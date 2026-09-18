import type { Template } from "./types";

/**
 * Valorile sunt măsurate din randarea reală a șablonului-sursă (Chromium,
 * 1440px), nu alese de mine. Ce s-a schimbat față de sursă e scris lângă
 * valoare, cu motivul — și e mereu contrast, niciodată gust.
 */
export const liniste: Template = {
  id: "liniste",
  nume: "Liniște",
  descriere: "Verde închis pe crem, titluri în serif. Mai auster și mai tăcut decât Căldură.",

  paleta: {
    fundal: "#F3EDE2",
    fundalNuantat: "#EBE3D4",
    fundalInchis: "#1F2A24",
    // Sursa n-are un al treilea fundal deschis — folosește doar două. Treapta a
    // treia e cerută de tonul „relief" (testimoniale, contact). Primul pas
    // încercat (#DED4C0, continuând seria cu un pas egal) scădea accentul la
    // 4,09:1 și roșul de eroare la 4,45:1 — sub prag. Oprit mai devreme, la
    // 4,58:1: treapta e a mea, nu a sursei, deci ea cedează, nu culorile
    // măsurate. Prins de `e2e/contrast-sabloane.proba.mjs`.
    fundalRelief: "#E7E0D1",

    text: "#1F2A24",
    textSecundar: "#4A574F",
    textPeInchis: "#F3EDE2",
    textSecundarPeInchis: "#C3CFB7",

    accent: "#4C6A52",
    accentText: "#FFFFFF",
    accentPeInchis: "#C3CFB7",

    eroare: "#B3261E",
    eroarePeInchis: "#E8877A",

    chenar: "#E7E0D1",
  },

  tipografie: {
    fontPrincipal: "DM Sans",
    fontSecundar: "Cormorant Garamond",
    fallbackPrincipal: "ui-sans-serif, system-ui, sans-serif",
    fallbackSecundar: "Georgia, serif",
    // Aici titlurile ÎNTREGI sunt în serif, nu doar accentele — pe dos față de
    // Căldură. E cea mai vizibilă diferență dintre cele două la prima privire.
    titluriInSecundar: true,
    accentInItalic: true,
    greutateTitlu: 400,
  },

  forme: {
    raza: "24px",
    razaButon: "32px",
    // Sursa are 140px de spațiu vertical, mai mult decât Căldură (128px):
    // densitatea mai mică e o parte din „liniște".
    spatiereSectiune: "clamp(80px, 10vw, 140px)",
  },

  // Aduse la referința „Dragoș Geamănă" (site-ul-sursă din care a fost măsurat
  // Liniște). Fiecare tratament e un steag pornit DOAR aici; componenta desenează
  // forma editorială când e pornit, altfel rămâne cum era — restul șabloanelor
  // nu se ating. Paleta și fonturile erau deja ale referinței, deci munca e
  // exclusiv de așezare.
  asezari: {
    hero: "textPozaDreapta",
    heroCercDecor: true,
    citatCentrat: true,
    despreReperCard: true,
    cumLucrezCarduri: true,
    serviciiImagine: true,
  },
};
