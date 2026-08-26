"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { scrieInJurnal } from "@/lib/audit";
import { metaSectiune } from "@/lib/sectiuni";
import { catreEditor, catreStocare, valideaza } from "@/lib/sectiuni-editare";

export type RandStructura = {
  id: string;
  pozitie: number;
  vizibil: boolean;
};

export type RezultatSalvare = { ok: true } | { ok: false; mesaj: string };

/** Peste atât nu e o pagină, e o greșeală sau un abuz. */
const MAXIM_SECTIUNI = 60;

/**
 * Salvează ordinea și vizibilitatea secțiunilor de pe pagina principală.
 *
 * Izolarea între clienți nu depinde de ce trimite browserul: se scrie cu
 * clientul userului autentificat, iar politica RLS a tabelului cere
 * `site_id = current_site_id()`. Un `id` din alt site pur și simplu nu
 * potrivește niciun rând — nu e nevoie de o verificare separată care ar putea
 * fi uitată.
 */
export async function salveazaStructuraPaginii(
  randuri: RandStructura[],
): Promise<RezultatSalvare> {
  const session = await verifySession();

  if (randuri.length === 0) return { ok: true };
  if (randuri.length > MAXIM_SECTIUNI) {
    return { ok: false, mesaj: "Prea multe secțiuni într-o singură salvare." };
  }

  const supabase = await createClient();

  // Starea dinainte, pentru jurnal: fără ea, intrarea ar spune „a modificat
  // ceva", ceea ce nu ajută pe nimeni să înțeleagă mai târziu ce s-a schimbat.
  const { data: inainte } = await supabase
    .from("site_content")
    .select("id, key, position, visible")
    .eq("site_id", session.siteId);

  const stareVeche = new Map(
    (inainte ?? []).map((r) => [r.id as string, r as { id: string; key: string; position: number; visible: boolean }]),
  );

  const deSchimbat = randuri.filter((rand) => {
    const vechi = stareVeche.get(rand.id);
    return vechi && (vechi.position !== rand.pozitie || vechi.visible !== rand.vizibil);
  });

  if (deSchimbat.length === 0) return { ok: true };

  // Fiecare rând primește propria valoare, deci nu încape într-un singur UPDATE
  // prin REST. Actualizările merg în paralel: dacă una pică, ordinea rămâne pe
  // jumătate aplicată — vizibil, nu coruptor, iar ecranul se reîncarcă din baza
  // de date, deci arată ce s-a scris efectiv, nu ce credea browserul.
  const rezultate = await Promise.all(
    deSchimbat.map((rand) =>
      supabase
        .from("site_content")
        .update({ position: rand.pozitie, visible: rand.vizibil })
        .eq("id", rand.id)
        .eq("site_id", session.siteId),
    ),
  );

  const esuata = rezultate.find((r) => r.error);
  if (esuata?.error) {
    console.error("Salvarea structurii paginii a eșuat:", esuata.error);
    return {
      ok: false,
      mesaj: "Nu am putut salva ordinea secțiunilor. Reîncarcă pagina și încearcă din nou.",
    };
  }

  await scrieInJurnal({
    siteId: session.siteId,
    actorId: session.userId,
    actiune: "update",
    entitate: "SiteContent",
    diff: {
      rezumat: `Structura paginii principale: ${deSchimbat.length} secțiuni modificate.`,
      modificari: deSchimbat.map((rand) => {
        const vechi = stareVeche.get(rand.id)!;
        return {
          sectiune: vechi.key,
          pozitie: vechi.position === rand.pozitie ? undefined : [vechi.position, rand.pozitie],
          vizibil: vechi.visible === rand.vizibil ? undefined : [vechi.visible, rand.vizibil],
        };
      }),
    },
  });

  revalidatePath("/dashboard/sectiuni");
  // Site-ul public citește exact rândurile astea; fără linia asta, clientul
  // salvează în panou și nu vede nicio schimbare pe site.
  revalidatePath("/");

  return { ok: true };
}

/** Peste atât, conținutul unei singure secțiuni e o greșeală, nu un text lung. */
const MAXIM_OCTETI_SECTIUNE = 100_000;

/**
 * Salvează conținutul unei secțiuni.
 *
 * Datele primite NU se scriu așa cum vin. Trec printr-un dus-întors prin
 * descrierea secțiunii (`catreEditor` → `catreStocare`), care păstrează exact
 * câmpurile declarate și le aruncă pe toate celelalte. Așa, o cheie în plus
 * trimisă din browser nu poate ajunge în conținutul site-ului, iar validarea
 * rulează pe server pe aceleași reguli ca în formular — nu pe o copie a lor,
 * care ar rămâne în urmă.
 */
export async function salveazaSectiune(
  id: string,
  date: Record<string, unknown>,
): Promise<RezultatSalvare> {
  const session = await verifySession();
  const supabase = await createClient();

  if (JSON.stringify(date).length > MAXIM_OCTETI_SECTIUNE) {
    return { ok: false, mesaj: "Conținutul secțiunii e prea mare. Scurtează textele." };
  }

  const { data: rand } = await supabase
    .from("site_content")
    .select("id, key, data")
    .eq("id", id)
    .eq("site_id", session.siteId)
    .maybeSingle();

  if (!rand) {
    return { ok: false, mesaj: "Secțiunea nu mai există. Reîncarcă pagina." };
  }

  const meta = metaSectiune(rand.key as string);
  if (!meta) {
    return { ok: false, mesaj: "Secțiunea aceasta nu poate fi editată din panou." };
  }

  const curatat = catreStocare(catreEditor(date, meta.campuri), meta.campuri);
  const erori = valideaza(catreEditor(curatat, meta.campuri), meta.campuri);

  if (Object.keys(erori).length > 0) {
    return { ok: false, mesaj: "Mai lipsește ceva. Verifică marcajele din formular." };
  }

  const { error } = await supabase
    .from("site_content")
    // `is_demo` cade la prima editare: din clipa în care clientul a scris ceva
    // aici, secțiunea nu mai e textul demonstrativ pus de noi la provizionare,
    // iar ecranul „Pregătit de lansare" nu mai are de ce s-o semnaleze.
    .update({ data: curatat, is_demo: false })
    .eq("id", id)
    .eq("site_id", session.siteId);

  if (error) {
    console.error("Salvarea secțiunii a eșuat:", error);
    return { ok: false, mesaj: "Nu am putut salva. Încearcă din nou peste câteva momente." };
  }

  await scrieInJurnal({
    siteId: session.siteId,
    actorId: session.userId,
    actiune: "update",
    entitate: "SiteContent",
    entitateId: id,
    diff: { sectiune: rand.key, rezumat: `Conținutul secțiunii „${meta.nume}” a fost modificat.` },
  });

  revalidatePath("/dashboard/sectiuni");
  revalidatePath(`/dashboard/sectiuni/${id}`);
  revalidatePath("/");

  return { ok: true };
}
