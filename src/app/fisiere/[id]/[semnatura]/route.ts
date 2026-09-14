import { createServiceClient } from "@/lib/supabase/admin";
import { ACCEPTED_DOCUMENT_TYPES, BUCKET_MEDIA } from "@/lib/uploads";
import { idValid, semnaturaEValida } from "@/lib/imagini-adrese";

/**
 * Servește un DOCUMENT din depozitul privat, pentru descărcare.
 *
 * Aceeași poartă ca la imagini (`/imagini/[id]/[semnatura]`): depozitul e privat,
 * iar singura cale spre un fișier e o adresă semnată de noi — nimeni nu ajunge la
 * fișierele altui cabinet oricâte id-uri ar ghici (vezi `src/lib/imagini-adrese.ts`).
 *
 * Diferența față de imagini: fișierul se DESCARCĂ, nu se deschide în filă
 * (`Content-Disposition: attachment`), cu numele pe care l-a pus clientul.
 */
const TIPURI_PERMISE: readonly string[] = ACCEPTED_DOCUMENT_TYPES;

export async function GET(
  _cerere: Request,
  { params }: { params: Promise<{ id: string; semnatura: string }> },
) {
  const { id, semnatura } = await params;

  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) {
    console.error("Lipsește SUPABASE_SECRET_KEY: nu se pot verifica adresele fișierelor.");
    return necunoscut();
  }

  // Id-ul înaintea semnăturii, ca un text oarecare din adresă să nu ajungă la bază.
  if (!idValid(id) || !semnaturaEValida(secret, id, semnatura)) return necunoscut();

  const service = createServiceClient();

  const { data: incarcare, error } = await service
    .from("uploads")
    .select("storage_path, mime_type, filename")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Citirea încărcării a eșuat:", error);
    return necunoscut();
  }

  if (!incarcare) return necunoscut();

  const { data: fisier, error: eroareDescarcare } = await service.storage
    .from(BUCKET_MEDIA)
    .download(incarcare.storage_path as string);

  if (eroareDescarcare || !fisier) {
    console.error("Descărcarea din depozit a eșuat:", eroareDescarcare);
    return necunoscut();
  }

  // Tipul se ia din lista pe care o acceptă încărcarea; orice altceva (ex. un
  // .docx raportat de browser ca octet-stream) se servește neutru — oricum se
  // descarcă, nu se interpretează.
  const tip = TIPURI_PERMISE.includes(incarcare.mime_type as string)
    ? (incarcare.mime_type as string)
    : "application/octet-stream";

  return new Response(fisier, {
    headers: {
      "Content-Type": tip,
      "Content-Disposition": dispozitieAtasament(incarcare.filename as string),
      // Aceeași plasă ca la imagini: nimic nu se execută din fișier, iar browserul
      // nu ghicește alt tip decât cel declarat.
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "X-Content-Type-Options": "nosniff",
      // Privat, cache scurt: adresa poartă id-ul (imutabil), dar un fișier e mai
      // sensibil decât o poză publică — nu-l lăsăm un an în cache-uri comune.
      "Cache-Control": "private, max-age=3600",
    },
  });
}

/**
 * `Content-Disposition` cu numele fișierului, în două forme: una ASCII, curățată,
 * pentru browsere vechi, și una `filename*` în UTF-8 pentru diacritice („Fișă
 * părinți.pdf"). Fără forma UTF-8, numele cu ș/ț ar ajunge cioburi.
 */
function dispozitieAtasament(numeBrut: string): string {
  const nume = (numeBrut || "document").replace(/[\r\n"]/g, "").trim() || "document";
  const asciiSigur =
    nume
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^\x20-\x7e]/g, "_") || "document";
  return `attachment; filename="${asciiSigur}"; filename*=UTF-8''${encodeURIComponent(nume)}`;
}

/** Un singur răspuns pentru toate refuzurile — cine încearcă nu află care dintre ele a fost. */
function necunoscut() {
  return new Response("Not Found", { status: 404, headers: { "Cache-Control": "no-store" } });
}
