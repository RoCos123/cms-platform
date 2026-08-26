import { getTenant } from "@/lib/dal";
import { createServiceClient, tenantTable } from "@/lib/supabase/admin";
import { getTemplate, templateFontsHref, templateStyle } from "@/lib/templates";
import { RenderSections, type SectionRow } from "@/components/site/render-sections";

export default async function PublicHomePage() {
  const { siteId, domain } = await getTenant();

  // Șablonul stă pe `sites`, deci vine din rândul deja citit la rezolvarea
  // tenantului. Clientul cu cheia secretă, ca la orice citire publică — rolul
  // `anon` nu mai are acces la date (vezi migrarea de întărire RLS).
  const { data: site } = await createServiceClient()
    .from("sites")
    .select("name, template")
    .eq("id", siteId)
    .single();

  const template = getTemplate(site?.template);

  const { data: rows } = await (await tenantTable("site_content"))
    .select("key, variant, tone, data, visible, position")
    .eq("visible", true)
    .order("position", { ascending: true });

  // Dublul cast e necesar cât timp nu generăm tipurile bazei de date: `tenantTable`
  // primește numele tabelului ca `string`, deci supabase-js nu poate deduce forma
  // rândului și cade pe un tip de eroare. De înlocuit cu tipuri generate
  // (`supabase gen types`) când schema se stabilizează.
  const sections = (rows ?? []) as unknown as SectionRow[];

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
        {sections.length > 0 ? (
          <RenderSections rows={sections} />
        ) : (
          // Un site fără nicio secțiune nu trebuie să fie o pagină albă:
          // clientul tocmai a fost provizionat și încă nu a scris nimic.
          <div style={{ padding: "120px 24px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: "18px", color: "var(--t-text-secundar)" }}>
              {site?.name ?? domain} — site în pregătire.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
