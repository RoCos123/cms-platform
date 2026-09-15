"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { scrieInJurnal } from "@/lib/audit";
import { BUCKET_MEDIA } from "@/lib/uploads";
import {
  MAXIM_DESCRIERE_IMAGINE,
  rescrieImaginea,
  scoateIncarcarea,
  type ImagineBiblioteca,
  type RandSectiune,
} from "@/lib/imagini";
import { imaginileBibliotecii } from "@/lib/imagini-panou";
import { normalizeazaPunctFocal } from "@/lib/punct-focal";

export type RezultatImagine = { ok: true } | { ok: false; mesaj: string };

/**
 * Lista bibliotecii, adusă la CERERE — când se deschide fereastra „Alege din
 * bibliotecă", nu în layout-ul panoului. Înainte se citea o dată pe fiecare
 * pagină din dashboard (Mesaje, Programări, Setări...), deși alegătorul se
 * deschide rar; la mii de imagini era cost degeaba pe fiecare navigare.
 * (Findingul F09 din audit.)
 */
export async function incarcaBibliotecaImagini(): Promise<ImagineBiblioteca[]> {
  const session = await verifySession();
  return imaginileBibliotecii(session.siteId);
}

const TIPAR_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Toate rutele care arată imagini, reîmprospătate împreună. */
function reimprospateaza() {
  revalidatePath("/dashboard", "layout");
  revalidatePath("/");
  revalidatePath("/servicii");
}

/**
 * Argumentele unui Server Action vin de pe rețea, deci tipul din semnătură nu
 * garantează nimic la rulare. Un id care nu arată a UUID ar ajunge altfel în
 * Postgres și ar da o eroare de conversie în loc de un mesaj omenesc.
 */
function idValid(uploadId: string): boolean {
  return TIPAR_UUID.test(uploadId);
}

type ClientSupabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Rescrie imaginea în toate secțiunile care o folosesc.
 *
 * Descrierea imaginii se scrie într-un singur loc — biblioteca — dar site-ul
 * public o randează din conținutul secțiunii, ca o pagină de vizitator să nu
 * depindă de un al doilea tabel. Sincronizarea celor două e treaba de aici, și
 * se face la fiecare schimbare, nu la fiecare afișare.
 *
 * Întoarce `false` dacă vreo scriere a eșuat: apelantul decide dacă mai are voie
 * să continue.
 */
async function rescrieInSectiuni(
  supabase: ClientSupabase,
  siteId: string,
  transforma: (data: unknown) => { valoare: unknown; schimbat: boolean },
): Promise<boolean> {
  const { data: sectiuni, error } = await supabase
    .from("site_content")
    .select("id, key, data")
    .eq("site_id", siteId);

  if (error) {
    console.error("Citirea secțiunilor pentru rescriere a eșuat:", error);
    return false;
  }

  const deScris = ((sectiuni ?? []) as RandSectiune[])
    .map((rand) => ({ id: rand.id, ...transforma(rand.data) }))
    // Rândurile neatinse nu se rescriu: altfel fiecare salvare ar mișca
    // `updated_at` pe toate secțiunile site-ului și jurnalul ar deveni ilizibil.
    .filter((rand) => rand.schimbat);

  if (deScris.length === 0) return true;

  const rezultate = await Promise.all(
    deScris.map((rand) =>
      supabase
        .from("site_content")
        .update({ data: rand.valoare })
        .eq("id", rand.id)
        .eq("site_id", siteId),
    ),
  );

  const esuata = rezultate.find((rezultat) => rezultat.error);
  if (esuata?.error) {
    console.error("Rescrierea imaginii în secțiuni a eșuat:", esuata.error);
    return false;
  }

  return true;
}

/**
 * Schimbă descrierea unei imagini, peste tot unde e folosită.
 *
 * Descrierea nu e o etichetă de arhivă: e textul citit cu voce tare de cititorul
 * de ecran al cuiva care nu vede poza, și cel afișat de browser când imaginea nu
 * se încarcă. De asta se schimbă în toate locurile deodată — aceeași poză a
 * cabinetului nu are cum să arate una în „Despre mine" și alta în „Contact".
 */
export async function salveazaDescriereaImaginii(
  uploadId: string,
  descriere: string,
): Promise<RezultatImagine> {
  const session = await verifySession();

  if (!idValid(uploadId)) {
    return { ok: false, mesaj: "Nu știu ce imagine să modific. Reîncarcă pagina și încearcă din nou." };
  }

  const curata = descriere.trim().slice(0, MAXIM_DESCRIERE_IMAGINE);
  const supabase = await createClient();

  // `eq("site_id")` e redundant față de RLS, dar face intenția explicită în cod:
  // nimeni nu scrie în biblioteca altui cabinet.
  const { data: existenta } = await supabase
    .from("uploads")
    .select("filename")
    .eq("id", uploadId)
    .eq("site_id", session.siteId)
    .maybeSingle<{ filename: string }>();

  if (!existenta) {
    return { ok: false, mesaj: "Imaginea nu mai există. Probabil a fost ștearsă între timp." };
  }

  const { error } = await supabase
    .from("uploads")
    // Gol înseamnă „încă nedescrisă", iar `null` e felul în care coloana spune
    // asta; un șir vid ar fi arătat la fel în panou, dar ar fi însemnat altceva
    // pentru orice interogare care caută imaginile fără descriere.
    .update({ alt_text: curata || null })
    .eq("id", uploadId)
    .eq("site_id", session.siteId);

  if (error) {
    console.error("Salvarea descrierii imaginii a eșuat:", error);
    return { ok: false, mesaj: "Nu am putut salva descrierea. Mai încearcă o dată." };
  }

  const propagat = await rescrieInSectiuni(supabase, session.siteId, (data) =>
    rescrieImaginea(data, uploadId, (imagine) => ({ ...imagine, altText: curata })),
  );

  if (!propagat) {
    return {
      ok: false,
      mesaj:
        "Descrierea s-a salvat în bibliotecă, dar nu în toate locurile de pe site. Reîncarcă pagina și salvează din nou.",
    };
  }

  await scrieInJurnal({
    siteId: session.siteId,
    actorId: session.userId,
    actiune: "update",
    entitate: "Upload",
    entitateId: uploadId,
    diff: { rezumat: `Descrierea imaginii „${existenta.filename}” a fost schimbată.` },
  });

  reimprospateaza();
  return { ok: true };
}

/**
 * Schimbă poziția unei imagini (punctul pe care se centrează când e tăiată),
 * peste tot unde e folosită.
 *
 * Ca și descrierea: poziția e o însușire a POZEI, nu a locului. Clientul o trage
 * în ramă o dată — la încărcare sau din bibliotecă — și rămâne așa în toate
 * secțiunile. Baza e coloana din `uploads`; copia din conținutul secțiunilor,
 * ținută la zi aici, e ce citește site-ul public fără a mai întreba un al doilea
 * tabel.
 */
export async function pozitioneazaImagine(
  uploadId: string,
  x: number,
  y: number,
): Promise<RezultatImagine> {
  const session = await verifySession();

  if (!idValid(uploadId)) {
    return { ok: false, mesaj: "Nu știu ce imagine să poziționez. Reîncarcă pagina și încearcă din nou." };
  }

  // Curățat înainte de bază: o valoare din afara intervalului ar cădea altfel
  // constrângerea `uploads_focal_pereche_in_interval` cu o eroare de Postgres.
  const punct = normalizeazaPunctFocal({ x, y });
  const supabase = await createClient();

  const { data: existenta } = await supabase
    .from("uploads")
    .select("filename")
    .eq("id", uploadId)
    .eq("site_id", session.siteId)
    .maybeSingle<{ filename: string }>();

  if (!existenta) {
    return { ok: false, mesaj: "Imaginea nu mai există. Probabil a fost ștearsă între timp." };
  }

  const { error } = await supabase
    .from("uploads")
    .update({ focal_x: punct.x, focal_y: punct.y })
    .eq("id", uploadId)
    .eq("site_id", session.siteId);

  if (error) {
    console.error("Salvarea poziției imaginii a eșuat:", error);
    return { ok: false, mesaj: "Nu am putut salva poziția. Mai încearcă o dată." };
  }

  const propagat = await rescrieInSectiuni(supabase, session.siteId, (data) =>
    rescrieImaginea(data, uploadId, (imagine) => ({ ...imagine, pozitie: punct })),
  );

  if (!propagat) {
    return {
      ok: false,
      mesaj:
        "Poziția s-a salvat pe poză, dar nu în toate locurile de pe site. Reîncarcă pagina și salvează din nou.",
    };
  }

  await scrieInJurnal({
    siteId: session.siteId,
    actorId: session.userId,
    actiune: "update",
    entitate: "Upload",
    entitateId: uploadId,
    diff: { rezumat: `Poziția imaginii „${existenta.filename}” a fost schimbată.` },
  });

  reimprospateaza();
  return { ok: true };
}

/**
 * Șterge definitiv o imagine: întâi o scoate din secțiunile care o folosesc,
 * apoi rândul din `uploads`, apoi fișierul din Storage.
 *
 * Ordinea e aleasă după ce se întâmplă dacă un pas pică:
 *
 * - scoasă din secțiuni, dar ștergerea eșuează → imaginea nu mai apare pe site
 *   (adică exact ce a cerut clientul), iar fișierul rămâne în bibliotecă și se
 *   poate încerca din nou;
 * - ștearsă întâi, cu scoaterea eșuată → secțiunile ar rămâne cu adrese moarte,
 *   iar vizitatorii ar vedea imagini rupte pe site-ul live.
 *
 * Un fișier rămas în Storage după ștergerea rândului costă câțiva kilobytes și
 * nu strică niciun ecran; invers nu e adevărat.
 */
export async function stergeImaginea(uploadId: string): Promise<RezultatImagine> {
  const session = await verifySession();

  if (!idValid(uploadId)) {
    return { ok: false, mesaj: "Nu știu ce imagine să șterg. Reîncarcă pagina și încearcă din nou." };
  }

  const supabase = await createClient();

  const { data: imagine } = await supabase
    .from("uploads")
    .select("storage_path, filename")
    .eq("id", uploadId)
    .eq("site_id", session.siteId)
    .maybeSingle<{ storage_path: string; filename: string }>();

  if (!imagine) {
    return { ok: false, mesaj: "Imaginea nu mai există. Probabil a fost ștearsă deja." };
  }

  // Scoate încărcarea din secțiuni fie că e poză, fie material (buton de
  // descărcare): altfel un buton ar rămâne legat de un fișier șters.
  const scoasa = await rescrieInSectiuni(supabase, session.siteId, (data) =>
    scoateIncarcarea(data, uploadId),
  );

  if (!scoasa) {
    return {
      ok: false,
      mesaj:
        "Nu am putut scoate imaginea din paginile în care e folosită, așa că nu am șters-o. Mai încearcă o dată.",
    };
  }

  const { error } = await supabase
    .from("uploads")
    .delete()
    .eq("id", uploadId)
    .eq("site_id", session.siteId);

  if (error) {
    console.error("Ștergerea imaginii a eșuat:", error);
    return {
      ok: false,
      mesaj: "Am scos imaginea de pe site, dar nu am putut-o șterge din bibliotecă. Mai încearcă o dată.",
    };
  }

  await supabase.storage.from(BUCKET_MEDIA).remove([imagine.storage_path]);

  await scrieInJurnal({
    siteId: session.siteId,
    actorId: session.userId,
    actiune: "delete",
    entitate: "Upload",
    entitateId: uploadId,
    diff: { rezumat: `Imaginea „${imagine.filename}” a fost ștearsă din bibliotecă.` },
  });

  reimprospateaza();
  return { ok: true };
}
