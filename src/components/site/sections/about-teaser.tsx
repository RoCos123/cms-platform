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
  /**
   * Repere scurte, sub text: un cuvânt mare (serif, accent) și o descriere mică.
   * Ex.: „+5 / ani de experiență", „Atestat / liberă practică". Lipsă → nu apare.
   */
  etichete?: { mare: string; mic?: string }[];
  /**
   * Domeniile în care lucrezi, ca niște etichete de text („Traumă",
   * „Anxietate"). Apar doar pe „Apropiere", sub text. Fără iconițe.
   */
  teme?: string[];
  buton?: { text: string; href: string };
  /** Aceeași formă ca la încărcare (`ImageValue`). De obicei portretul. */
  imagine?: { url: string; altText?: string; pozitie?: PunctFocal };
};

export function AboutTeaser({
  data,
  tone,
  pozaRotunda,
  pozaStivuita,
  friendly,
  reperCard,
}: {
  data: AboutTeaserData;
  tone?: SectionTone;
  /** Poza în cerc, nu ramă verticală. Hotărât de șablon (doar „Claritate"). */
  pozaRotunda?: boolean;
  /** Poza peste un card colorat decalat („stivuită"). Doar „Apropiere". */
  pozaStivuita?: boolean;
  /**
   * Primul reper scos într-un card ÎNCHIS suprapus în colțul de jos-dreapta al
   * portretului („12+ / ani de experiență"), ca la referința „Liniște". Restul
   * reperelor, dacă există, rămân în rândul de sub text. Doar „Liniște".
   */
  reperCard?: boolean;
  /**
   * Tratamentul prietenos: domeniile ca etichete-pastilă și reperele în
   * cartonașe. Doar „Apropiere". Culorile lor vin din nivelul ȘABLONULUI
   * (`--t-…`), ca să rămână deschise oricare ar fi tonul secțiunii.
   */
  friendly?: boolean;
}) {
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

  // La „Liniște" (`reperCard`), primul reper devine un card închis suprapus pe
  // colțul portretului; restul, dacă mai sunt, rămân în rândul de sub text. Fără
  // poză n-are peste ce sta, deci cade în rândul obișnuit.
  const eticheteValide = (data.etichete ?? []).filter((e) => e?.mare?.trim());
  const reperPeImagine = reperCard && poza ? eticheteValide[0] : undefined;
  const eticheteRand = reperPeImagine ? eticheteValide.slice(1) : eticheteValide;

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
            <span
              style={{
                fontFamily: "var(--t-font-secundar)",
                fontStyle: "var(--t-stil-accent)",
                // Același accent ca la celelalte titluri de secțiune: piersică
                // apăsat pe „Apropiere", subțire în culoarea titlului la rest.
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
          display: "grid",
          gap: "clamp(32px, 5vw, 72px)",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          // Textul stă centrat pe verticală față de poză: cu puțin text, e fix la
          // mijlocul pozei; pe măsură ce se scrie mai mult, se întinde în sus și în
          // jos deopotrivă, până marginea lui de sus ajunge la marginea de sus a
          // pozei (cerut de proprietar). Pe telefon e o coloană, deci alinierea
          // n-are efect — se stivuiește la fel.
          alignItems: "center",
          marginTop: "clamp(32px, 4vw, 48px)",
        }}
      >
        {/*
          Rama e verticală fiindcă locul cere de obicei un portret — o poză lată
          se taie pe margini (`object-fit: cover`), nu se turtește. Pe „Claritate"
          (`pozaRotunda`) e un cerc: un pătrat tăiat la 50%. Atunci punctul focal
          al pozei contează de două ori, ca fața să rămână în cerc — se reglează
          din panou, trăgând de poză. Fără poză, coloana lipsește cu totul și
          textul umple singur lățimea.
        */}
        {poza && (
          <div
            style={{
              position: pozaStivuita || reperPeImagine ? "relative" : undefined,
              maxWidth: pozaRotunda ? "340px" : "380px",
            }}
          >
            {/*
              Cardul verde decalat din spate: „poza lipită peste un carton",
              semnătura lui Apropiere. Culoarea e verdele deschis al accentului
              (`--t-accent-pe-inchis`), singura nuanță de salvie din paletă care
              stă bine pe crem; se randează doar pe apropiere.
            */}
            {pozaStivuita && (
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  transform: "translate(-16px, 18px) rotate(-2.5deg)",
                  borderRadius: "var(--t-raza)",
                  background: "var(--t-accent-pe-inchis)",
                }}
              />
            )}
            <div
              style={{
                position: pozaStivuita ? "relative" : undefined,
                borderRadius: pozaRotunda ? "50%" : pozaStivuita ? "var(--t-raza)" : undefined,
                overflow: pozaRotunda || pozaStivuita ? "hidden" : undefined,
              }}
            >
              <SectionImage
                src={poza.url}
                alt={poza.altText ?? ""}
                aspectRatio={pozaRotunda ? "1 / 1" : "4 / 5"}
                sizes={
                  pozaRotunda
                    ? "(max-width: 720px) 100vw, 340px"
                    : "(max-width: 720px) 100vw, 380px"
                }
                pozitie={poza.pozitie}
              />
            </div>

            {/*
              Cardul închis suprapus pe colțul de jos-dreapta al portretului, ca
              la referința „Liniște". Culorile vin din nivelul ȘABLONULUI
              (`--t-fundal-inchis`/`--t-text-pe-inchis`), nu din tonul secțiunii:
              cardul e mereu închis, oricare ar fi banda pe care stă. Cifra mare e
              în serif-ul de accent, verde-deschis (`--t-accent-pe-inchis`), ca la
              sursă. Fără iconițe.
            */}
            {reperPeImagine && (
              <div
                style={{
                  position: "absolute",
                  right: "-18px",
                  bottom: "-24px",
                  maxWidth: "260px",
                  padding: "22px 26px",
                  borderRadius: "18px",
                  background: "var(--t-fundal-inchis)",
                  color: "var(--t-text-pe-inchis)",
                  boxShadow: "0 24px 50px -24px rgba(0, 0, 0, 0.5)",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--t-font-secundar)",
                    fontStyle: "var(--t-stil-accent)",
                    fontSize: "clamp(40px, 5vw, 56px)",
                    lineHeight: 1,
                    color: "var(--t-accent-pe-inchis)",
                  }}
                >
                  {reperPeImagine.mare}
                </div>
                {reperPeImagine.mic?.trim() && (
                  <p
                    style={{
                      margin: "8px 0 0",
                      fontSize: "14px",
                      lineHeight: 1.5,
                      color: "var(--t-text-secundar-pe-inchis)",
                      textWrap: "pretty",
                    }}
                  >
                    {reperPeImagine.mic}
                  </p>
                )}
              </div>
            )}
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

          {/*
            Domeniile ca etichete-pastilă, sub text — semnătura prietenoasă, doar
            pe „Apropiere". Fără iconițe (cerut). Pastila e mereu deschisă
            (`--t-…`), ca bulina din hero, ca să rămână lizibilă pe orice ton.
          */}
          {friendly && data.teme?.some((t) => t?.trim()) && (
            <ul
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
                listStyle: "none",
                margin: "32px 0 0",
                padding: 0,
              }}
            >
              {data.teme
                .filter((t) => t?.trim())
                .map((tema, i) => (
                  <li
                    key={i}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "999px",
                      background: "var(--t-suprafata, var(--t-fundal-nuantat))",
                      border: "1px solid var(--t-chenar)",
                      color: "var(--t-text)",
                      fontSize: "14px",
                      fontWeight: 600,
                    }}
                  >
                    {tema}
                  </li>
                ))}
            </ul>
          )}

          {/*
            Reperele scurte, sub text: „+5 / ani de experiență" etc. Un rând care
            se rupe singur pe telefon (`auto-fit`). Cifra/cuvântul mare stă în
            serif-ul accentului, ca titlurile — dar DREPT, nu înclinat: e un reper
            de citit dintr-o privire, nu o frază.

            Pe „Apropiere" (`friendly`) fiecare reper stă într-un cartonaș deschis,
            ca la sursă; culorile vin din șablon (`--t-…`), tone-independente. La
            restul rămâne un rând sub o linie, cu culorile tonului (`--s-…`):
            chenarul de sus din `currentColor`, fiindcă `--s-chenar` nu e printre
            variabilele puse de `Section` și pe ton închis ar fi invizibil.
          */}
          {eticheteRand.length > 0 && (
            <dl
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                gap: friendly ? "14px" : "24px",
                margin: friendly ? "20px 0 0" : "40px 0 0",
                ...(friendly
                  ? {}
                  : {
                      paddingTop: "28px",
                      borderTop: "1px solid color-mix(in oklab, currentColor 15%, transparent)",
                    }),
              }}
            >
              {eticheteRand
                .map((eticheta, i) => (
                  <div
                    key={i}
                    style={
                      friendly
                        ? {
                            padding: "18px 20px",
                            borderRadius: "16px",
                            background: "var(--t-suprafata, var(--t-fundal-nuantat))",
                            border: "1px solid var(--t-chenar)",
                          }
                        : undefined
                    }
                  >
                    <dt
                      style={{
                        fontFamily: "var(--t-font-secundar)",
                        fontSize: "clamp(28px, 3vw, 38px)",
                        lineHeight: 1,
                        color: friendly ? "var(--t-accent)" : "var(--s-accent)",
                      }}
                    >
                      {eticheta.mare}
                    </dt>
                    {eticheta.mic?.trim() && (
                      <dd
                        style={{
                          margin: "8px 0 0",
                          fontSize: "14px",
                          lineHeight: 1.5,
                          color: friendly ? "var(--t-text-secundar)" : "var(--s-text-secundar)",
                          textWrap: "pretty",
                        }}
                      >
                        {eticheta.mic}
                      </dd>
                    )}
                  </div>
                ))}
            </dl>
          )}
        </div>
      </div>
    </Section>
  );
}
