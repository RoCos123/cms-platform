import "server-only";

import { cache } from "react";
import { createServiceClient } from "@/lib/supabase/admin";

/**
 * Cheile secțiunilor VIZIBILE de pe prima pagină a site-ului.
 *
 * Le cer și antetul (ca „Despre" să apară doar dacă secțiunea există), și subsolul
 * (coloana „Cabinet"). Memorată pe cerere: cele două o cheamă cu același `siteId`,
 * deci o singură interogare la bază, nu două.
 *
 * Ca orice citire publică, la eroare întoarce listă goală, nu aruncă: un vizitator
 * nu vede niciodată o eroare fiindcă baza a răspuns prost. Efectul e un meniu cu mai
 * puține intrări, nu o pagină căzută.
 */
export const cheileSectiunilorVizibile = cache(async (siteId: string): Promise<string[]> => {
  const { data } = await createServiceClient()
    .from("site_content")
    .select("key")
    .eq("site_id", siteId)
    .eq("visible", true);

  return (data ?? []).map((rand) => rand.key as string);
});
