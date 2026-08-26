import type { CampSchema } from "@/lib/sectiuni";

/**
 * Setările site-ului, descrise în același fel ca secțiunile — deci editate cu
 * același formular. Nu e o coincidență fericită, e motivul pentru care
 * formularul a fost făcut să se construiască dintr-o descriere.
 *
 * Datele astea nu stau într-un singur loc: numele cabinetului e o coloană în
 * `sites` (singura pe care proprietarul are dreptul s-o schimbe — domeniul e
 * blocat prin grant, vezi migrarea de întărire), restul stau în grupurile
 * `brand` și `seo` din `site_settings`. Împărțirea o face acțiunea de salvare;
 * clientul vede un singur formular, fiindcă pentru el sunt un singur lucru.
 */

export const CAMPURI_CABINET: CampSchema[] = [
  {
    tip: "text",
    cheie: "nume",
    eticheta: "Numele tău sau al cabinetului",
    hint: "Apare sus în antet și în subsolul fiecărei pagini.",
    obligatoriu: true,
    max: 120,
  },
  {
    tip: "text",
    cheie: "subtitlu",
    eticheta: "Rândul mic de sub nume",
    hint: "Ex.: Psiholog clinician. Lasă gol dacă nu vrei niciunul.",
    max: 80,
  },
  {
    tip: "text",
    cheie: "telefon",
    eticheta: "Telefon",
    hint: "Apare în antet și în subsol, ca număr pe care se poate apăsa.",
    max: 40,
  },
  { tip: "email", cheie: "email", eticheta: "Adresa de email", max: 200 },
  { tip: "text", cheie: "adresa", eticheta: "Adresa cabinetului", max: 200 },
  {
    tip: "text",
    cheie: "acreditare",
    eticheta: "Acreditare",
    hint: "Ex.: Membru al Colegiului Psihologilor din România.",
    max: 160,
  },
  {
    tip: "textLung",
    cheie: "descriereSubsol",
    eticheta: "Textul din subsol",
    hint: "Una-două propoziții despre ce faci, sub numele tău, jos pe pagină.",
    randuri: 3,
    max: 300,
  },
];

/**
 * Etichetele descriu ce SE VEDE, nu cum se numesc lucrurile în meseria noastră.
 * „Titlul din rezultatele Google" presupune că omul știe deja din ce e făcut un
 * rezultat Google; „titlul albastru" e ceva ce a văzut de mii de ori.
 *
 * Limitele nu sunt inventate: Google taie titlul pe la 60 de caractere și
 * descrierea pe la 160. Un text mai lung nu e o eroare, dar se termină cu „…"
 * în rezultate — deci merită spus dinainte, nu descoperit după.
 */
export const CAMPURI_SEO: CampSchema[] = [
  {
    tip: "text",
    cheie: "titlu",
    eticheta: "Titlul albastru, pe care se apasă",
    hint: "Dacă îl lași gol, se folosește numele tău. Peste 60 de caractere, Google îl taie.",
    max: 60,
  },
  {
    tip: "textLung",
    cheie: "descriere",
    eticheta: "Cele două rânduri gri de sub titlu",
    hint: "Singurul text pe care îl citește cineva înainte să decidă dacă intră pe site. Scrie-l pentru omul care caută ajutor, nu pentru Google. Peste 160 de caractere, se taie.",
    randuri: 3,
    max: 160,
  },
];

/** Ce citește site-ul public din `site_settings.brand`. */
export type Brand = {
  subtitlu?: string;
  telefon?: string;
  email?: string;
  adresa?: string;
  acreditare?: string;
  descriereSubsol?: string;
};

export type Seo = {
  titlu?: string;
  descriere?: string;
};
