"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { scrieInJurnal } from "@/lib/audit";

export type RezultatMesaj = { ok: true } | { ok: false; mesaj: string };

const EROARE =
  "Nu am putut face asta. Reîncarcă pagina și încearcă din nou.";

/**
 * Acțiunile din ecranul Mesaje.
 *
 * Izolarea între clienți nu depinde de ce trimite browserul: se scrie cu
 * clientul userului autentificat, iar politica RLS cere
 * `site_id = current_site_id()`. Un id din alt site nu potrivește niciun rând.
 *
 * NIMIC din conținutul mesajelor nu ajunge în jurnalul de activitate — nici
 * numele, nici adresa, nici textul. Altfel ștergerea definitivă n-ar fi
 * definitivă: datele ar rămâne într-un tabel pe care nimeni nu l-ar căuta.
 */

export async function marcheazaCitit(id: string, citit: boolean): Promise<RezultatMesaj> {
  const session = await verifySession();
  const supabase = await createClient();

  const { error } = await supabase
    .from("contact_messages")
    .update({ read_at: citit ? new Date().toISOString() : null })
    .eq("id", id)
    .eq("site_id", session.siteId);

  if (error) {
    console.error("Marcarea mesajului a eșuat:", error);
    return { ok: false, mesaj: EROARE };
  }

  // Fără intrare în jurnal: „a citit un mesaj" s-ar repeta de zeci de ori pe zi
  // și ar îneca lucrurile care chiar contează.
  // „layout", nu doar pagina: numărul de mesaje necitite se calculează în
  // layoutul panoului, pentru semnul de lângă „Mesaje" din meniu. Fără asta ar
  // rămâne pe valoarea veche până la o reîncărcare completă.
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

/** Ștergere reversibilă: mesajul iese din listă, dar se poate aduce înapoi. */
export async function mutaLaSterse(id: string): Promise<RezultatMesaj> {
  const session = await verifySession();
  const supabase = await createClient();

  const { error } = await supabase
    .from("contact_messages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("site_id", session.siteId);

  if (error) {
    console.error("Ștergerea mesajului a eșuat:", error);
    return { ok: false, mesaj: EROARE };
  }

  await scrieInJurnal({
    siteId: session.siteId,
    actorId: session.userId,
    actiune: "delete",
    entitate: "ContactSubmission",
    entitateId: id,
    diff: { rezumat: "Mesaj mutat la șterse." },
  });

  // „layout", nu doar pagina: numărul de mesaje necitite se calculează în
  // layoutul panoului, pentru semnul de lângă „Mesaje" din meniu. Fără asta ar
  // rămâne pe valoarea veche până la o reîncărcare completă.
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function restaureaza(id: string): Promise<RezultatMesaj> {
  const session = await verifySession();
  const supabase = await createClient();

  const { error } = await supabase
    .from("contact_messages")
    .update({ deleted_at: null })
    .eq("id", id)
    .eq("site_id", session.siteId);

  if (error) {
    console.error("Restaurarea mesajului a eșuat:", error);
    return { ok: false, mesaj: EROARE };
  }

  // „layout", nu doar pagina: numărul de mesaje necitite se calculează în
  // layoutul panoului, pentru semnul de lângă „Mesaje" din meniu. Fără asta ar
  // rămâne pe valoarea veche până la o reîncărcare completă.
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

/**
 * Ștergere adevărată, din baza de date.
 *
 * Există separat de ștergerea reversibilă tocmai fiindcă un mesaj de la cineva
 * care caută un psiholog e un dat cu caracter personal, uneori foarte intim.
 * Cine cere să fie șters chiar trebuie să poată fi șters — nu mutat într-o
 * coloană unde rămâne pe termen nedefinit.
 */
export async function stergeDefinitiv(id: string): Promise<RezultatMesaj> {
  const session = await verifySession();
  const supabase = await createClient();

  const { error } = await supabase
    .from("contact_messages")
    .delete()
    .eq("id", id)
    .eq("site_id", session.siteId);

  if (error) {
    console.error("Ștergerea definitivă a eșuat:", error);
    return { ok: false, mesaj: EROARE };
  }

  await scrieInJurnal({
    siteId: session.siteId,
    actorId: session.userId,
    actiune: "delete",
    entitate: "ContactSubmission",
    entitateId: id,
    diff: { rezumat: "Mesaj șters definitiv." },
  });

  // „layout", nu doar pagina: numărul de mesaje necitite se calculează în
  // layoutul panoului, pentru semnul de lângă „Mesaje" din meniu. Fără asta ar
  // rămâne pe valoarea veche până la o reîncărcare completă.
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}
