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
  // Încadrarea coperții stă pe rândul articolului, nu pe poză: aceeași poză poate
  // fi încadrată altfel în alt articol (decizie 3 oct. 2026). Deci se citește de
  // aici, într-o singură interogare, nu dintr-o a doua pe `uploads`.
  cover_focal_x: number | null;
  cover_focal_y: number | null;
  cover_focal_zoom: number | null;
};

type RandArticol = RandListat & { content: string };

function catreListat(rand: RandListat): ArticolListat {
  // `on delete set null` pe `cover_upload_id`: o poză ștearsă îl pune pe NULL,
  // deci un `id` prezent înseamnă că poza mai există — articolul se citește fără
  // copertă, nu cu o poză ruptă, fără o interogare în plus care s-o confirme.
  const coverId = rand.cover_upload_id;

  return {
    id: rand.id,
    slug: rand.slug,
    titlu: rand.title,
    extras: rand.excerpt ?? "",
    publicatLa: rand.published_at,
    coperta: coverId
      ? {
          url: adresaImaginii(coverId),
          altText: rand.cover_alt ?? "",
          pozitie: normalizeazaPunctFocal({
            x: rand.cover_focal_x,
            y: rand.cover_focal_y,
            zoom: rand.cover_focal_zoom,
          }),
        }
      : null,
  };
}

const CAMPURI_LISTA =
  "id, slug, title, excerpt, published_at, cover_upload_id, cover_alt, cover_focal_x, cover_focal_y, cover_focal_zoom";
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

  return ((data ?? []) as unknown as RandListat[]).map(catreListat);
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
    return { ...catreListat(rand), continut: rand.content ?? "" };
  },
);
