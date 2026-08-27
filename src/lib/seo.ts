import "server-only";

import { headers } from "next/headers";
import { getTenant } from "@/lib/dal";

/**
 * Adresa de bază a site-ului, pe domeniul propriu al clientului.
 *
 * Totul pleacă de aici: adresa canonică, sitemap-ul, robots-ul, linkurile din
 * cardurile sociale. O singură sursă, deliberat — originalul avea trei liste de
 * adrese scrise de mână, desincronizate între ele, iar sitemap-ul lui trimitea
 * motoarele de căutare în 404-uri (audit-site-public.md §3.2).
 *
 * Mereu `https://`, niciodată gazda de pe care s-a servit cererea: același site
 * răspunde și pe adrese de preview, iar o adresă de preview scrisă într-un
 * sitemap i-ar spune lui Google că acolo stă varianta oficială a cabinetului.
 */
export async function adresaSiteului(): Promise<URL> {
  const { domain } = await getTenant();
  return new URL(`https://${domain}`);
}

/**
 * Aceeași adresă, dar `null` în loc de excepție când tenantul nu e rezolvat.
 *
 * Îi trebuie layoutului rădăcină, fiindcă acela înfășoară și
 * `/site-unavailable` — pagina servită TOCMAI fiindcă niciun client nu s-a
 * putut rezolva pentru gazda cerută. Acolo antetele puse de proxy lipsesc, iar
 * un layout care ar arunca odată cu `getTenant()` ar înlocui explicația
 * omenească a problemei cu o eroare de server.
 */
export async function adresaSiteuluiOptionala(): Promise<URL | null> {
  const domeniu = (await headers()).get("x-site-domain");
  return domeniu ? new URL(`https://${domeniu}`) : null;
}

/**
 * O cale de pe site, ca adresă absolută.
 *
 * Prin `URL` și nu prin lipit de șiruri: un slug cu diacritice sau spațiu se
 * codează singur, iar o bară în plus nu mai produce `//articol`.
 */
export function adresaAbsoluta(baza: URL, cale: string): string {
  return new URL(cale, baza).toString();
}
