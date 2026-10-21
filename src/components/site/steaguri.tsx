import { useId } from "react";

/**
 * Steagurile din alegerea limbii, desenate, NU emoji: Windows nu are steaguri emoji și
 * le arată ca două litere („RO", „GB"), deci în Edge, pe calculatorul proprietarului, ar fi
 * ieșit stricate. Desenate, arată la fel peste tot.
 *
 * Steagul e al unei țări, nu al unei limbi; de aceea, în listă, lângă el stă și numele
 * limbii scris în limba ei („English", „Deutsch"). Pentru engleză, steagul britanic —
 * ales de proprietar, 21 oct. 2026.
 *
 * `forma`: `rotund` umple bulina (taie marginile, păstrează mijlocul — unde e crucea
 * steagului britanic); `drept` e steagul întreg, mic, din listă.
 */
export type CodSteag = "ro" | "en" | "de";

export function Steag({ cod, forma }: { cod: CodSteag; forma: "rotund" | "drept" }) {
  // Fără caracterele speciale din `useId` („«r1»", „:r1:"), care în `url(#…)` nu se potrivesc peste tot.
  const id = `steag${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const marime =
    forma === "rotund"
      ? { width: 24, height: 24, preserveAspectRatio: "xMidYMid slice" }
      : { width: 21, height: 14, preserveAspectRatio: "none" };

  if (cod === "ro") {
    return (
      <svg viewBox="0 0 3 2" {...marime} aria-hidden focusable="false" className="steag">
        <rect width="1" height="2" fill="#002B7F" />
        <rect x="1" width="1" height="2" fill="#FCD116" />
        <rect x="2" width="1" height="2" fill="#CE1126" />
      </svg>
    );
  }

  if (cod === "de") {
    return (
      <svg viewBox="0 0 5 3" {...marime} aria-hidden focusable="false" className="steag">
        <rect width="5" height="1" fill="#000000" />
        <rect y="1" width="5" height="1" fill="#DD0000" />
        <rect y="2" width="5" height="1" fill="#FFCE00" />
      </svg>
    );
  }

  // Steagul britanic, după desenul de referință (60 × 30): diagonalele roșii sunt
  // decalate, de aceea a doua tăietură (`diagonale`).
  const contur = `${id}-contur`;
  const diagonale = `${id}-diagonale`;
  return (
    <svg viewBox="0 0 60 30" {...marime} aria-hidden focusable="false" className="steag">
      <clipPath id={contur}>
        <path d="M0,0 v30 h60 v-30 z" />
      </clipPath>
      <clipPath id={diagonale}>
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <g clipPath={`url(#${contur})`}>
        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" clipPath={`url(#${diagonale})`} stroke="#C8102E" strokeWidth="4" />
        <path d="M30,0 v30 M0,15 h60" stroke="#FFFFFF" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}
