import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTenant } from "@/lib/dal";
import { identitateaSiteului } from "@/lib/site-public";
import { paginaEsteActiva } from "@/lib/setari";
import { serviciiPublicate } from "@/lib/servicii-publice";
import { tenantTable } from "@/lib/supabase/admin";
import { CadruSite } from "@/components/site/cadru-site";
import { ServiciiDetaliate } from "@/components/site/sections/servicii-detaliate";

/**
 * Antetul paginii de servicii vine din secțiunea „Serviciile mele" a paginii
 * principale — aceleași cuvinte, scrise o dată. Un titlu și un intro separate
 * ar fi însemnat încă două câmpuri de completat, care spun același lucru.
 */
async function antetulPaginii() {
  const { data } = await (await tenantTable("site_content"))
    .select("data")
    .eq("key", "features")
    .limit(1);

  const brut = ((data ?? [])[0] as { data?: Record<string, unknown> } | undefined)?.data ?? {};

  return {
    eyebrow: typeof brut.eyebrow === "string" ? brut.eyebrow : undefined,
    titlu: typeof brut.titlu === "string" && brut.titlu ? brut.titlu : "Servicii",
    titluAccent: typeof brut.titluAccent === "string" ? brut.titluAccent : undefined,
    intro: typeof brut.intro === "string" ? brut.intro : undefined,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const { siteId, domain } = await getTenant();
  const [{ site }, antet] = await Promise.all([identitateaSiteului(siteId), antetulPaginii()]);

  const nume = site?.name ?? domain;
  const titlu = [antet.titlu, antet.titluAccent].filter(Boolean).join(" ");

  return {
    title: `${titlu} · ${nume}`,
    description: antet.intro,
    alternates: { canonical: "/servicii" },
  };
}

export default async function PaginaServicii() {
  const { siteId } = await getTenant();

  const [{ pagini }, antet, servicii] = await Promise.all([
    identitateaSiteului(siteId),
    antetulPaginii(),
    serviciiPublicate(siteId),
  ]);

  // Oprită din panou, pagina nu există — nu e goală, nu e „în curând". Un
  // vizitator care nimerește adresa primește același răspuns ca la orice adresă
  // inexistentă, iar motoarele de căutare n-o mai indexează.
  if (!paginaEsteActiva(pagini, "servicii")) notFound();

  return (
    <CadruSite linkEditare="/dashboard/servicii">
      <ServiciiDetaliate
        eyebrow={antet.eyebrow}
        titlu={antet.titlu}
        titluAccent={antet.titluAccent}
        intro={antet.intro}
        servicii={servicii}
      />
    </CadruSite>
  );
}
