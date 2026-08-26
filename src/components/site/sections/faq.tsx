import type { SectionTone } from "@/lib/templates";
import { Section, SectionEyebrow } from "@/components/site/section";

export type FaqData = {
  eyebrow?: string;
  titlu: string;
  titluAccent?: string;
  intrebari: { intrebare: string; raspuns: string }[];
};

/**
 * „Întrebări frecvente".
 *
 * Construit pe `<details>`/`<summary>` nativ, nu pe JavaScript: funcționează fără
 * hidratare, e navigabil de la tastatură din start, iar Ctrl+F al browserului
 * găsește text și în răspunsurile închise. Un acordeon scris de mână pierde toate
 * cele trei.
 *
 * Randarea rămâne curat statică și fiindcă în Faza 4 conținutul de aici
 * alimentează datele structurate `FAQPage` pentru Google.
 */
export function Faq({ data, tone }: { data: FaqData; tone?: SectionTone }) {
  return (
    <Section tone={tone} id="intrebari">
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

      <div style={{ margin: "48px 0 0", maxWidth: "50em" }}>
        {data.intrebari.map((item, i) => (
          <details
            key={i}
            style={{
              borderTop: "1px solid var(--t-chenar)",
              borderBottom: i === data.intrebari.length - 1 ? "1px solid var(--t-chenar)" : undefined,
            }}
          >
            <summary
              style={{
                cursor: "pointer",
                listStyle: "none",
                padding: "24px 40px 24px 0",
                position: "relative",
                fontSize: "clamp(17px, 1.6vw, 20px)",
                fontWeight: 600,
                textWrap: "pretty",
              }}
            >
              {item.intrebare}
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  right: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "24px",
                  lineHeight: 1,
                  color: "var(--t-accent)",
                }}
              >
                +
              </span>
            </summary>
            <p
              style={{
                margin: "0 0 26px",
                paddingRight: "40px",
                fontSize: "17px",
                lineHeight: 1.75,
                color: "var(--s-text-secundar)",
                textWrap: "pretty",
              }}
            >
              {item.raspuns}
            </p>
          </details>
        ))}
      </div>
    </Section>
  );
}
