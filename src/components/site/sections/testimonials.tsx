import type { SectionTone } from "@/lib/templates";
import { Section, SectionEyebrow } from "@/components/site/section";

export type TestimonialsData = {
  eyebrow?: string;
  titlu: string;
  titluAccent?: string;
  marturii: {
    text: string;
    /** De obicei un prenume sau inițiale — mărturiile din terapie nu se semnează complet. */
    autor: string;
    context?: string;
  }[];
};

/**
 * „Păreri" — mărturii de la oameni cu care clientul a lucrat.
 *
 * Guardrail deontologic prevăzut în Faza 6: fiecare mărturie va cere în panou o
 * bifă „acord scris obținut" înainte să poată fi făcută vizibilă. Aici doar se
 * afișează ce a trecut de acea verificare; regula se aplică la editare, unde
 * poate fi impusă, nu la randare.
 */
export function Testimonials({ data, tone }: { data: TestimonialsData; tone?: SectionTone }) {
  /*
    Lista lipsește cu totul pe un site abia provizionat: `creeaza_client` pune
    toate secțiunile APRINSE, cu `{}` în ele (migrarea `comutator_lansare` —
    un site nepublicat nu se vede oricum, iar clientul stinge ce nu-i trebuie).
    Fără `?? []`, prima pagină a fiecărui client nou cădea cu 500.

    Goală, secțiunea nu se randează deloc — aceeași regulă ca la „Serviciile
    mele" și „Pachete": un titlu urmat de nimic arată a site stricat.
  */
  const marturii = data.marturii ?? [];
  /*
    Titlul singur e de ajuns ca să se vadă secțiunea, chiar fără nimic sub el.

    Hotărât de proprietar, uitându-se la primul site provizionat: un site nou
    trebuie să-și arate SCHELETUL — toate secțiunile, fiecare cu numele ei ca
    text de pornire — ca omul să vadă ce are de completat și unde. Ascunse, ele
    făceau panoul să mintă: acolo scria „vizibilă", pe site nu era nimic.

    Fără titlu ȘI fără conținut, tot nu se randează nimic: aia e secțiunea pe
    care clientul a golit-o dinadins.
  */
  if (marturii.length === 0 && !data.titlu?.trim()) return null;

  return (
    <Section tone={tone} id="pareri">
      {data.eyebrow && <SectionEyebrow>{data.eyebrow}</SectionEyebrow>}

      <h2
        style={{
          margin: 0,
          maxWidth: "13em",
          fontSize: "clamp(32px, 4.4vw, 54px)",
          lineHeight: 1.08,
          letterSpacing: "-0.025em",
          fontWeight: 700,
          textWrap: "balance",
        }}
      >
        {data.titlu}
        {data.titluAccent && (
          <>
            {" "}
            <span style={{ fontFamily: "var(--t-font-secundar)", fontStyle: "var(--t-stil-accent)", fontWeight: 300 }}>
              {data.titluAccent}
            </span>
          </>
        )}
      </h2>

      <div
        style={{
          margin: "52px 0 0",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "20px",
        }}
      >
        {marturii.map((marturie, i) => (
          <figure
            key={i}
            style={{
              margin: 0,
              padding: "32px",
              borderRadius: "var(--t-raza)",
              background: "color-mix(in oklab, var(--t-fundal-nuantat) 80%, transparent)",
              border: "1px solid color-mix(in oklab, var(--t-chenar) 70%, transparent)",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <blockquote
              style={{
                margin: 0,
                flex: 1,
                fontFamily: "var(--t-font-secundar)",
                fontStyle: "var(--t-stil-accent)",
                fontSize: "20px",
                lineHeight: 1.5,
                textWrap: "pretty",
              }}
            >
              {marturie.text}
            </blockquote>
            <figcaption style={{ fontSize: "14px", color: "var(--s-text-secundar)" }}>
              <span style={{ fontWeight: 600, color: "inherit" }}>{marturie.autor}</span>
              {marturie.context && <span> · {marturie.context}</span>}
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}
