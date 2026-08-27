import type { MetadataRoute } from "next";
import { getTenant } from "@/lib/dal";
import { identitateaSiteului } from "@/lib/site-public";
import { tenantTable } from "@/lib/supabase/admin";
import { adresaSiteului } from "@/lib/seo";
import { intrarileSitemapului, type IntrareCitita } from "@/lib/sitemap-reguli";
import { moduleleSiteului } from "@/lib/module";
import { seePotFaceProgramari } from "@/lib/programari-publice";

/**
 * `sitemap.xml`, generat din bază — niciodată dintr-o listă scrisă de mână.
 *
 * Aici stă doar citirea. Regula după care se alege ce intră e în
 * `src/lib/sitemap-reguli.ts`, ruptă de interogări tocmai ca să poată fi
 * probată fără Supabase (`e2e/sitemap-reguli.mjs`).
 *
 * Ruta e dinamică fiindcă citește antetele cererii — vezi nota din
 * node_modules/next/dist/docs/.../metadata/sitemap.md. Aici chiar trebuie:
 * același cod servește toți clienții, iar răspunsul diferă per domeniu.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { siteId } = await getTenant();
  const baza = await adresaSiteului();
  const { site, pagini } = await identitateaSiteului(siteId);

  const [modificareaPrimeiPagini, ultimaModificareServicii, articole, paginiProprii] =
    await Promise.all([
      ultimaModificare("site_content"),
      ultimaModificare("services", true),
      articolePentruSitemap(),
      paginiPentruSitemap(),
    ]);

  return intrarileSitemapului(baza, {
    pagini,
    // Pagina de programare există doar când chiar are ore de oferit — aceeași
    // regulă ca peste tot aici: în sitemap intră ce răspunde cu 200.
    areProgramari: await seePotFaceProgramari(siteId, moduleleSiteului(site).programari),
    modificareaPrimeiPagini,
    ultimaModificareServicii,
    articole,
    paginiProprii,
  });
}

/**
 * Articolele publicate, cele mai recent modificate întâi.
 *
 * Citire proprie, nu `articolePublicate()`: aceea aduce extrase și coperți,
 * adică o a doua interogare pentru imagini de care sitemap-ul n-are nevoie.
 * Aici trebuie doar adresa și data.
 */
async function articolePentruSitemap(): Promise<IntrareCitita[]> {
  const { data, error } = await (await tenantTable("blog_articles"))
    .select("slug, updated_at")
    .eq("status", "published")
    .order("updated_at", { ascending: false });

  if (error) {
    // Un sitemap incomplet se repară singur la următoarea trecere a
    // crawlerului. Unul care întoarce eroare 500 e raportat ca defect în
    // Search Console, iar clientul îl vede acolo luni de zile.
    console.error("Citirea articolelor pentru sitemap a eșuat:", error);
    return [];
  }

  return (data ?? []) as unknown as IntrareCitita[];
}

/**
 * Paginile proprii ale clientului, fără cele puse pe „Nicăieri”.
 *
 * Excluderea nu e o scăpare, e chiar promisiunea făcută în panou: opțiunea
 * „Nicăieri” e explicată clientului prin „Se ajunge doar cu adresa dată de
 * tine” (`LOCURI_MENIU` din src/lib/pagini.ts). Sitemap-ul e fix modul în care
 * i-am da adresa lui Google, deci ar rupe promisiunea aceea.
 *
 * Pagina rămâne accesibilă la adresa ei — `paginaDupaSlug()` se uită doar la
 * `status`. Ca promisiunea să fie ținută și când cineva ajunge la ea altfel,
 * `generateMetadata` din src/app/[slug]/page.tsx îi pune și `noindex`. Cele
 * două linii se schimbă împreună.
 */
async function paginiPentruSitemap(): Promise<IntrareCitita[]> {
  const { data, error } = await (await tenantTable("pages"))
    .select("slug, updated_at")
    .eq("status", "published")
    .neq("nav_location", "none")
    .order("position", { ascending: true });

  if (error) {
    console.error("Citirea paginilor pentru sitemap a eșuat:", error);
    return [];
  }

  return (data ?? []) as unknown as IntrareCitita[];
}

/**
 * Când s-a schimbat ultima oară ceva într-un tabel al clientului.
 *
 * `undefined` la eroare sau la tabel gol: `lastModified` e opțional în sitemap,
 * iar o dată inventată (`new Date()`) i-ar spune lui Google că pagina s-a
 * schimbat la fiecare trecere — adică ar face câmpul inutil tocmai pentru
 * paginile care chiar se schimbă rar.
 */
async function ultimaModificare(
  tabel: string,
  doarPublicate = false,
): Promise<string | undefined> {
  const toate = (await tenantTable(tabel)).select("updated_at");
  const interogare = doarPublicate ? toate.eq("status", "published") : toate;

  const { data, error } = await interogare
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error(`Citirea ultimei modificări din ${tabel} a eșuat:`, error);
    return undefined;
  }

  const rand = (data ?? [])[0] as { updated_at?: string } | undefined;
  return rand?.updated_at ?? undefined;
}
