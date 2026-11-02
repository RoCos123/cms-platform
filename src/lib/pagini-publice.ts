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

/** Adresa pe care o primește la provizionare politica fiecărui site (`creeaza_client`). */
const SLUG_POLITICA = "politica-de-confidentialitate";

/**
 * Adresa politicii de confidențialitate a site-ului, DOAR dacă e publicată — pentru linkul
 * „Politica de confidențialitate" de lângă bifa de acord, pe orice site (formularul de contact și
 * cel de programare). `undefined` cât e ciornă sau lipsește: un link către o pagină inexistentă e
 * mai rău decât un text care nu se apasă.
 *
 * Nu din `linkurilePaginilor`: acolo nu ajung paginile puse în meniu la „Nicăieri", iar politica
 * trebuie să se poată citi de lângă bifă și când clientul n-o vrea în subsol (2 nov. 2026).
 * „confident" în adresă, nu adresa exactă: o pagină redenumită de client (`/confidentialitate`)
 * rămâne politica lui; dacă sunt mai multe, cea cu adresa de la provizionare are întâietate.
 */
export const adresaPoliticii = cache(async (siteId: string): Promise<string | undefined> => {
  const { data, error } = await createServiceClient()
    .from("pages")
    .select("slug")
    .eq("site_id", siteId)
    .eq("status", "published")
    .ilike("slug", "%confident%")
    .order("position", { ascending: true });

  if (error) {
    // Fără link e mai bine decât un formular căzut: textul rămâne, doar nu se apasă.
    console.error("Citirea politicii de confidențialitate a eșuat:", error);
    return undefined;
  }

  const sluguri = (data ?? []).map((rand) => rand.slug as string);
  const slug = sluguri.includes(SLUG_POLITICA) ? SLUG_POLITICA : sluguri[0];
  return slug ? `/${slug}` : undefined;
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
