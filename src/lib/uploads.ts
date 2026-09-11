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
