import type { CSSProperties } from "react";
import {
  Bricolage_Grotesque,
  Caveat,
  Cormorant_Garamond,
  DM_Sans,
  Figtree,
  Fraunces,
  Instrument_Serif,
  Inter,
  Josefin_Sans,
  Literata,
  Lora,
  Manrope,
  Newsreader,
  Nunito,
  Playfair_Display,
  Quicksand,
  Source_Sans_3,
  Source_Serif_4,
  Tenor_Sans,
  Zilla_Slab,
} from "next/font/google";
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
 * DE CE TOATE, ÎNTR-UN SINGUR FIȘIER. `next/font` cere ca fontul să fie
 * cerut cu argumente scrise în cod, nu calculate: nu se poate „încarcă fontul al
 * cărui nume tocmai l-am citit din baza de date". Fonturile șabloanelor și cele
 * din meniul „Aspect" se declară deci toate aici, iar șablonul (sau clientul)
 * își alege familia din tabelul de mai jos.
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

/*
 * Fonturile din meniul „Aspect" (20 oct. 2026), pe care și le aleg clienții — lista și de ce e
 * închisă: `src/lib/aspect/fonturi.ts`. Aceleași reguli ca mai sus: `latin-ext`, `swap`, fără
 * preîncărcare (un site descarcă doar cele două fonturi pe care le folosește, cele nefolosite
 * rămân doar câteva rânduri `@font-face` în CSS). Cursivele se cer unde fontul le are, ca
 * browserul să nu le fabrice; Quicksand, Bricolage și Tenor Sans n-au.
 */
// Pentru titluri.
const josefinSans = Josefin_Sans({ subsets: ["latin", "latin-ext"], display: "swap", preload: false, style: ["normal", "italic"] });
const quicksand = Quicksand({ subsets: ["latin", "latin-ext"], display: "swap", preload: false });
const bricolage = Bricolage_Grotesque({ subsets: ["latin", "latin-ext"], display: "swap", preload: false });
const playfair = Playfair_Display({ subsets: ["latin", "latin-ext"], display: "swap", preload: false, style: ["normal", "italic"] });
const fraunces = Fraunces({ subsets: ["latin", "latin-ext"], display: "swap", preload: false, style: ["normal", "italic"] });
// Zilla Slab și cele două de mai jos nu sunt variabile: greutățile se cer una câte una.
const zillaSlab = Zilla_Slab({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  preload: false,
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});
const tenorSans = Tenor_Sans({ subsets: ["latin", "latin-ext"], display: "swap", preload: false, weight: "400" });
const instrumentSerif = Instrument_Serif({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  preload: false,
  weight: "400",
  style: ["normal", "italic"],
});
// Pentru text.
const sourceSans = Source_Sans_3({ subsets: ["latin", "latin-ext"], display: "swap", preload: false, style: ["normal", "italic"] });
const figtree = Figtree({ subsets: ["latin", "latin-ext"], display: "swap", preload: false, style: ["normal", "italic"] });
const lora = Lora({ subsets: ["latin", "latin-ext"], display: "swap", preload: false, style: ["normal", "italic"] });
const sourceSerif = Source_Serif_4({ subsets: ["latin", "latin-ext"], display: "swap", preload: false, style: ["normal", "italic"] });
const literata = Literata({ subsets: ["latin", "latin-ext"], display: "swap", preload: false, style: ["normal", "italic"] });
const newsreader = Newsreader({ subsets: ["latin", "latin-ext"], display: "swap", preload: false, style: ["normal", "italic"] });

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
  "Josefin Sans": josefinSans.style.fontFamily,
  Quicksand: quicksand.style.fontFamily,
  "Bricolage Grotesque": bricolage.style.fontFamily,
  "Playfair Display": playfair.style.fontFamily,
  Fraunces: fraunces.style.fontFamily,
  "Zilla Slab": zillaSlab.style.fontFamily,
  "Tenor Sans": tenorSans.style.fontFamily,
  "Instrument Serif": instrumentSerif.style.fontFamily,
  "Source Sans 3": sourceSans.style.fontFamily,
  Figtree: figtree.style.fontFamily,
  Lora: lora.style.fontFamily,
  "Source Serif 4": sourceSerif.style.fontFamily,
  Literata: literata.style.fontFamily,
  Newsreader: newsreader.style.fontFamily,
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

/**
 * Cât de lată e, în medie, o literă din fontul secundar, ca parte din mărimea
 * fontului — cu o mică margine peste ce s-a măsurat. Măsurat pe 4 oct. 2026, în
 * Chromium, pe cuvinte ca „Specializare", „Psihoterapie", „Supervizare",
 * „Online": Caveat 0,33–0,37; Cormorant Garamond 0,39–0,46; Inter 0,47–0,52.
 *
 * Folosită de reperele de sub „Despre mine", ca textul mare să se micșoreze
 * exact cât să încapă cel mai lung cuvânt — un singur factor pentru toate
 * fonturile ori micșora prea mult scrisul îngust (Caveat), ori prea puțin
 * scrisul lat (Inter). Un font nou fără valoare aici primește 0,53 — sigur
 * pentru orice font obișnuit, doar puțin mai mic decât ar putea fi.
 */
const LATIME_LITERA: Record<string, number> = {
  Caveat: 0.38,
  "Cormorant Garamond": 0.47,
  Inter: 0.53,
  // Fonturile de titlu din „Aspect" (devin fontul secundar), măsurate la fel pe 20 oct. 2026, plus
  // „Experiență" și „Certificări": cel mai lat cuvânt, rotunjit în sus cu o sutime.
  "Josefin Sans": 0.51,
  Quicksand: 0.51,
  "Bricolage Grotesque": 0.52,
  "Playfair Display": 0.51,
  Fraunces: 0.54,
  "Zilla Slab": 0.49,
  "Tenor Sans": 0.54,
  "Instrument Serif": 0.39,
};

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

  // Cu fonturi alese în „Aspect", titlurile au fontul lor explicit (vezi `tipografieEfectiva`).
  const titlu = t.fontTitlu
    ? familiaFontului(t.fontTitlu, t.fallbackTitlu ?? t.fallbackSecundar)
    : t.titluriInSecundar
      ? familiaFontului(t.fontSecundar, t.fallbackSecundar)
      : familiaFontului(t.fontPrincipal, t.fallbackPrincipal);

  return {
    "--t-font-principal": familiaFontului(t.fontPrincipal, t.fallbackPrincipal),
    "--t-font-secundar": familiaFontului(t.fontSecundar, t.fallbackSecundar),
    "--t-latime-litera-secundar": String(LATIME_LITERA[t.fontSecundar] ?? 0.53),
    "--t-font-titlu": titlu,
    // Doar cu fonturi alese: și titlurile secțiunilor care altfel ar sta pe fontul de text.
    ...(t.fontTitlu && { "--t-font-titlu-ales": titlu }),
  } as CSSProperties;
}
