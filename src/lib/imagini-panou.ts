import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { BUCKET_MEDIA } from "@/lib/uploads";
import {
  folosirileImaginilor,
  type ImagineBiblioteca,
  type RandArticolCoperta,
  type RandSectiune,
} from "@/lib/imagini";

/**
 * Biblioteca de imagini a site-ului curent, cu locurile în care e folosită
 * fiecare.
 *
 * `cache()` pentru că o cer două lucruri în același randare: aranjamentul
 * panoului (pentru fereastra „Alege din bibliotecă", disponibilă pe orice ecran
 * cu formular) și ecranul Imagini. Fără memorare, aceleași două interogări ar
 * pleca de două ori la fiecare pagină.
 *
 * `siteId` e parametru, nu citit aici din sesiune, tocmai ca memorarea să fie
 * corectă: două site-uri diferite în aceeași cerere nu se pot amesteca.
 */
export const imaginileBibliotecii = cache(
  async (siteId: string): Promise<ImagineBiblioteca[]> => {
    const supabase = await createClient();

    const [{ data: incarcari, error }, { data: sectiuni }, { data: articole }] = await Promise.all([
      supabase
        .from("uploads")
        .select("id, storage_path, filename, size_bytes, width, height, alt_text, created_at")
        .eq("site_id", siteId)
        .order("created_at", { ascending: false }),
      // Cele două locuri din care se referă imagini: conținutul secțiunilor și
      // coperțile articolelor.
      supabase.from("site_content").select("id, key, data").eq("site_id", siteId),
      supabase
        .from("blog_articles")
        .select("id, title, cover_upload_id")
        .eq("site_id", siteId)
        // Un articol nepublicat tot ține imaginea ocupată: ștearsă acum, ar
        // lipsi din articol în ziua în care clientul îl publică.
        .not("cover_upload_id", "is", null),
    ]);

    if (error) {
      // Un ecran gol e o minciună mai mică decât o pagină căzută: clientul vede
      // „nicio imagine" și reîncarcă, în loc să rămână blocat în panou.
      console.error("Citirea bibliotecii de imagini a eșuat:", error);
      return [];
    }

    const folosiri = folosirileImaginilor({
      sectiuni: (sectiuni ?? []) as RandSectiune[],
      articole: (articole ?? []) as RandArticolCoperta[],
    });

    return (incarcari ?? []).map((rand) => {
      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET_MEDIA).getPublicUrl(rand.storage_path as string);

      return {
        id: rand.id as string,
        url: publicUrl,
        numeFisier: rand.filename as string,
        descriere: (rand.alt_text as string | null) ?? "",
        marimeOcteti: (rand.size_bytes as number | null) ?? 0,
        latime: (rand.width as number | null) ?? null,
        inaltime: (rand.height as number | null) ?? null,
        incarcataLa: rand.created_at as string,
        folosiri: folosiri.get(rand.id as string) ?? [],
      } satisfies ImagineBiblioteca;
    });
  },
);
