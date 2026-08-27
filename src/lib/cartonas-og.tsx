import type { ReactElement } from "react";
import { marimeaNumelui } from "@/lib/cartonas-masuri";

/**
 * Desenul cartonașului care se vede când cineva dă linkul pe WhatsApp sau
 * Facebook.
 *
 * Stă separat de ruta care îl servește ca să poată fi desenat și cu date
 * inventate, fără Supabase — altfel n-ar fi putut fi văzut niciodată înainte de
 * primul client. Aceeași despărțire ca la `sitemap-reguli.ts`.
 *
 * Măsurile sunt în `cartonas-masuri.ts`: Node nu poate rula JSX, deci ce e de
 * probat în cifre nu are voie să stea într-un `.tsx`.
 */

export type CabinetPeCartonas = {
  nume: string;
  subtitlu?: string;
  acreditare?: string;
  domeniu: string;
};

export function cartonasulCabinetului(cabinet: CabinetPeCartonas): ReactElement {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "80px",
        // Culorile se scriu direct, nu prin `var(--t-…)`: desenul se face pe
        // server, fără CSS-ul paginii, deci variabilele temei n-ar avea valoare.
        background: "linear-gradient(135deg, #1b1f24 0%, #2e343c 100%)",
        color: "#f4f5f7",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", width: "72px", height: "6px", background: "#9fb3c8" }} />

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            fontSize: marimeaNumelui(cabinet.nume),
            lineHeight: 1.1,
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          {cabinet.nume}
        </div>

        {cabinet.subtitlu ? (
          <div style={{ display: "flex", marginTop: "24px", fontSize: 36, color: "#9fb3c8" }}>
            {cabinet.subtitlu}
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          fontSize: 26,
          color: "#8a96a3",
        }}
      >
        <div style={{ display: "flex", maxWidth: "760px" }}>{cabinet.acreditare ?? ""}</div>
        <div style={{ display: "flex" }}>{cabinet.domeniu}</div>
      </div>
    </div>
  );
}
