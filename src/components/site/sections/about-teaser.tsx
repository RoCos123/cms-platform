import type { SectionTone } from "@/lib/templates";
import { Section, SectionEyebrow } from "@/components/site/section";
import { SectionImage } from "@/components/site/section-image";

export type AboutTeaserData = {
  eyebrow?: string;
  titlu: string;
  titluAccent?: string;
  /** Fiecare element e un paragraf. Separate, ca editorul să nu ceară markdown. */
  paragrafe: string[];
  /** O propoziție scoasă în evidență, în serif italic — tiparul din șabloane. */
  fraza?: string;
  buton?: { text: string; href: string };
  /** Aceeași formă ca la încărcare (`ImageValue`). De obicei portretul. */
  imagine?: { url: string; altText?: string };
};

export function AboutTeaser({ data, tone }: { data: AboutTeaserData; tone?: SectionTone }) {
  const poza = data.imagine?.url ? data.imagine : null;

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

          {/*
            Sub titlu, în coloana care altfel rămâne goală pe ecran lat. Verticală,
            fiindcă locul ăsta cere de obicei un portret — iar dacă i se dă o poză
            lată, o taie pe margini, nu o turtește.
          */}
          {poza && (
            <div style={{ marginTop: "36px", maxWidth: "380px" }}>
              <SectionImage
                src={poza.url}
                alt={poza.altText ?? ""}
                aspectRatio="4 / 5"
                sizes="(max-width: 720px) 100vw, 380px"
              />
            </div>
          )}
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
                background: "var(--s-buton-fundal)",
                color: "var(--s-buton-text)",
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
