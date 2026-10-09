import "server-only";

import { cache } from "react";
import { createServiceClient } from "@/lib/supabase/admin";
import { numeleModelelor, tipulDinValoare, type TipSite } from "@/lib/pagina-vanzare";

/**
 * Ce fel de site e: cabinet (toate, implicit) sau pagina de vânzare.
 *
 * Citit SEPARAT de `identitateaSiteului`, dinadins. Coloana `sites.tip` vine cu
 * migrarea din 9 oct. 2026; dacă codul ajunge pe server înaintea ei, o interogare
 * care o cere dă eroare. În `identitateaSiteului`, eroarea ar fi lăsat fără nume
 * și fără șablon TOATE site-urile. Aici înseamnă doar „cabinet" — adică exact ce
 * erau toate site-urile până acum.
 *
 * Memorat pe cerere: îl cer și cadrul (subsolul, bara), și pagina, și cartonașul
 * de distribuire, cu același `siteId`.
 */
export const tipulSiteului = cache(async (siteId: string): Promise<TipSite> => {
  try {
    const { data, error } = await createServiceClient()
      .from("sites")
      .select("tip")
      .eq("id", siteId)
      .maybeSingle();

    if (error || !data) return "cabinet";
    return tipulDinValoare(data.tip);
  } catch {
    return "cabinet";
  }
});

/**
 * Numele modelelor din galeria de pe pagină (secțiunile vizibile), pentru
 * verificarea din formular. Vezi `numeleModelelor`.
 *
 * La eroare, listă goală: rămâne valabilă doar „Încă nu m-am hotărât", deci
 * mesajul tot pleacă — doar că o alegere de model nu poate fi verificată și e
 * refuzată cu o explicație, nu înghițită în tăcere.
 */
export const modeleleDePePagina = cache(async (siteId: string): Promise<string[]> => {
  try {
    const { data } = await createServiceClient()
      .from("site_content")
      .select("key, variant, data")
      .eq("site_id", siteId)
      .eq("key", "portfolio")
      .eq("visible", true)
      .order("position");

    return numeleModelelor((data ?? []) as { key: string; variant: string | null; data: unknown }[]);
  } catch {
    return [];
  }
});
