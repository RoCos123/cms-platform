import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSesiuneOptionala, getTenant } from "@/lib/dal";
import { identitateaSiteului } from "@/lib/site-public";
import { paginaServiciiEsteActiva } from "@/lib/setari";
import { serviciiPublicate } from "@/lib/servicii-publice";
import { tenantTable } from "@/lib/supabase/admin";
import { getTemplate, templateFontsHref, templateStyle } from "@/lib/templates";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { AdminBar } from "@/components/site/admin-bar";
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
    alternates: { canonical: `https://${domain}/servicii` },
  };
}

export default async function PaginaServicii() {
  const { siteId, domain } = await getTenant();

  const [{ site, brand, pagini }, antet, servicii, sesiune] = await Promise.all([
    identitateaSiteului(siteId),
    antetulPaginii(),
    serviciiPublicate(siteId),
    getSesiuneOptionala(),
  ]);

  // Oprită din panou, pagina nu există — nu e goală, nu e „în curând". Un
  // vizitator care nimerește adresa primește același răspuns ca la orice adresă
  // inexistentă, iar motoarele de căutare n-o mai indexează.
  if (!paginaServiciiEsteActiva(pagini)) notFound();

  const template = getTemplate(site?.template);
  const nume = site?.name ?? domain;

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href={templateFontsHref(template)} />

      <div
        style={{
          ...templateStyle(template),
          background: "var(--t-fundal)",
          color: "var(--t-text)",
          fontFamily: "var(--t-font-principal)",
          minHeight: "100%",
        }}
      >
        <SiteHeader
          data={{
            nume,
            subtitlu: brand.subtitlu,
            telefon: brand.telefon,
            paginaServicii: true,
          }}
        />

        <main>
          <ServiciiDetaliate
            eyebrow={antet.eyebrow}
            titlu={antet.titlu}
            titluAccent={antet.titluAccent}
            intro={antet.intro}
            servicii={servicii}
          />
        </main>

        <SiteFooter
          data={{
            nume,
            descriere: brand.descriereSubsol,
            telefon: brand.telefon,
            email: brand.email,
            adresa: brand.adresa,
            acreditare: brand.acreditare,
          }}
        />

        {sesiune && <AdminBar email={sesiune.email} linkEditare="/dashboard/servicii" />}
      </div>
    </>
  );
}
