/**
 * Regulile formularelor publice (contact, newsletter), într-un singur loc.
 *
 * Fișierul e neutru — nici „use client", nici „use server" — din același motiv
 * ca `uploads.ts`: aceleași limite trebuie să existe în browser (`maxLength` pe
 * input, ca omul să afle imediat) și pe server (unde e singura verificare care
 * contează). În plus, un fișier cu „use server" nu poate exporta constante.
 */

/**
 * Limitele de lungime. Nu sunt estetice: fără ele, un singur POST poate umple
 * cu megaocteți coloana `text`, iar mesajul devine necitibil în panou.
 */
export const LIMITE = {
  nume: 120,
  email: 200,
  mesaj: 5000,
} as const;

export type StareFormular = {
  status: "initial" | "succes" | "eroare";
  /** Mesajul general, arătat deasupra formularului. */
  mesaj?: string;
  /** Erori per câmp; cheia e atributul `name` al inputului. */
  erori?: Record<string, string>;
  /**
   * Ce a scris omul. React golește formularul după ce acțiunea se termină, deci
   * fără asta un mesaj lung scris cu greu s-ar pierde la prima eroare.
   */
  valori?: Record<string, string>;
  /**
   * Câte trimiteri s-au încheiat. Nu e telemetrie: tokenul Turnstile e de unică
   * folosință, iar formularul pune numărul ăsta drept `key` pe widget, ca React
   * să-l remonteze după fiecare încercare și acesta să emită alt token.
   *
   * Stă în starea acțiunii, nu într-un `useState` sincronizat printr-un efect:
   * un `setState` în efect declanșează redări în cascadă, iar aici valoarea e
   * oricum derivabilă — acțiunea primește starea anterioară ca prim argument.
   */
  incercari: number;
};

export const STARE_INITIALA: StareFormular = { status: "initial", incercari: 0 };

/**
 * Validare pragmatică, nu RFC 5322: forma exactă a unei adrese de email e
 * imposibil de prins corect cu o expresie regulată, iar încercările stricte
 * resping adrese valide. Singura dovadă reală că o adresă există e un email
 * trimis la ea — de asta newsletter-ul are `confirmed_at`.
 */
export function esteEmailValid(email: string): boolean {
  if (email.length > LIMITE.email) return false;
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email);
}

/**
 * Numele câmpului-capcană. Deliberat plauzibil: boturile completează automat
 * orice câmp cu nume cunoscut, iar „website" e printre primele. Un om nu-l vede
 * (e ascuns și scos din ordinea de tabulare), deci nu-l poate completa.
 *
 * Stă aici, nu în `antispam.ts`, fiindcă e nevoie de el în ambele lumi: browserul
 * randează câmpul, serverul îl citește — iar `antispam.ts` e `server-only`.
 */
export const CAMP_CAPCANA = "website";

/** Citește un câmp text din `FormData`, tăiat la limită și fără spații la capete. */
export function citesteText(formData: FormData, camp: string, limita: number): string {
  const valoare = formData.get(camp);
  if (typeof valoare !== "string") return "";
  return valoare.trim().slice(0, limita);
}
