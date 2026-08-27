import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTenant } from "@/lib/dal";
import { identitateaSiteului } from "@/lib/site-public";
import { serviciiPublicate } from "@/lib/servicii-publice";
import { linkurilePaginilor } from "@/lib/pagini-publice";
import { COLOANE_MODULE, moduleleSiteului } from "@/lib/module";
import { oreDeOferit } from "@/lib/programari-publice";
import { createServiceClient } from "@/lib/supabase/admin";
import { momentLa, ziuaScrisa } from "@/lib/zile";
import { CadruSite } from "@/components/site/cadru-site";
import { Section } from "@/components/site/section";
import { SectionHeading } from "@/components/site/section-heading";
import { FormularProgramare, type ZiDeAles } from "./formular";

/**
 * Pagina pe care cineva își alege o oră.
 *
 * Nu există decât dacă modulul e pornit ȘI clientul a bifat măcar o zi. Fără a
 * doua condiție, un cabinet care tocmai a cumpărat modulul ar oferi public o
 * pagină goală, iar oamenii ar crede că e stricată.
 */
async function potiCereOra() {
  const { siteId } = await getTenant();

  const { data: site } = await createServiceClient()
    .from("sites")
    .select(COLOANE_MODULE)
    .eq("id", siteId)
    .single();

  if (!moduleleSiteului(site).programari) return null;

  try {
    const zile = await oreDeOferit(siteId);
    return zile.length > 0 ? zile : null;
  } catch {
    // `oreDeOferit` aruncă dacă nu poate afla ce e ocupat. Mai bine pagina
    // lipsește decât să ofere ore deja luate.
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { siteId, domain } = await getTenant();
  const { site } = await identitateaSiteului(siteId);

  if (!(await potiCereOra())) return { title: "Pagina nu există" };

  return {
    title: `Programare · ${site?.name ?? domain}`,
    description: "Alege o oră liberă și trimite o cerere de programare.",
    alternates: { canonical: "/programare" },
  };
}

export default async function PaginaProgramare() {
  const { siteId } = await getTenant();
  const zile = await potiCereOra();

  if (!zile) notFound();

  const [{ site }, servicii, linkuriPagini] = await Promise.all([
    identitateaSiteului(siteId),
    serviciiPublicate(siteId),
    linkurilePaginilor(siteId),
  ]);

  const deAles: ZiDeAles[] = zile.map((z) => ({
    ...z,
    // Ziua scrisă se face pe server, ca să fie în fusul cabinetului indiferent
    // de ceasul telefonului pe care se deschide pagina.
    scris: ziuaScrisa(momentLa(z.zi, "12:00")),
  }));

  const confidentialitate = linkuriPagini.find((p) => p.slug.includes("confident"));

  return (
    <CadruSite linkEditare="/dashboard/programari">
      <Section tone="deschis">
        <div style={{ maxWidth: "34em", marginInline: "auto" }}>
          <SectionHeading
            titlu="Alege o oră"
            intro={`Orele de mai jos sunt libere. Trimiți o cerere, iar ${site?.name ?? "cabinetul"} ți-o confirmă.`}
          />

          <div style={{ marginTop: "clamp(32px, 4vw, 48px)" }}>
            <FormularProgramare
              zile={deAles}
              servicii={servicii.map((s) => s.titlu)}
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || null}
              // Secțiunea are tonul „deschis”, deci caseta merge pe varianta deschisă.
              temaCaptcha="light"
              linkConfidentialitate={confidentialitate ? `/${confidentialitate.slug}` : undefined}
            />
          </div>
        </div>
      </Section>
    </CadruSite>
  );
}
