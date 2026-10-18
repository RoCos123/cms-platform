import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { CAMPURI_ARTICOL } from "@/lib/blog";
import { catreEditor } from "@/lib/sectiuni-editare";
import { getTemplate } from "@/lib/templates";
import { culoriPermise } from "@/lib/aspect/acces";
import { brandulSiteului } from "@/lib/aspect/citire";
import { adresaImaginii } from "@/lib/imagini-adrese";
import { normalizeazaPunctFocal, type PunctFocal } from "@/lib/punct-focal";
import { EditorArticol } from "./editor";

export default async function EditorArticolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await verifySession();
  const supabase = await createClient();

  const [{ data: articol }, { data: site }, brand] = await Promise.all([
    supabase
      .from("blog_articles")
      .select(
        "id, slug, title, excerpt, content, status, published_at, cover_upload_id, cover_alt, cover_focal_x, cover_focal_y, cover_focal_zoom",
      )
      .eq("id", id)
      .eq("site_id", session.siteId)
      .maybeSingle(),
    supabase.from("sites").select("template").eq("id", session.siteId).single(),
    brandulSiteului(supabase, session.siteId),
  ]);

  // Un articol al altui client dispare aici la fel ca unul inexistent — 404, nu
  // „interzis", ca să nu confirmăm nici măcar că id-ul există undeva.
  if (!articol) notFound();

  // Coperta stă în bază ca referință către bibliotecă (`cover_upload_id`) plus
  // propria încadrare (`cover_focal_*`, pe rândul articolului — a LOCULUI, nu a
  // pozei); formularul lucrează cu adresa și punctul focal. `on delete set null`
  // pe cheia externă face ca un `cover_upload_id` prezent să însemne că poza mai
  // există, deci adresa se semnează direct din id, fără o interogare în plus.
  let coperta: { uploadId: string; url: string; altText: string; pozitie?: PunctFocal } | null = null;

  if (articol.cover_upload_id) {
    const coverId = articol.cover_upload_id as string;
    coperta = {
      uploadId: coverId,
      url: adresaImaginii(coverId),
      altText: (articol.cover_alt as string | null) ?? "",
      pozitie: normalizeazaPunctFocal({
        x: articol.cover_focal_x,
        y: articol.cover_focal_y,
        zoom: articol.cover_focal_zoom,
      }),
    };
  }

  return (
    <EditorArticol
      id={id}
      valoareInitiala={catreEditor({ ...articol, coperta }, CAMPURI_ARTICOL)}
      publicat={articol.status === "published"}
      publicatLa={articol.published_at as string | null}
      template={getTemplate(
        site?.template as string | null,
        culoriPermise(brand, { siteId: session.siteId, template: site?.template as string | null }),
      )}
    />
  );
}
