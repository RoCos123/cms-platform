import "server-only";

import { cache } from "react";
import { createServiceClient } from "@/lib/supabase/admin";
import type { Brand, Pagini, Seo, Social } from "@/lib/setari";

/**
 * Identitatea site-ului: numele, șablonul și setările.
 *
 * `cache()` fiindcă e nevoie de ea de mai multe ori într-o singură cerere — o
 * dată pentru titlul și descrierea din Google, o dată pentru pagina însăși.
 * Fără el, ar însemna interogări identice la fiecare vizită.
 *
 * Stă aici, nu în pagina principală, fiindcă orice pagină publică are nevoie de
 * ea: fiecare are antet, subsol și fonturi din același șablon.
 */
export const identitateaSiteului = cache(async (siteId: string) => {
  // Rolul `anon` nu mai are acces la date (vezi migrarea de întărire RLS), deci
  // tot ce se citește pentru site-ul public trece prin cheia secretă, server-side.
  const service = createServiceClient();

  const [{ data: site }, { data: settings }] = await Promise.all([
    service.from("sites").select("name, template, appointments_enabled").eq("id", siteId).single(),
    service.from("site_settings").select("brand, seo, pagini, social").eq("site_id", siteId).maybeSingle(),
  ]);

  return {
    site,
    brand: (settings?.brand ?? {}) as Brand,
    seo: (settings?.seo ?? {}) as Seo,
    pagini: (settings?.pagini ?? {}) as Pagini,
    social: (settings?.social ?? {}) as Social,
  };
});
