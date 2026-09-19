import type { SectionTone } from "@/lib/templates";
import { Section, SectionEyebrow } from "@/components/site/section";

export type FaqData = {
  eyebrow?: string;
  titlu: string;
  titluAccent?: string;
  intrebari: { intrebare: string; raspuns: string }[];
};

/**
 * „Întrebări frecvente".
 *
 * Construit pe `<details>`/`<summary>` nativ, nu pe JavaScript: funcționează fără
 * hidratare, e navigabil de la tastatură din start, iar Ctrl+F al browserului
 * găsește text și în răspunsurile închise. Un acordeon scris de mână pierde toate
 * cele trei.
 *
 * Randarea rămâne curat statică și fiindcă în Faza 4 conținutul de aici
 * alimentează datele structurate `FAQPage` pentru Google.
 */
export function Faq({ data, tone }: { data: FaqData; tone?: SectionTone }) {
  /*
    Lista lipsește cu totul pe un site abia provizionat: `creeaza_client` pune
    toate secțiunile APRINSE, cu `{}` în ele (migrarea `comutator_lansare` —
    un site nepublicat nu se vede oricum, iar clientul stinge ce nu-i trebuie).
    Fără `?? []`, prima pagină a fiecărui client nou cădea cu 500.

    Goală, secțiunea nu se randează deloc — aceeași regulă ca la „Serviciile
    mele" și „Pachete": un titlu urmat de nimic arată a site stricat.
  */
  const intrebari = data.intrebari ?? [];
  /*
    Titlul singur e de ajuns ca să se vadă secțiunea, chiar fără nimic sub el.

    Hotărât de proprietar, uitându-se la primul site provizionat: un site nou
    trebuie să-și arate SCHELETUL — toate secțiunile, fiecare cu numele ei ca
    text de pornire — ca omul să vadă ce are de completat și unde. Ascunse, ele
    făceau panoul să mintă: acolo scria „vizibilă", pe site nu era nimic.

    Fără titlu ȘI fără conținut, tot nu se randează nimic: aia e secțiunea pe
    care clientul a golit-o dinadins.
  */
  if (intrebari.length === 0 && !data.titlu?.trim()) return null;

  return (
    <Section tone={tone} id="intrebari">
      {data.eyebrow && <SectionEyebrow>{data.eyebrow}</SectionEyebrow>}

      <h2
        style={{
          margin: 0,
          maxWidth: "13em",
          fontSize: "clamp(32px, 4.4vw, 54px)",
          lineHeight: 1.08,
          letterSpacing: "-0.025em",
          // Fontul de titlu al șablonului, ca la `SectionHeading` — corectat
          // 19 sept. 2026: secțiunea asta nu trece prin `SectionHeading`
          // (are propriul antet), deci rămăsese pe fontul implicit, diferit
          // de restul titlurilor paginii (ex. „Apariții").
          fontFamily: "var(--t-font-titlu)",
          fontWeight: "var(--t-greutate-titlu)" as unknown as number,
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

      <div style={{ margin: "48px 0 0", maxWidth: "50em" }}>
        {intrebari.map((item, i) => (
          <details
            key={i}
            style={{
              borderTop: "1px solid var(--t-chenar)",
              borderBottom: i === intrebari.length - 1 ? "1px solid var(--t-chenar)" : undefined,
            }}
          >
            <summary
              style={{
                cursor: "pointer",
                listStyle: "none",
                padding: "24px 40px 24px 0",
                position: "relative",
                fontSize: "clamp(17px, 1.6vw, 20px)",
                fontWeight: 600,
                textWrap: "pretty",
              }}
            >
              {item.intrebare}
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  right: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "24px",
                  lineHeight: 1,
                  color: "var(--s-accent)",
                }}
              >
                +
              </span>
            </summary>
            <p
              style={{
                margin: "0 0 26px",
                paddingRight: "40px",
                fontSize: "17px",
                lineHeight: 1.75,
                color: "var(--s-text-secundar)",
                textWrap: "pretty",
              }}
            >
              {item.raspuns}
            </p>
          </details>
        ))}
      </div>
    </Section>
  );
}
