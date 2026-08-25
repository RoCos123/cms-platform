import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { resolveTenant } from "@/lib/tenant";

// Fallback pentru dev local: fără subdomeniu platformă, localhost n-are niciun
// tenant "gratuit" de testat — vezi decizii-faza-0.md §2. Setează în .env.local
// domeniul unui site real seedat, ex. DEV_TENANT_DOMAIN=rodicacotenescu.ro
const DEV_TENANT_DOMAIN = process.env.DEV_TENANT_DOMAIN;

function isLocalHost(host: string): boolean {
  return host.startsWith("localhost") || host.startsWith("127.0.0.1");
}

/**
 * Notă: Next.js 16 a redenumit Middleware în Proxy (funcționalitate identică) —
 * vezi node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md.
 */
export async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  let refreshedCookies: { name: string; value: string; options: CookieOptions }[] = [];

  const supabase = createServerClient(
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
  } = await supabase.auth.getUser();

  const requestHost = request.headers.get("host") ?? "";
  const lookupHost =
    DEV_TENANT_DOMAIN && isLocalHost(requestHost) ? DEV_TENANT_DOMAIN : requestHost;

  const tenant = await resolveTenant(supabase, lookupHost);

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

  const pathname = request.nextUrl.pathname;

  // Verificări optimistice — RLS (current_site_id()) rămâne granița reală de
  // securitate; astea sunt doar UX (evită un flash de dashboard neautorizat).
  if (pathname.startsWith("/dashboard") && !user) {
    return respond(NextResponse.redirect(new URL("/login", request.url)));
  }

  if (pathname === "/login" && user) {
    return respond(NextResponse.redirect(new URL("/dashboard", request.url)));
  }

  return respond(NextResponse.next({ request: { headers: requestHeaders } }));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
