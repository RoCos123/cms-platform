"use client";

import type { CSSProperties } from "react";
import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cereProgramare } from "@/app/actions/programari";
import { LIMITE, STARE_INITIALA } from "@/lib/formulare";
import { Camp, Capcana, MesajFormular, stilButonTrimite } from "@/components/site/form-parts";
import { Caseta } from "@/components/site/captcha";
import { Calendar } from "@/components/site/calendar";
import type { LunaCalendar } from "@/lib/calendar";
import type { ZiCuOreScrise } from "./programare";

/**
 * Programarea făcută în întregime pe prima pagină.
 *
 * Înainte, secțiunea arăta trei zile cu câteva ore și trimitea la
 * `/programare`. Acum ora se cere de aici: calendar, orele zilei alese, iar
 * după ce s-a ales o oră se deschide dedesubt un formular scurt — numele și
 * telefonul. Pagina întreagă rămâne, pentru cine vrea să scrie mai mult sau
 * intră direct pe ea din meniu.
 *
 * Se deschide în trepte fiindcă asta e și ordinea în care se hotărăște omul:
 * întâi ziua, apoi ora, iar numele abia când e ceva de rezervat. Cerut de la
 * început, ar fi arătat ca un formular de completat, nu ca o oră de ales.
 */
export function ProgramareRapida({
  zile,
  luni,
  saptamana,
  textButon,
  siteKey,
  furnizorCaptcha,
  temaCaptcha,
}: {
  zile: ZiCuOreScrise[];
  luni: LunaCalendar[];
  /** Grila pe zile a modelului prietenos, în loc de calendarul lunar. */
  saptamana?: boolean;
  textButon?: string;
  siteKey: string | null;
  furnizorCaptcha: string | null;
  temaCaptcha: "light" | "dark";
}) {
  const [stare, actiune, seLucreaza] = useActionState(cereProgramare, STARE_INITIALA);
  const [zi, setZi] = useState("");
  const [ora, setOra] = useState("");
  const [confirmat, setConfirmat] = useState(false);
  const refFormular = useRef<HTMLDivElement>(null);

  const ziAleasa = zile.find((z) => z.zi === zi);
  const etichete = Object.fromEntries(zile.map((z) => [z.zi, z.scris]));

  // Grila prietenoasă arată doar zilele apropiate — lista conține oricum numai
  // zile care au vreo oră liberă. Restul rămân pe pagina întreagă de programări.
  const zileAfisate = zile.slice(0, 6);

  // Un slot din grilă alege ziua ȘI ora dintr-o mișcare. Schimbarea intervalului
  // cere din nou confirmarea, altfel formularul ar rămâne deschis pe alt interval.
  const alege = (ziKey: string, o: string) => {
    setZi(ziKey);
    setOra(o);
    setConfirmat(false);
  };

  // După „Confirmă", du privirea la formular: pe grila lată câmpurile apar sub
  // card și altfel pot rămâne sub marginea de jos a ecranului.
  useEffect(() => {
    if (confirmat) refFormular.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [confirmat]);

  // După o cerere reușită nu mai arătăm nici calendarul: orele s-au schimbat,
  // iar cine tocmai a cerut o oră n-are ce face cu încă una.
  if (stare.status === "succes") {
    return <MesajFormular status="succes">{stare.mesaj}</MesajFormular>;
  }

  return (
    <form action={actiune} style={{ display: "flex", flexDirection: "column", gap: "28px" }} noValidate>
      {stare.status === "eroare" && stare.mesaj && (
        <MesajFormular status="eroare">{stare.mesaj}</MesajFormular>
      )}

      <Capcana />

      {saptamana ? (
        <SaptamanaGrila
          zile={zileAfisate}
          maiSunt={zile.length > zileAfisate.length}
          zi={zi}
          ora={ora}
          ziAleasa={ziAleasa}
          confirmat={confirmat}
          onAlege={alege}
          onConfirma={() => setConfirmat(true)}
        />
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "clamp(24px, 4vw, 40px)", alignItems: "flex-start" }}>
          <div style={{ flex: "0 0 auto" }}>
            <Calendar
              luni={luni}
              ziAleasa={zi}
              etichete={etichete}
              onAlege={(aleasa) => {
                setZi(aleasa);
                // Ora nu se ia mai departe în ziua nouă și nici nu se alege una
                // în locul omului: pasul următor e tocmai s-o aleagă el.
                setOra("");
              }}
            />
          </div>

          <div style={{ flex: "1 1 12em", minWidth: 0 }}>
            {ziAleasa ? (
              <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
                <legend style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>
                  Ore libere pe {ziAleasa.scris}
                </legend>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {ziAleasa.ore.map((o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => setOra(o)}
                      aria-pressed={o === ora}
                      aria-label={`${o}, ${ziAleasa.scris}`}
                      style={stilOra(o === ora)}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </fieldset>
            ) : (
              // Nu un spațiu gol care așteaptă: cine se uită la calendar trebuie
              // să afle din ecran ce urmează, nu să ghicească.
              <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.6, color: "var(--s-text-secundar)" }}>
                Alege o zi din calendar ca să vezi orele libere.
              </p>
            )}
          </div>
        </div>
      )}

      {ziAleasa && ora && (saptamana ? confirmat : true) && (
        <div ref={refFormular} style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "30em" }}>
          {/* Ce s-a ales cu butoanele pleacă spre server prin câmpuri ascunse. */}
          <input type="hidden" name="zi" value={ziAleasa.zi} />
          <input type="hidden" name="ora" value={ora} />

          <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.6 }}>
            Ceri <strong>{ziAleasa.scris}</strong>, ora <strong>{ora}</strong>.
          </p>

          <Camp
            id="prog-rapid-nume"
            name="nume"
            eticheta="Numele tău"
            autoComplete="name"
            maxLength={LIMITE.nume}
            eroare={stare.erori?.nume}
            valoare={stare.valori?.nume}
          />

          {/*
            Cerut, nu opțional: aici nu există câmp de email, deci telefonul e
            singura cale prin care psihologul poate răspunde. Fără el, cererea
            ar bloca o oră fără să lase pe nimeni de sunat. Serverul cere același
            lucru (`eroriDeContact`), ca eticheta să nu mintă.
          */}
          <Camp
            id="prog-rapid-telefon"
            name="telefon"
            eticheta="Telefon"
            autoComplete="tel"
            maxLength={40}
            eroare={stare.erori?.telefon}
            valoare={stare.valori?.telefon}
          />

          <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.6, color: "var(--s-text-secundar)" }}>
            Datele scrise aici sunt folosite doar ca să fie stabilită programarea.
          </p>

          {siteKey && (
            <Caseta
              key={stare.incercari}
              siteKey={siteKey}
              furnizor={furnizorCaptcha}
              tema={temaCaptcha}
            />
          )}

          <button type="submit" disabled={seLucreaza} style={stilButonTrimite(seLucreaza)}>
            {seLucreaza ? "Se trimite…" : textButon || "Cere ora aceasta"}
          </button>
        </div>
      )}
    </form>
  );
}

/**
 * Butoanele de oră: aleasă = plină, restul = doar contur. Aceleași culori ca pe
 * pagina întreagă — perechea butonului (`--s-buton-fundal` / `--s-buton-text`),
 * chenarul din `currentColor`. `Section` pune doar cinci variabile `--s-`, iar
 * una inventată cade tăcut în „fără culoare”; s-a întâmplat de trei ori.
 */
function stilOra(aleasa: boolean) {
  return {
    minHeight: "44px",
    padding: "0 16px",
    borderRadius: "var(--t-raza-buton)",
    border: aleasa
      ? "1px solid var(--s-buton-fundal)"
      : "1px solid color-mix(in oklab, currentColor 24%, transparent)",
    background: aleasa ? "var(--s-buton-fundal)" : "transparent",
    color: aleasa ? "var(--s-buton-text)" : "inherit",
    font: "inherit",
    fontSize: "15px",
    fontWeight: aleasa ? 600 : 400,
    fontVariantNumeric: "tabular-nums",
    cursor: "pointer",
  } as const;
}

/**
 * Grila pe zile a modelului prietenos: un card cu săptămâna pe coloane (o zi cu
 * capul ei și orele ei ca butoane) și, alături, un card de rezumat cu ce s-a
 * ales. Un slot alege ziua și ora deodată; „Confirmă” deschide apoi formularul.
 *
 * Culorile cardului vin din nivelul ȘABLONULUI (`--t-…`), nu al secțiunii
 * (`--s-…`): cardul rămâne deschis oricare ar fi tonul secțiunii, ca bulina din
 * hero. Cu `--s-text`, pe un ton închis ar fi ieșit text deschis pe card
 * deschis — nevăzut. Verdele-accent și textul închis rămân la fel peste tot.
 */
function SaptamanaGrila({
  zile,
  maiSunt,
  zi,
  ora,
  ziAleasa,
  confirmat,
  onAlege,
  onConfirma,
}: {
  zile: ZiCuOreScrise[];
  maiSunt: boolean;
  zi: string;
  ora: string;
  ziAleasa?: ZiCuOreScrise;
  confirmat: boolean;
  onAlege: (ziKey: string, o: string) => void;
  onConfirma: () => void;
}) {
  // Titlul secțiunii o ține vizibilă chiar fără ore; aici, fără nicio zi, spunem
  // limpede că nu-i nimic liber, în loc de un card gol.
  if (zile.length === 0) {
    return (
      <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.6, color: "var(--s-text-secundar)" }}>
        Momentan nu sunt ore libere. Scrie-mi și găsim împreună un moment.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={stilCard}>
        <div style={stilGrila}>
          {zile.map((z) => (
            <div key={z.zi} style={stilColoana}>
              <div style={stilCapZi}>
                <div style={stilNumeZi}>{z.nume}</div>
                <div style={stilDataZi}>{z.dataScurta}</div>
              </div>
              {z.ore.map((o) => {
                const ales = z.zi === zi && o === ora;
                return (
                  <button
                    key={o}
                    type="button"
                    onClick={() => onAlege(z.zi, o)}
                    aria-pressed={ales}
                    aria-label={`${o}, ${z.scris}`}
                    style={stilSlot(ales)}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <aside style={stilSumar}>
          <h4 style={stilSumarTitlu}>Rezumat</h4>
          {ziAleasa && ora ? (
            <>
              <div style={stilRand}>
                <span style={stilCheie}>Ziua</span>
                <span style={stilValoare}>
                  {ziAleasa.nume}, {ziAleasa.dataScurta}
                </span>
              </div>
              <div style={{ ...stilRand, borderBottom: "none" }}>
                <span style={stilCheie}>Ora</span>
                <span style={stilValoare}>{ora}</span>
              </div>
              {!confirmat && (
                <button type="button" onClick={onConfirma} style={stilConfirm}>
                  Confirmă programarea →
                </button>
              )}
            </>
          ) : (
            <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.6, color: "var(--t-text-secundar)" }}>
              Alege o oră din stânga și o vezi aici, gata de trimis.
            </p>
          )}
        </aside>
      </div>

      {maiSunt && (
        // Grila arată doar zilele apropiate; pagina întreagă le are pe toate.
        <Link
          href="/programare"
          style={{
            alignSelf: "center",
            fontSize: "14px",
            fontWeight: 600,
            color: "inherit",
            textDecoration: "underline",
            textUnderlineOffset: "3px",
          }}
        >
          Vezi toate zilele libere →
        </Link>
      )}
    </div>
  );
}

const stilCard: CSSProperties = {
  background: "var(--t-fundal-nuantat)",
  border: "1px solid var(--t-chenar)",
  borderRadius: "var(--t-raza)",
  padding: "clamp(18px, 3vw, 30px)",
  display: "flex",
  flexWrap: "wrap",
  gap: "clamp(20px, 3vw, 30px)",
};

const stilGrila: CSSProperties = {
  // Grila e mai lată decât rezumatul, ca la sursă. Coloanele se strâng singure
  // pe telefon (auto-fill), fără media query — pe care un `style` nu-l exprimă.
  flex: "1.7 1 300px",
  minWidth: 0,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
  gap: "10px",
  alignContent: "start",
};

const stilColoana: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const stilCapZi: CSSProperties = {
  textAlign: "center",
  padding: "9px 6px",
  background: "var(--t-fundal)",
  borderRadius: "14px",
  marginBottom: "2px",
};

const stilNumeZi: CSSProperties = {
  fontSize: "13px",
  fontWeight: 700,
  color: "var(--t-text)",
};

const stilDataZi: CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  color: "var(--t-text-secundar)",
  marginTop: "2px",
};

function stilSlot(ales: boolean): CSSProperties {
  return {
    minHeight: "40px",
    padding: "9px 6px",
    borderRadius: "12px",
    // Slotul are aceeași culoare ca fundalul cardului — se ține doar în chenar,
    // ca la sursă. Ales = plin pe culoarea textului (maro-închis), cu scris crem.
    border: ales ? "2px solid var(--t-text)" : "2px solid var(--t-chenar)",
    background: ales ? "var(--t-text)" : "var(--t-fundal-nuantat)",
    color: ales ? "var(--t-fundal-nuantat)" : "var(--t-text)",
    font: "inherit",
    fontSize: "13px",
    fontWeight: 600,
    fontVariantNumeric: "tabular-nums",
    cursor: "pointer",
    textAlign: "center",
  };
}

const stilSumar: CSSProperties = {
  flex: "1 1 220px",
  minWidth: 0,
  alignSelf: "start",
  background: "var(--t-fundal)",
  padding: "20px",
  borderRadius: "20px",
};

const stilSumarTitlu: CSSProperties = {
  margin: "0 0 12px",
  fontSize: "16px",
  fontWeight: 700,
  color: "var(--t-text)",
};

const stilRand: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "10px 0",
  borderBottom: "1px dashed var(--t-chenar)",
  fontSize: "13px",
};

const stilCheie: CSSProperties = {
  color: "var(--t-text-secundar)",
  fontWeight: 600,
};

const stilValoare: CSSProperties = {
  color: "var(--t-text)",
  fontWeight: 700,
  textAlign: "right",
};

const stilConfirm: CSSProperties = {
  width: "100%",
  marginTop: "16px",
  minHeight: "46px",
  padding: "12px 18px",
  borderRadius: "var(--t-raza-buton)",
  border: "none",
  background: "var(--t-text)",
  color: "var(--t-fundal-nuantat)",
  font: "inherit",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
  // „Prag" verde sub buton + umbră caldă, semnătura modelului prietenos: butonul
  // stă pe un cant verde de 6px. Umbra e maro-închis (culoarea textului), scrisă
  // direct fiindcă o variabilă nu intră într-un rgba().
  boxShadow: "0 6px 0 -2px var(--t-accent), 0 12px 24px -6px rgba(61, 53, 39, 0.25)",
};
