"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { scrieInJurnal } from "@/lib/audit";
import { CAMPURI_PAGINA, esteLocMeniu, type LocMeniu } from "@/lib/pagini";
import { catreEditor, catreStocare, valideaza, type ValoareEditor } from "@/lib/sectiuni-editare";

export type RezultatPagina =
  | { ok: true }
  | { ok: false; mesaj: string; erori?: Record<string, string> };

const MAXIM_PAGINI = 50;

/**
 * Cadrul site-ului (antet și subsol) e pe FIECARE pagină publică, iar linkurile
 * paginilor stau în el — deci o modificare aici schimbă tot site-ul, nu doar
 * pagina atinsă. De asta reîmprospătăm din rădăcină, cu `"layout"`.
 */
function reimprospateaza() {
  revalidatePath("/dashboard", "layout");
  revalidatePath("/", "layout");
}

export async function creeazaPagina(): Promise<never> {
  const session = await verifySession();
  const supabase = await createClient();

  const { count } = await supabase
    .from("pages")
    .select("id", { head: true, count: "exact" })
    .eq("site_id", session.siteId);

  if ((count ?? 0) >= MAXIM_PAGINI) {
    redirect("/dashboard/pagini?eroare=prea-multe");
  }

  const { data: ultima } = await supabase
    .from("pages")
    .select("position")
    .eq("site_id", session.siteId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Slug provizoriu, unic: coloana are `unique (site_id, slug)`, iar o pagină
  // nouă n-are încă titlu din care să-l genereze.
  const { data, error } = await supabase
    .from("pages")
    .insert({
      site_id: session.siteId,
      title: "Pagină nouă",
      slug: `pagina-noua-${Date.now()}`,
      status: "draft",
      position: ((ultima?.position as number | undefined) ?? 0) + 10,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Crearea paginii a eșuat:", error);
    redirect("/dashboard/pagini?eroare=creare");
  }

  await scrieInJurnal({
    siteId: session.siteId,
    actorId: session.userId,
    actiune: "create",
    entitate: "Page",
    entitateId: data.id as string,
  });

  reimprospateaza();
  redirect(`/dashboard/pagini/${data.id}`);
}

export async function salveazaPagina(
  id: string,
  valori: ValoareEditor,
): Promise<RezultatPagina> {
  const session = await verifySession();
  const supabase = await createClient();

  const erori = valideaza(valori, CAMPURI_PAGINA);
  if (Object.keys(erori).length > 0) {
    return { ok: false, mesaj: "Mai lipsește ceva. Câmpurile cu probleme sunt marcate.", erori };
  }

  // Dus-întors prin descriere: păstrează exact câmpurile declarate și le aruncă
  // pe toate celelalte, deci o cheie în plus trimisă din browser n-are unde să
  // ajungă.
  const curat = catreStocare(catreEditor(valori, CAMPURI_PAGINA), CAMPURI_PAGINA);

  const { error } = await supabase
    .from("pages")
    .update(curat)
    .eq("id", id)
    .eq("site_id", session.siteId);

  if (error) {
    // 23505 = adresa e deja folosită de altă pagină a aceluiași site.
    if (error.code === "23505") {
      return {
        ok: false,
        mesaj: "Adresa aceasta e deja folosită de altă pagină.",
        erori: { slug: "Alege altă adresă — două pagini nu pot avea aceeași." },
      };
    }
    console.error("Salvarea paginii a eșuat:", error);
    return { ok: false, mesaj: "Nu am putut salva. Încearcă din nou peste câteva momente." };
  }

  await scrieInJurnal({
    siteId: session.siteId,
    actorId: session.userId,
    actiune: "update",
    entitate: "Page",
    entitateId: id,
    diff: { rezumat: `Pagina „${String(curat.title ?? "")}” a fost modificată.` },
  });

  reimprospateaza();
  return { ok: true };
}

export async function comutaPublicareaPaginii(
  id: string,
  publicat: boolean,
): Promise<RezultatPagina> {
  const session = await verifySession();
  const supabase = await createClient();

  const { data: existenta } = await supabase
    .from("pages")
    .select("title")
    .eq("id", id)
    .eq("site_id", session.siteId)
    .maybeSingle<{ title: string }>();

  if (!existenta) {
    return { ok: false, mesaj: "Pagina nu mai există. Reîncarcă panoul." };
  }

  const { error } = await supabase
    .from("pages")
    .update({ status: publicat ? "published" : "unpublished" })
    .eq("id", id)
    .eq("site_id", session.siteId);

  if (error) {
    console.error("Comutarea publicării paginii a eșuat:", error);
    return { ok: false, mesaj: "Nu am putut salva. Încearcă din nou." };
  }

  await scrieInJurnal({
    siteId: session.siteId,
    actorId: session.userId,
    actiune: publicat ? "publish" : "unpublish",
    entitate: "Page",
    entitateId: id,
    diff: { rezumat: `Pagina „${existenta.title}” a fost ${publicat ? "publicată" : "retrasă"}.` },
  });

  reimprospateaza();
  return { ok: true };
}

export type RandPagina = {
  id: string;
  pozitie: number;
  publicat: boolean;
  loc: LocMeniu;
};

/**
 * Ordinea, publicarea și locul din meniu se salvează împreună, cu bara de jos.
 *
 * Sunt trei lucruri care se schimbă din același ecran și se uită la aceeași
 * listă; trei salvări separate ar fi trimis trei cereri pentru o singură
 * intenție („aranjez meniul").
 */
export async function salveazaAranjareaPaginilor(
  randuri: RandPagina[],
): Promise<RezultatPagina> {
  const session = await verifySession();
  const supabase = await createClient();

  if (randuri.length === 0) return { ok: true };
  if (randuri.length > MAXIM_PAGINI) {
    return { ok: false, mesaj: "Prea multe pagini într-o singură salvare." };
  }
  // Valoarea vine de pe rețea: tipul din semnătură nu garantează nimic la
  // rulare, iar un `nav_location` neașteptat ar fi respins abia de constrângerea
  // din Postgres, cu un mesaj pe care clientul n-are cum să-l înțeleagă.
  if (randuri.some((rand) => !esteLocMeniu(rand.loc))) {
    return { ok: false, mesaj: "Nu am înțeles unde să pun una dintre pagini. Reîncarcă panoul." };
  }

  const rezultate = await Promise.all(
    randuri.map((rand) =>
      supabase
        .from("pages")
        .update({
          position: rand.pozitie,
          status: rand.publicat ? "published" : "unpublished",
          nav_location: rand.loc,
        })
        .eq("id", rand.id)
        .eq("site_id", session.siteId),
    ),
  );

  const esuata = rezultate.find((rezultat) => rezultat.error);
  if (esuata?.error) {
    console.error("Salvarea aranjării paginilor a eșuat:", esuata.error);
    return { ok: false, mesaj: "Nu am putut salva. Reîncarcă pagina și încearcă din nou." };
  }

  reimprospateaza();
  return { ok: true };
}

export async function stergePagina(id: string): Promise<RezultatPagina> {
  const session = await verifySession();
  const supabase = await createClient();

  const { data: existenta } = await supabase
    .from("pages")
    .select("title")
    .eq("id", id)
    .eq("site_id", session.siteId)
    .maybeSingle<{ title: string }>();

  const { error } = await supabase
    .from("pages")
    .delete()
    .eq("id", id)
    .eq("site_id", session.siteId);

  if (error) {
    console.error("Ștergerea paginii a eșuat:", error);
    return { ok: false, mesaj: "Nu am putut șterge. Încearcă din nou." };
  }

  await scrieInJurnal({
    siteId: session.siteId,
    actorId: session.userId,
    actiune: "delete",
    entitate: "Page",
    entitateId: id,
    diff: existenta ? { rezumat: `Pagina „${existenta.title}” a fost ștearsă.` } : null,
  });

  reimprospateaza();
  return { ok: true };
}
