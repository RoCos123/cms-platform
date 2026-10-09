import "server-only";

import { cache } from "react";
import { createServiceClient } from "@/lib/supabase/admin";
import { contineUmplutura } from "@/lib/umplutura";

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
 *
 * O secțiune cu text de umplutură nu se randează (regula din 9 oct. 2026, vezi
 * `umplutura.ts`), deci nu se numără nici aici: altfel meniul și subsolul ar duce
 * la o ancoră care nu există pe pagină.
 */
export const cheileSectiunilorVizibile = cache(async (siteId: string): Promise<string[]> => {
  const { data } = await createServiceClient()
    .from("site_content")
    .select("key, data")
    .eq("site_id", siteId)
    .eq("visible", true);

  return (data ?? []).filter((rand) => !contineUmplutura(rand.data)).map((rand) => rand.key as string);
});

/**
 * `data` secțiunii „Pachete", doar dacă secțiunea e pornită. De aici își ia antetul
 * linkul „Prețuri" (câmpul „Link în bara de sus"; vezi `linkPachete`).
 *
 * Memorată pe cerere și chemată în paralel cu restul citirilor din cadru, deci nu
 * lungește pagina. La eroare sau fără rând întoarce `null` — fără link, nu pagină căzută.
 */
export const dateleSectiuniiPachete = cache(async (siteId: string): Promise<unknown> => {
  const { data } = await createServiceClient()
    .from("site_content")
    .select("data")
    .eq("site_id", siteId)
    .eq("key", "pricing")
    .eq("visible", true)
    .order("position")
    .limit(1);

  const date = data?.[0]?.data ?? null;
  // Cu umplutură, secțiunea nu apare pe pagină — deci nici linkul către ea.
  return contineUmplutura(date) ? null : date;
});
