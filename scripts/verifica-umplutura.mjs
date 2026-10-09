/**
 * Verificarea automată a regulii din 9 oct. 2026 (brief 1.2): pică dacă HTML-ul
 * public al unei pagini conține text de umplutură între paranteze drepte —
 * „[Numele]", „[Aici vine…]". Vezi `src/lib/umplutura.ts`.
 *
 *   node --import ./e2e/alias.mjs scripts/verifica-umplutura.mjs https://sitepsihologi.ro/ [alte adrese…]
 *
 * Pe bancul local, unde site-ul se alege după gazdă:
 *   GAZDA=sitepsihologi.test:4321 node --import ./e2e/alias.mjs scripts/verifica-umplutura.mjs http://127.0.0.1:4321/
 *
 * Ieșire 0 = curat peste tot; 1 = măcar o pagină are umplutură (o listează); 2 = o
 * pagină n-a putut fi citită — o verificare care n-a văzut pagina nu spune „curat".
 */
import { umpluturaInHtml } from "@/lib/umplutura";

const adrese = process.argv.slice(2);
if (adrese.length === 0) {
  console.error("Dă măcar o adresă. Ex.: … scripts/verifica-umplutura.mjs https://sitepsihologi.ro/");
  process.exit(2);
}

const gazda = process.env.GAZDA;
let cod = 0;

for (const adresa of adrese) {
  let html;
  try {
    const raspuns = await fetch(adresa, { headers: gazda ? { host: gazda } : {} });
    if (!raspuns.ok) throw new Error(`răspuns ${raspuns.status}`);
    html = await raspuns.text();
  } catch (eroare) {
    console.error(`✗ ${adresa}: n-am putut citi pagina (${eroare.message}).`);
    cod = Math.max(cod, 2);
    continue;
  }

  const gasite = umpluturaInHtml(html);
  if (gasite.length === 0) {
    console.log(`✓ ${adresa}: fără text de umplutură.`);
  } else {
    console.log(`✗ ${adresa}: ${gasite.length} bucăți de umplutură:`);
    for (const bucata of gasite) console.log(`    ${bucata}`);
    cod = Math.max(cod, 1);
  }
}

process.exit(cod);
