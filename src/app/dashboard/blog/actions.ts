"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { scrieInJurnal } from "@/lib/audit";
import { CAMPURI_ARTICOL } from "@/lib/blog";
import { catreEditor, catreStocare, valideaza, type ValoareEditor } from "@/lib/sectiuni-editare";

export type RezultatArticol =
  | { ok: true }
  | { ok: false; mesaj: string; erori?: Record<string, string> };

const MAXIM_ARTICOLE = 500;

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
function coloaneleCopertii(valoare: unknown): { cover_upload_id: string | null; cover_alt: string | null } {
  const coperta = valoare as { uploadId?: unknown; altText?: unknown } | null | undefined;

  const uploadId = typeof coperta?.uploadId === "string" && coperta.uploadId ? coperta.uploadId : null;
  const altText = typeof coperta?.altText === "string" ? coperta.altText.trim() : "";

  return { cover_upload_id: uploadId, cover_alt: uploadId && altText ? altText : null };
}

export async function creeazaArticol(): Promise<never> {
  const session = await verifySession();
  const supabase = await createClient();

  const { count } = await supabase
    .from("blog_articles")
    .select("id", { head: true, count: "exact" })
    .eq("site_id", session.siteId);

  if ((count ?? 0) >= MAXIM_ARTICOLE) {
    redirect("/dashboard/blog?eroare=prea-multe");
  }

  // Slug provizoriu, unic: coloana are `unique (site_id, slug)`, iar un articol
  // nou n-are încă titlu din care să-l genereze.
  const { data, error } = await supabase
    .from("blog_articles")
    .insert({
      site_id: session.siteId,
      title: "Articol nou",
      slug: `articol-nou-${Date.now()}`,
      status: "draft",
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
