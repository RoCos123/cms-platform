import "server-only";

import { cache } from "react";
import { createServiceClient } from "@/lib/supabase/admin";
import { citesteProgramul, oreLibere, primesteProgramari, type Program, type ZiCuOre } from "@/lib/programari";

/**
 * Ce trebuie ca să se poată cere o oră pe site.
 *
 * Se cere de două ori într-o singură cerere — o dată de cadrul site-ului, ca să
 * știe dacă pune linkul în meniu, o dată de pagina de programare — deci e
 * memorată. Fără `cache()` ar însemna două interogări identice la fiecare
 * vizită pe orice pagină.
 */
export const programulSiteului = cache(async (siteId: string): Promise<Program> => {
  const service = createServiceClient();

  const { data, error } = await service
    .from("site_settings")
    .select("programari")
    .eq("site_id", siteId)
    .maybeSingle();

  if (error) {
    // Un site fără formular de programare e mai bun decât unul căzut.
    console.error("Citirea programului a eșuat:", error);
    return citesteProgramul(null);
  }

  return citesteProgramul(data?.programari);
});

/** Modulul e pornit ȘI clientul a bifat măcar o zi? */
export const seePotFaceProgramari = cache(async (siteId: string, areModulul: boolean) => {
  if (!areModulul) return false;
  return primesteProgramari(await programulSiteului(siteId));
});

/**
 * Orele deja luate, de care depinde ce se oferă mai departe.
 *
 * Doar cererile vii: una refuzată sau anulată eliberează ora. Se citesc numai
 * cele din viitor — trecutul nu poate bloca nimic, iar la un cabinet vechi ar
 * însemna mii de rânduri aduse degeaba la fiecare vizită.
 */
export const oreleOcupate = cache(async (siteId: string): Promise<Date[]> => {
  const service = createServiceClient();

  const { data, error } = await service
    .from("appointments")
    .select("starts_at")
    .eq("site_id", siteId)
    .in("status", ["ceruta", "confirmata"])
    .gte("starts_at", new Date().toISOString());

  if (error) {
    /*
     * Aici NU se poate întoarce o listă goală liniștit, ca la celelalte citiri
     * publice: „n-am aflat ce e ocupat” ar fi arătat ca „nimic nu e ocupat”,
     * iar site-ul ar fi oferit ore deja luate. De asta aruncă — pagina de
     * programare răspunde atunci cu 404, iar restul site-ului merge mai departe.
     */
    console.error("Citirea orelor ocupate a eșuat:", error);
    throw new Error("Nu s-au putut citi orele ocupate.");
  }

  return (data ?? []).map((rand) => new Date(rand.starts_at as string));
});

/** Ce se oferă vizitatorului, gata calculat. */
export async function oreDeOferit(siteId: string): Promise<ZiCuOre[]> {
  const [program, ocupate] = await Promise.all([programulSiteului(siteId), oreleOcupate(siteId)]);
  return oreLibere(program, ocupate, new Date());
}
