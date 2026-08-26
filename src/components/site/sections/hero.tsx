import type { SectionTone } from "@/lib/templates";
import { Section, SectionEyebrow } from "@/components/site/section";
import { SectionImage } from "@/components/site/section-image";

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
  /** Aceeași formă ca la încărcare (`ImageValue`). Lipsă = secțiune doar text. */
  imagine?: { url: string; altText?: string };
};

export function Hero({ data, tone }: { data: HeroData; tone?: SectionTone }) {
  const poza = data.imagine?.url ? data.imagine : null;

  const text = (
    <>
      {data.eyebrow && <SectionEyebrow>{data.eyebrow}</SectionEyebrow>}

      <h1
        style={{
          margin: 0,
          // Fără poză, titlul are toată lățimea și poate fi cât o afiș. Alături
          // de o imagine are jumătate, iar aceleași 118px ar rupe fiecare cuvânt
          // pe câte un rând.
          fontSize: poza ? "clamp(40px, 5.2vw, 72px)" : "clamp(48px, 9vw, 118px)",
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
                background: "var(--s-buton-fundal)",
                color: "var(--s-buton-text)",
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
    </>
  );

  if (!poza) {
    return <Section tone={tone}>{text}</Section>;
  }

  return (
    <Section tone={tone}>
      {/*
        `auto-fit` cu un minim, nu două coloane fixe: pe telefon poza trece sub
        text de la sine, fără media query — pe care un `style` inline nici nu-l
        poate exprima.
      */}
      <div
        style={{
          display: "grid",
          gap: "clamp(32px, 4vw, 56px)",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(340px, 100%), 1fr))",
          alignItems: "center",
        }}
      >
        <div>{text}</div>
        {/*
          Pătrată: e forma care taie cel mai puțin din orice i-ai da, și un
          portret și o poză de cabinet. `priority` fiindcă e prima imagine de pe
          pagină — cea după care Google măsoară cât de repede se încarcă site-ul.
        */}
        <SectionImage
          src={poza.url}
          alt={poza.altText ?? ""}
          aspectRatio="1 / 1"
          sizes="(max-width: 860px) 100vw, 45vw"
          priority
        />
      </div>
    </Section>
  );
}
