import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Host-uri care nu corespund niciodată unui tenant real: mediul de dezvoltare
 * și preview-urile Vercel. Sufixele cu punct se compară ca sufix de domeniu
 * (`.vercel.app`), cele fără punct doar ca egalitate — altfel un domeniu
 * înregistrabil precum `mylocalhost.ro` ar fi tratat drept mediu de dezvoltare.
 */
const PLATFORM_HOST_SUFFIXES = [".vercel.app"];
const PLATFORM_HOST_EXACT = ["localhost", "127.0.0.1", "[::1]"];

export type ResolvedTenant =
  | { kind: "found"; siteId: string; domain: string; publicat: boolean }
  | { kind: "redirect"; canonicalHost: string }
  | { kind: "unresolved"; isPlatformHost: boolean };

/**
 * Aduce host-ul cererii la forma în care e stocat în `sites.domain`.
 *
 * Fără asta, `Cabinet.RO`, `cabinet.ro:443` și `cabinet.ro.` (punct final, formă
 * absolută validă în DNS) ar rata toate lookup-ul și ar scoate un client real
 * offline, deși domeniul lui e configurat corect.
 */
export function normalizeHost(host: string): string {
  let normalized = host.trim().toLowerCase();

  // Port: se taie doar pe hosturi non-IPv6 (IPv6 literal e `[::1]:3000`).
  if (normalized.startsWith("[")) {
    const closing = normalized.indexOf("]");
    normalized = closing === -1 ? normalized : normalized.slice(0, closing + 1);
  } else {
    const colon = normalized.indexOf(":");
    if (colon !== -1) normalized = normalized.slice(0, colon);
  }

  // Punct final (root DNS absolut) — `cabinet.ro.` și `cabinet.ro` sunt același host.
  return normalized.replace(/\.+$/, "");
}

export function isPlatformHost(host: string): boolean {
  const bareHost = normalizeHost(host);
  return (
    PLATFORM_HOST_EXACT.includes(bareHost) ||
    PLATFORM_HOST_SUFFIXES.some((suffix) => bareHost.endsWith(suffix))
  );
}

function wwwVariant(host: string): string {
  return host.startsWith("www.") ? host.slice(4) : `www.${host}`;
}

/**
 * Rezolvă host-ul cererii la un tenant, prin `sites.domain` — fără parsare de
 * subdomeniu/wildcard, pentru că fiecare tenant vine cu domeniul lui propriu
 * din Faza 1 (decizii-faza-0.md §2), nu cu un subdomeniu de platformă.
 *
 * Verifică și varianta www/apex a host-ului: dacă domeniul canonic stocat e
 * diferit doar prin „www.", cere un redirect spre forma canonică — exact bug-ul
 * de canonicalizare semnalat în audit-site-public.md §3.2.
 *
 * `supabase` trebuie să fie clientul cu cheia secretă: rolul `anon` nu mai are
 * acces la `sites` (vezi migrarea de întărire RLS).
 */
export async function resolveTenant(
  supabase: SupabaseClient,
  host: string,
): Promise<ResolvedTenant> {
  const normalized = normalizeHost(host);

  const { data: exact } = await supabase
    .from("sites")
    // `published_at` vine în aceeași interogare, nu într-una separată: rezolvarea
    // tenantului rulează la FIECARE cerere, iar comutatorul de lansare nu are
    // voie să coste încă un drum la baza de date pe fiecare pagină servită.
    .select("id, domain, published_at")
    .eq("domain", normalized)
    .maybeSingle();

  if (exact) {
    return {
      kind: "found",
      siteId: exact.id,
      domain: exact.domain,
      publicat: exact.published_at !== null,
    };
  }

  const variant = wwwVariant(normalized);
  const { data: variantSite } = await supabase
    .from("sites")
    .select("domain")
    .eq("domain", variant)
    .maybeSingle();

  // Gardă anti-buclă: redirectăm doar dacă ținta chiar diferă de host-ul cerut.
  if (variantSite && normalizeHost(variantSite.domain) !== normalized) {
    return { kind: "redirect", canonicalHost: normalizeHost(variantSite.domain) };
  }

  return { kind: "unresolved", isPlatformHost: isPlatformHost(normalized) };
}
