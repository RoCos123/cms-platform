import type { SupabaseClient } from "@supabase/supabase-js";
import { culoriDinBrand } from "./culori";

/**
 * Culorile alese de client, citite cu clientul din PANOU (RLS: doar rândul site-ului lui).
 * Pentru ecranele care au deja `brand` la îndemână, `culoriDinBrand(brand)` ajunge; asta e
 * pentru cele care aveau doar `sites.template` și nu citeau setările.
 *
 * Întoarce `unknown` dinadins: forma o curăță `getTemplate` (`citesteAspectCulori`), ca un
 * JSON stricat din bază să nu poată dărâma un ecran.
 */
export async function culoriSiteului(supabase: SupabaseClient, siteId: string): Promise<unknown> {
  const { data } = await supabase
    .from("site_settings")
    .select("brand")
    .eq("site_id", siteId)
    .maybeSingle();

  return culoriDinBrand(data?.brand);
}
