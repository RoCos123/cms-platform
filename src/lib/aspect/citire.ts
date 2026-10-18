import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * `site_settings.brand`, citit cu clientul din PANOU (RLS: doar rândul site-ului lui). Pentru
 * ecranele care aveau doar `sites.template` și nu citeau setările; de aici, culorile trec
 * mereu prin `culoriPermise` (poarta din `acces.ts`), nu direct în `getTemplate`.
 *
 * Întoarce `unknown` dinadins: forma o curăță `getTemplate` (`citesteAspectCulori`), ca un
 * JSON stricat din bază să nu poată dărâma un ecran.
 */
export async function brandulSiteului(supabase: SupabaseClient, siteId: string): Promise<unknown> {
  const { data } = await supabase
    .from("site_settings")
    .select("brand")
    .eq("site_id", siteId)
    .maybeSingle();

  return data?.brand;
}
