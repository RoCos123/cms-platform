import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { adresaImaginii, adresaFisierului } from "@/lib/imagini-adrese";
import { esteMimeDocument } from "@/lib/uploads";
import {
  folosirileImaginilor,
  type ImagineBiblioteca,
  type RandArticolCoperta,
  type RandSectiune,
} from "@/lib/imagini";

/** Un document din bibliotecă, gata de listat sau de descărcat. */
export type DocumentBiblioteca = {
  id: string;
  numeFisier: string;
  /** Adresa de descărcare, semnată. */
  url: string;
  marimeOcteti: number;
  incarcatLa: string;
};

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
        .select("id, storage_path, filename, mime_type, size_bytes, width, height, alt_text, focal_x, focal_y, created_at")
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

    return (incarcari ?? [])
      // Documentele (PDF/Word) stau în același tabel, dar n-au ce căuta în
      // biblioteca de IMAGINI — s-ar afișa ca miniaturi rupte. Le ia
      // `documenteleBibliotecii`.
      .filter((rand) => !esteMimeDocument(rand.mime_type as string | null))
      .map((rand) => {
      return {
        id: rand.id as string,
        url: adresaImaginii(rand.id as string),
        numeFisier: rand.filename as string,
        descriere: (rand.alt_text as string | null) ?? "",
        marimeOcteti: (rand.size_bytes as number | null) ?? 0,
        latime: (rand.width as number | null) ?? null,
        inaltime: (rand.height as number | null) ?? null,
        pozitie:
          rand.focal_x != null && rand.focal_y != null
            ? { x: rand.focal_x as number, y: rand.focal_y as number }
            : undefined,
        incarcataLa: rand.created_at as string,
        folosiri: folosiri.get(rand.id as string) ?? [],
      } satisfies ImagineBiblioteca;
    });
  },
);

/**
 * Documentele (PDF/Word) încărcate pe site-ul curent, gata de listat în
 * bibliotecă și de legat la un buton „Descarcă".
 *
 * Aceeași tabelă ca pozele, filtrată pe tip. Fără `folosiri` deocamdată: un
 * document e folosit prin `href`-ul unui buton de pachet, iar legătura aceea se
 * vede acolo, nu aici.
 */
export const documenteleBibliotecii = cache(
  async (siteId: string): Promise<DocumentBiblioteca[]> => {
    const supabase = await createClient();

    const { data: incarcari, error } = await supabase
      .from("uploads")
      .select("id, filename, mime_type, size_bytes, created_at")
      .eq("site_id", siteId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Citirea documentelor din bibliotecă a eșuat:", error);
      return [];
    }

    return (incarcari ?? [])
      .filter((rand) => esteMimeDocument(rand.mime_type as string | null))
      .map(
        (rand) =>
          ({
            id: rand.id as string,
            numeFisier: rand.filename as string,
            url: adresaFisierului(rand.id as string),
            marimeOcteti: (rand.size_bytes as number | null) ?? 0,
            incarcatLa: rand.created_at as string,
          }) satisfies DocumentBiblioteca,
      );
  },
);
