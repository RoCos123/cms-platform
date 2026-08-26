import { Section } from "@/components/site/section";

export type QuoteData = {
  citat: string;
  autor?: string;
};

/**
 * Secțiune găsită în șabloane, absentă din cele 17 definite în Faza 0: o bandă
 * cu un singur citat, folosită ca respiro între blocuri grele. La Renata și la
 * Dragoș apare de câte două ori, o dată pe fundal deschis și o dată pe închis —
 * de aceea tonul e prop, nu valoare fixă.
 */
export function Quote({ data, tone }: { data: QuoteData; tone?: "deschis" | "nuantat" | "inchis" }) {
  return (
    <Section tone={tone}>
      <figure style={{ margin: 0, display: "flex", gap: "clamp(16px, 3vw, 40px)" }}>
        <span
          aria-hidden
          style={{
            fontFamily: "var(--t-font-secundar)",
            fontSize: "clamp(56px, 7vw, 96px)",
            lineHeight: 0.8,
            color: "var(--t-accent)",
            flexShrink: 0,
          }}
        >
          &ldquo;
        </span>
        <div>
          <blockquote
            style={{
              margin: 0,
              fontFamily: "var(--t-font-secundar)",
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: "clamp(26px, 3.6vw, 44px)",
              lineHeight: 1.28,
              letterSpacing: "-0.01em",
              textWrap: "pretty",
            }}
          >
            {data.citat}
          </blockquote>
          {data.autor && (
            <figcaption
              style={{
                marginTop: "20px",
                fontSize: "14px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--s-text-secundar)",
              }}
            >
              {data.autor}
            </figcaption>
          )}
        </div>
      </figure>
    </Section>
  );
}
