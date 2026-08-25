"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import {
  buildStorageFileName,
  describeImageProblem,
  parsePixelDimension,
  type DeleteUploadResult,
  type UploadImageResult,
} from "@/lib/uploads";

const BUCKET = "media";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Un singur loc pentru toate mesajele: utilizatorul nu trebuie să vadă niciodată
 * textul brut de la Supabase („new row violates row-level security policy...").
 */
const GENERIC_UPLOAD_ERROR =
  "Nu am putut încărca imaginea. Mai încearcă o dată; dacă nu merge nici acum, verifică legătura la internet.";

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

  const { error: storageError } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
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

  const { data: upload, error: insertError } = await supabase
    .from("uploads")
    .insert({
      site_id: siteId,
      storage_path: storagePath,
      filename: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      width: parsePixelDimension(formData.get("width")),
      height: parsePixelDimension(formData.get("height")),
      alt_text: altText || null,
    })
    .select("id")
    // Fără tipuri generate din schemă, clientul Supabase întoarce `any` — iar
    // `uploadId` ajunge tocmai înapoi la formular, unde ne trebuie `string`.
    .single<{ id: string }>();

  if (insertError || !upload) {
    // Fișierul a ajuns în bucket, dar fără rând în `uploads` nu l-ar mai găsi
    // nimeni niciodată — îl scoatem, ca bucketul să nu adune gunoi invizibil.
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return { ok: false, error: GENERIC_UPLOAD_ERROR };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  // Biblioteca media și orice ecran care listează imagini stau sub /dashboard.
  revalidatePath("/dashboard", "layout");

  return { ok: true, image: { uploadId: upload.id, url: publicUrl, altText } };
}

/**
 * Șterge definitiv o imagine: întâi rândul din `uploads`, apoi obiectul din
 * Storage.
 *
 * Ordinea contează. Ștergând întâi rândul, cheile externe `cover_upload_id` se
 * pun automat pe null (on delete set null) și nicio pagină nu mai poate arăta o
 * imagine care nu mai există. Dacă ștergerea din Storage eșuează după aceea,
 * rămâne un fișier orfan — costă câțiva kilobytes, dar nu strică niciun ecran.
 * Invers, un rând rămas în urma fișierului ar produce imagini rupte pe site.
 */
export async function deleteUpload(uploadId: string): Promise<DeleteUploadResult> {
  const { siteId } = await verifySession();

  // Argumentele unui Server Action vin de pe rețea, deci tipul din semnătură nu
  // garantează nimic la rulare. Un id care nu arată a UUID ar ajunge altfel în
  // Postgres și ar da o eroare de conversie în loc de un mesaj omenesc.
  if (!UUID_PATTERN.test(uploadId)) {
    return { ok: false, error: "Nu știu ce imagine să șterg. Reîncarcă pagina și încearcă din nou." };
  }

  const supabase = await createClient();

  // `eq("site_id")` e redundant față de RLS, dar face intenția explicită în cod:
  // nimeni nu șterge din biblioteca altui cabinet.
  const { data: upload } = await supabase
    .from("uploads")
    .select("storage_path")
    .eq("id", uploadId)
    .eq("site_id", siteId)
    .maybeSingle<{ storage_path: string }>();

  if (!upload) {
    return { ok: false, error: "Imaginea nu mai există. Probabil a fost ștearsă deja." };
  }

  const { error: deleteError } = await supabase
    .from("uploads")
    .delete()
    .eq("id", uploadId)
    .eq("site_id", siteId);

  if (deleteError) {
    return {
      ok: false,
      error: "Nu am putut șterge imaginea. Mai încearcă o dată peste câteva momente.",
    };
  }

  await supabase.storage.from(BUCKET).remove([upload.storage_path]);

  revalidatePath("/dashboard", "layout");

  return { ok: true };
}
