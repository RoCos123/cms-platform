"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { scrieInJurnal } from "@/lib/audit";
import { CAMPURI_ARTICOL } from "@/lib/blog";
import { catreEditor, catreStocare, valideaza, type ValoareEditor } from "@/lib/sectiuni-editare";
import { normalizeazaPunctFocal } from "@/lib/punct-focal";
import { MAXIM_ARTICOLE, EROARE_PREA_MULTE } from "@/lib/limite-panou";
import { mutaArticol, pozitiaArticoluluiNou, type Directie } from "@/lib/ordine-articole";

export type RezultatArticol =
  | { ok: true }
  | { ok: false; mesaj: string; erori?: Record<string, string> };

/** Toate rutele care arată articole, reîmprospătate împreună. */
function reimprospateaza(slug?: string) {
  revalidatePath("/dashboard", "layout");
  revalidatePath("/");
  revalidatePath("/blog");
  if (slug) revalidatePath(`/blog/${slug}`);
}

/**
 * Coperta vine din formular ca `{ uploadId, url, altText }` — aceeași formă ca
 * orice imagine din panou — dar în baza de date stă în două coloane, cu cheie
 * externă către `uploads`.
 *
 * Cheia externă nu e un moft: are `on delete set null`, deci ștergerea unei
 * imagini din bibliotecă scoate automat coperta din articol. Fără ea, articolul
 * ar fi rămas cu adresa unui fișier care nu mai există, iar cititorii ar fi
 * văzut o imagine ruptă.
 */
function coloaneleCopertii(valoare: unknown): {
  cover_upload_id: string | null;
  cover_alt: string | null;
  cover_focal_x: number | null;
  cover_focal_y: number | null;
  cover_focal_zoom: number | null;
} {
  const coperta = valoare as
    | { uploadId?: unknown; altText?: unknown; pozitie?: unknown }
    | null
    | undefined;

  const uploadId = typeof coperta?.uploadId === "string" && coperta.uploadId ? coperta.uploadId : null;
  const altText = typeof coperta?.altText === "string" ? coperta.altText.trim() : "";

  // Încadrarea e a LOCULUI (a articolului), nu a pozei (3 oct. 2026): pe rândul
  // articolului, nu pe `uploads`. Fără poză, n-are rost nicio încadrare.
  if (!uploadId) {
    return {
      cover_upload_id: null,
      cover_alt: null,
      cover_focal_x: null,
      cover_focal_y: null,
      cover_focal_zoom: null,
    };
  }

  const p = normalizeazaPunctFocal(coperta?.pozitie);
  return {
    cover_upload_id: uploadId,
    cover_alt: altText ? altText : null,
    cover_focal_x: p.x,
    cover_focal_y: p.y,
    cover_focal_zoom: p.zoom ?? null,
  };
}

export async function creeazaArticol(): Promise<never> {
  const session = await verifySession();
  const supabase = await createClient();

  const { count } = await supabase
    .from("blog_articles")
    .select("id", { head: true, count: "exact" })
    .eq("site_id", session.siteId);

  if ((count ?? 0) >= MAXIM_ARTICOLE) {
    redirect(`/dashboard/blog?eroare=${EROARE_PREA_MULTE}`);
  }

  // Articolul nou se așază înaintea tuturor: „cel mai nou primul" rămâne purtarea
  // implicită, iar cine vrea altfel îl mută din meniul „⋯" al rândului.
  const { data: primul } = await supabase
    .from("blog_articles")
    .select("position")
    .eq("site_id", session.siteId)
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle<{ position: number }>();

  // Slug provizoriu, unic: coloana are `unique (site_id, slug)`, iar un articol
  // nou n-are încă titlu din care să-l genereze.
  const { data, error } = await supabase
    .from("blog_articles")
    .insert({
      site_id: session.siteId,
      title: "Articol nou",
      slug: `articol-nou-${Date.now()}`,
      status: "draft",
      position: pozitiaArticoluluiNou(primul?.position ?? null),
      // Autorul e cine scrie, luat din sesiune. Nu se afișează pe site (un
      // cabinet are un singur psiholog), dar jurnalul are nevoie de el.
      author_id: session.userId,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Crearea articolului a eșuat:", error);
    redirect("/dashboard/blog?eroare=creare");
  }

  await scrieInJurnal({
    siteId: session.siteId,
    actorId: session.userId,
    actiune: "create",
    entitate: "BlogArticle",
    entitateId: data.id as string,
  });

  reimprospateaza();
  redirect(`/dashboard/blog/${data.id}`);
}

export async function salveazaArticol(
  id: string,
  valori: ValoareEditor,
): Promise<RezultatArticol> {
  const session = await verifySession();
  const supabase = await createClient();

  const erori = valideaza(valori, CAMPURI_ARTICOL);
  if (Object.keys(erori).length > 0) {
    return { ok: false, mesaj: "Mai lipsește ceva. Câmpurile cu probleme sunt marcate.", erori };
  }

  // Dus-întors prin descriere: păstrează exact câmpurile declarate și le aruncă
  // pe toate celelalte, deci o cheie în plus trimisă din browser n-are unde să
  // ajungă.
  const curat = catreStocare(catreEditor(valori, CAMPURI_ARTICOL), CAMPURI_ARTICOL);
  const { coperta, ...coloane } = curat;

  const { data, error } = await supabase
    .from("blog_articles")
    .update({ ...coloane, ...coloaneleCopertii(coperta) })
    .eq("id", id)
    .eq("site_id", session.siteId)
    .select("slug")
    .maybeSingle<{ slug: string }>();

  if (error) {
    // 23505 = adresa e deja folosită de alt articol al aceluiași site.
    if (error.code === "23505") {
      return {
        ok: false,
        mesaj: "Adresa aceasta e deja folosită de alt articol.",
        erori: { slug: "Alege altă adresă — două articole nu pot avea aceeași." },
      };
    }
    console.error("Salvarea articolului a eșuat:", error);
    return { ok: false, mesaj: "Nu am putut salva. Încearcă din nou peste câteva momente." };
  }

  await scrieInJurnal({
    siteId: session.siteId,
    actorId: session.userId,
    actiune: "update",
    entitate: "BlogArticle",
    entitateId: id,
    diff: { rezumat: `Articolul „${String(coloane.title ?? "")}” a fost modificat.` },
  });

  reimprospateaza(data?.slug);
  return { ok: true };
}

/**
 * Publică sau retrage un articol.
 *
 * `published_at` se pune o singură dată, la prima publicare, și rămâne. Un
 * articol retras și repus n-a fost scris de două ori — data lui e cea la care
 * l-au citit oamenii prima oară, iar rescriind-o s-ar fi mutat brusc în capul
 * listei ca și cum ar fi nou.
 */
export async function comutaPublicareaArticolului(
  id: string,
  publicat: boolean,
): Promise<RezultatArticol> {
  const session = await verifySession();
  const supabase = await createClient();

  const { data: existent } = await supabase
    .from("blog_articles")
    .select("title, slug, published_at")
    .eq("id", id)
    .eq("site_id", session.siteId)
    .maybeSingle<{ title: string; slug: string; published_at: string | null }>();

  if (!existent) {
    return { ok: false, mesaj: "Articolul nu mai există. Reîncarcă pagina." };
  }

  const { error } = await supabase
    .from("blog_articles")
    .update({
      status: publicat ? "published" : "unpublished",
      published_at: publicat ? (existent.published_at ?? new Date().toISOString()) : existent.published_at,
    })
    .eq("id", id)
    .eq("site_id", session.siteId);

  if (error) {
    console.error("Comutarea publicării a eșuat:", error);
    return { ok: false, mesaj: "Nu am putut salva. Încearcă din nou." };
  }

  await scrieInJurnal({
    siteId: session.siteId,
    actorId: session.userId,
    actiune: publicat ? "publish" : "unpublish",
    entitate: "BlogArticle",
    entitateId: id,
    diff: { rezumat: `Articolul „${existent.title}” a fost ${publicat ? "publicat" : "retras"}.` },
  });

  reimprospateaza(existent.slug);
  return { ok: true };
}

export type RezultatMutare =
  | { ok: true; ordine: string[] }
  | { ok: false; mesaj: string };

/**
 * Mută un articol cu o treaptă mai sus sau mai jos, în ordinea de pe site.
 *
 * Ordinea se ia din baza de date, nu de la browser: un panou rămas deschis de
 * mult are lista veche, iar „mută mai sus" trebuie să însemne mai sus în lista
 * de ACUM. Răspunsul poartă ordinea rezultată, ca panoul să se potrivească cu
 * ea dacă între timp a mai umblat cineva.
 *
 * Se salvează pe loc, fără bară de jos — ca publicarea de pe același rând.
 */
export async function mutaArticolul(id: string, directie: Directie): Promise<RezultatMutare> {
  const session = await verifySession();
  const supabase = await createClient();

  if (directie !== "sus" && directie !== "jos") {
    return { ok: false, mesaj: "Nu am înțeles unde să mut articolul." };
  }

  // Aceeași ordine ca în panou și pe blogul public (vezi `ordine-articole.ts`).
  const { data, error: eroareCitire } = await supabase
    .from("blog_articles")
    .select("id, position")
    .eq("site_id", session.siteId)
    .order("position", { ascending: true })
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (eroareCitire || !data) {
    console.error("Citirea ordinii articolelor a eșuat:", eroareCitire);
    return { ok: false, mesaj: "Nu am putut muta articolul. Încearcă din nou." };
  }

  const randuri = data as unknown as { id: string; position: number }[];

  if (!randuri.some((rand) => rand.id === id)) {
    return { ok: false, mesaj: "Articolul nu mai există. Reîncarcă pagina." };
  }

  const mutare = mutaArticol(randuri, id, directie);

  // Deja primul (sau ultimul): nimic de scris, iar panoul primește ordinea reală.
  if (!mutare) return { ok: true, ordine: randuri.map((rand) => rand.id) };

  const rezultate = await Promise.all(
    mutare.scrieri.map((rand) =>
      supabase
        .from("blog_articles")
        .update({ position: rand.position })
        .eq("id", rand.id)
        .eq("site_id", session.siteId),
    ),
  );

  const esuata = rezultate.find((rezultat) => rezultat.error);
  if (esuata?.error) {
    console.error("Mutarea articolului a eșuat:", esuata.error);
    return { ok: false, mesaj: "Nu am putut muta articolul. Reîncarcă pagina și încearcă din nou." };
  }

  reimprospateaza();
  return { ok: true, ordine: mutare.ordine };
}

export async function stergeArticol(id: string): Promise<RezultatArticol> {
  const session = await verifySession();
  const supabase = await createClient();

  const { data: existent } = await supabase
    .from("blog_articles")
    .select("title, slug")
    .eq("id", id)
    .eq("site_id", session.siteId)
    .maybeSingle<{ title: string; slug: string }>();

  const { error } = await supabase
    .from("blog_articles")
    .delete()
    .eq("id", id)
    .eq("site_id", session.siteId);

  if (error) {
    console.error("Ștergerea articolului a eșuat:", error);
    return { ok: false, mesaj: "Nu am putut șterge. Încearcă din nou." };
  }

  await scrieInJurnal({
    siteId: session.siteId,
    actorId: session.userId,
    actiune: "delete",
    entitate: "BlogArticle",
    entitateId: id,
    diff: existent ? { rezumat: `Articolul „${existent.title}” a fost șters.` } : null,
  });

  reimprospateaza(existent?.slug);
  return { ok: true };
}

/**
 * Pornește sau oprește blogul.
 *
 * Oprit, dispare tot: pagina `/blog`, paginile articolelor, secțiunea „Articole
 * recente" de pe prima pagină și intrarea din meniu. Spre deosebire de servicii,
 * unde cartonașul se citește întreg și fără pagina lui, un cartonaș de articol
 * fără pagina articolului n-ar avea unde duce.
 *
 * Nimic nu se șterge: articolele rămân scrise, doar nu se mai afișează.
 */
export async function comutaBlogul(activ: boolean): Promise<RezultatArticol> {
  const session = await verifySession();
  const supabase = await createClient();

  const { data: existent } = await supabase
    .from("site_settings")
    .select("pagini")
    .eq("site_id", session.siteId)
    .maybeSingle();

  const pagini = { ...((existent?.pagini ?? {}) as Record<string, unknown>), blog: activ };

  // `upsert`: rândul de setări poate lipsi, iar un `update` ar fi trecut în
  // tăcere fără să scrie nimic.
  const { error } = await supabase
    .from("site_settings")
    .upsert({ site_id: session.siteId, pagini }, { onConflict: "site_id" });

  if (error) {
    console.error("Comutarea blogului a eșuat:", error);
    return { ok: false, mesaj: "Nu am putut salva. Încearcă din nou." };
  }

  await scrieInJurnal({
    siteId: session.siteId,
    actorId: session.userId,
    actiune: activ ? "publish" : "unpublish",
    entitate: "SiteSettings",
    diff: { rezumat: `Blogul a fost ${activ ? "pornit" : "oprit"}.` },
  });

  reimprospateaza();
  return { ok: true };
}
