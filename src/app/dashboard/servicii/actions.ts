"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { scrieInJurnal } from "@/lib/audit";
import { CAMPURI_SERVICIU, rezumatServiciu } from "@/lib/servicii";
import { catreEditor, catreStocare, valideaza, type ValoareEditor } from "@/lib/sectiuni-editare";

export type RezultatServiciu =
  | { ok: true }
  | { ok: false; mesaj: string; erori?: Record<string, string> };

const MAXIM_SERVICII = 40;

/**
 * Coperta stă în bază ca `cover_upload_id` (o referință), dar formularul o dă ca
 * imagine (`{ uploadId, url, altText }`). Aici scoatem doar id-ul.
 *
 * Serviciile n-au coloană de text alternativ (spre deosebire de articole):
 * poza cartonașului e ilustrativă, iar numele serviciului, chiar lângă ea, spune
 * ce e — deci se randează ca decor (`alt=""`), nu se cere o descriere în plus.
 */
function coloanaCoperta(valoare: unknown): { cover_upload_id: string | null } {
  const coperta = valoare as { uploadId?: unknown } | null | undefined;
  const uploadId =
    typeof coperta?.uploadId === "string" && coperta.uploadId ? coperta.uploadId : null;
  return { cover_upload_id: uploadId };
}

/**
 * Serviciile stau în tabelul lor, nu în conținutul unei secțiuni.
 *
 * Așa, cartonașul de pe prima pagină și pagina de servicii citesc din același
 * loc. Dacă fiecare și-ar fi ținut propriile texte, ar fi ajuns să se
 * contrazică — clientul schimbă prețul într-un loc și îl uită în celălalt.
 */

/** Toate rutele care arată servicii, revalidate împreună. */
function reimprospateaza() {
  revalidatePath("/dashboard", "layout");
  revalidatePath("/");
  revalidatePath("/servicii");
}

export async function creeazaServiciu(): Promise<never> {
  const session = await verifySession();
  const supabase = await createClient();

  const { count } = await supabase
    .from("services")
    .select("id", { head: true, count: "exact" })
    .eq("site_id", session.siteId);

  if ((count ?? 0) >= MAXIM_SERVICII) {
    redirect("/dashboard/servicii?eroare=prea-multe");
  }

  const { data: ultimul } = await supabase
    .from("services")
    .select("position")
    .eq("site_id", session.siteId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Slug provizoriu, unic: coloana are `unique (site_id, slug)`, iar un serviciu
  // nou n-are încă nume din care să-l genereze.
  const provizoriu = `serviciu-nou-${Date.now()}`;

  const { data, error } = await supabase
    .from("services")
    .insert({
      site_id: session.siteId,
      title: "Serviciu nou",
      slug: provizoriu,
      status: "draft",
      position: ((ultimul?.position as number | undefined) ?? 0) + 10,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Crearea serviciului a eșuat:", error);
    redirect("/dashboard/servicii?eroare=creare");
  }

  await scrieInJurnal({
    siteId: session.siteId,
    actorId: session.userId,
    actiune: "create",
    entitate: "Service",
    entitateId: data.id as string,
  });

  reimprospateaza();
  redirect(`/dashboard/servicii/${data.id}`);
}

export async function salveazaServiciu(
  id: string,
  valori: ValoareEditor,
): Promise<RezultatServiciu> {
  const session = await verifySession();
  const supabase = await createClient();

  const erori = valideaza(valori, CAMPURI_SERVICIU);
  if (Object.keys(erori).length > 0) {
    return { ok: false, mesaj: "Mai lipsește ceva. Câmpurile cu probleme sunt marcate.", erori };
  }

  // Dus-întors prin descriere: păstrează exact câmpurile declarate și le aruncă
  // pe toate celelalte, deci o cheie în plus trimisă din browser n-are unde să
  // ajungă.
  const curat = catreStocare(catreEditor(valori, CAMPURI_SERVICIU), CAMPURI_SERVICIU);

  // Coperta se traduce în coloana ei; restul câmpurilor sunt deja coloane. Fără
  // scoaterea asta, `update` ar primi o cheie `coperta` inexistentă și ar pica.
  const { coperta, ...coloane } = curat;

  // Rezumatul de pe cartonaș se scoate din descriere, nu se scrie de mână.
  // Coloana `excerpt` rămâne (cartonașul citea din ea), dar acum o umplem noi.
  const curatCuRezumat = {
    ...coloane,
    ...coloanaCoperta(coperta),
    excerpt: rezumatServiciu(String(coloane.content ?? "")),
  };

  const { error } = await supabase
    .from("services")
    .update(curatCuRezumat)
    .eq("id", id)
    .eq("site_id", session.siteId);

  if (error) {
    // 23505 = adresa e deja folosită de alt serviciu al aceluiași site.
    if (error.code === "23505") {
      return {
        ok: false,
        mesaj: "Adresa aceasta e deja folosită de alt serviciu.",
        erori: { slug: "Alege altă adresă — două servicii nu pot avea aceeași." },
      };
    }
    console.error("Salvarea serviciului a eșuat:", error);
    return { ok: false, mesaj: "Nu am putut salva. Încearcă din nou peste câteva momente." };
  }

  await scrieInJurnal({
    siteId: session.siteId,
    actorId: session.userId,
    actiune: "update",
    entitate: "Service",
    entitateId: id,
    diff: { rezumat: `Serviciul „${String(curat.title ?? "")}” a fost modificat.` },
  });

  reimprospateaza();
  return { ok: true };
}

/**
 * Pornește sau oprește pagina cu serviciile descrise pe larg.
 *
 * Oprită, `/servicii` nu mai există (răspunde „pagina nu există", nu o pagină
 * goală), iar cartonașele de pe prima pagină rămân cartonașe fără link. Un card
 * care scrie „Află mai multe" și nu duce nicăieri e mai rău decât unul simplu.
 */
export async function comutaPaginaServicii(activa: boolean): Promise<RezultatServiciu> {
  const session = await verifySession();
  const supabase = await createClient();

  const { data: existent } = await supabase
    .from("site_settings")
    .select("pagini")
    .eq("site_id", session.siteId)
    .maybeSingle();

  const pagini = { ...((existent?.pagini ?? {}) as Record<string, unknown>), servicii: activa };

  // `upsert`: rândul de setări poate lipsi, iar un `update` ar fi trecut în
  // tăcere fără să scrie nimic.
  const { error } = await supabase
    .from("site_settings")
    .upsert({ site_id: session.siteId, pagini }, { onConflict: "site_id" });

  if (error) {
    console.error("Comutarea paginii de servicii a eșuat:", error);
    return { ok: false, mesaj: "Nu am putut salva. Încearcă din nou." };
  }

  await scrieInJurnal({
    siteId: session.siteId,
    actorId: session.userId,
    actiune: activa ? "publish" : "unpublish",
    entitate: "SiteSettings",
    diff: { rezumat: `Pagina de servicii a fost ${activa ? "pornită" : "oprită"}.` },
  });

  reimprospateaza();
  return { ok: true };
}

export type RandServiciu = { id: string; pozitie: number; publicat: boolean };

export async function salveazaOrdineaServiciilor(
  randuri: RandServiciu[],
): Promise<RezultatServiciu> {
  const session = await verifySession();
  const supabase = await createClient();

  if (randuri.length === 0) return { ok: true };
  if (randuri.length > MAXIM_SERVICII) {
    return { ok: false, mesaj: "Prea multe servicii într-o singură salvare." };
  }

  const rezultate = await Promise.all(
    randuri.map((rand) =>
      supabase
        .from("services")
        .update({ position: rand.pozitie, status: rand.publicat ? "published" : "draft" })
        .eq("id", rand.id)
        .eq("site_id", session.siteId),
    ),
  );

  const esuata = rezultate.find((r) => r.error);
  if (esuata?.error) {
    console.error("Salvarea ordinii serviciilor a eșuat:", esuata.error);
    return { ok: false, mesaj: "Nu am putut salva. Reîncarcă pagina și încearcă din nou." };
  }

  reimprospateaza();
  return { ok: true };
}

export async function stergeServiciu(id: string): Promise<RezultatServiciu> {
  const session = await verifySession();
  const supabase = await createClient();

  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", id)
    .eq("site_id", session.siteId);

  if (error) {
    console.error("Ștergerea serviciului a eșuat:", error);
    return { ok: false, mesaj: "Nu am putut șterge. Încearcă din nou." };
  }

  await scrieInJurnal({
    siteId: session.siteId,
    actorId: session.userId,
    actiune: "delete",
    entitate: "Service",
    entitateId: id,
  });

  reimprospateaza();
  return { ok: true };
}
