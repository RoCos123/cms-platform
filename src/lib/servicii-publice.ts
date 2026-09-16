import "server-only";

import { cache } from "react";
import { createServiceClient } from "@/lib/supabase/admin";
import { adresaImaginii } from "@/lib/imagini-adrese";
import type { Serviciu } from "@/lib/servicii";

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

  return (data ?? []).map((rand) => {
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
      coperta: coverId ? { url: adresaImaginii(coverId) } : null,
    };
  });
});
