import type { Template } from "./types";

/**
 * Valorile sunt măsurate din randarea reală a șablonului-sursă, nu alese de mine
 * — vezi design/sabloane/sablon-caldura-spec.json pentru datele brute.
 */
export const caldura: Template = {
  id: "caldura",
  nume: "Căldură",
  descriere: "Crem și terracotta, titluri mari cu accente în serif. Cel mai complet dintre cele patru.",

  paleta: {
    fundal: "#F8F1EA",
    fundalNuantat: "#FCF8F5",
    fundalInchis: "#2A1F1A",
    fundalRelief: "#DFD8D1",

    text: "#2A1F1A",
    // Sursa folosea #877E78 (3,55:1 pe crem) și #B8654D (3,75:1 ca text, 4,19:1
    // sub text alb) — toate sub pragul WCAG AA de 4,5:1 pentru text normal.
    // Întunecate cât să treacă pe cel mai greu fundal deschis (#DFD8D1),
    // păstrând nuanța: -12,8% și -11,8% luminozitate. Un site pentru oameni
    // anxioși e ultimul loc unde merită copiată o greșeală de lizibilitate.
    textSecundar: "#645E59",
    textPeInchis: "#F8F1EA",
    textSecundarPeInchis: "#B5AAA2",

    accent: "#904D39",
    accentText: "#FFFFFF",
    chenar: "#DFD8D1",
  },

  tipografie: {
    fontPrincipal: "Manrope",
    fontSecundar: "Cormorant Garamond",
    fallbackPrincipal: "ui-sans-serif, system-ui, sans-serif",
    fallbackSecundar: "Georgia, serif",
    // Titlurile sunt în Manrope; serif-ul apare doar pe fragmentele accentuate
    // („psiholog clinician." din hero e italic serif, restul e sans).
    titluriInSecundar: false,
  },

  forme: {
    raza: "16px",
    razaButon: "999px",
    spatiereSectiune: "clamp(72px, 9vw, 128px)",
  },
};
