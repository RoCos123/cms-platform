"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { scrieInJurnal } from "@/lib/audit";
import { aspectPermis } from "@/lib/aspect/acces";
import { brandCuCulori, valideazaCulori } from "@/lib/aspect/salvare";

export type RezultatAspect = { ok: true } | { ok: false; mesaj: string };

/**
 * Salvează culorile alese de client pentru site-ul lui (meniul „Aspect").
 *
 * `null` = „revino la culorile șablonului": cheia dispare din bază, iar site-ul arată din nou
 * exact cum l-a făcut șablonul.
 *
 * Culorile stau în `site_settings.brand.aspect.culori`, lângă datele din Setări. De aceea se
 * citește `brand`-ul de acum și se scrie înapoi ÎNTREG, doar cu `aspect.culori` schimbat
 * (`brandCuCulori`): ce n-am citit și n-am pus la loc ar dispărea.
 *
 * Ce trimite browserul se verifică de la zero (`valideazaCulori`), nu se crede: o valoare
 * care nu e `#RRGGBB` ar ajunge, prin variabilele CSS, direct în stilul fiecărei pagini.
 */
export async function salveazaCulori(brut: unknown): Promise<RezultatAspect> {
  const session = await verifySession();
  const supabase = await createClient();

  // „Aspect" e în probă (`acces.ts`): cererea trimisă de mână de pe un site fără poartă
  // deschisă se refuză aici, nu doar se ascunde din meniu. Șablonul se citește din bază,
  // niciodată din ce trimite browserul.
  const { data: site } = await supabase.from("sites").select("template").eq("id", session.siteId).single();
  if (!aspectPermis({ siteId: session.siteId, template: site?.template })) {
    return { ok: false, mesaj: "Culorile nu sunt pornite pentru site-ul tău încă." };
  }

  let culori = null;
  if (brut !== null) {
    const verificat = valideazaCulori(brut);
    if (!verificat.ok) return { ok: false, mesaj: verificat.mesaj };
    culori = verificat.culori;
  }

  const { data: existente, error: eroareCitire } = await supabase
    .from("site_settings")
    .select("brand")
    .eq("site_id", session.siteId)
    .maybeSingle();

  if (eroareCitire) {
    console.error("Citirea setărilor înainte de salvarea culorilor a eșuat:", eroareCitire);
    return { ok: false, mesaj: "Nu am putut salva culorile. Încearcă din nou." };
  }

  // `upsert` pe `site_id`, ca la Setări: rândul poate lipsi. Se scrie DOAR `brand`; `seo` și
  // `social` nu sunt în cerere, deci rămân cum sunt.
  const { error } = await supabase
    .from("site_settings")
    .upsert(
      { site_id: session.siteId, brand: brandCuCulori(existente?.brand, culori) },
      { onConflict: "site_id" },
    );

  if (error) {
    console.error("Salvarea culorilor a eșuat:", error);
    return { ok: false, mesaj: "Nu am putut salva culorile. Încearcă din nou." };
  }

  await scrieInJurnal({
    siteId: session.siteId,
    actorId: session.userId,
    actiune: "update",
    entitate: "SiteSettings",
    diff: {
      rezumat: !culori
        ? "Site-ul a revenit la culorile șablonului."
        : culori.mod === "auto"
          ? "Culorile site-ului au fost schimbate (culoare principală aleasă)."
          : "Culorile site-ului au fost schimbate (alese manual).",
    },
  });

  revalidatePath("/dashboard", "layout");
  // Culorile se văd pe TOATE paginile publice, nu doar pe prima.
  revalidatePath("/", "layout");

  return { ok: true };
}
