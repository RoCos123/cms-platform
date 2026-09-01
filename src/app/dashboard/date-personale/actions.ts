"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { scrieInJurnal } from "@/lib/audit";
import {
  albesteRezumatul,
  citesteCautarea,
  esteAlPersoanei,
  type Cautare,
} from "@/lib/date-personale";

/**
 * Găsirea și ștergerea datelor unei persoane, la cererea ei.
 *
 * Prin GDPR, cine a lăsat date pe site poate cere oricând să nu mai fie
 * păstrate. Până acum ștergerea se făcea de mână, în baza de date, de către
 * proprietarul platformei — adică psihologul nu putea răspunde singur unei
 * cereri, iar nicăieri nu rămânea urma că a fost onorată.
 */

export type Gasire = {
  fel: "mesaj" | "programare" | "newsletter";
  id: string;
  nume: string;
  contact: string;
  cand: string;
};

export type RezultatCautare =
  | { ok: true; gasiri: Gasire[] }
  | { ok: false; mesaj: string };

export type RezultatStergere =
  | { ok: true; sterse: number; rezumateAlbite: number }
  | { ok: false; mesaj: string };

const CAUTARE_NEINTELEASA =
  "Scrie un număr de telefon sau o adresă de email. După nume nu se poate căuta: doi oameni pot avea același nume, iar o ștergere greșită nu se mai poate da înapoi.";

/**
 * Se citește TOT ce are cabinetul și se compară în memorie, nu cu `like` în SQL.
 *
 * Motivul e chiar potrivirea: „0721 123 456” și „+40721123456” sunt același om,
 * iar un `like` i-ar găsi doar pe unii. Un cabinet are sute, nu milioane de
 * rânduri; o interogare care ratează jumătate din datele cuiva costă mult mai
 * mult decât una care citește câteva sute de rânduri de două ori pe an.
 */
async function strange(siteId: string, cautare: Cautare) {
  const supabase = await createClient();

  const [mesaje, programari, abonati] = await Promise.all([
    supabase
      .from("contact_messages")
      .select("id, name, phone, email, created_at")
      .eq("site_id", siteId),
    supabase
      .from("appointments")
      .select("id, name, phone, email, starts_at, created_at")
      .eq("site_id", siteId),
    supabase
      .from("newsletter_subscribers")
      .select("id, email, created_at")
      .eq("site_id", siteId),
  ]);

  const gasiri: Gasire[] = [];

  for (const rand of mesaje.data ?? []) {
    if (!esteAlPersoanei(rand, cautare)) continue;
    gasiri.push({
      fel: "mesaj",
      id: rand.id as string,
      nume: (rand.name as string) || "—",
      contact: (rand.phone as string) || (rand.email as string) || "—",
      cand: rand.created_at as string,
    });
  }

  for (const rand of programari.data ?? []) {
    if (!esteAlPersoanei(rand, cautare)) continue;
    gasiri.push({
      fel: "programare",
      id: rand.id as string,
      nume: (rand.name as string) || "—",
      contact: (rand.phone as string) || (rand.email as string) || "—",
      cand: (rand.starts_at as string) ?? (rand.created_at as string),
    });
  }

  for (const rand of abonati.data ?? []) {
    if (!esteAlPersoanei(rand, cautare)) continue;
    gasiri.push({
      fel: "newsletter",
      id: rand.id as string,
      nume: "—",
      contact: rand.email as string,
      cand: rand.created_at as string,
    });
  }

  return gasiri;
}

export async function cautaPersoana(termen: string): Promise<RezultatCautare> {
  const session = await verifySession();
  const cautare = citesteCautarea(termen);

  if (cautare.fel === "necunoscut") return { ok: false, mesaj: CAUTARE_NEINTELEASA };

  try {
    return { ok: true, gasiri: await strange(session.siteId, cautare) };
  } catch (eroare) {
    console.error("Căutarea datelor unei persoane a eșuat:", eroare);
    return { ok: false, mesaj: "Căutarea nu a mers. Mai încearcă o dată." };
  }
}

/**
 * Șterge tot ce ține de persoana căutată.
 *
 * Se caută din nou aici, nu se primesc id-urile de la ecran. Între căutare și
 * apăsarea butonului poate trece un sfert de oră, timp în care mai poate intra
 * o cerere de la același om — iar o listă veche ar lăsa-o în bază. Mai
 * important: id-urile venite din browser ar trebui oricum verificate una câte
 * una că sunt ale cabinetului, deci lista de la ecran n-ar scuti nimic.
 */
export async function stergePersoana(termen: string): Promise<RezultatStergere> {
  const session = await verifySession();
  const cautare = citesteCautarea(termen);

  if (cautare.fel === "necunoscut") return { ok: false, mesaj: CAUTARE_NEINTELEASA };

  const supabase = await createClient();
  const gasiri = await strange(session.siteId, cautare);

  if (gasiri.length === 0) {
    return { ok: false, mesaj: "Nu am mai găsit nimic de șters. Poate a fost șters deja." };
  }

  const dupaFel = (fel: Gasire["fel"]) =>
    gasiri.filter((g) => g.fel === fel).map((g) => g.id);

  const tabele: [string, string[]][] = [
    ["contact_messages", dupaFel("mesaj")],
    ["appointments", dupaFel("programare")],
    ["newsletter_subscribers", dupaFel("newsletter")],
  ];

  for (const [tabel, iduri] of tabele) {
    if (iduri.length === 0) continue;

    /*
     * Ștergere adevărată, nu `deleted_at`. Mesajele au și o ștergere „la coș”,
     * de unde se pot recupera — dar o cerere GDPR nu înseamnă „mută la coș”,
     * înseamnă „nu mai păstra”. `site_id` rămâne în condiție peste RLS: e
     * explicit, iar o ștergere e ultimul loc unde vrei să te bazezi pe o singură
     * apărare.
     */
    const { error } = await supabase
      .from(tabel)
      .delete()
      .eq("site_id", session.siteId)
      .in("id", iduri);

    if (error) {
      console.error(`Ștergerea din ${tabel} a eșuat:`, error);
      return {
        ok: false,
        mesaj: "Ștergerea nu s-a putut face până la capăt. Nu s-a șters nimic pe jumătate — mai încearcă o dată.",
      };
    }
  }

  const rezumateAlbite = await albesteJurnalul(
    session.siteId,
    [...new Set(gasiri.map((g) => g.nume).filter((n) => n !== "—"))],
  );

  await scrieInJurnal({
    siteId: session.siteId,
    actorId: session.userId,
    actiune: "delete",
    entitate: "DatePersonale",
    diff: {
      rezumat: `Șterse la cererea persoanei: ${gasiri.length} ${
        gasiri.length === 1 ? "înregistrare" : "înregistrări"
      }.`,
    },
  });

  revalidatePath("/dashboard", "layout");

  return { ok: true, sterse: gasiri.length, rezumateAlbite };
}

/**
 * Scoate numele persoanei din rezumatele rămase în jurnal.
 *
 * Jurnalul scrie propoziții ca „Programarea lui Ion Popescu a fost confirmată”.
 * Numele ăla e tot dată personală: șterse rândurile din tabele și lăsat el, n-am
 * fi șters nimic.
 *
 * Rândurile NU se șterg, se albesc — jurnalul e dovada că nimeni n-a umblat pe
 * ascuns în datele cabinetului, iar unul din care se pot scoate rânduri nu mai
 * dovedește nimic. Rămâne că s-a întâmplat ceva, dispare cine.
 *
 * Se scrie cu cheia de serviciu fiindcă jurnalul e, pentru client, doar de
 * citit și de adăugat (nu există politică de `update`) — și așa trebuie să
 * rămână. Excepția asta e o operație a platformei, cerută de lege, iar ea
 * însăși lasă o intrare în jurnal.
 */
async function albesteJurnalul(siteId: string, nume: string[]): Promise<number> {
  if (nume.length === 0) return 0;

  const service = createServiceClient();

  const { data, error } = await service
    .from("audit_log")
    .select("id, diff")
    .eq("site_id", siteId);

  if (error) {
    console.error("Citirea jurnalului pentru albire a eșuat:", error);
    return 0;
  }

  let albite = 0;

  for (const rand of data ?? []) {
    const diff = rand.diff as { rezumat?: unknown } | null;
    if (!diff || typeof diff.rezumat !== "string") continue;

    let rezumat = diff.rezumat;
    for (const n of nume) rezumat = albesteRezumatul(rezumat, n);

    if (rezumat === diff.rezumat) continue;

    const { error: eroareScriere } = await service
      .from("audit_log")
      .update({ diff: { ...diff, rezumat } })
      .eq("id", rand.id as string)
      .eq("site_id", siteId);

    if (eroareScriere) {
      console.error("Albirea unui rând din jurnal a eșuat:", eroareScriere);
      continue;
    }

    albite += 1;
  }

  return albite;
}
