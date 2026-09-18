import type { Template } from "./types";

/**
 * Valorile sunt măsurate din randarea reală a șablonului-sursă (Chromium,
 * 1440px). Cel mai prietenos dintre cele patru: colțuri foarte rotunjite, un
 * singur font rotund, și un accent scris de mână.
 */
export const apropiere: Template = {
  id: "apropiere",
  nume: "Apropiere",
  descriere: "Crem cald și verde, colțuri foarte rotunjite. Cel mai apropiat ca ton, fără să pară neserios.",

  paleta: {
    fundal: "#F4EDE2",
    fundalNuantat: "#FAF4E8",
    // Sursa n-are NICIO secțiune pe fundal închis. Tonul „închis" există însă
    // în ritmul paginii noastre (newsletter, subsol), deci se ia culoarea
    // textului, ca la Căldură — acolo `#2A1F1A` e și text, și fundal închis.
    fundalInchis: "#3D3527",
    fundalRelief: "#E8DCC8",

    text: "#3D3527",
    textSecundar: "#6B5F4D",
    textPeInchis: "#FAF4E8",
    textSecundarPeInchis: "#C0B49E",

    // Sursa folosește #7EA577 — 2,25:1 pe cremul ei, sub orice prag. E aceeași
    // greșeală ca la Căldură, iar aici e și mai vizibilă: verdele apare pe
    // bucata scrisă de mână din titlu. Aceeași nuanță, întunecată până trece.
    accent: "#456B3F",
    accentText: "#FFFFFF",
    accentPeInchis: "#A8C9A1",

    // Piersica sursei (`--peach: #f7c9b8`), luată neatinsă: e o dungă
    // decorativă sub un cuvânt, nu text, deci n-o măsurăm la contrast ca pe
    // verde. Tocmai moliciunea ei face semnătura caldă a modelului.
    accentCald: "#F7C9B8",
    // Aceeași piersică, dar întunecată până trece pragul de contrast: sursa
    // scrie accentul de titlu cu `--peach-deep: #db8d72` (≈2,3:1 pe crem, sub
    // prag), la fel de spălăcit ca verdele ei. O cobor până devine lizibilă la
    // mărime de titlu.
    accentCaldInchis: "#B55A38",

    eroare: "#B3261E",
    eroarePeInchis: "#E8877A",

    chenar: "#E8DCC8",
  },

  tipografie: {
    fontPrincipal: "Nunito",
    // Sursa scrie ultima bucată a titlului cu mâna, în Caveat. E singurul
    // șablon cu un font de scris, și e chiar semnătura lui.
    fontSecundar: "Caveat",
    fallbackPrincipal: "ui-rounded, ui-sans-serif, system-ui, sans-serif",
    fallbackSecundar: "cursive",
    titluriInSecundar: false,
    // Singurul „false" din cele patru: Caveat n-are cursivă, iar cerută oricum
    // ar fi fost fabricată de browser prin înclinare. Pe originalul lor,
    // bucata scrisă de mână e dreaptă.
    accentInItalic: false,
    greutateTitlu: 800,
  },

  forme: {
    raza: "36px",
    razaButon: "100px",
    // Cel mai dens dintre cele patru: 110px, față de 128 la Căldură și 140 la
    // celelalte două.
    spatiereSectiune: "clamp(64px, 8vw, 110px)",
  },

  // Poza din „Despre mine" stă peste un card verde decalat, ca la sursă —
  // „poza lipită peste un carton". Iar poza din hero e un dreptunghi rotunjit
  // simplu, fără arcadă (sursa n-are arcadă). Doar aici.
  asezari: {
    hero: "textPozaDreapta",
    desprePozaStivuita: true,
    despreFriendly: true,
    heroFaraArcada: true,
    heroTitluFriendly: true,
    heroBlob: true,
    programareSaptamana: true,
    antetPastila: true,
    testimonialeFriendly: true,
    serviciiFriendly: true,
  },
};
