"use client";

import { useActionState, useState } from "react";
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
  textButon,
  siteKey,
  furnizorCaptcha,
  temaCaptcha,
}: {
  zile: ZiCuOreScrise[];
  luni: LunaCalendar[];
  textButon?: string;
  siteKey: string | null;
  furnizorCaptcha: string | null;
  temaCaptcha: "light" | "dark";
}) {
  const [stare, actiune, seLucreaza] = useActionState(cereProgramare, STARE_INITIALA);
  const [zi, setZi] = useState("");
  const [ora, setOra] = useState("");

  const ziAleasa = zile.find((z) => z.zi === zi);
  const etichete = Object.fromEntries(zile.map((z) => [z.zi, z.scris]));

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

      {ziAleasa && ora && (
        <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "30em" }}>
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
