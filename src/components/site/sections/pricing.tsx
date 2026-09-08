import type { SectionTone } from "@/lib/templates";
import { Section } from "@/components/site/section";
import { SectionHeading } from "@/components/site/section-heading";

export type PricingData = {
  eyebrow?: string;
  titlu: string;
  titluAccent?: string;
  intro?: string;
  pachete: {
    nume: string;
    /** Text, nu număr: „300 €”, „de la 250 lei”, „200 lei/an”. */
    pret: string;
    subPret?: string;
    descriere?: string;
    include?: string[];
    /** Scrisă = pachetul iese în față. Goală la restul. */
    eticheta?: string;
    buton?: { text: string; href: string };
  }[];
  nota?: string;
};

/**
 * „Pachete” — prețurile, scrise pe față.
 *
 * DE CE ARATĂ AȘA. Un preț ascuns în spatele lui „cere o ofertă" pare o
 * politețe, dar costă de două ori: omul care n-are bugetul scrie oricum și
 * pleacă supărat, iar cel care l-ar avea nu scrie deloc, fiindcă nu vrea o
 * conversație ca să afle un număr. Secțiunea asta e făcută ca omul să afle în
 * trei secunde dacă e pentru el.
 *
 * Cardul cu etichetă iese în față prin CHENAR și fundal, nu prin altă culoare
 * de accent: culoarea de accent e a șablonului, iar un al doilea accent inventat
 * aici ar fi arătat altfel la fiecare dintre cele patru. Vezi `section.tsx` —
 * secțiunea pune cinci variabile `--s-`, iar una inventată cade tăcut în „fără
 * culoare". S-a întâmplat de trei ori.
 */
export function Pricing({ data, tone }: { data: PricingData; tone?: SectionTone }) {
  const pachete = data.pachete ?? [];
  if (pachete.length === 0) return null;

  return (
    <Section tone={tone} id="pachete">
      <SectionHeading
        eyebrow={data.eyebrow}
        titlu={data.titlu}
        titluAccent={data.titluAccent}
        intro={data.intro}
      />

      <div
        style={{
          marginTop: "clamp(32px, 4vw, 48px)",
          display: "grid",
          // `auto-fit` cu minim 260px: două pachete stau larg, patru se așază pe
          // două rânduri pe laptop și unul sub altul pe telefon, fără media query.
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "clamp(16px, 2vw, 24px)",
          alignItems: "start",
        }}
      >
        {pachete.map((pachet, i) => {
          const inFata = Boolean(pachet.eticheta?.trim());

          return (
            <div
              key={`${pachet.nume}-${i}`}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                height: "100%",
                padding: "clamp(20px, 2.4vw, 28px)",
                borderRadius: "var(--t-raza)",
                border: inFata
                  ? "2px solid var(--s-accent)"
                  : "1px solid color-mix(in oklab, currentColor 18%, transparent)",
                background: inFata
                  ? "color-mix(in oklab, var(--s-accent) 7%, transparent)"
                  : "transparent",
              }}
            >
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "8px 12px" }}>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600, lineHeight: 1.3 }}>
                  {pachet.nume}
                </h3>
                {inFata && (
                  <span
                    style={{
                      /*
                        Perechea BUTONULUI, nu accentul cu `--t-accent-text`.
                        Pe tonul închis, `--s-accent` devine `accentPeInchis`,
                        dar `--t-accent-text` rămâne culoarea gândită pentru
                        accentul de pe fundal deschis — două culori care nu s-au
                        văzut niciodată împreună. `--s-buton-fundal` și
                        `--s-buton-text` sunt pereche prin construcție, la toate
                        cele patru tonuri.
                      */
                      borderRadius: "999px",
                      background: "var(--s-buton-fundal)",
                      color: "var(--s-buton-text)",
                      padding: "3px 10px",
                      fontSize: "12px",
                      fontWeight: 600,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {pachet.eticheta}
                  </span>
                )}
              </div>

              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "clamp(28px, 3.4vw, 40px)",
                    lineHeight: 1.05,
                    letterSpacing: "-0.02em",
                    fontWeight: "var(--t-greutate-titlu)" as unknown as number,
                    fontFamily: "var(--t-font-titlu)",
                  }}
                >
                  {pachet.pret}
                </p>
                {pachet.subPret && (
                  <p style={{ margin: "4px 0 0", fontSize: "14px", color: "var(--s-text-secundar)" }}>
                    {pachet.subPret}
                  </p>
                )}
              </div>

              {pachet.descriere && (
                <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.6, color: "var(--s-text-secundar)" }}>
                  {pachet.descriere}
                </p>
              )}

              {pachet.include && pachet.include.length > 0 && (
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: "8px" }}>
                  {(pachet.include ?? []).map((rand, j) => (
                    <li
                      key={`${rand}-${j}`}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "auto 1fr",
                        gap: "10px",
                        fontSize: "15px",
                        lineHeight: 1.5,
                      }}
                    >
                      {/*
                        Bifa e desenată, nu un caracter: „✓" arată altfel la fiecare
                        font, iar la Caveat (Apropiere) nici nu există în font și ar
                        fi căzut pe altul. `aria-hidden` fiindcă rândul se citește
                        oricum întreg de un cititor de ecran.
                      */}
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 20 20"
                        width="18"
                        height="18"
                        style={{ marginTop: "3px", flexShrink: 0, color: "var(--s-accent)" }}
                      >
                        <path
                          d="M4 10.5l4 4 8-9"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>{rand}</span>
                    </li>
                  ))}
                </ul>
              )}

              {pachet.buton?.text && (
                <a
                  href={pachet.buton.href || "#contact"}
                  style={{
                    // `marginTop: auto` lipește butonul de talpa cardului, ca
                    // toate butoanele să stea pe aceeași linie chiar dacă
                    // pachetele au liste de lungimi diferite.
                    marginTop: "auto",
                    display: "inline-flex",
                    minHeight: "44px",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "var(--t-raza-buton)",
                    padding: "0 20px",
                    background: inFata ? "var(--s-buton-fundal)" : "transparent",
                    color: inFata ? "var(--s-buton-text)" : "currentColor",
                    border: inFata ? "none" : "1px solid currentColor",
                    fontSize: "15px",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  {pachet.buton.text}
                </a>
              )}
            </div>
          );
        })}
      </div>

      {data.nota && (
        <p
          style={{
            margin: "clamp(20px, 2.4vw, 28px) 0 0",
            maxWidth: "44em",
            fontSize: "14px",
            lineHeight: 1.6,
            color: "var(--s-text-secundar)",
          }}
        >
          {data.nota}
        </p>
      )}
    </Section>
  );
}
