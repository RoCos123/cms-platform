import type { SectionTone } from "@/lib/templates";
import type { Serviciu } from "@/lib/servicii";
import { Section } from "@/components/site/section";
import { SectionHeading } from "@/components/site/section-heading";

export type FeaturesData = {
  eyebrow?: string;
  titlu: string;
  titluAccent?: string;
  intro?: string;
  /** Câte se arată pe prima pagină. Lipsă = toate. */
  numar?: number;
};

/**
 * „Serviciile mele" — vitrina de pe prima pagină.
 *
 * Nu-și ține conținutul: îl citește din Servicii, la fel cum „Articole recente"
 * îl citește din Blog. Secțiunea reține doar CUM se afișează (titlu, câte), nu
 * CE — altfel fiecare serviciu ar fi scris de două ori, o dată aici și o dată pe
 * pagina de servicii, iar cele două ar ajunge să se contrazică.
 */
export function Features({
  data,
  servicii,
  paginaDetaliata,
  tone,
}: {
  data: FeaturesData;
  servicii: Serviciu[];
  /** E pornită pagina cu descrierile pe larg? Dacă nu, cardurile nu duc nicăieri. */
  paginaDetaliata: boolean;
  tone?: SectionTone;
}) {
  // Fără niciun serviciu publicat, secțiunea nu se randează deloc: un titlu
  // „Serviciile mele" urmat de nimic arată a site stricat, nu a site nou.
  if (servicii.length === 0) return null;

  // Limita „câte se văd" are sens doar cât timp restul se pot vedea altundeva.
  // Cu pagina detaliată oprită, un serviciu tăiat de aici n-ar mai apărea NICĂIERI
  // pe site — clientul l-ar fi scris degeaba, fără să afle vreodată.
  const afisate = data.numar && paginaDetaliata ? servicii.slice(0, data.numar) : servicii;
  const maiSunt = servicii.length > afisate.length;

  return (
    <Section tone={tone} id="servicii">
      <SectionHeading
        eyebrow={data.eyebrow}
        titlu={data.titlu}
        titluAccent={data.titluAccent}
        intro={data.intro}
        maxWidthTitlu="14em"
        actiune={
          maiSunt && paginaDetaliata ? (
            /*
              Ancoră simplă, nu `next/link`, ca peste tot în secțiunile site-ului:
              aceleași componente se randează și în previzualizarea din panou,
              printr-un portal într-un iframe. Acolo contextul de rutare e al
              PANOULUI — un `Link` ar încerca să navigheze panoul, nu site-ul, și
              ar preîncărca pagini de care previzualizarea n-are nevoie.
            */
            // eslint-disable-next-line @next/next/no-html-link-for-pages
            <a
              href="/servicii"
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "var(--s-accent)",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              Toate serviciile →
            </a>
          ) : undefined
        }
      />

      <ul
        style={{
          listStyle: "none",
          margin: "56px 0 0",
          padding: 0,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(288px, 100%), 1fr))",
          gap: "20px",
        }}
      >
        {afisate.map((serviciu) => (
          <li key={serviciu.id}>
            {/*
              Cardul întreg e link, nu doar rândul de jos: pe telefon, o țintă de
              opt pixeli înălțime e greu de nimerit, iar oricine vede un card cu
              „Află mai multe" încearcă oricum să apese oriunde pe el.

              Fără pagina detaliată n-are unde să ducă, deci nu e link deloc: un
              card care pare apăsabil și nu face nimic e mai rău decât unul
              simplu.
            */}
            <Card link={paginaDetaliata ? `/servicii#${serviciu.slug}` : undefined}>
              <h3 style={{ margin: 0, fontSize: "21px", fontWeight: 600, textWrap: "pretty" }}>
                {serviciu.titlu}
              </h3>

              <p
                style={{
                  margin: 0,
                  fontSize: "16px",
                  lineHeight: 1.7,
                  color: "var(--t-text-secundar)",
                  textWrap: "pretty",
                }}
              >
                {serviciu.descriereScurta}
              </p>

              {(serviciu.durata || serviciu.pret) && (
                <p style={{ margin: 0, fontSize: "14px", color: "var(--t-text-secundar)" }}>
                  {[serviciu.durata, serviciu.pret].filter(Boolean).join(" · ")}
                </p>
              )}

              {paginaDetaliata && (
                <span
                  style={{
                    marginTop: "auto",
                    paddingTop: "12px",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "var(--t-accent)",
                  }}
                >
                  Află mai multe →
                </span>
              )}
            </Card>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/**
 * Cardul unui serviciu. Link doar când există unde să ducă — un `<a>` fără
 * `href` nu e focusabil și e anunțat ca link stricat de cititoarele de ecran.
 */
function Card({ link, children }: { link?: string; children: React.ReactNode }) {
  const stil: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    height: "100%",
    background: "var(--t-fundal-nuantat)",
    border: "1px solid var(--t-chenar)",
    borderRadius: "var(--t-raza)",
    padding: "32px",
    color: "var(--t-text)",
    textDecoration: "none",
  };

  if (!link) return <div style={stil}>{children}</div>;

  return (
    <a href={link} style={stil}>
      {children}
    </a>
  );
}
