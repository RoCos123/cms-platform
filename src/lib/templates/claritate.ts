import type { Template } from "./types";

/**
 * Al cincilea șablon, și singurul care NU vine dintr-o sursă măsurată.
 *
 * Celelalte patru sunt portări fidele ale unor site-uri de psihologi reali,
 * toate calde: crem, nisip, lavandă. Potrivite pentru un cabinet, nepotrivite
 * pentru o pagină care vinde ceva — și, la fel de important, nepotrivite pentru
 * psihologul care nu se vrea cald. Cine lucrează în evaluare psihologică,
 * expertize sau psihologia muncii n-are ce face cu un fundal crem.
 *
 * De aici, trei reguli pe care le ține tot fișierul:
 *
 * - **Pardoseala e argintie, nu albă.** `#EEF2F7` — un argintiu deschis și rece.
 *   Albul nu dispare, urcă: `fundalNuantat` e `#FFFFFF` curat, iar cartonașele
 *   îl folosesc pe el (`--t-fundal-nuantat`, vezi features/portfolio/
 *   testimonials). Deci panourile albe plutesc peste argintiu, în loc să se
 *   piardă în el. E invers față de celelalte patru șabloane, unde `nuantat` e
 *   mai închis decât `fundal` — dinadins, și singurul lucru din fișierul ăsta
 *   care nu se poate copia orbește într-un șablon nou.
 * - **Rece peste tot**: fiecare gri are o urmă de albastru, niciunul de galben.
 *   Un gri neutru arată murdar; unul cu urmă de albastru arată ales.
 * - **Colțuri mici, nu rotunjite**. 6px, nu 24px, iar butoanele nu sunt pastile.
 *   Rotunjimea mare citește a „prietenos"; aici vrem a „serios".
 *
 * Fonturile sunt Inter și pentru text, și pentru accente, dinadins: două fonturi
 * diferite ar fi adus căldură pe ușa din dos. Accentul se deosebește prin
 * GREUTATE, nu prin formă — titlu la 700, cuvântul accentuat la 300. Contrastul
 * ăla e tot ce-i trebuie unui șablon sobru.
 *
 * `accentInItalic: false` din același motiv: cursivele într-un sans-serif dau un
 * aer de scrisoare, nu de document.
 */
export const claritate: Template = {
  id: "claritate",
  nume: "Claritate",
  descriere: "Alb curat, gri rece, albastru sobru. Pentru cine vrea să arate a birou, nu a living.",

  paleta: {
    fundal: "#EEF2F7",
    fundalNuantat: "#FFFFFF",
    fundalRelief: "#DFE6EE",
    fundalInchis: "#0E1720",

    text: "#0D141B",
    textSecundar: "#46556A",
    // Nu alb pur pe închis: se leagă cu argintiul de sus, în loc să sară din el.
    textPeInchis: "#F2F6FA",
    textSecundarPeInchis: "#A6B8CA",

    accent: "#1B5C99",
    accentText: "#FFFFFF",
    accentPeInchis: "#8FC6F5",

    eroare: "#B3261E",
    // Roșul de pe fundal deschis n-are contrast pe albastrul-închis. Deschis
    // până trece, păstrând nuanța — aceeași corecție ca la Lumină.
    eroarePeInchis: "#F0A79B",

    // Mai apăsat decât înainte: pe argintiu, un chenar cât cel de pe alb pur
    // dispare. Panoul alb are nevoie de o muchie ca să se vadă că e panou.
    chenar: "#D2DAE4",
  },

  tipografie: {
    fontPrincipal: "Inter",
    fontSecundar: "Inter",
    fallbackPrincipal: "ui-sans-serif, system-ui, sans-serif",
    fallbackSecundar: "ui-sans-serif, system-ui, sans-serif",
    titluriInSecundar: false,
    accentInItalic: false,
    greutateTitlu: 700,
  },

  forme: {
    raza: "6px",
    razaButon: "6px",
    spatiereSectiune: "clamp(72px, 9vw, 120px)",
  },

  // Titlul pe toată lățimea: pe o pagină care vinde ceva, propoziția de sus e
  // marfa. Împărțită pe două coloane cu o poză alături, se citește ca o
  // ilustrație lângă un text; lată, se citește ca o afirmație.
  // Poza din „Despre mine" în cerc, doar aici: pe un șablon curat, cu alb
  // adevărat, cercul e mai prietenos decât o ramă tăiată drept. Restul
  // șabloanelor păstrează dreptunghiul.
  // Poza LATĂ (peisaj) pe toată lățimea, cu textul și butonul dedesubt. Cerut de
  // proprietar (21 sept. 2026): poza din hero e cabinetul, nu un portret.
  asezari: { hero: "pozaLata", desprePozaRotunda: true },
};
