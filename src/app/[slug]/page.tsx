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
    alternates: { canonical: `https://${domain}/${pagina.slug}` },
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
