import type { Template } from "./types";

/**
 * Valorile sunt măsurate din randarea reală a șablonului, nu alese de mine —
 * vezi design/sabloane/renata-spec.json pentru extragerea brută.
 */
export const renata: Template = {
  id: "renata",
  nume: "Cald și editorial",
  descriere: "Crem cald, accent terracotta, titluri mari cu accente în serif italic.",

  paleta: {
    fundal: "#F8F1EA",
    fundalNuantat: "#FCF8F5",
    fundalInchis: "#2A1F1A",
    fundalRelief: "#DFD8D1",

    text: "#2A1F1A",
    textSecundar: "#877E78",
    textPeInchis: "#F8F1EA",
    textSecundarPeInchis: "#B5AAA2",

    accent: "#B8654D",
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
