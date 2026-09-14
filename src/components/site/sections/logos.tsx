import type { SectionTone } from "@/lib/templates";
import type { PunctFocal } from "@/lib/punct-focal";
import { Section } from "@/components/site/section";
import { SectionHeading } from "@/components/site/section-heading";
import { SectionImage } from "@/components/site/section-image";
import { RedareVideo } from "@/components/site/redare-video";
import { idYouTube, embedYouTube, posterYouTube } from "@/lib/video";

export type LogosData = {
  eyebrow?: string;
  titlu: string;
  titluAccent?: string;
  intro?: string;
  /**
   * Videouri de la YouTube, așezate în grilă (2-3 pe rând), fiecare cu buton de
   * play. Cerute de proprietar („ca la Renata Iancu"), dar mai multe, nu unul.
   */
  videouri?: {
    /** Link YouTube, în orice formă (`watch?v=`, `youtu.be/`, `/embed/`…). */
    video: string;
    /** Un titlu scurt sub video (opțional). */
    titlu?: string;
    /** Afiș propriu; gol → se ia automat de pe YouTube. */
    poster?: { url: string; altText?: string; pozitie?: PunctFocal };
  }[];
  aparitii: {
    /** Unde a apărut: „Digi24", „Podcast Vorbim deschis". */
    sursa: string;
    titlu: string;
    descriere?: string;
    /** „Emisiune TV", „Podcast", „Interviu" — se afișează ca etichetă mică. */
    tip?: string;
    data?: string;
    href?: string;
    /** Aceeași formă ca la încărcare (`ImageValue`): `altText`, nu `alt`. */
    imagine?: { url: string; altText?: string; pozitie?: PunctFocal };
  }[];
};

/**
 * „Apariții și acreditări" — presă, TV, podcast.
 *
 * Cheia `logos` fusese repurposată în „Bandă servicii" în decizii-faza-0.md
 * §6.1; șablonul „Căldură" arată că sunt două lucruri diferite și că amândouă
 * există (vezi design/sabloane/README.md). Aici e scopul original: recunoaștere
 * externă.
 *
 * Nu e o listă de link-uri seci, ci carduri: în șablon fiecare apariție are
 * imagine și context, fiindcă rolul secțiunii e încrederea, nu navigarea. Peste
 * carduri, o grilă de videouri încorporate: o apariție TV se vede cel mai bine
 * pornind-o pe loc, nu ca link către alt site.
 */
export function Logos({ data, tone }: { data: LogosData; tone?: SectionTone }) {
  /*
    Listele lipsesc cu totul pe un site abia provizionat: `creeaza_client` pune
    toate secțiunile APRINSE, cu `{}` în ele (migrarea `comutator_lansare` —
    un site nepublicat nu se vede oricum, iar clientul stinge ce nu-i trebuie).
    Fără `?? []`, prima pagină a fiecărui client nou cădea cu 500.

    Goală, secțiunea nu se randează deloc — aceeași regulă ca la „Serviciile
    mele" și „Pachete": un titlu urmat de nimic arată a site stricat.
  */
  const aparitii = data.aparitii ?? [];
  const videouri = data.videouri ?? [];
  /*
    Titlul singur e de ajuns ca să se vadă secțiunea, chiar fără nimic sub el.

    Hotărât de proprietar, uitându-se la primul site provizionat: un site nou
    trebuie să-și arate SCHELETUL — toate secțiunile, fiecare cu numele ei ca
    text de pornire — ca omul să vadă ce are de completat și unde. Ascunse, ele
    făceau panoul să mintă: acolo scria „vizibilă", pe site nu era nimic.

    Fără titlu ȘI fără conținut, tot nu se randează nimic: aia e secțiunea pe
    care clientul a golit-o dinadins.
  */
  if (aparitii.length === 0 && videouri.length === 0 && !data.titlu?.trim()) return null;

  return (
    <Section tone={tone} id="aparitii">
      <SectionHeading
        eyebrow={data.eyebrow}
        titlu={data.titlu}
        titluAccent={data.titluAccent}
        intro={data.intro}
      />

      {/* Grila de videouri: 2-3 pe un rând lat, 1 pe telefon (`auto-fit`, fără
          media queries). Un link stricat sau non-YouTube se sare, nu dărâmă. */}
      {videouri.length > 0 && (
        <ul
          style={{
            listStyle: "none",
            margin: "52px 0 0",
            padding: 0,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px",
          }}
        >
          {videouri.map((v, i) => {
            const id = idYouTube(v.video);
            if (!id) return null;
            const poster = v.poster?.url ? v.poster : null;

            return (
              <li key={`${v.video}-${i}`}>
                <RedareVideo embedUrl={embedYouTube(id)} titlu={v.titlu || data.titlu || "Video"}>
                  <SectionImage
                    src={poster ? poster.url : posterYouTube(id)}
                    alt={poster?.altText ?? ""}
                    aspectRatio="16 / 9"
                    sizes="(max-width: 720px) 100vw, 380px"
                    pozitie={poster?.pozitie}
                  />
                </RedareVideo>
                {v.titlu && (
                  <p
                    style={{
                      margin: "14px 0 0",
                      fontSize: "16px",
                      fontWeight: 600,
                      lineHeight: 1.4,
                      color: "var(--s-text-secundar)",
                      textWrap: "pretty",
                    }}
                  >
                    {v.titlu}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Cardurile de apariții în presă. Fără ele, secțiunea poate fi doar video. */}
      {aparitii.length > 0 && (
        <ul
          style={{
            listStyle: "none",
            margin: "52px 0 0",
            padding: 0,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px",
          }}
        >
          {aparitii.map((aparitie, i) => {
            const meta = [aparitie.tip, aparitie.data].filter(Boolean).join(" · ");

            return (
              <li key={`${aparitie.sursa}-${i}`}>
                <Continut href={aparitie.href}>
                  {aparitie.imagine && (
                    <SectionImage
                      src={aparitie.imagine.url}
                      alt={aparitie.imagine.altText ?? ""}
                      aspectRatio="16 / 9"
                      sizes="(max-width: 720px) 100vw, 560px"
                      pozitie={aparitie.imagine.pozitie}
                    />
                  )}

                  <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                    {meta && (
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: "var(--t-accent)",
                        }}
                      >
                        {meta}
                      </span>
                    )}

                    <h3 style={{ margin: 0, fontSize: "21px", lineHeight: 1.3, fontWeight: 600, textWrap: "pretty" }}>
                      {aparitie.titlu}
                    </h3>

                    <p style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "var(--t-text-secundar)" }}>
                      {aparitie.sursa}
                    </p>

                    {aparitie.descriere && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: "16px",
                          lineHeight: 1.7,
                          color: "var(--t-text-secundar)",
                          textWrap: "pretty",
                        }}
                      >
                        {aparitie.descriere}
                      </p>
                    )}

                    {aparitie.href && (
                      <span
                        style={{
                          marginTop: "auto",
                          paddingTop: "10px",
                          fontSize: "15px",
                          fontWeight: 600,
                          color: "var(--t-accent)",
                        }}
                      >
                        Vezi materialul →
                      </span>
                    )}
                  </div>
                </Continut>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

/**
 * Cardul e link doar dacă apariția are adresă. Un `<a>` fără `href` nu e
 * focusabil și e anunțat ca link stricat de cititoarele de ecran, așa că în
 * lipsa adresei se randează un simplu `<div>`.
 */
function Continut({ href, children }: { href?: string; children: React.ReactNode }) {
  const stil: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
    borderRadius: "var(--t-raza)",
    border: "1px solid var(--t-chenar)",
    background: "var(--t-fundal-nuantat)",
    color: "var(--t-text)",
    textDecoration: "none",
  };

  if (!href) return <div style={stil}>{children}</div>;

  return (
    <a href={href} style={stil} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noopener noreferrer" : undefined}>
      {children}
    </a>
  );
}
