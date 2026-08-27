import type { SectionTone } from "@/lib/templates";
import { Section } from "@/components/site/section";
import { SectionHeading } from "@/components/site/section-heading";

/** O zi cu orele ei libere, gata scrisă pentru afișare. */
export type ZiCuOreScrise = { zi: string; scris: string; ore: string[] };

export type ProgramareData = {
  eyebrow?: string;
  titlu?: string;
  titluAccent?: string;
  intro?: string;
  textButon?: string;
};

/** Câte zile se arată aici. Restul se văd pe pagina întreagă. */
const ZILE_ARATATE = 3;
/** Câte ore pe zi. Peste atât, rândul devine un zid de cifre. */
const ORE_PE_ZI = 4;

/**
 * „Programare” — primele ore libere, direct pe prima pagină.
 *
 * Nu e formularul întreg, ci momentul dinaintea lui: cineva care tocmai a citit
 * despre cabinet vede că se poate mâine la 19:00 și apasă. Formularul rămâne pe
 * `/programare`, unde are loc.
 *
 * Nu se randează deloc fără ore libere. Asta se întâmplă în trei cazuri —
 * modulul nu e cumpărat, clientul n-a bifat nicio zi, sau chiar s-au ocupat
 * toate — și în toate trei o secțiune goală ar arăta a defect. Comportamentul e
 * același ca la „Articole recente” fără articole.
 */
export function Programare({
  data,
  zile,
  tone = "deschis",
}: {
  data: ProgramareData;
  zile: ZiCuOreScrise[];
  tone?: SectionTone;
}) {
  if (zile.length === 0) return null;

  const deAratat = zile.slice(0, ZILE_ARATATE);

  return (
    <Section tone={tone} id="programare">
      <SectionHeading
        eyebrow={data.eyebrow}
        titlu={data.titlu || "Programează o ședință"}
        titluAccent={data.titluAccent}
        intro={data.intro}
        maxWidthTitlu="11em"
      />

      <div
        style={{
          marginTop: "clamp(32px, 4vw, 48px)",
          display: "grid",
          gap: "clamp(16px, 2.5vw, 24px)",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))",
        }}
      >
        {deAratat.map((zi) => (
          <div
            key={zi.zi}
            style={{
              // Chenarul din `currentColor`, nu dintr-o variabilă: `Section`
              // pune doar cinci (`--s-accent`, `--s-buton-*`, `--s-eroare`,
              // `--s-text-secundar`), iar una inventată cade tăcut în „fără
              // chenar". Vezi `e2e/culori-sectiuni.proba.mjs`.
              border: "1px solid color-mix(in oklab, currentColor 24%, transparent)",
              borderRadius: "var(--t-raza)",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              minWidth: 0,
            }}
          >
            <p style={{ margin: 0, fontSize: "15px", fontWeight: 600 }}>{zi.scris}</p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {zi.ore.slice(0, ORE_PE_ZI).map((ora) => (
                /*
                  Fiecare oră duce direct la formular, nu la capul paginii: cine
                  a apăsat pe „19:00” a ales deja, iar pagina care se deschide
                  trebuie să continue de acolo, nu să-l pună să aleagă din nou.

                  `<a>`, nu `next/link`: secțiunile se randează și în
                  previzualizarea din panou, printr-un portal într-un iframe,
                  unde contextul de rutare e al PANOULUI (vezi CONVENTII.md).
                */
                <a
                  key={ora}
                  href={`/programare?zi=${zi.zi}&ora=${encodeURIComponent(ora)}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    minHeight: "40px",
                    paddingInline: "14px",
                    borderRadius: "var(--t-raza-buton)",
                    // Chenarul din `currentColor`, nu dintr-o variabilă: `Section`
              // pune doar cinci (`--s-accent`, `--s-buton-*`, `--s-eroare`,
              // `--s-text-secundar`), iar una inventată cade tăcut în „fără
              // chenar". Vezi `e2e/culori-sectiuni.proba.mjs`.
              border: "1px solid color-mix(in oklab, currentColor 24%, transparent)",
                    color: "inherit",
                    textDecoration: "none",
                    fontSize: "15px",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {ora}
                </a>
              ))}

              {zi.ore.length > ORE_PE_ZI && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    minHeight: "40px",
                    fontSize: "14px",
                    color: "var(--s-text-secundar)",
                  }}
                >
                  +{zi.ore.length - ORE_PE_ZI}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "clamp(28px, 3.5vw, 40px)" }}>
        {/*
          `<a>`, nu `next/link`: aceleași componente se randează și în
          previzualizarea din panou, printr-un portal într-un iframe. Acolo
          contextul de rutare e al PANOULUI — un `Link` ar încerca să navigheze
          panoul, nu site-ul, și ar preîncărca pagini de care previzualizarea
          n-are nevoie.
        */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/programare"
          style={{
            display: "inline-flex",
            alignItems: "center",
            height: "52px",
            paddingInline: "30px",
            borderRadius: "var(--t-raza-buton)",
            background: "var(--s-buton-fundal)",
            color: "var(--s-buton-text)",
            fontSize: "16px",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          {data.textButon || "Vezi toate orele libere"}
        </a>
      </div>
    </Section>
  );
}
