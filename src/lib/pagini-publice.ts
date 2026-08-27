import "server-only";

import { cache } from "react";
import { createServiceClient } from "@/lib/supabase/admin";
import { esteLocMeniu, type LinkPagina, type Pagina } from "@/lib/pagini";

/**
 * Paginile publicate, în ordinea aleasă de client.
 *
 * Doar cât îi trebuie antetului și subsolului ca să pună linkuri — fără text.
 * Se cere pe FIECARE pagină a site-ului (cadrul e același peste tot), deci nu
 * are voie să care conținutul tuturor paginilor la fiecare vizită.
 */
export const linkurilePaginilor = cache(async (siteId: string): Promise<LinkPagina[]> => {
  const service = createServiceClient();

  const { data, error } = await service
    .from("pages")
    .select("slug, title, nav_location")
    .eq("site_id", siteId)
    .eq("status", "published")
    .order("position", { ascending: true });

  if (error) {
    // Un meniu fără linkurile de pagini e mai bun decât un site căzut.
    console.error("Citirea paginilor a eșuat:", error);
    return [];
  }

  return (data ?? [])
    .map((rand) => ({
      slug: rand.slug as string,
      titlu: rand.title as string,
      loc: esteLocMeniu(rand.nav_location) ? rand.nav_location : ("footer" as const),
    }))
    // „Nicăieri" nu se leagă de nicăieri, deci n-are ce căuta în lista de linkuri.
    .filter((pagina) => pagina.loc !== "none");
});

/**
 * O pagină după adresa ei. `null` dacă nu există sau nu e publicată — atunci
 * ruta răspunde ca la orice adresă inexistentă.
 */
export const paginaDupaSlug = cache(
  async (siteId: string, slug: string): Promise<Pagina | null> => {
    const service = createServiceClient();

    const { data, error } = await service
      .from("pages")
      .select("id, slug, title, content, nav_location")
      .eq("site_id", siteId)
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (error || !data) {
      if (error) console.error("Citirea paginii a eșuat:", error);
      return null;
    }

    return {
      id: data.id as string,
      slug: data.slug as string,
      titlu: data.title as string,
      continut: (data.content as string) ?? "",
      // Aceeași plasă, și aceeași cădere ca la `linkurilePaginilor`: „footer”.
      // Trebuie să fie identică — dacă aici ar cădea pe „none”, o valoare
      // necunoscută ar face pagina `noindex` în timp ce subsolul îi ține
      // linkul la vedere.
      locMeniu: esteLocMeniu(data.nav_location) ? data.nav_location : "footer",
    };
  },
);
