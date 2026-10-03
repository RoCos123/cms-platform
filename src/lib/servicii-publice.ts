import "server-only";

import { cache } from "react";
import { createServiceClient } from "@/lib/supabase/admin";
import { adresaImaginii } from "@/lib/imagini-adrese";
import { normalizeazaPunctFocal, type PunctFocal } from "@/lib/punct-focal";
import type { Serviciu } from "@/lib/servicii";

/**
 * Punctul focal al fiecărei coperți, într-o singură interogare pe `uploads`.
 *
 * Două cereri în loc de o îmbinare — exact ca la coperțile de blog
 * (`blog-public.ts`): `cover_upload_id` chiar e cheie externă, dar forma aia de
 * interogare se rupe tăcut dacă se schimbă numele constrângerii, iar ce se rupe
 * aici e pagina publică a clientului. Fără interogarea asta, poziția aleasă prin
 * tragere nu ajungea deloc pe site, deși se salva pe poză (prins de proprietar,
 * 3 oct. 2026): se mișca în câmpul din panou, dar nu și în previzualizare și pe
 * site.
 */
async function pozitiileCopertilor(
  service: ReturnType<typeof createServiceClient>,
  coverIds: string[],
): Promise<Map<string, PunctFocal>> {
  const iduri = [...new Set(coverIds)];
  if (iduri.length === 0) return new Map();

  const { data, error } = await service
    .from("uploads")
    .select("id, focal_x, focal_y, focal_zoom")
    .in("id", iduri);

  if (error) {
    // Un serviciu fără punct focal se citește la fel de bine — poza iese din
    // centru, ca înainte. O pagină căzută, nu.
    console.error("Citirea punctelor focale ale serviciilor a eșuat:", error);
    return new Map();
  }

  return new Map(
    (data ?? []).map((rand) => [
      rand.id as string,
      normalizeazaPunctFocal({ x: rand.focal_x, y: rand.focal_y, zoom: rand.focal_zoom }),
    ]),
  );
}

/**
 * Serviciile publicate ale unui site, în ordinea aleasă de client.
 *
 * `cache()` fiindcă le cer și pagina principală (pentru vitrină), și pagina de
 * servicii — uneori în aceeași cerere, când cineva vine pe `/servicii`.
 */
export const serviciiPublicate = cache(async (siteId: string): Promise<Serviciu[]> => {
  const service = createServiceClient();

  const { data, error } = await service
    .from("services")
    .select("id, slug, title, excerpt, content, price_label, duration_label, cover_upload_id")
    .eq("site_id", siteId)
    .eq("status", "published")
    .order("position", { ascending: true });

  if (error) {
    // Un serviciu lipsă e mai bun decât o pagină căzută: vizitatorul vede
    // site-ul fără secțiunea de servicii, nu un ecran de eroare.
    console.error("Citirea serviciilor a eșuat:", error);
    return [];
  }

  const randuri = data ?? [];
  const pozitii = await pozitiileCopertilor(
    service,
    randuri
      .map((rand) => rand.cover_upload_id as string | null)
      .filter((id): id is string => Boolean(id)),
  );

  return randuri.map((rand) => {
    // Adresa pozei se semnează din id, ca la coperțile de blog. `cover_upload_id`
    // e mereu al acestui site: clonarea îl pune pe NULL, iar salvarea îl scrie
    // doar din biblioteca proprie. Lipsă → serviciul rămâne fără poză.
    const coverId = rand.cover_upload_id as string | null;

    return {
      id: rand.id as string,
      slug: rand.slug as string,
      titlu: rand.title as string,
      descriereScurta: (rand.excerpt as string) ?? "",
      descriereCompleta: (rand.content as string) ?? "",
      pret: rand.price_label as string | null,
      durata: rand.duration_label as string | null,
      coperta: coverId
        ? { url: adresaImaginii(coverId), pozitie: pozitii.get(coverId) }
        : null,
    };
  });
});
