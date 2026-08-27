import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTenant } from "@/lib/dal";
import { identitateaSiteului } from "@/lib/site-public";
import { articolDupaSlug } from "@/lib/blog-public";
import { paginaEsteActiva } from "@/lib/setari";
import { CadruSite } from "@/components/site/cadru-site";
import { ArticolComplet } from "@/components/site/sections/articol-complet";

/**
 * Un articol nepublicat, unul care nu există și unul de pe alt site dau exact
 * același răspuns: pagina nu există. Nu confirmăm nici măcar că adresa a
 * însemnat vreodată ceva.
 */
async function articolulPaginii(slug: string) {
  const { siteId } = await getTenant();
  const [{ pagini }, articol] = await Promise.all([
    identitateaSiteului(siteId),
    articolDupaSlug(siteId, slug),
  ]);

  // Comutatorul stinge tot blogul, nu doar lista: un articol rămas citibil după
  // ce clientul a oprit blogul ar fi tocmai ce a cerut să nu se mai vadă.
  if (!paginaEsteActiva(pagini, "blog") || !articol) return null;

  return articol;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { siteId, domain } = await getTenant();

  const [{ site }, articol] = await Promise.all([
    identitateaSiteului(siteId),
    articolulPaginii(slug),
  ]);

  if (!articol) return { title: "Pagina nu există" };

  const nume = site?.name ?? domain;
  const adresa = `/blog/${articol.slug}`;

  return {
    title: `${articol.titlu} · ${nume}`,
    description: articol.extras,
    alternates: { canonical: adresa },
    openGraph: {
      title: articol.titlu,
      description: articol.extras,
      url: adresa,
      siteName: nume,
      locale: "ro_RO",
      // `article`, nu `website`: pe Facebook și WhatsApp asta face diferența
      // dintre o previzualizare de articol și una de pagină oarecare.
      type: "article",
      publishedTime: articol.publicatLa ?? undefined,
      images: articol.coperta ? [articol.coperta.url] : undefined,
    },
  };
}

export default async function PaginaArticol({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const articol = await articolulPaginii(slug);

  if (!articol) notFound();

  return (
    <CadruSite linkEditare="/dashboard/blog">
      <ArticolComplet articol={articol} />
    </CadruSite>
  );
}
