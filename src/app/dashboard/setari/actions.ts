"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { scrieInJurnal } from "@/lib/audit";
import { CAMPURI_CABINET, CAMPURI_SEO, CAMPURI_SOCIAL } from "@/lib/setari";
import { catreEditor, catreStocare, valideaza, type ValoareEditor } from "@/lib/sectiuni-editare";

export type RezultatSetari =
  | { ok: true }
  | { ok: false; mesaj: string; erori?: Record<string, string> };

/**
 * Salvează setările site-ului.
 *
 * Clientul completează un singur formular, dar datele merg în patru locuri:
 * `sites.name`, `site_settings.brand`, `site_settings.seo` și
 * `site_settings.social`. Împărțirea se face aici, nu în formular — dacă ecranul
 * ar trebui să știe unde stă fiecare câmp, orice mutare de coloană ar cere
 * modificări în două locuri.
 *
 * Ca la secțiuni, ce trimite browserul nu se scrie ca atare: trece printr-un
 * dus-întors prin descriere, care păstrează exact câmpurile declarate. Domeniul
 * nu poate ajunge aici nici dacă cineva îl trimite — nu e în descriere, iar la
 * nivel de bază de date proprietarul n-are drept de scriere pe acea coloană.
 */
export async function salveazaSetari(
  cabinet: ValoareEditor,
  seo: ValoareEditor,
  social: ValoareEditor,
): Promise<RezultatSetari> {
  const session = await verifySession();
  const supabase = await createClient();

  const erori = {
    ...valideaza(cabinet, CAMPURI_CABINET),
    ...valideaza(seo, CAMPURI_SEO),
    ...valideaza(social, CAMPURI_SOCIAL),
  };

  if (Object.keys(erori).length > 0) {
    return { ok: false, mesaj: "Mai lipsește ceva. Câmpurile cu probleme sunt marcate.", erori };
  }

  const cabinetCurat = catreStocare(catreEditor(cabinet, CAMPURI_CABINET), CAMPURI_CABINET);
  const seoCurat = catreStocare(catreEditor(seo, CAMPURI_SEO), CAMPURI_SEO);
  const socialCurat = catreStocare(catreEditor(social, CAMPURI_SOCIAL), CAMPURI_SOCIAL);

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
    .upsert(
      { site_id: session.siteId, brand, seo: seoCurat, social: socialCurat },
      { onConflict: "site_id" },
    );

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

/**
 * Publică sau retrage site-ul.
 *
 * `sites.published_at` null înseamnă „încă nu e lansat": vizitatorii primesc
 * pagina de așteptare, iar clientul logat vede site-ul adevărat, cu o bandă
 * deasupra (vezi src/proxy.ts și migrarea `comutator_lansare`).
 *
 * Comutatorul e al CLIENTULUI, nu al nostru. El știe când a terminat de scris,
 * și tot el trebuie să poată retrage site-ul dacă vrea să-l refacă — fără să
 * sune pe cineva. La nivel de bază de date, dreptul lui de scriere pe `sites`
 * se oprește la `name` și `published_at`; domeniul și modulele plătite rămân
 * închise, indiferent ce trimite panoul.
 *
 * Data se pune cu `now()` din partea noastră, nu din browser: ceasul unui
 * calculator poate fi oricum, iar în jurnal ar rămâne o oră care nu s-a
 * întâmplat niciodată.
 */
export async function schimbaPublicarea(publica: boolean): Promise<RezultatSetari> {
  const session = await verifySession();
  const supabase = await createClient();

  const { error } = await supabase
    .from("sites")
    .update({ published_at: publica ? new Date().toISOString() : null })
    .eq("id", session.siteId);

  if (error) {
    console.error("Schimbarea publicării a eșuat:", error);
    return {
      ok: false,
      mesaj: publica
        ? "Nu am putut publica site-ul. Încearcă din nou."
        : "Nu am putut retrage site-ul. Încearcă din nou.",
    };
  }

  await scrieInJurnal({
    siteId: session.siteId,
    actorId: session.userId,
    actiune: "update",
    entitate: "Site",
    diff: {
      rezumat: publica
        ? "Site-ul a fost publicat."
        : "Site-ul a fost retras de pe internet.",
    },
  });

  revalidatePath("/dashboard", "layout");
  // Tot site-ul public, nu doar prima pagină: comutatorul schimbă ce vede
  // oricine, pe orice adresă — inclusiv `robots.txt` și `sitemap.xml`.
  revalidatePath("/", "layout");

  return { ok: true };
}
