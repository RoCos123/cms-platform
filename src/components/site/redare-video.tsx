"use client";

import { useState, type ReactNode } from "react";

/**
 * Un video încorporat, cu afiș și buton de play; la clic se schimbă în player.
 *
 * De ce nu punem iframe-ul de la început: fiecare iframe YouTube aduce zeci de
 * cereri și cookie-uri la fiecare încărcare de pagină, pentru un video pe care
 * poate nimeni nu-l pornește — pe o grilă de 3, ar fi de trei ori. Așa, până la
 * primul clic vizitatorul vede doar o poză, iar player-ul se încarcă doar când
 * chiar vrea să vadă.
 *
 * E o componentă de client (are nevoie de stare: pornit/oprit), dar afișul îi
 * vine deja randat pe server ca `children`, deci optimizarea imaginii rămâne
 * unde trebuie.
 */
export function RedareVideo({
  embedUrl,
  titlu,
  children,
}: {
  /** Adresa de încorporare (`embedYouTube`). */
  embedUrl: string;
  /** Pentru cititoarele de ecran și titlul player-ului: „Redă videoul: {titlu}". */
  titlu: string;
  /** Afișul (poza) de dinainte de play, care umple rama 16:9. */
  children: ReactNode;
}) {
  const [pornit, setPornit] = useState(false);

  const rama: React.CSSProperties = {
    position: "relative",
    aspectRatio: "16 / 9",
    overflow: "hidden",
    borderRadius: "var(--t-raza)",
    background: "color-mix(in oklab, currentColor 8%, transparent)",
  };

  if (pornit) {
    return (
      <div style={rama}>
        <iframe
          src={embedUrl}
          title={titlu}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      className="redare-video"
      onClick={() => setPornit(true)}
      aria-label={`Redă videoul: ${titlu}`}
      style={{
        ...rama,
        display: "block",
        width: "100%",
        padding: 0,
        border: 0,
        cursor: "pointer",
        color: "inherit",
      }}
    >
      {children}

      {/* Un voal ușor, ca butonul alb să se vadă și pe un afiș deschis. */}
      <span
        aria-hidden
        style={{ position: "absolute", inset: 0, background: "rgba(0, 0, 0, 0.12)" }}
      />

      {/* Cercul de play, centrat. Alb cu triunghi închis — se citește pe orice
          poză, exact ca la butonul de play din orice player. */}
      <span
        aria-hidden
        className="redare-video-cerc"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "72px",
          height: "72px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "999px",
          background: "rgba(255, 255, 255, 0.92)",
          boxShadow: "0 6px 24px rgba(0, 0, 0, 0.28)",
        }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="#18181b" aria-hidden>
          {/* Triunghi ușor decalat la dreapta, ca să pară centrat optic. */}
          <path d="M8 5.5v13l11-6.5z" />
        </svg>
      </span>
    </button>
  );
}
