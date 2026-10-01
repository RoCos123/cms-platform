import type { TemplateAsezari } from "@/lib/templates";

/**
 * Ce FORMĂ are rama în care ajunge o poză, pe site.
 *
 * DE CE EXISTĂ. În panou, poza se trage într-o ramă ca s-o poziționezi — și
 * rama aia era PĂTRATĂ peste tot, deși pe site sunt șapte forme diferite:
 * „Despre mine" e 4/5, galeria de șabloane 16/9, cartonașul unui program 3/2,
 * copertele de articol 16/9 și așa mai departe. Deci ce încadrai nu era ce
 * ieșea.
 *
 * Mai rău: `object-fit: cover` lasă poza să se miște doar pe axa pe care îi
 * PRISOSEȘTE ceva. O poză lată într-o ramă pătrată n-are joc pe verticală, dar
 * într-o ramă 4/5 are și mai puțin — iar proprietarul trăgea în sus, nu se
 * întâmpla nimic, și nimic nu-i spunea de ce (1 oct. 2026). Cu rama potrivită,
 * ce vede în panou e exact ce poate face pe site.
 *
 * Unele forme depind de ȘABLON (la „Despre mine", Claritate taie poza în cerc,
 * restul într-un dreptunghi vertical) sau de VARIANTA rândului (galeria de
 * șabloane față de un program obișnuit). De-aia regula primește așezările și
 * varianta, nu doar numele câmpului.
 *
 * Ține de forma de pe site, deci se schimbă ÎMPREUNĂ cu componenta care
 * desenează rama. Probele din `e2e/rame-poze.proba.mjs` compară valorile de
 * aici cu `aspectRatio`-urile scrise în componente, ca cele două să nu se
 * depărteze în tăcere.
 */
export function raportRamei(
  cheieSectiune: string,
  drumCamp: string,
  context: { asezari: TemplateAsezari; variant?: string | null },
): string | undefined {
  // Indicii listelor nu contează: al treilea program are aceeași ramă ca primul.
  const camp = drumCamp.replace(/\.\d+\./g, ".");
  const { asezari, variant } = context;

  if (cheieSectiune === "hero" && camp === "imagine") {
    // `pozaLata` e peisaj pe toată lățimea; restul, pătrat sub arcadă.
    return asezari.hero === "pozaLata" ? "16 / 9" : "1 / 1";
  }

  if (cheieSectiune === "aboutTeaser" && camp === "imagine") {
    return asezari.desprePozaRotunda ? "1 / 1" : "4 / 5";
  }

  if (cheieSectiune === "portfolio" && camp === "elemente.imagine") {
    // „vitrina" — galeria de șabloane de pe sitepsihologi; restul, cartonașul
    // obișnuit al unui program.
    return variant === "vitrina" ? "16 / 9" : "3 / 2";
  }

  if (cheieSectiune === "logos" && camp === "elemente.imagine") {
    return "16 / 9";
  }

  // Necunoscut → `undefined`, iar rama rămâne pătrată, ca până acum. Un câmp
  // nou nu trebuie să strice panoul fiindcă nimeni nu l-a trecut aici.
  return undefined;
}
