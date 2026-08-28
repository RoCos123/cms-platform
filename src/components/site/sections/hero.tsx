import type { AsezareHero, SectionTone } from "@/lib/templates";
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

/**
 * Prima secțiune, în cele două așezări măsurate pe șabloanele-sursă.
 *
 * `textPozaDreapta` (implicit) — text stânga, poză dreapta. O fac trei din cele
 * patru șabloane. `titluLat` — titlul pe toată lățimea, iar sub el poza la
 * stânga și textul la dreapta; doar „Căldură".
 *
 * Așezarea vine din șablon, nu din rândul secțiunii: e o hotărâre de design,
 * nu de conținut. Fără poză, amândouă arată la fel — n-are ce împărți.
 */
export function Hero({
  data,
  tone,
  asezare = "textPozaDreapta",
}: {
  data: HeroData;
  tone?: SectionTone;
  asezare?: AsezareHero;
}) {
  const poza = data.imagine?.url ? data.imagine : null;
  const titluLat = asezare === "titluLat" && poza !== null;

  const titlu = (
    <>
      {data.eyebrow && <SectionEyebrow>{data.eyebrow}</SectionEyebrow>}

      <h1
        style={{
          margin: 0,
          // Titlul are toată lățimea când nu-l îngustează o poză alături — fie
          // că nu există poză deloc, fie că așezarea o pune dedesubt. Pe
          // jumătate de rând, aceleași 118px ar rupe fiecare cuvânt pe câte un
          // rând.
          fontSize:
            poza && !titluLat ? "clamp(40px, 5.2vw, 72px)" : "clamp(48px, 9vw, 118px)",
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

    </>
  );

  const restul = (
    <>
      {data.subtitlu && (
        <p
          style={{
            // În așezarea cu titlul lat, textul stă lângă poză, nu sub titlu:
            // marginea de sus ar împinge un paragraf deja aliniat la bază.
            margin: titluLat ? 0 : "36px 0 0",
            // Serif italic, ca pe originalul „Căldură": acolo paragraful de sub
            // titlu nu e text curent, e o continuare a titlului.
            fontFamily: titluLat ? "var(--t-font-secundar)" : undefined,
            fontStyle: titluLat ? "italic" : undefined,
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

  // Fără poză n-are ce împărți: amândouă așezările sunt același text lat.
  if (!poza) {
    return (
      <Section tone={tone}>
        {titlu}
        {restul}
      </Section>
    );
  }

  /*
    Pătrată: e forma care taie cel mai puțin din orice i-ai da, și un portret și
    o poză de cabinet. `priority` fiindcă e prima imagine de pe pagină — cea
    după care Google măsoară cât de repede se încarcă site-ul.

    `sizes` diferă între așezări fiindcă și lățimea reală diferă: 47% din ecran
    la titlul lat (măsurat pe original), 45% pe două coloane. O valoare greșită
    aici nu strică nimic vizibil, dar face browserul să descarce o poză de altă
    mărime decât îi trebuie.
  */
  const imagine = (
    <SectionImage
      src={poza.url}
      alt={poza.altText ?? ""}
      aspectRatio="1 / 1"
      sizes={titluLat ? "(max-width: 860px) 100vw, 47vw" : "(max-width: 860px) 100vw, 45vw"}
      priority
    />
  );

  if (titluLat) {
    return (
      <Section tone={tone}>
        {titlu}

        {/*
          Poza la stânga, textul la dreapta, aliniate la BAZĂ. Alinierea nu e un
          moft: pe original textul se termină la aceeași linie cu poza, iar
          centrat l-ar ridica la mijlocul unei imagini înalte, unde ar pluti.

          Coloanele sunt inegale fiindcă și pe original poza e mai lată decât
          textul de lângă ea — vezi comentariul de pe flex-uri, mai jos.
        */}
        <div
          style={{
            marginTop: "clamp(40px, 5vw, 72px)",
            display: "flex",
            flexWrap: "wrap",
            gap: "clamp(32px, 4vw, 56px)",
            alignItems: "flex-end",
          }}
        >
          {/*
            Flex cu `wrap`, nu grid cu `auto-fit`: `auto-fit` dă coloane EGALE,
            iar aici poza trebuie să fie mai lată decât textul de lângă ea, ca pe
            original (47% din ecran). Baza de 320px face rândul să se rupă
            singur pe telefon, fără media query — pe care un `style` inline nici
            nu-l poate exprima.
          */}
          <div style={{ flex: "1.1 1 320px", minWidth: 0 }}>{imagine}</div>
          <div style={{ flex: "1 1 340px", minWidth: 0 }}>{restul}</div>
        </div>
      </Section>
    );
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
        <div>
          {titlu}
          {restul}
        </div>
        {imagine}
      </div>
    </Section>
  );
}
