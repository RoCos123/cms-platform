import { createServiceClient } from "@/lib/supabase/admin";
import { ACCEPTED_IMAGE_TYPES, BUCKET_MEDIA } from "@/lib/uploads";
import { idValid, semnaturaEValida } from "@/lib/imagini-adrese";

/**
 * Servește o imagine din depozitul privat.
 *
 * Depozitul nu mai e public (vezi migrarea `depozit_privat`), deci nimeni nu mai
 * poate cere lista fișierelor și nimeni nu mai ajunge la un fișier direct la
 * Supabase. Singura cale către o poză e aici, iar aici se intră doar cu o adresă
 * semnată de noi — vezi `src/lib/imagini-adrese.ts` pentru de ce semnătură și nu
 * tenantul din antet.
 *
 * Ruta e scoasă din `matcher`-ul proxy-ului dinadins: nu are nevoie de tenant,
 * iar cererea pe care și-o face singur optimizatorul de imagini vine fără niciun
 * antet. Ce n-are nevoie de anteturi nu trebuie să depindă de ele.
 */

/** Un an, marcat `immutable`: adresa poartă id-ul încărcării, iar o încărcare nu se schimbă niciodată — o poză nouă înseamnă un id nou. */
const CACHE = "public, max-age=31536000, immutable";

const TIPURI_PERMISE: readonly string[] = ACCEPTED_IMAGE_TYPES;

export async function GET(
  _cerere: Request,
  { params }: { params: Promise<{ id: string; semnatura: string }> },
) {
  const { id, semnatura } = await params;

  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) {
    console.error("Lipsește SUPABASE_SECRET_KEY: nu se pot verifica adresele imaginilor.");
    return necunoscut();
  }

  // Id-ul se verifică ÎNAINTE de semnătură, ca un text oarecare din adresă să nu
  // ajungă niciodată la baza de date.
  if (!idValid(id) || !semnaturaEValida(secret, id, semnatura)) return necunoscut();

  const service = createServiceClient();

  const { data: incarcare, error } = await service
    .from("uploads")
    .select("storage_path, mime_type")
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
    // Rândul există, fișierul nu: se întâmplă dacă o ștergere a mers pe jumătate.
    console.error("Descărcarea din depozit a eșuat:", eroareDescarcare);
    return necunoscut();
  }

  /*
   * Tipul se ia din lista pe care o acceptă încărcarea, nu direct din coloană.
   * Coloana e umplută din ce declară browserul la încărcare — dacă vreodată
   * scapă acolo altceva, nu vrem să-l servim noi înapoi cu binecuvântare.
   */
  const tip = TIPURI_PERMISE.includes(incarcare.mime_type as string)
    ? (incarcare.mime_type as string)
    : "application/octet-stream";

  return new Response(fisier, {
    headers: {
      "Content-Type": tip,
      "Cache-Control": CACHE,
      /*
       * SVG-ul e motivul pentru care anteturile astea două nu sunt opționale.
       *
       * Panoul acceptă SVG, iar un SVG poate conține `<script>`. Cât timp
       * pozele veneau de pe supabase.co, un SVG rău intenționat rula pe domeniul
       * LOR și nu putea atinge site-ul cabinetului. De când le servim noi, ar
       * rula pe `cabinet.ro` — adică am fi mutat singuri o gaură de XSS pe
       * domeniul clientului, tocmai prin schimbarea care trebuia să-l apere.
       *
       * `sandbox` fără niciun steag oprește scripturile, formularele și
       * navigarea; `default-src 'none'` oprește orice cerere pornită din fișier.
       * `nosniff` oprește browserul să ghicească alt tip decât cel declarat.
       */
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "X-Content-Type-Options": "nosniff",
      // Fișierul se afișează, nu se descarcă — dar niciodată ca pagină de sine
      // stătătoare cu numele ales de cine a încărcat.
      "Content-Disposition": "inline",
    },
  });
}

/**
 * Un singur răspuns pentru toate refuzurile: semnătură greșită, id inventat,
 * fișier lipsă. Cine încearcă nu află care dintre ele a fost.
 */
function necunoscut() {
  return new Response("Not Found", { status: 404, headers: { "Cache-Control": "no-store" } });
}
