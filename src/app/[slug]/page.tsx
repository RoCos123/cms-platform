import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTenant } from "@/lib/dal";
import { identitateaSiteului } from "@/lib/site-public";
import { paginaDupaSlug } from "@/lib/pagini-publice";
import { CadruSite } from "@/components/site/cadru-site";
import { PaginaText } from "@/components/site/sections/pagina-text";

/**
 * Paginile scrise de client, la adresa aleasă de el: `/tarife`,
 * `/politica-de-confidentialitate`.
 *
 * Ruta e ultima consultată: Next alege întotdeauna o rută scrisă în cod
 * (`/blog`, `/servicii`) înaintea uneia dinamice. De asta adresele acelea sunt
 * refuzate din formular — altfel pagina s-ar salva fără nicio eroare și n-ar fi
 * văzută niciodată de nimeni.
 *
 * Tot aici ajunge și orice adresă greșită de pe site, iar `notFound()` o trimite
 * la pagina noastră de 404 în română.
 */
async function paginaCeruta(slug: string) {
  const { siteId } = await getTenant();
  return paginaDupaSlug(siteId, slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { siteId, domain } = await getTenant();

  const [{ site }, pagina] = await Promise.all([
    identitateaSiteului(siteId),
    paginaCeruta(slug),
  ]);

  if (!pagina) return { title: "Pagina nu există" };

  return {
    title: `${pagina.titlu} · ${site?.name ?? domain}`,
    // Relativ: domeniul vine din `metadataBase` (layoutul rădăcină).
    alternates: { canonical: `/${pagina.slug}` },
    /**
     * Paginile puse pe „Nicăieri” nu se indexează.
     *
     * Nu e o alegere de SEO, e promisiunea făcută clientului în panou: opțiunea
     * aia îi e explicată prin „Se ajunge doar cu adresa dată de tine”
     * (`LOCURI_MENIU` din src/lib/pagini.ts). Lăsată indexabilă, pagina ar
     * ajunge în rezultatele Google, iar cineva ar nimeri-o fără ca adresa să-i
     * fi fost dată vreodată — exact ce i-am spus că nu se întâmplă.
     *
     * Perechea acestei linii e în sitemap: acolo paginile astea sunt sărite.
     * Amândouă trebuie schimbate odată, dacă se schimbă vreodată promisiunea.
     *
     * `follow` rămâne pornit: linkurile dinăuntru duc spre paginile publice ale
     * aceluiași cabinet, iar acelea merită urmate.
     */
    robots: pagina.locMeniu === "none" ? { index: false, follow: true } : undefined,
  };
}

export default async function PaginaProprie({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pagina = await paginaCeruta(slug);

  if (!pagina) notFound();

  return (
    <CadruSite linkEditare="/dashboard/pagini">
      <PaginaText pagina={pagina} />
    </CadruSite>
  );
}
