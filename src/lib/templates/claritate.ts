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
 * - **Fundal alb adevărat**, nu crem, nu albăstrui. `#FFFFFF`.
 * - **Rece peste tot**: fiecare gri are o urmă de albastru, niciunul de galben.
 *   Un gri neutru lângă alb pur arată murdar; unul cu urmă de albastru arată
 *   ales.
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
    fundal: "#FFFFFF",
    fundalNuantat: "#F4F6F8",
    fundalRelief: "#E8ECF1",
    fundalInchis: "#16202B",

    text: "#111820",
    textSecundar: "#4A5765",
    textPeInchis: "#FFFFFF",
    textSecundarPeInchis: "#AEBDCC",

    accent: "#1B4D7E",
    accentText: "#FFFFFF",
    accentPeInchis: "#8FC0EA",

    eroare: "#B3261E",
    // Roșul de pe fundal deschis n-are contrast pe albastrul-închis. Deschis
    // până trece, păstrând nuanța — aceeași corecție ca la Lumină.
    eroarePeInchis: "#F0A79B",

    chenar: "#DDE3E9",
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
  asezari: { hero: "titluLat" },
};
