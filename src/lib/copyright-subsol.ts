/**
 * Rândul din stânga al barei de jos din subsol: „© 2026 Popescu Robert".
 *
 * Până pe 15 oct. 2026 rândul se compunea singur — anul de azi și numele
 * cabinetului, același din antet —, deci nu se putea scrie altfel (de exemplu cu
 * denumirea întreagă și CIF-ul). Acum e un câmp în Setări („Textul de copyright din
 * subsol"). Niciun site existent nu are câmpul, deci niciunul nu se schimbă.
 *
 * Omul scrie DOAR textul („Cabinet Individual de Psihologie Popescu Cosmin Robert ·
 * CIF 54440949"); „© " și anul curent se pun singure în față (cerut de proprietar, 15 oct.
 * 2026, după ce prima variantă — „exact ce ai scris" — îl obliga să-și găsească semnul © pe
 * tastatură). Anul se schimbă singur în fiecare ianuarie.
 *
 * Două ieșiri pentru cine vrea altceva: dacă textul începe deja cu un semn de copyright
 * („©", „(c)", „Copyright"), rândul rămâne exact cum e scris, fără al doilea © în față;
 * iar `{an}` din text devine anul curent, ca cine scrie rândul întreg să nu rămână cu
 * un an învechit.
 *
 * Fișier neutru (nici „use client", nici `server-only`): îl folosesc și subsolul de
 * pe site, și previzualizarea din Setări, care rulează în browser.
 */
export const MAX_COPYRIGHT = 200;

export function randulDeCopyright(copyright: unknown, an: number, nume: string): string {
  const scris = typeof copyright === "string" ? copyright.trim() : "";
  if (scris === "") return `© ${an} ${nume}`;

  const text = scris.replace(/\{an\}/gi, String(an));

  // Cine a scris deja semnul își are rândul gata: nu punem altul în față.
  if (/^(©|\(c\)|copyright\b)/i.test(text)) return text;

  return `© ${an} ${text}`;
}
