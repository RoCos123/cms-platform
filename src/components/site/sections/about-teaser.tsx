import type { SectionTone } from "@/lib/templates";
import { Section, SectionEyebrow } from "@/components/site/section";

export type AboutTeaserData = {
  eyebrow?: string;
  titlu: string;
  titluAccent?: string;
  /** Fiecare element e un paragraf. Separate, ca editorul să nu ceară markdown. */
  paragrafe: string[];
  /** O propoziție scoasă în evidență, în serif italic — tiparul din șabloane. */
  fraza?: string;
  buton?: { text: string; href: string };
};

export function AboutTeaser({ data, tone }: { data: AboutTeaserData; tone?: SectionTone }) {
  return (
    <Section tone={tone} id="despre">
      <div style={{ display: "grid", gap: "clamp(32px, 5vw, 72px)", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        <div>
          {data.eyebrow && <SectionEyebrow>{data.eyebrow}</SectionEyebrow>}
          <h2
            style={{
              margin: 0,
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
        </div>

        <div>
          {data.paragrafe.map((paragraf, i) => (
            <p
              key={i}
              style={{
                margin: i === 0 ? 0 : "18px 0 0",
                fontSize: "17px",
                lineHeight: 1.75,
                color: "var(--s-text-secundar)",
                textWrap: "pretty",
              }}
            >
              {paragraf}
            </p>
          ))}

          {data.fraza && (
            <p
              style={{
                margin: "28px 0 0",
                fontFamily: "var(--t-font-secundar)",
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: "clamp(20px, 2.2vw, 26px)",
                lineHeight: 1.4,
                textWrap: "pretty",
              }}
            >
              {data.fraza}
            </p>
          )}

          {data.buton && (
            <a
              href={data.buton.href}
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: "50px",
                marginTop: "32px",
                paddingInline: "26px",
                borderRadius: "var(--t-raza-buton)",
                background: "var(--t-accent)",
                color: "var(--t-accent-text)",
                fontSize: "15px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              {data.buton.text}
            </a>
          )}
        </div>
      </div>
    </Section>
  );
}
