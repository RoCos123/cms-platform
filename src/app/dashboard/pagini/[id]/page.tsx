import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { CAMPURI_PAGINA } from "@/lib/pagini";
import { catreEditor } from "@/lib/sectiuni-editare";
import { getTemplate } from "@/lib/templates";
import { culoriPermise } from "@/lib/aspect/acces";
import { brandulSiteului } from "@/lib/aspect/citire";
import { EditorPagina } from "./editor";

export default async function EditorPaginaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await verifySession();
  const supabase = await createClient();

  const [{ data: pagina }, { data: site }, brand] = await Promise.all([
    supabase
      .from("pages")
      .select("id, slug, title, content, status")
      .eq("id", id)
      .eq("site_id", session.siteId)
      .maybeSingle(),
    supabase.from("sites").select("domain, template").eq("id", session.siteId).single(),
    brandulSiteului(supabase, session.siteId),
  ]);

  // O pagină a altui client dispare aici la fel ca una inexistentă — 404, nu
  // „interzis", ca să nu confirmăm nici măcar că id-ul există undeva.
  if (!pagina) notFound();

  return (
    <EditorPagina
      id={id}
      valoareInitiala={catreEditor(pagina, CAMPURI_PAGINA)}
      publicata={pagina.status === "published"}
      aFostPublicata={pagina.status !== "draft"}
      template={getTemplate(
        site?.template as string | null,
        culoriPermise(brand, { domain: site?.domain as string | null, template: site?.template as string | null }),
      )}
    />
  );
}
