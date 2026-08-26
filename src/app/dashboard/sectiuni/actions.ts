"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { scrieInJurnal } from "@/lib/audit";

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
