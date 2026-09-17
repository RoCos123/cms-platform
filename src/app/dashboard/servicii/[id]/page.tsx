import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { CAMPURI_SERVICIU } from "@/lib/servicii";
import { catreEditor } from "@/lib/sectiuni-editare";
import { getTemplate } from "@/lib/templates";
import { paginaEsteActiva, type Pagini } from "@/lib/setari";
import { adresaImaginii } from "@/lib/imagini-adrese";
import { EditorServiciu } from "./editor";

export default async function EditorServiciuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await verifySession();
  const supabase = await createClient();

  const [{ data: serviciu }, { data: site }, { data: setari }] = await Promise.all([
    supabase
      .from("services")
      .select("id, slug, title, excerpt, content, price_label, duration_label, cover_upload_id, status")
      .eq("id", id)
      .eq("site_id", session.siteId)
      .maybeSingle(),
    supabase.from("sites").select("template").eq("id", session.siteId).single(),
    supabase.from("site_settings").select("pagini").eq("site_id", session.siteId).maybeSingle(),
  ]);

  // Un serviciu al altui client dispare aici la fel ca unul inexistent — 404,
  // nu „interzis", ca să nu confirmăm nici măcar că id-ul există undeva.
  if (!serviciu) notFound();

  // „Vezi pe site" duce la starea SALVATĂ, nu la ce e nesalvat în formular:
  // pe site apare doar un serviciu publicat, iar adresa lui depinde de pagina
  // de servicii — cu ea pornită are pagina lui, fără ea stă pe prima pagină.
  // Draft → niciun link, fiindcă n-are ce vedea pe site.
  const slug = serviciu.slug as string;
  const hrefPeSite =
    serviciu.status === "published" && slug
      ? paginaEsteActiva((setari?.pagini ?? {}) as Pagini, "servicii")
        ? `/servicii#${slug}`
        : "/#servicii"
      : null;

  // Coperta stă în bază ca referință; formularul lucrează cu adresa. Traducerea
  // se face la citire (aici) și la scriere (`coloanaCoperta`), exact ca la
  // articolele de blog — în restul panoului imaginea are o singură formă.
  let coperta: { uploadId: string; url: string; altText: string } | null = null;

  if (serviciu.cover_upload_id) {
    const { data: incarcare } = await supabase
      .from("uploads")
      // Interogarea confirmă că poza există ȘI e a acestui cabinet, nu doar că
      // rândul serviciului o pomenește.
      .select("id")
      .eq("id", serviciu.cover_upload_id as string)
      .eq("site_id", session.siteId)
      .maybeSingle<{ id: string }>();

    if (incarcare) {
      coperta = { uploadId: incarcare.id, url: adresaImaginii(incarcare.id), altText: "" };
    }
  }

  return (
    <EditorServiciu
      id={id}
      valoareInitiala={catreEditor({ ...serviciu, coperta }, CAMPURI_SERVICIU)}
      template={getTemplate(site?.template as string | null)}
      hrefPeSite={hrefPeSite}
    />
  );
}
