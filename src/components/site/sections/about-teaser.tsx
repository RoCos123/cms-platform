import type { SectionTone } from "@/lib/templates";
import type { PunctFocal } from "@/lib/punct-focal";
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
  imagine?: { url: string; altText?: string; pozitie?: PunctFocal };
};

export function AboutTeaser({ data, tone }: { data: AboutTeaserData; tone?: SectionTone }) {
  /*
    Lista lipsește cu totul pe un site abia provizionat: `creeaza_client` pune
    toate secțiunile APRINSE, cu `{}` în ele (migrarea `comutator_lansare` —
    un site nepublicat nu se vede oricum, iar clientul stinge ce nu-i trebuie).
    Fără `?? []`, prima pagină a fiecărui client nou cădea cu 500.

    Goală, secțiunea nu se randează deloc — aceeași regulă ca la „Serviciile
    mele" și „Pachete": un titlu urmat de nimic arată a site stricat.
  */
  const paragrafe = data.paragrafe ?? [];
  /*
    Titlul singur e de ajuns ca să se vadă secțiunea, chiar fără nimic sub el.

    Hotărât de proprietar, uitându-se la primul site provizionat: un site nou
    trebuie să-și arate SCHELETUL — toate secțiunile, fiecare cu numele ei ca
    text de pornire — ca omul să vadă ce are de completat și unde. Ascunse, ele
    făceau panoul să mintă: acolo scria „vizibilă", pe site nu era nimic.

    Fără titlu ȘI fără conținut, tot nu se randează nimic: aia e secțiunea pe
    care clientul a golit-o dinadins.
  */
  if (paragrafe.length === 0 && !data.titlu?.trim()) return null;

  const poza = data.imagine?.url ? data.imagine : null;

  return (
    <Section tone={tone} id="despre">
      {/*
        Antetul stă pe TOATĂ lățimea, deasupra celor două coloane. Înainte,
        titlul locuia în coloana din stânga, peste poză, așa că textul din
        dreapta pornea din capul de sus — adică în dreptul TITLULUI — iar poza
        rămânea jos, singură. Proprietarul a cerut ca textul să fie în dreptul
        POZEI: scos aici, titlul nu mai împinge textul în sus, iar sub el poza și
        textul pornesc de la același nivel.
      */}
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
            <span style={{ fontFamily: "var(--t-font-secundar)", fontStyle: "var(--t-stil-accent)", fontWeight: 300 }}>
              {data.titluAccent}
            </span>
          </>
        )}
      </h2>

      <div
        style={{
          display: "grid",
          gap: "clamp(32px, 5vw, 72px)",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          // Poza și textul se ancorează sus, fiecare pe înălțimea lui — nu întinse
          // una să o ajungă pe cealaltă.
          alignItems: "start",
          marginTop: "clamp(32px, 4vw, 48px)",
        }}
      >
        {/*
          Rama e verticală fiindcă locul cere de obicei un portret — o poză lată
          se taie pe margini (`object-fit: cover`), nu se turtește. Fără poză,
          coloana lipsește cu totul și textul umple singur lățimea.
        */}
        {poza && (
          <div style={{ maxWidth: "380px" }}>
            <SectionImage
              src={poza.url}
              alt={poza.altText ?? ""}
              aspectRatio="4 / 5"
              sizes="(max-width: 720px) 100vw, 380px"
              pozitie={poza.pozitie}
            />
          </div>
        )}

        <div>
          {paragrafe.map((paragraf, i) => (
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
                fontStyle: "var(--t-stil-accent)",
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
