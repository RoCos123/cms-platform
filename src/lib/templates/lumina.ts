import type { Template } from "./types";

/**
 * Valorile sunt măsurate din randarea reală a șablonului-sursă (Chromium,
 * 1440px). Singurul dintre cele patru care nu e pe crem — fundal albăstrui,
 * accent mov.
 */
export const lumina: Template = {
  id: "lumina",
  nume: "Lumină",
  descriere: "Lavandă și mov, titluri în serif. Cel mai luminos și mai rece dintre cele patru.",

  paleta: {
    fundal: "#F1F5FD",
    fundalNuantat: "#E6EDFA",
    fundalInchis: "#46195A",
    // A treia treaptă, continuând seria: sursa se oprește la două.
    fundalRelief: "#D8E2F5",

    text: "#1D1230",
    textSecundar: "#3F3252",
    textPeInchis: "#FFFFFF",
    textSecundarPeInchis: "#C9A6DA",

    accent: "#5E2976",
    accentText: "#FFFFFF",
    accentPeInchis: "#C9A6DA",

    eroare: "#B3261E",
    // Roșul de pe fundal deschis dă 2,73:1 pe movul închis. Deschis până trece,
    // păstrând nuanța — aceeași corecție ca la accentul lui Căldură.
    eroarePeInchis: "#F0A79B",

    chenar: "#D8E2F5",
  },

  tipografie: {
    fontPrincipal: "Inter",
    fontSecundar: "Cormorant Garamond",
    fallbackPrincipal: "ui-sans-serif, system-ui, sans-serif",
    fallbackSecundar: "Georgia, serif",
    titluriInSecundar: true,
    accentInItalic: true,
    greutateTitlu: 400,
  },

  forme: {
    raza: "24px",
    razaButon: "999px",
    spatiereSectiune: "clamp(80px, 10vw, 140px)",
  },

  asezari: { hero: "textPozaDreapta" },
};
