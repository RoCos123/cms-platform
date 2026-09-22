/**
 * Regulile de încărcare a imaginilor, într-un singur loc.
 *
 * Fișierul e neutru (nici „use client", nici „use server") pentru că exact
 * aceleași reguli trebuie să ruleze în două locuri: în browser, ca utilizatorul
 * să afle imediat că fișierul nu e bun, și pe server, unde e singura verificare
 * care contează. Un fișier cu „use server" nu poate exporta decât funcții async,
 * deci constantele și tipurile nu pot locui în `src/app/actions/upload.ts`.
 */

import type { PunctFocal } from "@/lib/punct-focal";

/**
 * Un singur bucket pentru toate site-urile, cu prefix `site_id/` (decizii-faza-0
 * §4). Numele stă aici, nu în acțiunea de încărcare: îl citesc și încărcarea, și
 * ștergerea, și construirea adreselor publice pentru bibliotecă — trei locuri
 * din care doar unul ar fi fost actualizat la o redenumire.
 */
export const BUCKET_MEDIA = "media";

export const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
] as const;

export type AcceptedImageType = (typeof ACCEPTED_IMAGE_TYPES)[number];

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Textele de sub zona de încărcare — scrise pentru client, nu pentru developer. */
export const ACCEPTED_IMAGE_LABEL = "PNG, JPEG, WebP sau SVG";
export const MAX_IMAGE_SIZE_LABEL = "5 MB";

/** Valoarea pentru `accept` pe `<input type="file">`. */
export const IMAGE_INPUT_ACCEPT = ACCEPTED_IMAGE_TYPES.join(",");

/** Imaginea așa cum o vede formularul: referința, adresa publică și textul alternativ. */
export type ImageValue = {
  uploadId: string;
  url: string;
  altText: string;
  /**
   * Ce parte a pozei să rămână în cadru când e tăiată (`object-fit: cover`).
   * Lipsă = centru, adică purtarea de dinainte. Vezi `@/lib/punct-focal`.
   */
  pozitie?: PunctFocal;
  /**
   * Măsurile pozei, în pixeli, așa cum au fost citite din fișier la încărcare
   * (`measureImage`). Stau LÂNGĂ poză, în conținutul secțiunii, din același
   * motiv pentru care stă și `url`: site-ul public randează imaginile fără să
   * mai întrebe tabelul `uploads`, deci pagina unui client nu depinde de o a
   * doua interogare ca să afișeze o poză.
   *
   * Pentru ce: o secțiune care vrea să arate poza ÎNTREAGĂ, netăiată, are
   * nevoie de raportul ei ca să-și potrivească înălțimea casetei — altfel
   * caseta are un raport fix, iar tot ce nu intră se taie. Vezi cartonașul
   * „vitrina" din galeria de șabloane.
   *
   * Lipsesc la pozele încărcate înainte de 22 sept. 2026 și la cele al căror
   * fișier n-a putut fi măsurat (un SVG fără dimensiuni scrise în el). Cine le
   * folosește trebuie să aibă o purtare de rezervă; nu se presupune niciodată
   * că există.
   */
  latime?: number;
  inaltime?: number;
};

export type UploadImageResult =
  | { ok: true; image: ImageValue }
  | { ok: false; error: string };

/** Doar cât ne trebuie ca să validăm — așa putem testa fără un `File` real. */
export type ImageCandidate = {
  name: string;
  type: string;
  size: number;
};

const MEGABYTE = 1024 * 1024;

/**
 * Rotunjire în SUS, la o zecimală. Rotunjirea normală face ca un fișier de
 * 5,04 MB să apară ca „5", iar mesajul ajunge „Imaginea are 5 MB, iar limita e
 * 5 MB" — omul nu are cum să înțeleagă de ce a fost refuzată. În sus, orice
 * fișier peste limită se vede peste limită.
 */
function formatMegabytes(bytes: number): string {
  const megabytes = Math.ceil((bytes / MEGABYTE) * 10) / 10;

  return new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 1 }).format(
    megabytes,
  );
}

function isAcceptedType(type: string): type is AcceptedImageType {
  return (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(type);
}

/**
 * Întoarce mesajul de arătat utilizatorului, sau `null` dacă fișierul e bun.
 * Mesajul spune și ce are de făcut mai departe — un „format neacceptat" sec
 * lasă omul blocat, fără să știe ce alt fișier să caute.
 */
export function describeImageProblem(file: ImageCandidate): string | null {
  if (!file.name || file.size === 0) {
    return "Fișierul pare gol. Alege altul sau mai încearcă o dată.";
  }

  if (!isAcceptedType(file.type)) {
    return `Fișierul acesta nu e o imagine pe care o putem folosi. Acceptăm ${ACCEPTED_IMAGE_LABEL}.`;
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return `Imaginea are ${formatMegabytes(file.size)} MB, iar limita e ${MAX_IMAGE_SIZE_LABEL}. Alege o variantă mai mică sau micșoreaz-o înainte de încărcare.`;
  }

  return null;
}

/**
 * Curăță numele fișierului pentru cheia din Storage: diacriticele și spațiile
 * din „Poză cabinet.JPG" ajung altfel codificate procentual în adresa publică și
 * fac URL-uri imposibil de citit sau de depanat.
 */
export function buildStorageFileName(originalName: string): string {
  const normalized = originalName
    .normalize("NFD")
    // Semnele diacritice rămase separat după normalizare (ă, â, î, ș, ț).
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-");

  const lastDot = normalized.lastIndexOf(".");
  const hasExtension = lastDot > 0 && lastDot < normalized.length - 1;

  const rawBase = hasExtension ? normalized.slice(0, lastDot) : normalized;
  const extension = hasExtension
    ? normalized.slice(lastDot + 1).replace(/[^a-z0-9]/g, "")
    : "";

  const base =
    rawBase
      .replace(/\./g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      // Cheia completă mai primește și un UUID în față; tăiem ca să nu lovim
      // limita de lungime a numelui de obiect din Storage.
      .slice(0, 60)
      .replace(/-+$/, "") || "imagine";

  return extension ? `${base}.${extension}` : base;
}

/**
 * Dimensiunile reale ale imaginii se citesc în browser și se trimit ca metadata:
 * server-ul nu poate deschide antetul fișierului fără o librărie în plus, iar
 * fără lățime/înălțime biblioteca nu poate arăta niciodată „1200 × 630".
 *
 * Stă aici, lângă restul regulilor, fiindcă o cer amândouă locurile din care se
 * încarcă imagini: câmpul dintr-un formular și ecranul Imagini.
 */
export async function measureImage(
  file: Blob,
): Promise<{ width: number; height: number } | null> {
  if (typeof createImageBitmap !== "function") return null;

  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    // SVG-urile fără dimensiuni intrinseci pică aici. Lipsa metadatelor nu e
    // motiv să oprim încărcarea — imaginea în sine e perfect bună.
    return null;
  }
}

/**
 * Dimensiunile în pixeli vin din browser (server-ul nu poate citi antetul
 * imaginii fără o librărie în plus). Sunt doar metadata afișată în bibliotecă,
 * nu o graniță de securitate — dar tot le limităm, ca un număr aberant să nu
 * ajungă în coloana `integer`.
 */
export function parsePixelDimension(raw: FormDataEntryValue | null): number | null {
  if (typeof raw !== "string" || raw === "") return null;

  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0 || value > 50_000) return null;

  return value;
}

// ----------------------------------------------------------------------------
// Documente (fișe, formulare) — pentru descărcare, nu pentru afișare.
//
// Stau în ACELAȘI depozit și tabel ca pozele (bucketul `media` n-a avut niciodată
// restricție de tip, iar `uploads.mime_type` acceptă orice text — verificat în
// migrarea `init_schema`). Ce le deosebește de poze e tipul: un document nu se
// arată într-o ramă, ci se descarcă. Deci nu au dimensiuni, nici punct focal.
// ----------------------------------------------------------------------------

export const ACCEPTED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

/**
 * 5 MB: o fișă sau un formular PDF trece lejer, dar limita e legată de ceva mai
 * puțin vizibil — `serverActions.bodySizeLimit` din `next.config.ts` (6 MB).
 * `uploadDocument` e un Server Action, deci fișierul trece întâi prin plafonul
 * ăluia; un document acceptat aici (dar peste 6 MB) ar fi respins de framework
 * ÎNAINTE de verificarea noastră, cu o eroare pe care omul n-o înțelege. Ținem
 * limita sub plafon, cu spațiu pentru overhead-ul cererii. Dacă vreodată crește,
 * crește ȘI `bodySizeLimit`, altfel se rupe tăcut. (Prins într-un audit.)
 */
export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;

export const ACCEPTED_DOCUMENT_LABEL = "PDF sau Word";
export const MAX_DOCUMENT_SIZE_LABEL = "5 MB";

/** Pentru `accept` pe `<input type="file">`: tipuri ȘI extensii (unele browsere raportează .docx greșit). */
export const DOCUMENT_INPUT_ACCEPT = [...ACCEPTED_DOCUMENT_TYPES, ".pdf", ".doc", ".docx"].join(",");

/** Documentul așa cum îl vede formularul: referința, adresa de descărcare, numele. */
export type DocumentValue = {
  uploadId: string;
  url: string;
  filename: string;
  marimeOcteti: number;
};

export type UploadDocumentResult =
  | { ok: true; document: DocumentValue }
  | { ok: false; error: string };

/** Un document ca opțiune în alegătorul de materiale din editor (dropdown). */
export type OptiuneDocument = {
  id: string;
  numeFisier: string;
  url: string;
};

/**
 * E un document încărcabil? Întâi după tip (sursa de adevăr), dar și după
 * extensie: unele browsere raportează un .docx ca `application/octet-stream` sau
 * gol. Riscul e mic — fișierul se DESCARCĂ, nu se execută, și se servește cu
 * „attachment" + `nosniff`, deci nici măcar nu e interpretat de browser.
 */
export function esteDocumentAcceptat(file: ImageCandidate): boolean {
  if ((ACCEPTED_DOCUMENT_TYPES as readonly string[]).includes(file.type)) return true;
  return /\.(pdf|docx?)$/i.test(file.name);
}

/** Un mime_type stocat aparține unui document? (Pentru a separa pozele de fișiere în bibliotecă.) */
export function esteMimeDocument(mimeType: string | null | undefined): boolean {
  return typeof mimeType === "string" && !mimeType.startsWith("image/");
}

/** Mesajul de arătat, sau `null` dacă documentul e bun. Spune și ce are de făcut mai departe. */
export function describeDocumentProblem(file: ImageCandidate): string | null {
  if (!file.name || file.size === 0) {
    return "Fișierul pare gol. Alege altul sau mai încearcă o dată.";
  }

  if (!esteDocumentAcceptat(file)) {
    return `Fișierul acesta nu e un document pe care îl putem folosi. Acceptăm ${ACCEPTED_DOCUMENT_LABEL}.`;
  }

  if (file.size > MAX_DOCUMENT_BYTES) {
    return `Documentul are ${formatMegabytes(file.size)} MB, iar limita e ${MAX_DOCUMENT_SIZE_LABEL}. Alege o variantă mai mică.`;
  }

  return null;
}
