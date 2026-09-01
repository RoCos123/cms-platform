import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Adresa sub care se vede o imagine, acum că depozitul e privat.
 *
 * DE CE EXISTĂ FIȘIERUL ĂSTA. Până acum bucket-ul `media` era public: adresa
 * unei poze era un link direct către Supabase, iar oricine putea nu doar s-o
 * deschidă, ci și să ceară LISTA tuturor fișierelor tuturor cabinetelor.
 * Cerința proprietarului e fără nuanțe: un client nu atinge niciodată fișierele
 * altui client. Deci bucket-ul devine privat, iar pozele se servesc printr-o
 * rută de-a noastră.
 *
 * DE CE O SEMNĂTURĂ, ȘI NU TENANTUL DIN ANTET. Ruta ar fi putut citi cabinetul
 * din antetul pus de proxy și verifica acolo apartenența. Nu merge, și nu e o
 * chestiune de gust: optimizatorul de imagini din Next își cere singur fișierul
 * printr-o cerere construită în memorie, iar `fetchInternalImage` cheamă
 * `createRequestResponseMocks({ url, method, socket })` — FĂRĂ anteturi (verificat
 * în node_modules/next/dist/server/{image-optimizer,lib/mock-request}.js). O rută
 * care depinde de antetul de tenant s-ar rupe în spatele optimizatorului, sau —
 * mai rău — ar merge pe Vercel și ar cădea în dezvoltare, adică exact felul de
 * diferență care se descoperă în ziua lansării.
 *
 * Așa că adresa se apără singură: poartă o semnătură pe care numai serverul
 * nostru o poate produce. Nimeni nu poate fabrica adresa unei poze a altui
 * cabinet, oricâte id-uri ar ghici.
 *
 * DE CE CHEIA DE SERVICIU, ȘI NU O VARIABILĂ NOUĂ. O variabilă de mediu în plus
 * e o variabilă care poate lipsi — iar dacă lipsește, ori se închid toate
 * pozele, ori (mai rău) cineva pune o portiță „mergi fără semnătură”. Cheia de
 * serviciu există deja pe orice mediu unde aplicația poate funcționa, nu ajunge
 * niciodată în browser, iar un HMAC nu dezvăluie nimic despre ea. Dacă vreodată
 * se schimbă cheia, adresele vechi expiră singure: paginile se randează din nou
 * la fiecare cerere, deci noile adrese apar imediat.
 */

/**
 * Jumătate dintr-un SHA-256 e mai mult decât destul: 128 de biți înseamnă că a
 * ghici o semnătură e la fel de greu ca a ghici o cheie. Tăiem ca adresa să
 * rămână citibilă într-un jurnal sau într-un raport de eroare.
 */
const OCTETI_SEMNATURA = 16;

export function semneaza(secret: string, uploadId: string): string {
  // Tăiem OCTEȚII, nu caracterele: felierea textului base64 ar lăsa la coadă un
  // caracter care codează doar o parte dintr-un octet, iar câți biți rămân
  // devine o socoteală de făcut în cap. 16 octeți → exact 22 de caractere.
  return createHmac("sha256", secret)
    .update(uploadId)
    .digest()
    .subarray(0, OCTETI_SEMNATURA)
    .toString("base64url");
}

/**
 * Comparație în timp constant. Cu `===`, timpul de răspuns ar spune câte
 * caractere de la început au nimerit, iar semnătura s-ar putea afla caracter cu
 * caracter.
 *
 * Se compară TAMPOANELE, nu textele: `timingSafeEqual` aruncă pe lungimi
 * diferite, iar un caracter cu diacritice ocupă doi octeți — două șiruri de
 * aceeași lungime în caractere pot avea lungimi diferite în octeți. Fără
 * verificarea de dedesubt, cineva ar fi putut face ruta să arunce trimițând
 * „semnături” cu diacritice.
 */
export function semnaturaEValida(secret: string, uploadId: string, primita: string): boolean {
  const asteptata = Buffer.from(semneaza(secret, uploadId));
  const data = Buffer.from(primita);
  if (data.length !== asteptata.length) return false;

  return timingSafeEqual(data, asteptata);
}

/** Tiparul unui UUID, ca un id inventat să nu ajungă niciodată la baza de date. */
const TIPAR_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function idValid(uploadId: string): boolean {
  return TIPAR_UUID.test(uploadId);
}

function cheia(): string {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) {
    throw new Error(
      "Lipsește SUPABASE_SECRET_KEY. Fără ea nu se pot semna adresele imaginilor, " +
        "iar depozitul fiind privat, nicio poză nu s-ar putea afișa.",
    );
  }
  return secret;
}

/**
 * Adresa unei imagini, gata de pus în `src`.
 *
 * Relativă, nu absolută: ajunge pe domeniul clientului care se randează chiar
 * atunci, deci nu leagă poza de o gazdă anume și rămâne validă dacă se schimbă
 * domeniul. `section-image.tsx` tratează adresele relative ca „servite de noi”,
 * deci trec și prin optimizatorul de imagini.
 *
 * Semnătura stă ca segment de cale, nu ca parametru de interogare: unele CDN-uri
 * și cache-uri ignoră interogarea la calculul cheii, iar două poze diferite ar
 * ajunge să se suprascrie una pe alta în cache.
 */
export function adresaImaginii(uploadId: string): string {
  return `/imagini/${uploadId}/${semneaza(cheia(), uploadId)}`;
}
