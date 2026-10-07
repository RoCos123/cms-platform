import type { SectionTone } from "@/lib/templates";
import { Section } from "@/components/site/section";
import { SectionHeading } from "@/components/site/section-heading";
import { TabelComparativ } from "./tabel-comparativ";

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
export function Pricing({
  data,
  tone,
  friendly,
  variant,
}: {
  data: PricingData;
  tone?: SectionTone;
  /**
   * Cardurile pe fundal alb, cu culorile șablonului („ca la servicii"): cardul
   * evidențiat cu chenar și buton verde, restul albe. Doar „Apropiere". Culorile
   * vin din nivelul șablonului (`--t-…`), deci rămân deschise pe orice ton.
   */
  friendly?: boolean;
  /**
   * `"comparatie"` = tabelul comparativ în dreapta pachetelor. Doar sitepsihologi.ro, pus
   * din SQL; vezi `tabel-comparativ.tsx`. Lipsa sau orice altceva = fără tabel.
   */
  variant?: string | null;
}) {
  const pachete = data.pachete ?? [];
  if (pachete.length === 0) return null;

  return (
    <Section tone={tone} id="pachete">
      <SectionHeading
        eyebrow={data.eyebrow}
        titlu={data.titlu}
        titluAccent={data.titluAccent}
        intro={data.intro}
        // Cu tabelul alături, titlul se întinde pe toată lățimea, și peste tabel
        // (cerut pentru sitepsihologi). Altfel rămâne lățimea obișnuită.
        maxWidthTitlu={variant === "comparatie" ? "none" : undefined}
      />

      <LangaTabel activ={variant === "comparatie"}>
        <div
          style={{
            marginTop: variant === "comparatie" ? 0 : "clamp(32px, 4vw, 48px)",
            // Lângă tabel, cât toată coloana: căsuța și tabelul ies la fel de înalte.
            height: variant === "comparatie" ? "100%" : undefined,
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

            // La „Apropiere" (`friendly`) cardul e alb, cu culorile șablonului
            // (`--t-…`), deci lizibil pe orice ton; la rest rămâne așezat pe fundalul
            // secțiunii (`--s-…`), ca înainte. Cel evidențiat: chenar și buton verde.
            const cardFundal = friendly
              ? "var(--t-suprafata, var(--t-fundal-nuantat))"
              : inFata
                ? "color-mix(in oklab, var(--s-accent) 7%, transparent)"
                : "transparent";
            const cardChenar = friendly
              ? inFata
                ? "2px solid var(--t-accent)"
                : "1px solid var(--t-chenar)"
              : inFata
                ? "2px solid var(--s-accent)"
                : "1px solid color-mix(in oklab, currentColor 18%, transparent)";
            const textSecundar = friendly ? "var(--t-text-secundar)" : "var(--s-text-secundar)";
            const bifa = friendly ? "var(--t-accent)" : "var(--s-accent)";
            const butonFundal = friendly ? "var(--t-accent)" : "var(--s-buton-fundal)";
            const butonText = friendly ? "var(--t-accent-text)" : "var(--s-buton-text)";

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
                  border: cardChenar,
                  background: cardFundal,
                  color: friendly ? "var(--t-text)" : undefined,
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
                        background: butonFundal,
                        color: butonText,
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
                    <p style={{ margin: "4px 0 0", fontSize: "14px", color: textSecundar }}>
                      {pachet.subPret}
                    </p>
                  )}
                </div>

                {pachet.descriere && (
                  <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.6, color: textSecundar }}>
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
                          style={{ marginTop: "3px", flexShrink: 0, color: bifa }}
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
                      background: inFata ? butonFundal : "transparent",
                      color: inFata ? butonText : "currentColor",
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
      </LangaTabel>

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

/**
 * Pachetele cu tabelul comparativ ÎN DREAPTA lor — doar când rândul are
 * `variant = 'comparatie'` (sitepsihologi.ro; vezi `tabel-comparativ.tsx`). Fără
 * variantă nu adaugă nimic în pagină: grila de pachete iese exact ca înainte.
 *
 * Flex cu `wrap`, nu o grilă pe două coloane egale: tabelul are nevoie de cel
 * puțin 600px, iar sub atât s-ar derula pe orizontală chiar pe laptop. Cu baza de
 * 600px, cele două stau alături doar cât încap întregi; altfel tabelul coboară sub
 * pachete, ca pe telefon. `minWidth: 0` lasă coloana tabelului să se strângă pe
 * telefon, unde derularea rămâne înăuntrul tabelului, nu a paginii.
 *
 * `stretch`: alături, cele două coloane au aceeași înălțime, iar căsuța și
 * tabelul o umplu (`height: 100%`), deci se termină pe aceeași linie — cerut de
 * proprietar, „tabelul de mărimea căsuței".
 */
function LangaTabel({ activ, children }: { activ: boolean; children: React.ReactNode }) {
  if (!activ) return <>{children}</>;

  return (
    <div
      style={{
        marginTop: "clamp(32px, 4vw, 48px)",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "stretch",
        gap: "clamp(16px, 2vw, 24px)",
      }}
    >
      <div style={{ flex: "1 1 340px", minWidth: 0 }}>{children}</div>
      <div style={{ flex: "1.6 1 600px", minWidth: 0 }}>
        <TabelComparativ />
      </div>
    </div>
  );
}
