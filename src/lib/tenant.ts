import type { SupabaseClient } from "@supabase/supabase-js";

/** Sufixe de host care nu corespund niciodată unui tenant real. */
const PLATFORM_HOST_SUFFIXES = [".vercel.app", "localhost", "127.0.0.1"];

export type ResolvedTenant =
  | { kind: "found"; siteId: string; domain: string }
  | { kind: "redirect"; canonicalHost: string }
  | { kind: "unresolved"; isPlatformHost: boolean };

function isPlatformHost(host: string): boolean {
  const bareHost = host.split(":")[0];
  return PLATFORM_HOST_SUFFIXES.some(
    (suffix) => bareHost === suffix || bareHost.endsWith(suffix),
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
 */
export async function resolveTenant(
  supabase: SupabaseClient,
  host: string,
): Promise<ResolvedTenant> {
  const { data: exact } = await supabase
    .from("sites")
    .select("id, domain")
    .eq("domain", host)
    .maybeSingle();

  if (exact) {
    return { kind: "found", siteId: exact.id, domain: exact.domain };
  }

  const { data: variant } = await supabase
    .from("sites")
    .select("domain")
    .eq("domain", wwwVariant(host))
    .maybeSingle();

  if (variant) {
    return { kind: "redirect", canonicalHost: variant.domain };
  }

  return { kind: "unresolved", isPlatformHost: isPlatformHost(host) };
}
