import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { resolveTenant, isPlatformHost } from "@/lib/tenant";

/**
 * Fallback de rezolvare a tenantului pentru host-uri care nu aparțin niciunui
 * client: dev local și preview-uri Vercel (decizii-faza-0.md §2).
 *
 * ATENȚIE: a NU se seta pe Production odată ce există un client real. Ar face
 * ca orice URL `*.vercel.app` al proiectului să servească site-ul și ecranul de
 * login ale acelui client, pe un domeniu care nu e al lui.
 */
const DEV_TENANT_DOMAIN = process.env.DEV_TENANT_DOMAIN;

/**
 * Antete pe care le stabilim noi, pe baza cererii. Se șterg necondiționat din
 * cererea primită: altfel un client le-ar putea trimite el însuși, iar pe orice
 * cale unde răspundem fără să le rescriem (rewrite, redirect, rute excluse de
 * `matcher`) ar ajunge la aplicație ca și cum le-ar fi pus proxy-ul — adică
 * spoofing de tenant.
 *
 * `x-cale` e în aceeași listă din același motiv: din el se numără traficul, iar
 * un vizitator care și l-ar trimite singur ar putea scrie în statisticile
 * clientului ce pagini vrea el că au fost citite.
 */
const TENANT_HEADERS = ["x-site-id", "x-site-domain", "x-cale"];

/**
 * Notă: Next.js 16 a redenumit Middleware în Proxy (funcționalitate identică) —
 * vezi node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md.
 */
export async function proxy(request: NextRequest) {
  TENANT_HEADERS.forEach((header) => request.headers.delete(header));

  let refreshedCookies: { name: string; value: string; options: CookieOptions }[] = [];

  // Client de autentificare: cheia publishable + cookie-urile cererii.
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          refreshedCookies = cookiesToSet;
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        },
      },
    },
  );

  /** Aplică pe răspunsul final cookie-urile de sesiune reîmprospătate de Supabase. */
  function respond(response: NextResponse) {
    refreshedCookies.forEach(({ name, value, options }) =>
      response.cookies.set(name, value, options),
    );
    return response;
  }

  // getUser() (nu getSession()) validează token-ul cu Supabase Auth și declanșează
  // refresh-ul dacă e nevoie — vezi Next.js docs „Optimistic checks with Proxy".
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  // Snapshot-ul antetelor se ia DUPĂ getUser(): refresh-ul rescrie cookie-urile
  // pe `request`, iar o copie luată înainte ar trimite mai departe token-ul deja
  // rotit — Server Components ar vedea o sesiune invalidă și ar deconecta userul.
  const requestHeaders = new Headers(request.headers);

  // Rolul `anon` nu mai are acces la `sites` (migrarea de întărire RLS), deci
  // rezolvarea tenantului se face cu cheia secretă, server-side.
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!secretKey) {
    // Fără ea nu se poate rezolva niciun tenant, deci fiecare cerere ar eșua.
    // Mesaj explicit în loguri: în Vercel, variabilele au bife separate per
    // mediu, iar una setată doar pe Production lasă Preview-ul complet rupt.
    console.error(
      "[proxy] Lipsește SUPABASE_SECRET_KEY. În Vercel, verifică Project Settings → " +
        "Environment Variables că e bifată pentru mediul curent (Production ȘI Preview). " +
        "Local: .env.local",
    );
    return NextResponse.rewrite(new URL("/site-unavailable", request.url));
  }

  const supabaseService = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secretKey,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const requestHost = request.headers.get("host") ?? "";
  const lookupHost =
    DEV_TENANT_DOMAIN && isPlatformHost(requestHost) ? DEV_TENANT_DOMAIN : requestHost;

  const tenant = await resolveTenant(supabaseService, lookupHost);

  if (tenant.kind === "redirect") {
    const url = new URL(request.nextUrl.pathname + request.nextUrl.search, request.url);
    url.host = tenant.canonicalHost;
    return respond(NextResponse.redirect(url, 308));
  }

  if (tenant.kind === "unresolved") {
    const url = tenant.isPlatformHost
      ? new URL("/site-unavailable", request.url)
      : new URL(`/site-unavailable?host=${encodeURIComponent(requestHost)}`, request.url);
    return respond(NextResponse.rewrite(url));
  }

  requestHeaders.set("x-site-id", tenant.siteId);
  requestHeaders.set("x-site-domain", tenant.domain);
  // Calea cerută, pentru numărarea traficului: un Server Component n-are de
  // unde să afle singur pe ce adresă a fost cerut.
  requestHeaders.set("x-cale", request.nextUrl.pathname);

  const pathname = request.nextUrl.pathname;
  const isDashboard = pathname.startsWith("/dashboard");
  const isLogin = pathname === "/login";

  if (isDashboard || isLogin) {
    // Userul aparține tenantului cerut? Un cont valid pe alt domeniu nu dă
    // acces aici. Verificarea e optimistă (UX) — granița reală rămâne RLS +
    // verifySession() din DAL.
    let belongsToTenant = false;

    if (user) {
      const { data: profile } = await supabaseService
        .from("users")
        .select("site_id")
        .eq("id", user.id)
        .maybeSingle();

      belongsToTenant = profile?.site_id === tenant.siteId;
    }

    // Redirect doar când schimbă efectiv ceva. Bounce-ul necondiționat
    // /login -> /dashboard pentru orice user autentificat crea o buclă
    // infinită la login încrucișat: dashboard-ul respingea tenantul greșit
    // înapoi spre /login, iar proxy-ul îl trimitea imediat la loc.
    if (isDashboard && !belongsToTenant) {
      const url = new URL("/login", request.url);
      if (user) url.searchParams.set("error", "cont-gresit");
      return respond(NextResponse.redirect(url));
    }

    if (isLogin && belongsToTenant) {
      return respond(NextResponse.redirect(new URL("/dashboard", request.url)));
    }
  }

  return respond(NextResponse.next({ request: { headers: requestHeaders } }));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
