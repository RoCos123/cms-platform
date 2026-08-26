import type { SectionTone } from "@/lib/templates";
import { Section, SectionEyebrow } from "@/components/site/section";

export type HowItWorksData = {
  eyebrow?: string;
  titlu: string;
  titluAccent?: string;
  intro?: string;
  pasi: { titlu: string; descriere: string }[];
};

/**
 * „Cum decurge colaborarea" — pașii de la primul telefon la ședințele propriu-zise.
 *
 * Numărul se derivă din poziția în listă, nu se introduce de client: scris de
 * mână, o reordonare a pașilor ar lăsa numerotarea desincronizată. E și motivul
 * pentru care lista e `<ol>` — aici ordinea are înțeles, spre deosebire de servicii.
 */
export function HowItWorks({ data, tone }: { data: HowItWorksData; tone?: SectionTone }) {
  return (
    <Section tone={tone} id="proces">
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
            <span style={{ fontFamily: "var(--t-font-secundar)", fontStyle: "italic", fontWeight: 300 }}>
              {data.titluAccent}
            </span>
          </>
        )}
      </h2>

      {data.intro && (
        <p
          style={{
            margin: "22px 0 0",
            maxWidth: "36em",
            fontSize: "17px",
            lineHeight: 1.7,
            color: "var(--s-text-secundar)",
          }}
        >
          {data.intro}
        </p>
      )}

      <ol
        style={{
          listStyle: "none",
          margin: "56px 0 0",
          padding: 0,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(232px, 1fr))",
          gap: "36px 28px",
        }}
      >
        {data.pasi.map((pas, index) => (
          <li key={pas.titlu} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <span
              aria-hidden
              style={{
                fontFamily: "var(--t-font-secundar)",
                fontSize: "44px",
                lineHeight: 1,
                color: "var(--s-accent)",
              }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 600 }}>{pas.titlu}</h3>
            <p
              style={{
                margin: 0,
                fontSize: "16px",
                lineHeight: 1.7,
                color: "var(--s-text-secundar)",
                textWrap: "pretty",
              }}
            >
              {pas.descriere}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
