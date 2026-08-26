"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { scrieInJurnal } from "@/lib/audit";
import { CAMPURI_CABINET, CAMPURI_SEO } from "@/lib/setari";
import { catreEditor, catreStocare, valideaza, type ValoareEditor } from "@/lib/sectiuni-editare";

export type RezultatSetari =
  | { ok: true }
  | { ok: false; mesaj: string; erori?: Record<string, string> };

/**
 * Salvează setările site-ului.
 *
 * Clientul completează un singur formular, dar datele merg în trei locuri:
 * `sites.name`, `site_settings.brand` și `site_settings.seo`. Împărțirea se
 * face aici, nu în formular — dacă ecranul ar trebui să știe unde stă fiecare
 * câmp, orice mutare de coloană ar cere modificări în două locuri.
 *
 * Ca la secțiuni, ce trimite browserul nu se scrie ca atare: trece printr-un
 * dus-întors prin descriere, care păstrează exact câmpurile declarate. Domeniul
 * nu poate ajunge aici nici dacă cineva îl trimite — nu e în descriere, iar la
 * nivel de bază de date proprietarul n-are drept de scriere pe acea coloană.
 */
export async function salveazaSetari(
  cabinet: ValoareEditor,
  seo: ValoareEditor,
): Promise<RezultatSetari> {
  const session = await verifySession();
  const supabase = await createClient();

  const erori = {
    ...valideaza(cabinet, CAMPURI_CABINET),
    ...valideaza(seo, CAMPURI_SEO),
  };

  if (Object.keys(erori).length > 0) {
    return { ok: false, mesaj: "Mai lipsește ceva. Câmpurile cu probleme sunt marcate.", erori };
  }

  const cabinetCurat = catreStocare(catreEditor(cabinet, CAMPURI_CABINET), CAMPURI_CABINET);
  const seoCurat = catreStocare(catreEditor(seo, CAMPURI_SEO), CAMPURI_SEO);

  const { nume, ...brand } = cabinetCurat as { nume?: string } & Record<string, unknown>;

  const { error: eroareNume } = await supabase
    .from("sites")
    .update({ name: nume })
    .eq("id", session.siteId);

  if (eroareNume) {
    console.error("Salvarea numelui site-ului a eșuat:", eroareNume);
    return { ok: false, mesaj: "Nu am putut salva numele. Încearcă din nou." };
  }

  // `upsert` pe `site_id`: rândul de setări poate lipsi (un site provizionat
  // fără el), iar un `update` ar fi trecut în tăcere fără să scrie nimic.
  const { error: eroareSetari } = await supabase
    .from("site_settings")
    .upsert({ site_id: session.siteId, brand, seo: seoCurat }, { onConflict: "site_id" });

  if (eroareSetari) {
    console.error("Salvarea setărilor a eșuat:", eroareSetari);
    return { ok: false, mesaj: "Nu am putut salva setările. Încearcă din nou." };
  }

  await scrieInJurnal({
    siteId: session.siteId,
    actorId: session.userId,
    actiune: "update",
    entitate: "SiteSettings",
    diff: { rezumat: "Setările site-ului au fost modificate." },
  });

  revalidatePath("/dashboard", "layout");
  // Antetul și subsolul site-ului public citesc exact datele astea.
  revalidatePath("/");

  return { ok: true };
}
