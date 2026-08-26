import { getTenant } from "@/lib/dal";
import { createServiceClient, tenantTable } from "@/lib/supabase/admin";
import { getTemplate, templateFontsHref, templateStyle } from "@/lib/templates";
import { RenderSections, type SectionRow } from "@/components/site/render-sections";
import type { Articol } from "@/components/site/sections/latest-posts";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";

/** Ce ține `site_settings.brand` din perspectiva site-ului public. */
type Brand = {
  subtitlu?: string;
  telefon?: string;
  email?: string;
  adresa?: string;
  acreditare?: string;
  descriereSubsol?: string;
};

export default async function PublicHomePage() {
  const { siteId, domain } = await getTenant();

  // Rolul `anon` nu mai are acces la date (vezi migrarea de întărire RLS), deci
  // tot ce se citește pentru site-ul public trece prin cheia secretă, server-side.
  const service = createServiceClient();

  const [{ data: site }, { data: settings }, { data: rows }, { data: articole }] =
    await Promise.all([
      service.from("sites").select("name, template").eq("id", siteId).single(),
      service.from("site_settings").select("brand").eq("site_id", siteId).maybeSingle(),
      (await tenantTable("site_content"))
        .select("id, key, variant, tone, data, visible, position")
        .eq("visible", true)
        .order("position", { ascending: true }),
      // Articolele se citesc o dată aici, nu în componentă: secțiunea „Articole
      // recente" e singura care are nevoie de ele, dar o componentă care își face
      // singură interogarea ar face imposibilă previzualizarea live din Faza 3.
      (await tenantTable("blog_articles"))
        .select("slug, title, excerpt, published_at, status")
        .eq("status", "published")
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(3),
    ]);

  const template = getTemplate(site?.template);
  const brand = (settings?.brand ?? {}) as Brand;
  const nume = site?.name ?? domain;

  // Dublul cast e necesar cât timp nu generăm tipurile bazei de date: `tenantTable`
  // primește numele tabelului ca `string`, deci supabase-js nu poate deduce forma
  // rândului și cade pe un tip de eroare. De înlocuit cu tipuri generate
  // (`supabase gen types`) când schema se stabilizează.
  const sections = (rows ?? []) as unknown as SectionRow[];
  const articoleRaw = (articole ?? []) as unknown as {
    slug: string;
    title: string;
    excerpt: string;
    published_at: string | null;
  }[];

  const articoleRecente: Articol[] = articoleRaw.map((a) => ({
    slug: a.slug,
    titlu: a.title,
    extras: a.excerpt,
    publishedAt: a.published_at,
  }));

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
          data={{ nume, subtitlu: brand.subtitlu, telefon: brand.telefon }}
        />

        <main>
          {sections.length > 0 ? (
            <RenderSections rows={sections} context={{ articole: articoleRecente }} />
          ) : (
            // Un site fără nicio secțiune nu trebuie să fie o pagină albă:
            // clientul tocmai a fost provizionat și încă nu a scris nimic.
            <div style={{ padding: "120px 24px", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "18px", color: "var(--t-text-secundar)" }}>
                {nume} — site în pregătire.
              </p>
            </div>
          )}
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
      </div>
    </>
  );
}
