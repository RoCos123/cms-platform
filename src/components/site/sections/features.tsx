import type { SectionTone } from "@/lib/templates";
import { Section, SectionEyebrow } from "@/components/site/section";

export type FeaturesData = {
  eyebrow?: string;
  titlu: string;
  titluAccent?: string;
  intro?: string;
  servicii: { titlu: string; descriere: string; href?: string }[];
};

/**
 * „Serviciile mele" — în șabloanele analizate numărul variază între patru și
 * șase. Grila se adaptează singură la câte există, ca numărul de servicii să fie
 * o alegere a clientului, nu o constrângere de layout.
 */
export function Features({
  data,
  tone,
}: {
  data: FeaturesData;
  tone?: SectionTone;
}) {
  return (
    <Section tone={tone} id="servicii">
      {data.eyebrow && <SectionEyebrow>{data.eyebrow}</SectionEyebrow>}

      <h2
        style={{
          margin: 0,
          maxWidth: "14em",
          fontSize: "clamp(34px, 5vw, 62px)",
          lineHeight: 1.05,
          letterSpacing: "-0.025em",
          fontWeight: 700,
          textWrap: "balance",
        }}
      >
        {data.titlu}
        {data.titluAccent && (
          <>
            {" "}
            <span
              style={{
                fontFamily: "var(--t-font-secundar)",
                fontStyle: "italic",
                fontWeight: 300,
              }}
            >
              {data.titluAccent}
            </span>
          </>
        )}
      </h2>

      {data.intro && (
        <p
          style={{
            margin: "24px 0 0",
            maxWidth: "36em",
            fontSize: "17px",
            lineHeight: 1.7,
            color: "var(--s-text-secundar)",
            textWrap: "pretty",
          }}
        >
          {data.intro}
        </p>
      )}

      <ul
        style={{
          listStyle: "none",
          margin: "56px 0 0",
          padding: 0,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(288px, 1fr))",
          gap: "20px",
        }}
      >
        {data.servicii.map((serviciu) => (
          <li
            key={serviciu.titlu}
            style={{
              background: "var(--t-fundal-nuantat)",
              border: "1px solid var(--t-chenar)",
              borderRadius: "var(--t-raza)",
              padding: "32px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "21px", fontWeight: 600, color: "var(--t-text)" }}>
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
              {serviciu.descriere}
            </p>
            {serviciu.href && (
              <a
                href={serviciu.href}
                style={{
                  marginTop: "auto",
                  paddingTop: "12px",
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "var(--t-accent)",
                  textDecoration: "none",
                }}
              >
                Află mai multe →
              </a>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}
