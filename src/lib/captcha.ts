/**
 * Ce furnizor de casetă anti-spam folosim și cum se leagă la el.
 *
 * Fișierul e neutru — nici „use client”, nici „use server” — fiindcă ambele
 * lumi au nevoie de aceleași date: browserul, ca să încarce scriptul potrivit
 * și să știe ce câmp ascuns caută; serverul, ca să știe la ce adresă trimite
 * tokenul spre verificare.
 *
 * De ce există tabelul ăsta, în loc de o singură implementare:
 *
 * Am pornit pe Cloudflare Turnstile. Turnstile cere ca fiecare domeniu pe care
 * apare caseta să fie trecut în lista widgetului, iar lista se oprește la 10
 * domenii pe cheie, cu 20 de chei pe cont — 200 de domenii cu totul. Pasul
 * următor al Cloudflare e Enterprise Bot Management, de la 2.000 $/lună. Pentru
 * o platformă care ține site-urile mai multor cabinete, plafonul ăla nu e o
 * limită tehnică de ocolit, ci un capăt de drum: la 200 de clienți costul
 * anti-spamului ar depăși de două ori venitul recurent al întregului produs.
 *
 * hCaptcha n-are plafonul. O cheie merge implicit pe ORICE domeniu, iar lista de
 * domenii e opțională și nelimitată („some customers need to use many domains
 * per sitekey”, docs.hcaptcha.com/configuration). O singură pereche de chei ține
 * toată platforma — la 20 de clienți ca și la 2.000 — iar un client nou nu cere
 * nicio înregistrare nicăieri. Asta contează cel mai mult aici: provizionarea
 * unui cabinet e o linie de SQL, și trebuie să rămână așa.
 *
 * Turnstile rămâne în tabel fiindcă lecția adevărată nu e „hCaptcha e mai bun”,
 * ci că furnizorul trebuie să se poată schimba dintr-o variabilă de mediu, nu
 * dintr-o rescriere de cod. Data viitoare când unul dintre ei schimbă regulile,
 * fișierul ăsta e singurul care se atinge.
 */

export type NumeFurnizor = "hcaptcha" | "turnstile";

export type Furnizor = {
  nume: NumeFurnizor;
  /** Adresa scriptului, în varianta cu randare explicită. */
  script: (numeCallback: string) => string;
  /** Obiectul pe care scriptul îl lasă în `window`. */
  global: NumeFurnizor;
  /** `name`-ul inputului ascuns în care widgetul pune tokenul. */
  campToken: string;
  /** Cum se cheamă opțiunea de limbă la `render()`. Nu e la fel la cei doi. */
  campLimba: "hl" | "language";
  /** Endpointul care spune dacă tokenul e bun. */
  verificare: string;
};

export const FURNIZORI: Record<NumeFurnizor, Furnizor> = {
  hcaptcha: {
    nume: "hcaptcha",
    script: (callback) => `https://js.hcaptcha.com/1/api.js?render=explicit&onload=${callback}`,
    global: "hcaptcha",
    campToken: "h-captcha-response",
    campLimba: "hl",
    verificare: "https://api.hcaptcha.com/siteverify",
  },
  turnstile: {
    nume: "turnstile",
    script: (callback) =>
      `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=${callback}`,
    global: "turnstile",
    campToken: "cf-turnstile-response",
    campLimba: "language",
    verificare: "https://challenges.cloudflare.com/turnstile/v0/siteverify",
  },
};

/**
 * Fără variabilă de mediu, hCaptcha. E singurul care merge pe oricâte domenii,
 * deci e singurul cu care platforma poate crește fără să se oprească.
 */
export const FURNIZOR_IMPLICIT: NumeFurnizor = "hcaptcha";

/**
 * O valoare scrisă greșit în variabile de mediu NU trebuie să oprească
 * formularele. Cade pe furnizorul implicit și spune în jurnal ce a găsit —
 * un site care nu mai primește mesaje e o pagubă mult mai mare decât o casetă
 * care vine de la alt furnizor decât s-a vrut.
 */
export function alegeFurnizor(brut: string | null | undefined): Furnizor {
  const cheie = (brut ?? "").trim().toLowerCase();
  if (cheie === "") return FURNIZORI[FURNIZOR_IMPLICIT];
  if (cheie in FURNIZORI) return FURNIZORI[cheie as NumeFurnizor];

  console.warn(
    `Furnizor de captcha necunoscut: „${brut}”. Folosesc ${FURNIZOR_IMPLICIT}. ` +
      `Valori acceptate: ${Object.keys(FURNIZORI).join(", ")}.`,
  );
  return FURNIZORI[FURNIZOR_IMPLICIT];
}

/**
 * Tokenul, oricare ar fi furnizorul. Câmpul ascuns are alt nume la fiecare, iar
 * până acum ternarul care îl citea era copiat în trei acțiuni — de trei ori
 * același nume scris de mână, adică trei locuri de uitat la o schimbare.
 */
export function tokenulDinFormular(formData: FormData, furnizor: Furnizor): string | null {
  const valoare = formData.get(furnizor.campToken);
  return typeof valoare === "string" && valoare !== "" ? valoare : null;
}
