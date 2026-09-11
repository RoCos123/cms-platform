import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { resolveTenant, isPlatformHost } from "@/lib/tenant";
import { seServesteNepublicat } from "@/lib/lansare";
import { estePanou, esteConectare, estePanouProprietar } from "@/lib/rute";

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
 *
 * `x-nepublicat` la fel: din el se hotărăște `noindex` și banda „doar tu vezi
 * site-ul”. Trimis de un vizitator, ar scoate un site publicat din Google.
 */
const TENANT_HEADERS = ["x-site-id", "x-site-domain", "x-cale", "x-nepublicat"];

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

  /*
   * Panoul de proprietar (tu, peste toate site-urile) nu e al niciunui tenant.
   * Îl scoatem din rezolvarea de tenant ÎNAINTE de a o porni: altfel, pe adresa
   * brută a platformei (un `*.vercel.app` neînregistrat), `resolveTenant` n-ar
   * găsi nimic și ar rescrie la „site indisponibil", iar panoul n-ar fi de
   * atins. Session-ul s-a reîmprospătat deja mai sus (`getUser`), deci `respond`
   * duce cookie-urile mai departe. Cine are voie aici se verifică în rutele
   * lui (`verificaProprietar`), nu aici — proxy-ul doar le lasă să treacă, fără
   * antet de tenant.
   */
  if (estePanouProprietar(request.nextUrl.pathname)) {
    return respond(NextResponse.next({ request: { headers: requestHeaders } }));
  }

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
  // `estePanou`, nu `startsWith("/dashboard")`: clientul are voie să-și facă o
  // pagină numită `dashboard-ul-meu`, iar cu prefixul ea cerea conectare și
  // niciun vizitator n-o putea citi. Vezi src/lib/rute.ts.
  const isDashboard = estePanou(pathname);
  const isLogin = esteConectare(pathname);

  /**
   * Userul aparține tenantului cerut? Un cont valid pe alt domeniu nu dă acces.
   * Verificarea e optimistă (UX) — granița reală rămâne RLS + verifySession().
   *
   * Se cheamă LENEȘ, o singură dată pe cerere: pe un site publicat nu se atinge
   * deloc, deci comutatorul de lansare nu costă nimic în cazul obișnuit.
   */
  let apartenenta: boolean | null = null;
  // Funcție-expresie, nu declarație: o declarație e ridicată în capul funcției,
  // iar acolo `tenant` e încă uniunea nerestrânsă și `tenant.siteId` nu există.
  const esteProprietarul = async (): Promise<boolean> => {
    if (apartenenta !== null) return apartenenta;
    if (!user) return (apartenenta = false);

    const { data: profile } = await supabaseService
      .from("users")
      .select("site_id")
      .eq("id", user.id)
      .maybeSingle();

    return (apartenenta = profile?.site_id === tenant.siteId);
  };

  if (!tenant.publicat) {
    requestHeaders.set("x-nepublicat", "1");

    /*
     * Comutatorul de lansare. Un site nepublicat nu se arată nimănui din afară —
     * dar clientul trebuie să poată intra, să scrie și să se uite la ce a ieșit.
     *
     * Lista căilor care rămân deschise stă în `src/lib/lansare.ts`, cu motivul
     * fiecăreia, ca să poată fi probată: greșită într-o parte, îl închide pe
     * client afară din propriul panou.
     */
    if (!seServesteNepublicat(pathname) && !(await esteProprietarul())) {
      return respond(
        NextResponse.rewrite(new URL("/nepublicat", request.url), {
          request: { headers: requestHeaders },
        }),
      );
    }
  }

  if (isDashboard || isLogin) {
    const belongsToTenant = await esteProprietarul();

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
    /*
     * `imagini` e scoasă dinadins, lângă rutele interne ale Next: ruta care
     * servește pozele din depozitul privat se apără cu semnătura din adresă, nu
     * cu tenantul din antet — și N-ARE CUM să depindă de antete, fiindcă
     * optimizatorul de imagini își cere singur fișierul printr-o cerere fără
     * niciun antet. Trecută prin proxy, ar mai plăti un drum la baza de date
     * pentru un tenant pe care nu-l folosește, iar pe cererea internă a
     * optimizatorului rezolvarea n-ar avea de unde începe.
     *
     * `proba-vanzari` la fel: e o pagină de lucru care randează site-ul de
     * vânzări fără bază de date, ca să se poată vedea cum arată înainte să
     * existe. N-are tenant, deci proxy-ul ar trimite-o la „site indisponibil".
     * În producție dă oricum 404.
     */
    "/((?!_next/static|_next/image|imagini/|proba-vanzari|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
