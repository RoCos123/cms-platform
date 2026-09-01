import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { CAMPURI_ARTICOL } from "@/lib/blog";
import { catreEditor } from "@/lib/sectiuni-editare";
import { getTemplate } from "@/lib/templates";
import { adresaImaginii } from "@/lib/imagini-adrese";
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
  let coperta: { uploadId: string; url: string; altText: string } | null = null;

  if (articol.cover_upload_id) {
    const { data: incarcare } = await supabase
      .from("uploads")
      // Nu ne mai trebuie calea din depozit — adresa se derivă din id. Interogarea
      // rămâne fiindcă face altceva, la fel de important: se asigură că imaginea
      // există ȘI e a acestui cabinet.
      .select("id")
      .eq("id", articol.cover_upload_id as string)
      .eq("site_id", session.siteId)
      .maybeSingle<{ id: string }>();

    if (incarcare) {
      coperta = {
        uploadId: articol.cover_upload_id as string,
        url: adresaImaginii(incarcare.id),
        altText: (articol.cover_alt as string | null) ?? "",
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
