import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTenant } from "@/lib/dal";
import { identitateaSiteului } from "@/lib/site-public";
import { articolePublicate } from "@/lib/blog-public";
import { paginaEsteActiva } from "@/lib/setari";
import { tenantTable } from "@/lib/supabase/admin";
import { CadruSite } from "@/components/site/cadru-site";
import { ListaArticole } from "@/components/site/sections/lista-articole";

/**
 * Antetul paginii de blog vine din secțiunea „Articole recente" a paginii
 * principale — aceleași cuvinte, scrise o dată. Un titlu separat ar fi însemnat
 * încă un câmp de completat, care spune același lucru.
 */
async function antetulPaginii() {
  const { data } = await (await tenantTable("site_content"))
    .select("data")
    .eq("key", "latestPosts")
    .limit(1);

  const brut = ((data ?? [])[0] as { data?: Record<string, unknown> } | undefined)?.data ?? {};

  return {
    eyebrow: typeof brut.eyebrow === "string" ? brut.eyebrow : undefined,
    titlu: typeof brut.titlu === "string" && brut.titlu ? brut.titlu : "Articole",
    titluAccent: typeof brut.titluAccent === "string" ? brut.titluAccent : undefined,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const { siteId, domain } = await getTenant();
  const [{ site }, antet] = await Promise.all([identitateaSiteului(siteId), antetulPaginii()]);

  const nume = site?.name ?? domain;
  const titlu = [antet.titlu, antet.titluAccent].filter(Boolean).join(" ");

  return {
    title: `${titlu} · ${nume}`,
    alternates: { canonical: `https://${domain}/blog` },
  };
}

export default async function PaginaBlog() {
  const { siteId } = await getTenant();

  const [{ pagini }, antet, articole] = await Promise.all([
    identitateaSiteului(siteId),
    antetulPaginii(),
    articolePublicate(siteId),
  ]);

  if (!paginaEsteActiva(pagini, "blog")) notFound();

  return (
    <CadruSite linkEditare="/dashboard/blog">
      <ListaArticole
        eyebrow={antet.eyebrow}
        titlu={antet.titlu}
        titluAccent={antet.titluAccent}
        articole={articole}
      />
    </CadruSite>
  );
}
