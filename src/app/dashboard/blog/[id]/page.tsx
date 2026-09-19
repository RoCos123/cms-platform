import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { CAMPURI_ARTICOL } from "@/lib/blog";
import { catreEditor } from "@/lib/sectiuni-editare";
import { getTemplate } from "@/lib/templates";
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

  const [{ data: articol }, { data: site }] = await Promise.all([
    supabase
      .from("blog_articles")
      .select("id, slug, title, excerpt, content, status, published_at, cover_upload_id, cover_alt")
      .eq("id", id)
      .eq("site_id", session.siteId)
      .maybeSingle(),
    supabase.from("sites").select("template").eq("id", session.siteId).single(),
  ]);

  // Un articol al altui client dispare aici la fel ca unul inexistent — 404, nu
  // „interzis", ca să nu confirmăm nici măcar că id-ul există undeva.
  if (!articol) notFound();

  // Coperta stă în bază ca referință către bibliotecă; formularul lucrează cu
  // adresa publică. Traducerea se face aici, la citire, și în acțiunea de
  // salvare, la scriere — în restul panoului imaginea are o singură formă.
  let coperta: { uploadId: string; url: string; altText: string; pozitie?: PunctFocal } | null = null;

  if (articol.cover_upload_id) {
    const { data: incarcare } = await supabase
      .from("uploads")
      // Adresa se derivă din `id`. `focal_x/focal_y` — punctul focal ales la
      // tragere — corectat 19 sept. 2026: fără el, câmpul pornea mereu din
      // centru, ca și cum poza n-ar fi fost repoziționată niciodată, iar
      // previzualizarea vie din panou nu avea cum să arate poziția reală.
      .select("id, focal_x, focal_y")
      .eq("id", articol.cover_upload_id as string)
      .eq("site_id", session.siteId)
      .maybeSingle<{ id: string; focal_x: number | null; focal_y: number | null }>();

    if (incarcare) {
      coperta = {
        uploadId: articol.cover_upload_id as string,
        url: adresaImaginii(incarcare.id),
        altText: (articol.cover_alt as string | null) ?? "",
        pozitie: normalizeazaPunctFocal({ x: incarcare.focal_x, y: incarcare.focal_y }),
      };
    }
  }

  return (
    <EditorArticol
      id={id}
      valoareInitiala={catreEditor({ ...articol, coperta }, CAMPURI_ARTICOL)}
      publicat={articol.status === "published"}
      publicatLa={articol.published_at as string | null}
      template={getTemplate(site?.template as string | null)}
    />
  );
}
