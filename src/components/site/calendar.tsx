"use client";

import { useState } from "react";
import { CAPETE_SAPTAMANA, lunaZilei, type LunaCalendar } from "@/lib/calendar";

/**
 * Calendarul din care se alege ziua.
 *
 * Înainte era un șir de butoane cu data scrisă în fiecare — la treizeci de
 * zile, un zid de text. Nu se vedea nici în ce zi a săptămânii cade fiecare,
 * nici de ce lipsesc unele. Aici se văd amândouă: zilele fără ore rămân
 * scrise, doar stinse, iar coloanele spun singure că e vorba de duminici.
 *
 * Lunile vin gata socotite de pe server, cu numele deja scris în fusul și
 * limba cabinetului. Componenta nu face niciun calcul de dată — dacă l-ar
 * face, l-ar face pe ceasul telefonului care deschide pagina.
 */
export function Calendar({
  luni,
  ziAleasa,
  etichete,
  onAlege,
}: {
  luni: LunaCalendar[];
  ziAleasa: string;
  /** Ziua scrisă întreagă, pentru cititoarele de ecran: „14 septembrie 2026”. */
  etichete: Record<string, string>;
  onAlege: (zi: string) => void;
}) {
  // Se deschide pe luna zilei alese, nu pe prima din listă: cine vine de pe
  // prima pagină apăsând o oră din septembrie n-are ce căuta în august.
  const [deschisa, setDeschisa] = useState(() => lunaZilei(luni, ziAleasa));

  const luna = luni[deschisa];
  if (!luna) return null;

  return (
    <div style={{ maxWidth: "21em" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        {/* Numele lunii se schimbă la apăsarea săgeților; fără `aria-live`,
            cine nu vede ecranul ar apăsa în gol. */}
        <span aria-live="polite" style={{ fontSize: "16px", fontWeight: 600 }}>
          {luna.nume}
        </span>

        <div style={{ display: "flex", gap: "4px" }}>
          <Sageata
            eticheta="Luna anterioară"
            semn="‹"
            activa={deschisa > 0}
            onClick={() => setDeschisa((n) => n - 1)}
          />
          <Sageata
            eticheta="Luna următoare"
            semn="›"
            activa={deschisa < luni.length - 1}
            onClick={() => setDeschisa((n) => n + 1)}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
        {/* Capetele de coloană sunt scrise pentru ochi. Fiecare zi își poartă
            data întreagă în `aria-label`, deci pentru un cititor de ecran
            rândul ăsta n-ar fi decât șapte silabe fără rost. */}
        {CAPETE_SAPTAMANA.map((cap) => (
          <span
            key={cap}
            aria-hidden="true"
            style={{
              textAlign: "center",
              fontSize: "12px",
              fontWeight: 600,
              padding: "4px 0",
              color: "var(--s-text-secundar)",
            }}
          >
            {cap}
          </span>
        ))}

        {Array.from({ length: luna.gol }, (_, i) => (
          <span key={`gol-${i}`} />
        ))}

        {luna.celule.map((celula) => {
          const aleasa = celula.zi === ziAleasa;

          return (
            <button
              key={celula.zi}
              type="button"
              disabled={!celula.liber}
              onClick={() => onAlege(celula.zi)}
              aria-pressed={aleasa}
              aria-label={etichete[celula.zi] ?? celula.zi}
              style={stilCelula(celula.liber, aleasa)}
            >
              {celula.numar}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Sageata({
  eticheta,
  semn,
  activa,
  onClick,
}: {
  eticheta: string;
  semn: string;
  activa: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={eticheta}
      disabled={!activa}
      onClick={onClick}
      style={{
        width: "36px",
        height: "36px",
        display: "grid",
        placeItems: "center",
        borderRadius: "50%",
        border: "1px solid color-mix(in oklab, currentColor 24%, transparent)",
        background: "transparent",
        color: "inherit",
        font: "inherit",
        fontSize: "18px",
        lineHeight: 1,
        cursor: activa ? "pointer" : "default",
        opacity: activa ? 1 : 0.35,
      }}
    >
      {semn}
    </button>
  );
}

/**
 * Culorile sunt aceleași ca la butoanele de oră (`stilOptiune` din
 * `formular.tsx`): perechea `--s-buton-fundal` / `--s-buton-text`, iar
 * chenarul din `currentColor`. `Section` pune doar cinci variabile `--s-`, iar
 * una inventată cade tăcut în „fără culoare” — s-a întâmplat de trei ori.
 *
 * O zi fără ore rămâne scrisă, dar palidă și fără chenar: se citește ca „nu se
 * poate atunci”, nu ca un buton care nu răspunde.
 */
function stilCelula(liber: boolean, aleasa: boolean) {
  return {
    aspectRatio: "1",
    minHeight: "40px",
    display: "grid",
    placeItems: "center",
    borderRadius: "50%",
    border: aleasa
      ? "1px solid var(--s-buton-fundal)"
      : liber
        ? "1px solid color-mix(in oklab, currentColor 24%, transparent)"
        : "1px solid transparent",
    background: aleasa ? "var(--s-buton-fundal)" : "transparent",
    color: aleasa ? "var(--s-buton-text)" : liber ? "inherit" : "var(--s-text-secundar)",
    opacity: liber ? 1 : 0.5,
    font: "inherit",
    fontSize: "15px",
    fontWeight: aleasa ? 600 : 400,
    cursor: liber ? "pointer" : "default",
  } as const;
}
