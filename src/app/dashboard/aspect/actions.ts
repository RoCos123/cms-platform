"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { scrieInJurnal } from "@/lib/audit";
import { aspectPermis, matPermis } from "@/lib/aspect/acces";
import { brandCuCulori, brandCuFonturi, valideazaCulori, valideazaFonturi } from "@/lib/aspect/salvare";

export type RezultatAspect = { ok: true } | { ok: false; mesaj: string };

/**
 * Salvează culorile și fonturile alese de client pentru site-ul lui (meniul „Aspect"), dintr-o
 * dată: ecranul are un singur buton Salvează pentru amândouă.
 *
 * `null` = „revino la culorile / fonturile șablonului": cheia dispare din bază, iar site-ul arată
 * din nou exact cum l-a făcut șablonul.
 *
 * Stau în `site_settings.brand.aspect` (`culori`, `fonturi`), lângă datele din Setări. De aceea se
 * citește `brand`-ul de acum și se scrie înapoi ÎNTREG, doar cu `aspect.culori` și
 * `aspect.fonturi` schimbate (`brandCuCulori`, `brandCuFonturi`): ce n-am citit și n-am pus la loc
 * ar dispărea.
 *
 * Ce trimite browserul se verifică de la zero (`valideazaCulori`, `valideazaFonturi`), nu se
 * crede: o valoare care nu e `#RRGGBB` ar ajunge, prin variabilele CSS, direct în stilul fiecărei
 * pagini, iar un font din afara listei n-ar fi descărcat deloc.
 */
export async function salveazaAspect(brut: unknown, brutFonturi: unknown): Promise<RezultatAspect> {
  const session = await verifySession();
  const supabase = await createClient();

  // „Aspect" e în probă (`acces.ts`): cererea trimisă de mână de pe un site fără poartă
  // deschisă se refuză aici, nu doar se ascunde din meniu. Șablonul se citește din bază,
  // niciodată din ce trimite browserul.
  const { data: site } = await supabase.from("sites").select("domain, template").eq("id", session.siteId).single();
  if (!aspectPermis({ domain: site?.domain, template: site?.template })) {
    return { ok: false, mesaj: "Culorile și fonturile nu sunt pornite pentru site-ul tău încă." };
  }

  let culori = null;
  if (brut !== null) {
    const verificat = valideazaCulori(brut);
    if (!verificat.ok) return { ok: false, mesaj: verificat.mesaj };
    culori = verificat.culori;
    // Colecția „Mat & Mineral", doar pe șabloanele care o au (`SABLOANE_CU_MAT`, azi Claritate).
    if (culori.finisaj === "mat" && !matPermis(site?.template)) {
      return { ok: false, mesaj: "Colecția „Mat & Mineral” nu e pornită pentru șablonul site-ului tău." };
    }
  }

  const verificateFonturi = valideazaFonturi(brutFonturi);
  if (!verificateFonturi.ok) return { ok: false, mesaj: verificateFonturi.mesaj };
  const fonturi = verificateFonturi.fonturi;

  const { data: existente, error: eroareCitire } = await supabase
    .from("site_settings")
    .select("brand")
    .eq("site_id", session.siteId)
    .maybeSingle();

  if (eroareCitire) {
    console.error("Citirea setărilor înainte de salvarea aspectului a eșuat:", eroareCitire);
    return { ok: false, mesaj: "Nu am putut salva. Încearcă din nou." };
  }

  // `upsert` pe `site_id`, ca la Setări: rândul poate lipsi. Se scrie DOAR `brand`; `seo` și
  // `social` nu sunt în cerere, deci rămân cum sunt.
  const { error } = await supabase
    .from("site_settings")
    .upsert(
      { site_id: session.siteId, brand: brandCuFonturi(brandCuCulori(existente?.brand, culori), fonturi) },
      { onConflict: "site_id" },
    );

  if (error) {
    console.error("Salvarea aspectului a eșuat:", error);
    return { ok: false, mesaj: "Nu am putut salva. Încearcă din nou." };
  }

  await scrieInJurnal({
    siteId: session.siteId,
    actorId: session.userId,
    actiune: "update",
    entitate: "SiteSettings",
    diff: {
      rezumat: [
        !culori
          ? "Culorile: ale șablonului."
          : culori.mod === "auto"
            ? "Culorile: alese din culoarea principală."
            : "Culorile: alese manual.",
        !fonturi
          ? "Fonturile: ale șablonului."
          : `Fonturile: titluri ${fonturi.titluri ?? "ca în șablon"}, text ${fonturi.text ?? "ca în șablon"}.`,
      ].join(" "),
    },
  });

  revalidatePath("/dashboard", "layout");
  // Culorile și fonturile se văd pe TOATE paginile publice, nu doar pe prima.
  revalidatePath("/", "layout");

  return { ok: true };
}
