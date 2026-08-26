import type { CSSProperties, ReactNode } from "react";
import { CAMP_CAPCANA } from "@/lib/formulare";

/**
 * Piesele comune ale formularelor publice.
 *
 * Nu folosesc componentele din `src/components/ui/` fiindcă acelea sunt scrise
 * în Tailwind, cu tokenurile panoului. Site-ul public se colorează din
 * variabilele șablonului, iar formularul trebuie să arate bine și pe o bandă
 * crem, și pe una maro-închis.
 *
 * De aceea culorile aici se derivă din `currentColor`: pe fundal deschis textul
 * e închis, deci `currentColor 7%` dă o umbră fină; pe fundal închis textul e
 * crem, deci aceeași formulă dă o lumină fină. O singură regulă, ambele tonuri.
 */

export function stilControl(areEroare: boolean): CSSProperties {
  return {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "var(--t-raza)",
    border: `1px solid ${areEroare ? "var(--s-eroare)" : "color-mix(in oklab, currentColor 24%, transparent)"}`,
    background: "color-mix(in oklab, currentColor 7%, transparent)",
    color: "inherit",
    font: "inherit",
    fontSize: "16px",
    lineHeight: 1.5,
  };
}

export function stilButonTrimite(seLucreaza: boolean): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: "52px",
    paddingInline: "30px",
    border: "none",
    borderRadius: "var(--t-raza-buton)",
    background: "var(--s-buton-fundal)",
    color: "var(--s-buton-text)",
    font: "inherit",
    fontSize: "16px",
    fontWeight: 600,
    cursor: seLucreaza ? "progress" : "pointer",
    opacity: seLucreaza ? 0.7 : 1,
  };
}

/**
 * Un câmp de formular cu etichetă și eroare.
 *
 * `aria-describedby` și `aria-invalid` se pun PE CONTROL, niciodată pe un
 * înveliș: nu se moștenesc, iar un cititor de ecran n-ar anunța niciodată
 * eroarea. (Aceeași greșeală a fost prinsă și reparată în `ui/field.tsx`.)
 */
export function Camp({
  id,
  name,
  eticheta,
  eroare,
  valoare,
  tip = "text",
  randuri,
  maxLength,
  autoComplete,
  placeholder,
  obligatoriu = true,
}: {
  id: string;
  name: string;
  eticheta: string;
  eroare?: string;
  valoare?: string;
  tip?: "text" | "email";
  /** Dacă e dat, câmpul e `<textarea>` cu atâtea rânduri. */
  randuri?: number;
  maxLength?: number;
  autoComplete?: string;
  placeholder?: string;
  obligatoriu?: boolean;
}) {
  const idEroare = `${id}-eroare`;

  const legaturi = {
    id,
    name,
    className: "camp-public",
    defaultValue: valoare,
    required: obligatoriu,
    maxLength,
    autoComplete,
    placeholder,
    "aria-describedby": eroare ? idEroare : undefined,
    "aria-invalid": eroare ? true : undefined,
    style: stilControl(Boolean(eroare)),
  } as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <label htmlFor={id} style={{ fontSize: "14px", fontWeight: 600 }}>
        {eticheta}
        {!obligatoriu && (
          <span style={{ fontWeight: 400, color: "var(--s-text-secundar)" }}> (opțional)</span>
        )}
      </label>

      {randuri ? (
        <textarea {...legaturi} rows={randuri} style={{ ...legaturi.style, resize: "vertical" }} />
      ) : (
        <input {...legaturi} type={tip} />
      )}

      {eroare && (
        <p id={idEroare} style={{ margin: 0, fontSize: "14px", color: "var(--s-eroare)" }}>
          {eroare}
        </p>
      )}
    </div>
  );
}

/**
 * Câmpul-capcană. Ascuns vizual, dar NU cu `display: none` — unele boturi sar
 * peste câmpurile ascunse așa. `tabIndex={-1}` și `autoComplete="off"` îl țin
 * departe de oameni și de completarea automată a browserului, iar
 * `aria-hidden` de cititoarele de ecran.
 */
export function Capcana() {
  return (
    <div
      aria-hidden
      style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", overflow: "hidden" }}
    >
      <label htmlFor={CAMP_CAPCANA}>Nu completa acest câmp</label>
      <input id={CAMP_CAPCANA} name={CAMP_CAPCANA} type="text" tabIndex={-1} autoComplete="off" />
    </div>
  );
}

/**
 * Mesajul de deasupra formularului.
 *
 * `role="alert"` doar pentru erori: e întreruptiv, iar folosit și la succes ar
 * tăia vorba cititorului de ecran la fiecare confirmare. `role="status"` anunță
 * politicos, când termină ce citea.
 */
export function MesajFormular({ status, children }: { status: "succes" | "eroare"; children: ReactNode }) {
  const eSucces = status === "succes";

  return (
    <p
      role={eSucces ? "status" : "alert"}
      style={{
        margin: 0,
        padding: "14px 16px",
        borderRadius: "var(--t-raza)",
        border: `1px solid ${eSucces ? "color-mix(in oklab, currentColor 24%, transparent)" : "var(--s-eroare)"}`,
        background: "color-mix(in oklab, currentColor 7%, transparent)",
        color: eSucces ? "inherit" : "var(--s-eroare)",
        fontSize: "15px",
        lineHeight: 1.6,
      }}
    >
      {children}
    </p>
  );
}
