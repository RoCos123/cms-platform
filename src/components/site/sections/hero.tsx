import { Section, SectionEyebrow } from "@/components/site/section";

export type HeroData = {
  eyebrow?: string;
  /** Prima parte a titlului, în fontul principal. */
  titlu: string;
  /**
   * Partea accentuată a titlului, în serif italic. E separată de `titlu` fiindcă
   * la toate patru șabloanele accentul cade pe o bucată anume („psiholog
   * clinician.", „să te ascult."), nu pe tot titlul.
   */
  titluAccent?: string;
  subtitlu?: string;
  butonPrincipal?: { text: string; href: string };
  butonSecundar?: { text: string; href: string };
};

export function Hero({ data, tone }: { data: HeroData; tone?: "deschis" | "nuantat" | "inchis" }) {
  return (
    <Section tone={tone}>
      {data.eyebrow && <SectionEyebrow>{data.eyebrow}</SectionEyebrow>}

      <h1
        style={{
          margin: 0,
          fontSize: "clamp(48px, 9vw, 118px)",
          lineHeight: 0.98,
          letterSpacing: "-0.035em",
          fontWeight: 700,
          textWrap: "balance",
        }}
      >
        {data.titlu}
        {data.titluAccent && (
          <>
            <br />
            <span
              style={{
                fontFamily: "var(--t-font-secundar)",
                fontStyle: "italic",
                fontWeight: 300,
                letterSpacing: "-0.01em",
              }}
            >
              {data.titluAccent}
            </span>
          </>
        )}
      </h1>

      {data.subtitlu && (
        <p
          style={{
            margin: "36px 0 0",
            maxWidth: "34em",
            fontSize: "clamp(17px, 1.4vw, 19px)",
            lineHeight: 1.7,
            color: "var(--s-text-secundar)",
            textWrap: "pretty",
          }}
        >
          {data.subtitlu}
        </p>
      )}

      {(data.butonPrincipal || data.butonSecundar) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", marginTop: "44px" }}>
          {data.butonPrincipal && (
            <a
              href={data.butonPrincipal.href}
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: "54px",
                paddingInline: "30px",
                borderRadius: "var(--t-raza-buton)",
                background: "var(--t-accent)",
                color: "var(--t-accent-text)",
                fontSize: "16px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              {data.butonPrincipal.text}
            </a>
          )}
          {data.butonSecundar && (
            <a
              href={data.butonSecundar.href}
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: "54px",
                paddingInline: "28px",
                borderRadius: "var(--t-raza-buton)",
                border: "1px solid var(--t-chenar)",
                color: "inherit",
                fontSize: "16px",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              {data.butonSecundar.text}
            </a>
          )}
        </div>
      )}
    </Section>
  );
}
