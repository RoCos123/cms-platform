"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { adresaImaginii, adresaFisierului } from "@/lib/imagini-adrese";
import {
  BUCKET_MEDIA,
  buildStorageFileName,
  describeImageProblem,
  describeDocumentProblem,
  parsePixelDimension,
  type UploadImageResult,
  type UploadDocumentResult,
} from "@/lib/uploads";

/**
 * Un singur loc pentru toate mesajele: utilizatorul nu trebuie să vadă niciodată
 * textul brut de la Supabase („new row violates row-level security policy...").
 */
const GENERIC_UPLOAD_ERROR =
  "Nu am putut încărca imaginea. Mai încearcă o dată; dacă nu merge nici acum, verifică legătura la internet.";

/**
 * O coordonată a poziției pozei (0–100), venită din `formData`. Ca orice de pe
 * rețea, nu e garantat un număr întreg în interval — orice altceva devine `null`
 * (poziție necunoscută = centru), niciodată o valoare care ar cădea constrângerea
 * din bază.
 */
function procentPozitie(brut: FormDataEntryValue | null): number | null {
  if (typeof brut !== "string" || brut === "") return null;
  const numar = Number(brut);
  if (!Number.isInteger(numar) || numar < 0 || numar > 100) return null;
  return numar;
}

/**
 * Încărcarea unei imagini în bucketul `media`, sub prefixul propriului site.
 *
 * `siteId` vine EXCLUSIV din sesiune (`verifySession`), niciodată din `formData`:
 * altfel oricine ar putea trimite alt `site_id` și ar scrie în folderul altui
 * cabinet. Politicile de Storage compară oricum primul segment al căii cu
 * `current_site_id()`, deci ar respinge cererea — dar nu ne bazăm pe ele ca pe
 * singura încuietoare.
 */
export async function uploadImage(formData: FormData): Promise<UploadImageResult> {
  // Autentificarea înaintea oricărei alte verificări: nu facem muncă pentru
  // cineva care nici nu are voie să ajungă aici.
  const { siteId } = await verifySession();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "Nu am primit niciun fișier. Alege o imagine și încearcă din nou." };
  }

  // Aceeași validare rulează și în browser, dar aceea e doar pentru UX: cererea
  // poate fi trimisă și fără interfața noastră, deci aici e granița reală.
  const problem = describeImageProblem({
    name: file.name,
    type: file.type,
    size: file.size,
  });
  if (problem) {
    return { ok: false, error: problem };
  }

  const supabase = await createClient();

  const storagePath = `${siteId}/${crypto.randomUUID()}-${buildStorageFileName(file.name)}`;

  const { error: storageError } = await supabase.storage.from(BUCKET_MEDIA).upload(storagePath, file, {
    contentType: file.type,
    // UUID-ul din cale face fiecare fișier unic, deci conținutul nu se mai
    // schimbă niciodată la aceeași adresă și poate fi ținut în cache la maximum.
    cacheControl: "31536000",
    upsert: false,
  });

  if (storageError) {
    return { ok: false, error: GENERIC_UPLOAD_ERROR };
  }

  // Ca și `uploadId` mai jos: ce vine din `formData` nu e garantat un text.
  // `String(unFișier)` ar strecura „[object File]" ca descriere a imaginii.
  const rawAltText = formData.get("altText");
  const altText = typeof rawAltText === "string" ? rawAltText.trim() : "";

  // Poziția aleasă la încărcare (trasă în ramă, ca la Facebook). Constrângerea
  // din bază le cere împreună: dacă lipsește una, o lăsăm pe amândouă goale, adică
  // centru — poziția implicită.
  const px = procentPozitie(formData.get("focal_x"));
  const py = procentPozitie(formData.get("focal_y"));
  const focalX = px !== null && py !== null ? px : null;
  const focalY = px !== null && py !== null ? py : null;

  const latime = parsePixelDimension(formData.get("width"));
  const inaltime = parsePixelDimension(formData.get("height"));

  const { data: upload, error: insertError } = await supabase
    .from("uploads")
    .insert({
      site_id: siteId,
      storage_path: storagePath,
      filename: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      width: latime,
      height: inaltime,
      alt_text: altText || null,
      focal_x: focalX,
      focal_y: focalY,
    })
    .select("id")
    // Fără tipuri generate din schemă, clientul Supabase întoarce `any` — iar
    // `uploadId` ajunge tocmai înapoi la formular, unde ne trebuie `string`.
    .single<{ id: string }>();

  if (insertError || !upload) {
    // Fișierul a ajuns în bucket, dar fără rând în `uploads` nu l-ar mai găsi
    // nimeni niciodată — îl scoatem, ca bucketul să nu adune gunoi invizibil.
    await supabase.storage.from(BUCKET_MEDIA).remove([storagePath]);
    return { ok: false, error: GENERIC_UPLOAD_ERROR };
  }

  // Biblioteca media și orice ecran care listează imagini stau sub /dashboard.
  // Site-ul public nu se atinge: o imagine abia încărcată nu e încă folosită
  // nicăieri, iar legarea ei de o secțiune trece prin salvarea acelei secțiuni.
  revalidatePath("/dashboard", "layout");

  return {
    ok: true,
    image: {
      uploadId: upload.id,
      url: adresaImaginii(upload.id),
      altText,
      ...(focalX !== null && focalY !== null ? { pozitie: { x: focalX, y: focalY } } : {}),
      // Măsurile merg cu poza în conținutul secțiunii, ca o secțiune care o
      // arată întreagă să-și poată potrivi caseta după ea. Amândouă sau
      // niciuna: o singură latură nu dă un raport.
      ...(latime !== null && inaltime !== null ? { latime, inaltime } : {}),
    },
  };
}

const GENERIC_DOCUMENT_ERROR =
  "Nu am putut încărca documentul. Mai încearcă o dată; dacă nu merge nici acum, verifică legătura la internet.";

/**
 * Încărcarea unui DOCUMENT (PDF/Word) în bibliotecă, sub prefixul propriului site.
 *
 * Geamăn cu `uploadImage`, aceleași granițe (site-ul din sesiune, nu din formular;
 * validare pe server ca singura care contează). Diferă doar prin ce ține un
 * document: fără dimensiuni în pixeli, fără punct focal, fără text alternativ —
 * un fișier se descarcă, nu se așază într-o ramă.
 */
export async function uploadDocument(formData: FormData): Promise<UploadDocumentResult> {
  const { siteId } = await verifySession();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "Nu am primit niciun fișier. Alege un document și încearcă din nou." };
  }

  const problem = describeDocumentProblem({ name: file.name, type: file.type, size: file.size });
  if (problem) {
    return { ok: false, error: problem };
  }

  const supabase = await createClient();

  const storagePath = `${siteId}/${crypto.randomUUID()}-${buildStorageFileName(file.name)}`;
  const contentType = file.type || "application/octet-stream";

  const { error: storageError } = await supabase.storage.from(BUCKET_MEDIA).upload(storagePath, file, {
    contentType,
    cacheControl: "31536000",
    upsert: false,
  });

  if (storageError) {
    return { ok: false, error: GENERIC_DOCUMENT_ERROR };
  }

  const { data: upload, error: insertError } = await supabase
    .from("uploads")
    .insert({
      site_id: siteId,
      storage_path: storagePath,
      filename: file.name,
      mime_type: contentType,
      size_bytes: file.size,
      // Un document n-are dimensiuni, nici punct focal.
      width: null,
      height: null,
      alt_text: null,
      focal_x: null,
      focal_y: null,
    })
    .select("id")
    .single<{ id: string }>();

  if (insertError || !upload) {
    await supabase.storage.from(BUCKET_MEDIA).remove([storagePath]);
    return { ok: false, error: GENERIC_DOCUMENT_ERROR };
  }

  revalidatePath("/dashboard", "layout");

  return {
    ok: true,
    document: {
      uploadId: upload.id,
      url: adresaFisierului(upload.id),
      filename: file.name,
      marimeOcteti: file.size,
    },
  };
}
