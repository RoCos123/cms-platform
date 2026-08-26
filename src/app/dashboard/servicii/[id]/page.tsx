import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { CAMPURI_SERVICIU } from "@/lib/servicii";
import { catreEditor } from "@/lib/sectiuni-editare";
import { getTemplate } from "@/lib/templates";
import { EditorServiciu } from "./editor";

export default async function EditorServiciuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await verifySession();
  const supabase = await createClient();

  const [{ data: serviciu }, { data: site }] = await Promise.all([
    supabase
      .from("services")
      .select("id, slug, title, excerpt, content, price_label, duration_label")
      .eq("id", id)
      .eq("site_id", session.siteId)
      .maybeSingle(),
    supabase.from("sites").select("template").eq("id", session.siteId).single(),
  ]);

  // Un serviciu al altui client dispare aici la fel ca unul inexistent — 404,
  // nu „interzis", ca să nu confirmăm nici măcar că id-ul există undeva.
  if (!serviciu) notFound();

  return (
    <EditorServiciu
      id={id}
      valoareInitiala={catreEditor(serviciu, CAMPURI_SERVICIU)}
      template={getTemplate(site?.template as string | null)}
    />
  );
}
