import type { CSSProperties } from "react";
import { Caveat, Cormorant_Garamond, DM_Sans, Inter, Manrope, Nunito } from "next/font/google";
import type { Template } from "@/lib/templates/types";

/**
 * Fonturile șabloanelor, servite de pe domeniul clientului.
 *
 * DE CE. Până acum, fiecare pagină cerea o foaie de stil de la
 * `fonts.googleapis.com`, iar aceea cerea fișierele de la `fonts.gstatic.com`.
 * Adică browserul fiecărui vizitator al fiecărui cabinet trimitea o cerere către
 * serverele Google, care îi vedeau adresa IP. Nu e ilegal, dar trebuie scris în
 * politica de confidențialitate a fiecărui client — iar o instanță germană a
 * decis deja că nu e nici măcar asta destul. Mai simplu e să nu se întâmple.
 *
 * `next/font/google` NU e o cerere către Google în timp ce omul citește pagina:
 * Next descarcă fișierele la BUILD și le pune lângă restul aplicației. Nimic nu
 * mai pleacă din browserul vizitatorului către altcineva. (Fonturile panoului,
 * din `src/app/layout.tsx`, erau deja așa — problema era doar la șabloane.)
 *
 * DE CE TOATE ȘASE, ÎNTR-UN SINGUR FIȘIER. `next/font` cere ca fontul să fie
 * cerut cu argumente scrise în cod, nu calculate: nu se poate „încarcă fontul al
 * cărui nume tocmai l-am citit din baza de date". Șabloanele sunt patru și
 * fonturile lor șase, deci se declară toate aici, iar șablonul își alege
 * familia din tabelul de mai jos.
 *
 * `latin-ext` NU e opțional. Fără el, ă, â, î, ș și ț n-ar fi în font și ar
 * cădea pe fontul de sistem — pe un site românesc, jumătate din cuvinte ar fi
 * scrise cu alte litere decât cealaltă jumătate. E cel mai ușor de ratat lucru
 * din tot fișierul, fiindcă în engleză totul arată perfect.
 */

/*
 * Opțiunile se repetă la fiecare font, deși sunt aceleași. Nu e neglijență:
 * `next/font` le citește la compilare, din cod, nu la rulare — „Font loader
 * values must be explicitly written literals”. Un obiect comun, împrăștiat cu
 * `...`, oprește build-ul.
 *
 * `latin-ext` NU e opțional: fără el, ă, â, î, ș și ț n-ar fi în font.
 * `display: "swap"` arată textul imediat, cu fontul de sistem, și îl schimbă
 * când sosește cel adevărat.
 */
// `preload: false` la toate: fonturile rămân auto-găzduite (descărcate la build,
// servite de pe domeniul clientului — deci GDPR-ul neatins), dar Next NU mai pune
// `<link rel=preload>` pentru ele. Toate șase se declară aici, într-un fișier,
// deci cu preload pornit fiecare pagină preîncărca fonturile TUTUROR celor patru
// șabloane (~16 fișiere woff2), deși un site folosește doar două. Acum fontul
// șablonului activ se încarcă tot, dar leneș (prin `@font-face` + elementul care-l
// cere); `display: "swap"` arată textul imediat cu fontul de sistem și-l schimbă
// când sosește, deci LCP-ul nu are de suferit. Prins în raportul Lighthouse:
// ~390 KiB de fonturi în încărcarea inițială, majoritatea nefolosite.
const manrope = Manrope({ subsets: ["latin", "latin-ext"], display: "swap", preload: false });
const dmSans = DM_Sans({ subsets: ["latin", "latin-ext"], display: "swap", preload: false });
const inter = Inter({ subsets: ["latin", "latin-ext"], display: "swap", preload: false });
const nunito = Nunito({ subsets: ["latin", "latin-ext"], display: "swap", preload: false });

// Cursivele se cer explicit: `--t-stil-accent` scrie accentele în cursiv la trei
// din cele patru șabloane, iar fără fișierul de cursive browserul ar înclina el
// literele drepte — „faux italic”, care la o serifă se vede imediat.
const cormorant = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  preload: false,
  style: ["normal", "italic"],
});

// Caveat n-are cursive deloc; șablonul Apropiere știe asta
// (`accentInItalic: false`) și nu le cere.
const caveat = Caveat({ subsets: ["latin", "latin-ext"], display: "swap", preload: false });

/**
 * Numele din șablon → familia adevărată, așa cum a numit-o Next după ce a
 * descărcat fontul. Numele generat NU e „Manrope”, ci ceva de forma
 * `__Manrope_abc123` — de asta tabelul ăsta nu poate fi ocolit scriind numele
 * de mână în CSS.
 */
const FAMILII: Record<string, string> = {
  Manrope: manrope.style.fontFamily,
  "DM Sans": dmSans.style.fontFamily,
  Inter: inter.style.fontFamily,
  Nunito: nunito.style.fontFamily,
  "Cormorant Garamond": cormorant.style.fontFamily,
  Caveat: caveat.style.fontFamily,
};

/**
 * Familia de folosit în CSS pentru un font de șablon, cu rezervele lui.
 *
 * Un nume necunoscut nu oprește pagina: se întoarce doar lista de rezerve, deci
 * site-ul se vede cu un font de sistem în loc să cadă. Un șablon nou cu un font
 * nedeclarat aici se vede imediat la o privire — dar un vizitator nu vede o
 * eroare.
 */
export function familiaFontului(nume: string, rezerve: string): string {
  const familie = FAMILII[nume];
  if (!familie) {
    console.warn(
      `Fontul „${nume}” nu e declarat în src/lib/templates/fonturi.ts. ` +
        "Se folosesc doar rezervele. Adaugă-l acolo, altfel șablonul arată cu alt font.",
    );
    return rezerve;
  }

  // `style.fontFamily` vine deja cu ghilimele unde trebuie.
  return `${familie}, ${rezerve}`;
}

/** Numele declarate aici, pentru probe și pentru verificarea șabloanelor. */
export const FONTURI_DECLARATE = Object.keys(FAMILII);

/**
 * Variabilele de font ale unui șablon, de pus lângă cele din `templateStyle`.
 *
 * Stau separat fiindcă `next/font` merge doar înăuntrul build-ului Next: dacă
 * ar fi fost în `index.ts`, tot fișierul acela n-ar mai fi putut fi încărcat de
 * probe, iar verificarea de contrast a culorilor s-ar fi rupt. Culorile sunt
 * judecată; fonturile sunt unealtă.
 */
export function templateFontStyle(template: Template): CSSProperties {
  const t = template.tipografie;

  return {
    "--t-font-principal": familiaFontului(t.fontPrincipal, t.fallbackPrincipal),
    "--t-font-secundar": familiaFontului(t.fontSecundar, t.fallbackSecundar),
    "--t-font-titlu": t.titluriInSecundar
      ? familiaFontului(t.fontSecundar, t.fallbackSecundar)
      : familiaFontului(t.fontPrincipal, t.fallbackPrincipal),
  } as CSSProperties;
}
