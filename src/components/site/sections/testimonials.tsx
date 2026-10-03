import type { SectionTone } from "@/lib/templates";
import { Section, SectionEyebrow } from "@/components/site/section";

export type TestimonialsData = {
  eyebrow?: string;
  titlu: string;
  titluAccent?: string;
  marturii: {
    text: string;
    /** De obicei un prenume sau inițiale — mărturiile din terapie nu se semnează complet. */
    autor: string;
    context?: string;
  }[];
};

/**
 * „Păreri" — mărturii de la oameni cu care clientul a lucrat.
 *
 * Guardrail deontologic prevăzut în Faza 6: fiecare mărturie va cere în panou o
 * bifă „acord scris obținut" înainte să poată fi făcută vizibilă. Aici doar se
 * afișează ce a trecut de acea verificare; regula se aplică la editare, unde
 * poate fi impusă, nu la randare.
 */
export function Testimonials({
  data,
  tone,
  friendly,
  verde,
  titluSerif,
}: {
  data: TestimonialsData;
  tone?: SectionTone;
  /**
   * Cardurile prietenoase (stele, citat drept, avatar cu inițiale, unul verde),
   * ca la sursă. Doar „Apropiere"; restul rămân cu cardul-citat de dinainte.
   */
  friendly?: boolean;
  /**
   * Fundal verde în gradient, text deschis, carduri translucide. Doar „Liniște"
   * — vezi `TemplateAsezari.testimonialeVerde`.
   */
  verde?: boolean;
  /**
   * Fontul de titlu al șablonului (`--t-font-titlu`), ca la `SectionHeading`.
   * Pornit DOAR pe „Liniește" (23 sept. 2026), cerut de proprietar — vezi
   * `TemplateAsezari.titluSerif`. Fără el, titlul rămâne pe fontul implicit.
   */
  titluSerif?: boolean;
}) {
  /*
    Lista lipsește cu totul pe un site abia provizionat: `creeaza_client` pune
    toate secțiunile APRINSE, cu `{}` în ele (migrarea `comutator_lansare` —
    un site nepublicat nu se vede oricum, iar clientul stinge ce nu-i trebuie).
    Fără `?? []`, prima pagină a fiecărui client nou cădea cu 500.

    Goală, secțiunea nu se randează deloc — aceeași regulă ca la „Serviciile
    mele" și „Pachete": un titlu urmat de nimic arată a site stricat.
  */
  const marturii = data.marturii ?? [];
  /*
    Titlul singur e de ajuns ca să se vadă secțiunea, chiar fără nimic sub el.

    Hotărât de proprietar, uitându-se la primul site provizionat: un site nou
    trebuie să-și arate SCHELETUL — toate secțiunile, fiecare cu numele ei ca
    text de pornire — ca omul să vadă ce are de completat și unde. Ascunse, ele
    făceau panoul să mintă: acolo scria „vizibilă", pe site nu era nimic.

    Fără titlu ȘI fără conținut, tot nu se randează nimic: aia e secțiunea pe
    care clientul a golit-o dinadins.
  */
  if (marturii.length === 0 && !data.titlu?.trim()) return null;

  return (
    <Section
      // Pe verde: tonul închis dă textul deschis și variabilele `--s-*` potrivite
      // unui fundal închis; verdele propriu-zis e desenat de `decor`, peste el.
      tone={verde ? "inchis" : tone}
      id="pareri"
      decor={verde ? <FundalVerde /> : undefined}
    >
      {data.eyebrow && <SectionEyebrow>{data.eyebrow}</SectionEyebrow>}

      <h2
        style={{
          margin: 0,
          maxWidth: "13em",
          fontSize: "clamp(32px, 4.4vw, 54px)",
          lineHeight: 1.08,
          letterSpacing: "-0.025em",
          // Fontul de titlu al șablonului, ca la `SectionHeading` — DOAR când
          // `titluSerif` e pornit (Liniește). Fără el, rămâne fontWeight 700
          // simplu, exact ca înainte de 19 sept. 2026, pe celelalte șabloane.
          ...(titluSerif
            ? {
                fontFamily: "var(--t-font-titlu)",
                fontWeight: "var(--t-greutate-titlu)" as unknown as number,
              }
            : { fontWeight: 700 }),
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
                fontStyle: "var(--t-stil-accent)",
                // Ca la celelalte titluri de secțiune: piersică apăsat pe
                // „Apropiere", subțire în culoarea titlului la rest.
                fontWeight: "var(--t-greutate-accent-titlu, 300)" as unknown as number,
                color: "var(--t-accent-titlu, inherit)",
              }}
            >
              {data.titluAccent}
            </span>
          </>
        )}
      </h2>

      <div
        style={{
          margin: "52px 0 0",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "20px",
        }}
      >
        {marturii.map((marturie, i) => {
          if (friendly) {
            // Cardul prietenos: stele, citat drept, iar jos un avatar cu
            // inițialele scoase din nume. Cardul din mijloc e verde. Culorile vin
            // din șablon (`--t-…`), deci rămân deschise pe orice ton al secțiunii.
            const featured = i === Math.floor((marturii.length - 1) / 2);
            const initiale = marturie.autor
              .split(/\s+/)
              .filter(Boolean)
              .map((cuvant) => cuvant[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            return (
              <div
                key={i}
                style={{
                  padding: "28px",
                  borderRadius: "var(--t-raza)",
                  background: featured ? "var(--t-accent-pe-inchis)" : "var(--t-suprafata, var(--t-fundal-nuantat))",
                  border: `1px solid ${featured ? "var(--t-accent)" : "var(--t-chenar)"}`,
                  color: "var(--t-text)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div aria-hidden style={{ color: "var(--t-accent-cald-inchis)", letterSpacing: "3px", fontSize: "15px" }}>
                  ★★★★★
                </div>
                <p style={{ margin: 0, flex: 1, fontSize: "16px", lineHeight: 1.6, textWrap: "pretty" }}>
                  „{marturie.text}”
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span
                    aria-hidden
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      flexShrink: 0,
                      background: "var(--t-accent)",
                      color: "var(--t-accent-text)",
                      display: "grid",
                      placeItems: "center",
                      fontSize: "13px",
                      fontWeight: 700,
                    }}
                  >
                    {initiale}
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "block", fontWeight: 700, fontSize: "14px" }}>{marturie.autor}</span>
                    {marturie.context && (
                      <span style={{ display: "block", fontSize: "13px", color: "var(--t-text-secundar)" }}>
                        {marturie.context}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            );
          }
          return (
            <figure
              key={i}
              style={{
                margin: 0,
                borderRadius: "var(--t-raza)",
                // Pe verde, cardul e ALB, exact ca pașii din „Cum decurge
                // colaborarea" la Liniște (cerut de proprietar, 3 oct. 2026): același
                // fundal, chenar, rază și spațiu interior, iar textul își ia culorile
                // din șablon (`--t-…`), nu din tonul închis al benzii.
                ...(verde
                  ? {
                      padding: "clamp(28px, 3vw, 40px)",
                      background: "var(--t-suprafata, #ffffff)",
                      border: "1px solid var(--t-chenar)",
                      color: "var(--t-text)",
                    }
                  : {
                      padding: "32px",
                      background: "color-mix(in oklab, var(--t-fundal-nuantat) 80%, transparent)",
                      border: "1px solid color-mix(in oklab, var(--t-chenar) 70%, transparent)",
                    }),
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              <blockquote
                style={{
                  margin: 0,
                  flex: 1,
                  fontFamily: "var(--t-font-secundar)",
                  fontStyle: "var(--t-stil-accent)",
                  fontSize: "20px",
                  lineHeight: 1.5,
                  textWrap: "pretty",
                }}
              >
                {marturie.text}
              </blockquote>
              <figcaption
                style={{
                  fontSize: "14px",
                  // Pe verde cardul e alb, deci textul secundar e al șablonului
                  // (`--t-`), nu cel deschis al benzii închise (`--s-`).
                  color: verde ? "var(--t-text-secundar)" : "var(--s-text-secundar)",
                }}
              >
                <span style={{ fontWeight: 600, color: "inherit" }}>{marturie.autor}</span>
                {marturie.context && <span> · {marturie.context}</span>}
              </figcaption>
            </figure>
          );
        })}
      </div>
    </Section>
  );
}

/**
 * Verdele din spatele „Păreri" la Liniște, măsurat pe captura adusă de
 * proprietar (3 oct. 2026): baza rgb(65,84,71); spre stânga-sus urcă la
 * rgb(71,90,77), în dreapta coboară la rgb(60,80,66). Un gradient liniar pe
 * orizontală pentru bază, plus o lumină largă și slabă sus.
 */
function FundalVerde() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(ellipse 55% 70% at 33% 0%, rgba(80, 100, 86, 0.55), transparent 70%), linear-gradient(90deg, #415447 0%, #415548 50%, #3c5042 100%)",
      }}
    />
  );
}
