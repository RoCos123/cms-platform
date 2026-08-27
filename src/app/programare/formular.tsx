"use client";

import { useActionState, useState } from "react";
import { cereProgramare } from "@/app/actions/programari";
import { LIMITE, STARE_INITIALA } from "@/lib/formulare";
import { Camp, Capcana, MesajFormular, stilButonTrimite } from "@/components/site/form-parts";
import { Turnstile } from "@/components/site/turnstile";
import { Calendar } from "./calendar";
import type { LunaCalendar } from "@/lib/calendar";
import type { ZiCuOre } from "@/lib/programari";

export type ZiDeAles = ZiCuOre & { scris: string };

/**
 * Alegerea orei și datele omului, într-un singur pas.
 *
 * Ora se alege întâi, fiindcă e singurul lucru care poate lipsi: dacă nu-i
 * convine niciun interval, n-are rost să-i cerem numele.
 */
export function FormularProgramare({
  zile,
  luni,
  servicii,
  siteKey,
  temaCaptcha,
  linkConfidentialitate,
  alegereInitiala,
}: {
  zile: ZiDeAles[];
  /** Zilele libere aranjate pe luni, socotite pe server (`src/lib/calendar.ts`). */
  luni: LunaCalendar[];
  servicii: string[];
  siteKey: string | null;
  temaCaptcha: "light" | "dark";
  linkConfidentialitate?: string;
  /**
   * Ce a ales omul înainte să ajungă aici — apăsând o oră în secțiunea de pe
   * prima pagină. Fără asta, linkul „19:00” ar deschide pagina cu altă oră
   * selectată, iar omul ar trebui să aleagă a doua oară ce alesese deja.
   *
   * Se ignoră dacă între timp ora s-a ocupat: pagina se deschide atunci pe
   * prima liberă, nu pe una care n-ar mai putea fi cerută.
   */
  alegereInitiala?: { zi: string; ora: string };
}) {
  const [stare, actiune, seLucreaza] = useActionState(cereProgramare, STARE_INITIALA);

  const ziValida = zile.find((z) => z.zi === alegereInitiala?.zi);
  const oraValida = ziValida?.ore.includes(alegereInitiala?.ora ?? "") ? alegereInitiala?.ora : undefined;

  const [zi, setZi] = useState(ziValida?.zi ?? zile[0]?.zi ?? "");
  const [ora, setOra] = useState(oraValida ?? ziValida?.ore[0] ?? zile[0]?.ore[0] ?? "");

  const zileleAlese = zile.find((z) => z.zi === zi) ?? zile[0];

  // Căsuța din calendar scrie doar numărul zilei. Data întreagă merge în
  // `aria-label`, altfel un cititor de ecran ar spune „14”, fără nicio lună.
  const etichete = Object.fromEntries(zile.map((z) => [z.zi, z.scris]));

  // După o cerere reușită, orele s-au schimbat: nu mai arătăm formularul, ca
  // omul să nu ceară din greșeală a doua oară aceeași oră.
  if (stare.status === "succes") {
    return <MesajFormular status="succes">{stare.mesaj}</MesajFormular>;
  }

  return (
    <form action={actiune} style={{ display: "flex", flexDirection: "column", gap: "22px" }} noValidate>
      {stare.status === "eroare" && stare.mesaj && (
        <MesajFormular status="eroare">{stare.mesaj}</MesajFormular>
      )}

      <Capcana />

      <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
        <legend style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>
          Alege ziua
        </legend>
        <Calendar
          luni={luni}
          ziAleasa={zileleAlese?.zi ?? ""}
          etichete={etichete}
          onAlege={(aleasa) => {
            setZi(aleasa);
            // Ora dinainte n-are ce căuta în altă zi: la 14 se putea la 19:00,
            // la 15 poate nu. Se sare pe prima liberă din ziua nouă.
            setOra(zile.find((z) => z.zi === aleasa)?.ore[0] ?? "");
          }}
        />
      </fieldset>

      <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
        <legend style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>
          Alege ora {zileleAlese ? `— ${zileleAlese.scris}` : ""}
        </legend>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {(zileleAlese?.ore ?? []).map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => setOra(o)}
              aria-pressed={o === ora}
              aria-label={zileleAlese ? `${o}, ${zileleAlese.scris}` : o}
              style={stilOptiune(o === ora)}
            >
              {o}
            </button>
          ))}
        </div>
        {stare.erori?.ora && (
          <p style={{ margin: "8px 0 0", fontSize: "14px", color: "var(--s-eroare)" }}>
            {stare.erori.ora}
          </p>
        )}
      </fieldset>

      {/* Ce s-a ales cu butoanele pleacă spre server prin câmpuri ascunse. */}
      <input type="hidden" name="zi" value={zileleAlese?.zi ?? ""} />
      <input type="hidden" name="ora" value={ora} />

      <Camp
        id="prog-nume"
        name="nume"
        eticheta="Numele tău"
        autoComplete="name"
        maxLength={LIMITE.nume}
        eroare={stare.erori?.nume}
        valoare={stare.valori?.nume}
      />

      <Camp
        id="prog-email"
        name="email"
        tip="email"
        eticheta="Adresa de email"
        autoComplete="email"
        maxLength={LIMITE.email}
        eroare={stare.erori?.email}
        valoare={stare.valori?.email}
      />

      <Camp
        id="prog-telefon"
        name="telefon"
        eticheta="Telefon"
        autoComplete="tel"
        maxLength={40}
        obligatoriu={false}
        eroare={stare.erori?.telefon}
        valoare={stare.valori?.telefon}
      />

      {servicii.length > 0 && (
        <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px", fontWeight: 600 }}>
          Pentru ce
          <select
            name="serviciu"
            defaultValue={stare.valori?.serviciu ?? ""}
            style={{
              height: "44px",
              borderRadius: "10px",
              border: "1px solid color-mix(in oklab, currentColor 24%, transparent)",
              // Același fundal ca la celelalte câmpuri (`stilControl` din
              // form-parts.tsx): `--s-fundal` nu există, iar lista ieșea albă
              // pe un șablon închis. Prins de `e2e/culori-sectiuni.proba.mjs`.
              background: "color-mix(in oklab, currentColor 7%, transparent)",
              color: "inherit",
              padding: "0 12px",
              fontSize: "16px",
              fontWeight: 400,
            }}
          >
            <option value="">Nu m-am hotărât</option>
            {servicii.map((serviciu) => (
              <option key={serviciu} value={serviciu}>
                {serviciu}
              </option>
            ))}
          </select>
        </label>
      )}

      <Camp
        id="prog-note"
        name="note"
        eticheta="Vrei să adaugi ceva?"
        randuri={3}
        maxLength={1000}
        obligatoriu={false}
        eroare={stare.erori?.note}
        valoare={stare.valori?.note}
      />

      <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.6, color: "var(--s-text-secundar)" }}>
        Datele scrise aici sunt folosite doar ca să fie stabilită programarea.{" "}
        {linkConfidentialitate ? (
          <a
            href={linkConfidentialitate}
            style={{
              color: "var(--s-accent)",
              textDecoration: "underline",
              textDecorationThickness: "1px",
              textUnderlineOffset: "2px",
            }}
          >
            Politica de confidențialitate
          </a>
        ) : (
          "Politica de confidențialitate"
        )}
        .
      </p>

      {siteKey && <Turnstile key={stare.incercari} siteKey={siteKey} tema={temaCaptcha} />}

      <button type="submit" disabled={seLucreaza} style={stilButonTrimite(seLucreaza)}>
        {seLucreaza ? "Se trimite…" : "Cere ora aceasta"}
      </button>
    </form>
  );
}

/**
 * Butoanele de zi și de oră: aleasă = plină, restul = doar contur.
 *
 * Perechea de culori e chiar cea a butonului de trimitere
 * (`--s-buton-fundal` / `--s-buton-text`), nu accentul cu o culoare de text
 * ghicită. Prima variantă folosea o variabilă care nu există în niciun șablon,
 * iar textul rămânea închis pe fundal închis — se vedea în probă, dar numai
 * dacă te uitai la imagine.
 *
 * Chenarul se face din `currentColor`, ca la câmpurile din `form-parts.tsx`:
 * merge pe orice fundal, fără să depindă de o variabilă anume.
 */
function stilOptiune(aleasa: boolean) {
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
    cursor: "pointer",
  } as const;
}
