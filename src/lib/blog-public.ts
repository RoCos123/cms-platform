import "server-only";

import { cache } from "react";
import { createServiceClient } from "@/lib/supabase/admin";
import { adresaImaginii } from "@/lib/imagini-adrese";
import { normalizeazaPunctFocal } from "@/lib/punct-focal";
import type { Articol, ArticolListat } from "@/lib/blog";

type RandListat = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  published_at: string | null;
  cover_upload_id: string | null;
  cover_alt: string | null;
};

type RandArticol = RandListat & { content: string };

/**
 * Adresele publice ale coperților, într-o singură interogare.
 *
 * Două cereri în loc de o îmbinare: `cover_upload_id` chiar e o cheie externă,
 * deci PostgREST ar putea aduce coperta odată cu articolul — dar forma aia de
 * interogare se rupe tăcut dacă vreodată se schimbă numele constrângerii, iar
 * ce se rupe aici e pagina publică a unui client. Două interogări simple nu au
 * cum să surprindă pe nimeni.
 */
type CopertaInfo = { url: string; pozitie: ReturnType<typeof normalizeazaPunctFocal> };

async function coperti(
  service: ReturnType<typeof createServiceClient>,
  randuri: RandListat[],
): Promise<Map<string, CopertaInfo>> {
  const iduri = [...new Set(randuri.map((r) => r.cover_upload_id).filter((id): id is string => Boolean(id)))];
  if (iduri.length === 0) return new Map();

  const { data, error } = await service
    .from("uploads")
    // `id`: adresa se derivă din el, iar interogarea confirmă că imaginea mai
    // există — un articol a cărui copertă a fost ștearsă trebuie să se citească
    // fără copertă, nu cu o poză ruptă. `focal_x/focal_y`: punctul focal ales la
    // tragere (corectat 19 sept. 2026 — până acum nu se citea deloc de aici).
    .select("id, focal_x, focal_y")
    .in("id", iduri);

  if (error) {
    // Un articol fără copertă se citește la fel de bine. O pagină căzută, nu.
    console.error("Citirea coperților a eșuat:", error);
    return new Map();
  }

  return new Map(
    (data ?? []).map((rand) => [
      rand.id as string,
      {
        url: adresaImaginii(rand.id as string),
        pozitie: normalizeazaPunctFocal({ x: rand.focal_x, y: rand.focal_y }),
      },
    ]),
  );
}

function catreListat(rand: RandListat, adrese: Map<string, CopertaInfo>): ArticolListat {
  const info = rand.cover_upload_id ? adrese.get(rand.cover_upload_id) : undefined;

  return {
    id: rand.id,
    slug: rand.slug,
    titlu: rand.title,
    extras: rand.excerpt ?? "",
    publicatLa: rand.published_at,
    coperta: info ? { url: info.url, altText: rand.cover_alt ?? "", pozitie: info.pozitie } : null,
  };
}

const CAMPURI_LISTA = "id, slug, title, excerpt, published_at, cover_upload_id, cover_alt";
const CAMPURI_INTREG = `${CAMPURI_LISTA}, content`;

/**
 * Articolele publicate ale unui site, cele mai noi întâi.
 *
 * `cache()` fiindcă le cer și pagina principală (secțiunea „Articole recente"),
 * și pagina de blog — uneori în aceeași cerere.
 *
 * Ordinea e după data publicării, nu după data creării: un articol scris acum
 * trei luni și publicat azi e cel nou pentru cititor. Cele fără dată (publicate
 * înainte ca noi să o setăm) cad la coadă, nu în față.
 */
export const articolePublicate = cache(async (siteId: string): Promise<ArticolListat[]> => {
  const service = createServiceClient();

  const { data, error } = await service
    .from("blog_articles")
    .select(CAMPURI_LISTA)
    .eq("site_id", siteId)
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("Citirea articolelor a eșuat:", error);
    return [];
  }

  const randuri = (data ?? []) as unknown as RandListat[];
  const adrese = await coperti(service, randuri);

  return randuri.map((rand) => catreListat(rand, adrese));
});

/**
 * Un articol după adresa lui. `null` dacă nu există sau nu e publicat — pagina
 * răspunde atunci ca la orice adresă inexistentă.
 */
export const articolDupaSlug = cache(
  async (siteId: string, slug: string): Promise<Articol | null> => {
    const service = createServiceClient();

    const { data, error } = await service
      .from("blog_articles")
      .select(CAMPURI_INTREG)
      .eq("site_id", siteId)
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (error || !data) {
      if (error) console.error("Citirea articolului a eșuat:", error);
      return null;
    }

    const rand = data as unknown as RandArticol;
    const adrese = await coperti(service, [rand]);

    return { ...catreListat(rand, adrese), continut: rand.content ?? "" };
  },
);
