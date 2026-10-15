/**
 * Rândul din stânga al barei de jos din subsol: „© 2026 Popescu Robert".
 *
 * Până pe 15 oct. 2026 rândul se compunea singur — anul de azi și numele
 * cabinetului, același din antet —, deci nu se putea scrie altfel (de exemplu cu
 * denumirea întreagă și CIF-ul). Acum e un câmp în Setări („Textul de copyright din
 * subsol"): dacă are text, rândul arată exact acel text; dacă e gol, rămâne ca înainte.
 * Niciun site existent nu are câmpul, deci niciunul nu se schimbă.
 *
 * `{an}` din text devine anul curent. Fără el, cine scrie „© 2026 …" de mână ar
 * rămâne cu un an învechit din prima ianuarie, iar nimeni nu și-ar mai aminti să-l
 * schimbe. Cine vrea totuși un an anume, îl scrie ca număr.
 *
 * Fișier neutru (nici „use client", nici `server-only`): îl folosesc și subsolul de
 * pe site, și previzualizarea din Setări, care rulează în browser.
 */
export const MAX_COPYRIGHT = 200;

export function randulDeCopyright(copyright: unknown, an: number, nume: string): string {
  const scris = typeof copyright === "string" ? copyright.trim() : "";
  if (scris === "") return `© ${an} ${nume}`;

  return scris.replace(/\{an\}/gi, String(an));
}
