import type { SectionTone } from "@/lib/templates";
import { Section, SectionEyebrow } from "@/components/site/section";

export type HowItWorksData = {
  eyebrow?: string;
  titlu: string;
  titluAccent?: string;
  intro?: string;
  pasi: { titlu: string; descriere: string }[];
};

/**
 * „Cum decurge colaborarea" — pașii de la primul telefon la ședințele propriu-zise.
 *
 * Numărul se derivă din poziția în listă, nu se introduce de client: scris de
 * mână, o reordonare a pașilor ar lăsa numerotarea desincronizată. E și motivul
 * pentru care lista e `<ol>` — aici ordinea are înțeles, spre deosebire de servicii.
 */
export function HowItWorks({
  data,
  tone,
  carduri,
}: {
  data: HowItWorksData;
  tone?: SectionTone;
  /**
   * Antetul centrat și pașii în carduri albe (cifră serif + text), ca stâlpii
   * din referința „Liniște". Fără iconițe. Doar „Liniște".
   */
  carduri?: boolean;
}) {
  /*
    Lista lipsește cu totul pe un site abia provizionat: `creeaza_client` pune
    toate secțiunile APRINSE, cu `{}` în ele (migrarea `comutator_lansare` —
    un site nepublicat nu se vede oricum, iar clientul stinge ce nu-i trebuie).
    Fără `?? []`, prima pagină a fiecărui client nou cădea cu 500.

    Goală, secțiunea nu se randează deloc — aceeași regulă ca la „Serviciile
    mele" și „Pachete": un titlu urmat de nimic arată a site stricat.
  */
  const pasi = data.pasi ?? [];
  /*
    Titlul singur e de ajuns ca să se vadă secțiunea, chiar fără nimic sub el.

    Hotărât de proprietar, uitându-se la primul site provizionat: un site nou
    trebuie să-și arate SCHELETUL — toate secțiunile, fiecare cu numele ei ca
    text de pornire — ca omul să vadă ce are de completat și unde. Ascunse, ele
    făceau panoul să mintă: acolo scria „vizibilă", pe site nu era nimic.

    Fără titlu ȘI fără conținut, tot nu se randează nimic: aia e secțiunea pe
    care clientul a golit-o dinadins.
  */
  if (pasi.length === 0 && !data.titlu?.trim()) return null;

  return (
    <Section tone={tone} id="proces">
      {/*
        La „Liniște" (`carduri`) antetul e centrat, ca la referință; la restul
        rămâne aliniat la stânga. Centrarea e o alegere de așezare a șablonului,
        nu conținut, deci vine din steag, nu din date.
      */}
      <div style={carduri ? { textAlign: "center" } : undefined}>
        {data.eyebrow && <SectionEyebrow>{data.eyebrow}</SectionEyebrow>}

        <h2
          style={{
            margin: carduri ? "0 auto" : 0,
            maxWidth: carduri ? "16em" : "13em",
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

        {data.intro && (
          <p
            style={{
              margin: carduri ? "22px auto 0" : "22px 0 0",
              maxWidth: "36em",
              fontSize: "17px",
              lineHeight: 1.7,
              color: "var(--s-text-secundar)",
            }}
          >
            {data.intro}
          </p>
        )}
      </div>

      <ol
        style={{
          listStyle: "none",
          margin: "56px 0 0",
          padding: 0,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(232px, 1fr))",
          gap: carduri ? "24px" : "36px 28px",
        }}
      >
        {pasi.map((pas, index) => (
          <li
            key={pas.titlu}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              // La „Liniște" fiecare pas stă într-un card ALB (ca stâlpii din
              // referință), oricare ar fi tonul benzii — de aici fallback-ul pe
              // `#ffffff`, nu pe cremul nuanțat. Albul se pune DOAR aici (și la
              // sub-cardul de formular din Contact), nu la nivel de șablon, ca să
              // nu albească din greșeală cardurile din secțiunile nereferențiate
              // (testimoniale, pachete, programare). Textul își ia culorile tot
              // din șablon (`--t-…`), nu din tonul benzii.
              ...(carduri
                ? {
                    background: "var(--t-suprafata, #ffffff)",
                    border: "1px solid var(--t-chenar)",
                    borderRadius: "var(--t-raza)",
                    padding: "clamp(28px, 3vw, 40px)",
                    color: "var(--t-text)",
                  }
                : {}),
            }}
          >
            <span
              aria-hidden
              style={{
                fontFamily: "var(--t-font-secundar)",
                fontSize: "44px",
                lineHeight: 1,
                color: carduri ? "var(--t-accent)" : "var(--s-accent)",
              }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 600 }}>{pas.titlu}</h3>
            <p
              style={{
                margin: 0,
                fontSize: "16px",
                lineHeight: 1.7,
                color: carduri ? "var(--t-text-secundar)" : "var(--s-text-secundar)",
                textWrap: "pretty",
              }}
            >
              {pas.descriere}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
