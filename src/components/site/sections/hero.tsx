import type { CSSProperties } from "react";
import type { AsezareHero, SectionTone } from "@/lib/templates";
import type { PunctFocal } from "@/lib/punct-focal";
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
  imagine?: { url: string; altText?: string; pozitie?: PunctFocal };
  /**
   * Buline mici care plutesc peste poză („Răspund în / sub 24h"). Cel mult două,
   * opționale. Fără poză nu apar — n-au peste ce sta.
   */
  bulinePoza?: { emoji?: string; mic?: string; mare: string }[];
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
  faraArcada,
  titluFriendly,
  blob,
  cercDecor,
}: {
  data: HeroData;
  tone?: SectionTone;
  asezare?: AsezareHero;
  /** Poza fără arcadă în cap — dreptunghi rotunjit simplu (doar „Apropiere"). */
  faraArcada?: boolean;
  /**
   * Un cerc de accent (salvie) în spatele portretului, care iese pe sub arcadă
   * — semnătura editorială a referinței „Liniște". Doar „Liniște".
   */
  cercDecor?: boolean;
  /**
   * Tratamentul de titlu al modelului prietenos (doar „Apropiere"): ultimul
   * cuvânt din titlu are o dungă piersică pe dedesubt (ca „tu" la sursă), iar
   * coada scrisă de mână (`titluAccent`) e verde, nu subliniată.
   */
  titluFriendly?: boolean;
  /**
   * Pete blurate în spatele hero-ului (o salvie și o piersică), semnătura
   * prietenoasă a sursei. Doar „Apropiere". Secțiunea taie ce iese pe margini,
   * deci nu apare derulare orizontală.
   */
  blob?: boolean;
}) {
  /*
    Fără un titlu, secțiunea nu se randează deloc.

    Nu e prudență: `creeaza_client` aprinde toate secțiunile cu `{}` în ele, iar
    fără paza asta un site abia provizionat arăta o bandă goală în capul paginii. Aceeași regulă ca
    peste tot — o secțiune fără conținut nu desenează nimic, nici măcar ornamentul.
  */
  if (!data.titlu?.trim()) return null;

  const poza = data.imagine?.url ? data.imagine : null;
  const titluLat = asezare === "titluLat" && poza !== null;

  // La „Apropiere", dunga piersică stă sub ULTIMUL cuvânt din titlu (ca „tu" la
  // sursă), nu sub coada scrisă de mână. Îl desprind ca să subliniez doar
  // cuvântul, nu tot rândul; un titlu dintr-un singur cuvânt se subliniază întreg.
  const cuvinte = data.titlu.trim().split(/\s+/);
  const ultimulCuvant = titluFriendly ? cuvinte.pop() ?? "" : "";
  const inceputulTitlului = cuvinte.join(" ");

  // Petele blurate din spatele hero-ului, doar pe „Apropiere". Culorile vin din
  // șablon: salvia deschisă și piersica. `Section` le pune sub conținut și taie
  // ce iese pe margini.
  const decorBlob = blob ? (
    <>
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "-60px",
          left: "-120px",
          width: "460px",
          height: "460px",
          borderRadius: "50%",
          background: "var(--t-accent-pe-inchis)",
          filter: "blur(72px)",
          opacity: 0.5,
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "80px",
          right: "-110px",
          width: "360px",
          height: "360px",
          borderRadius: "50%",
          background: "var(--t-accent-cald)",
          filter: "blur(72px)",
          opacity: 0.42,
          pointerEvents: "none",
        }}
      />
    </>
  ) : undefined;

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
          fontFamily: "var(--t-font-titlu)",
          fontWeight: "var(--t-greutate-titlu)" as unknown as number,
          textWrap: "balance",
        }}
      >
        {titluFriendly ? (
          <>
            {inceputulTitlului}
            {inceputulTitlului && " "}
            {/* Cuvântul cu dunga piersică pe dedesubt. E un fundal, nu
               `text-decoration`: așa controlez grosimea și cât de jos stă, iar
               `padding-bottom` întinde doar dunga, nu urcă rândul. */}
            <span
              style={{
                backgroundImage:
                  "linear-gradient(var(--t-accent-cald), var(--t-accent-cald))",
                backgroundRepeat: "no-repeat",
                backgroundSize: "100% 0.14em",
                backgroundPosition: "left bottom",
                paddingBottom: "0.06em",
              }}
            >
              {ultimulCuvant}
            </span>
          </>
        ) : (
          data.titlu
        )}
        {data.titluAccent && (
          <>
            <br />
            <span
              style={{
                fontFamily: "var(--t-font-secundar)",
                fontStyle: "var(--t-stil-accent)",
                // La „Apropiere" coada scrisă de mână e mai apăsată și verde, ca
                // la sursă („din nou."); la restul rămâne subțire, în culoarea
                // titlului.
                fontWeight: titluFriendly ? 700 : 300,
                letterSpacing: "-0.01em",
                color: titluFriendly ? "var(--t-accent)" : undefined,
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
      <Section tone={tone} decor={decorBlob}>
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
  // Bulinele care plutesc peste poză — doar cele cu rândul mare scris. Cel mult
  // două: una sus-dreapta, una jos-stânga, ca la modelul prietenos.
  const buline = (data.bulinePoza ?? []).filter((b) => b?.mare?.trim()).slice(0, 2);

  const imagine = (
    <div style={{ position: "relative" }}>
      {/*
        Cercul de accent din spatele portretului, care iese pe sub arcadă la
        stânga — semnătura editorială a referinței „Liniște". E salvia
        (`--t-accent`), coborâtă în opacitate ca să rămână un fundal, nu o pată
        tare. Poza stă deasupra (`zIndex: 1`); `overflow` de pe secțiune taie ce
        iese pe margini, deci nu apare derulare orizontală.
      */}
      {cercDecor && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: "-38px",
            top: "36%",
            width: "clamp(150px, 26vw, 230px)",
            height: "clamp(150px, 26vw, 230px)",
            borderRadius: "50%",
            background: "var(--t-accent)",
            opacity: 0.5,
            zIndex: 0,
            pointerEvents: "none",
          }}
        />
      )}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          // Poza rotunjită, cu arcadă în cap pe așezarea cu poza lângă titlu (cerut
          // pe 16 sept. 2026, după modelul șablonului mov). Pe titlul lat (Căldură)
          // rămâne o rotunjire blândă, ca să nu se bată cu poza lată de acolo. Pe
          // „Apropiere" (`faraArcada`) e un dreptunghi rotunjit simplu — sursa lui
          // n-are arcadă.
          borderRadius:
            titluLat || faraArcada
              ? "var(--t-raza)"
              : "clamp(64px, 13vw, 190px) clamp(64px, 13vw, 190px) var(--t-raza) var(--t-raza)",
          overflow: "hidden",
        }}
      >
        <SectionImage
          src={poza.url}
          alt={poza.altText ?? ""}
          aspectRatio="1 / 1"
          sizes={titluLat ? "(max-width: 860px) 100vw, 47vw" : "(max-width: 860px) 100vw, 45vw"}
          pozitie={poza.pozitie}
          priority
        />
      </div>

      {buline[0] && <Bulina bulina={buline[0]} pozitie={{ top: "26px", right: "-10px" }} />}
      {buline[1] && <Bulina bulina={buline[1]} pozitie={{ bottom: "30px", left: "-10px" }} />}
    </div>
  );

  if (titluLat) {
    return (
      <Section tone={tone} decor={decorBlob}>
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
    <Section tone={tone} decor={decorBlob}>
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

/**
 * O bulină care plutește peste poză: emoji într-un cerc, un rând mic deasupra și
 * unul mare dedesubt. Tiparul prietenos din șablonul-sursă.
 *
 * Culorile vin din nivelul ȘABLONULUI (`--t-…`), nu al secțiunii (`--s-…`):
 * fundalul bulinei e mereu crem-deschis, deci și textul trebuie să rămână închis
 * oricare ar fi tonul secțiunii. Cu `--s-text`, pe un hero pe ton închis ar fi
 * ieșit text deschis pe bulină deschisă — nevăzut.
 */
function Bulina({
  bulina,
  pozitie,
}: {
  bulina: { emoji?: string; mic?: string; mare: string };
  pozitie: CSSProperties;
}) {
  return (
    <div
      style={{
        position: "absolute",
        ...pozitie,
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        maxWidth: "min(240px, 66%)",
        padding: "10px 18px 10px 12px",
        borderRadius: "999px",
        background: "var(--t-fundal-nuantat)",
        border: "1px solid var(--t-chenar)",
        boxShadow: "0 16px 36px -16px rgba(0, 0, 0, 0.45)",
      }}
    >
      {bulina.emoji?.trim() && (
        <span
          aria-hidden
          style={{
            display: "grid",
            placeItems: "center",
            width: "36px",
            height: "36px",
            flexShrink: 0,
            borderRadius: "999px",
            background: "color-mix(in oklab, var(--t-accent) 22%, transparent)",
            fontSize: "17px",
          }}
        >
          {bulina.emoji}
        </span>
      )}
      <span style={{ minWidth: 0, lineHeight: 1.25 }}>
        {bulina.mic?.trim() && (
          <span style={{ display: "block", fontSize: "12px", color: "var(--t-text-secundar)" }}>
            {bulina.mic}
          </span>
        )}
        <span
          style={{
            display: "block",
            fontSize: "14px",
            fontWeight: 700,
            color: "var(--t-text)",
            textWrap: "pretty",
          }}
        >
          {bulina.mare}
        </span>
      </span>
    </div>
  );
}
