import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { CAMPURI_SERVICIU } from "@/lib/servicii";
import { catreEditor } from "@/lib/sectiuni-editare";
import { getTemplate } from "@/lib/templates";
import { paginaEsteActiva, type Pagini } from "@/lib/setari";
import { adresaImaginii } from "@/lib/imagini-adrese";
import { serviciiPublicate } from "@/lib/servicii-publice";
import type { SectionTone } from "@/lib/templates";
import { normalizeazaPunctFocal, type PunctFocal } from "@/lib/punct-focal";
import { EditorServiciu } from "./editor";

export default async function EditorServiciuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await verifySession();
  const supabase = await createClient();

  const [{ data: serviciu }, { data: site }, { data: setari }, { data: sectiuneServicii }, publicate] = await Promise.all([
    supabase
      .from("services")
      .select("id, slug, title, excerpt, content, price_label, duration_label, cover_upload_id, status")
      .eq("id", id)
      .eq("site_id", session.siteId)
      .maybeSingle(),
    supabase.from("sites").select("template").eq("id", session.siteId).single(),
    supabase.from("site_settings").select("pagini").eq("site_id", session.siteId).maybeSingle(),
    // Pentru previzualizarea „Cum arată pe prima pagină": secțiunea „Serviciile
    // mele" (titlul, câte se văd, așezarea) și vecinii serviciului, ca
    // cartonașul să iasă la lățimea și cu tăierea de pe site. În aceeași rundă,
    // ca să nu adauge încă un drum până la bază (vezi `dashboard/loading.tsx`).
    supabase
      .from("site_content")
      .select("variant, tone, data, visible")
      .eq("site_id", session.siteId)
      .eq("key", "features")
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle(),
    serviciiPublicate(session.siteId),
  ]);

  // Un serviciu al altui client dispare aici la fel ca unul inexistent — 404,
  // nu „interzis", ca să nu confirmăm nici măcar că id-ul există undeva.
  if (!serviciu) notFound();

  // „Vezi pe site" duce la starea SALVATĂ, nu la ce e nesalvat în formular:
  // pe site apare doar un serviciu publicat, iar adresa lui depinde de pagina
  // de servicii — cu ea pornită are pagina lui, fără ea stă pe prima pagină.
  // Draft → niciun link, fiindcă n-are ce vedea pe site.
  const slug = serviciu.slug as string;
  const paginaServiciiActiva = paginaEsteActiva((setari?.pagini ?? {}) as Pagini, "servicii");
  const hrefPeSite =
    serviciu.status === "published" && slug
      ? paginaServiciiActiva
        ? `/servicii#${slug}`
        : "/#servicii"
      : null;

  // Coperta stă în bază ca referință; formularul lucrează cu adresa. Traducerea
  // se face la citire (aici) și la scriere (`coloanaCoperta`), exact ca la
  // articolele de blog — în restul panoului imaginea are o singură formă.
  let coperta: { uploadId: string; url: string; altText: string; pozitie?: PunctFocal } | null =
    null;

  if (serviciu.cover_upload_id) {
    const { data: incarcare } = await supabase
      .from("uploads")
      // Interogarea confirmă că poza există ȘI e a acestui cabinet, nu doar că
      // rândul serviciului o pomenește. `focal_x/focal_y`: punctul focal ales
      // prin tragere, ca editorul să arate la redeschidere poziția salvată — ca
      // la articolele de blog. Fără el, poza revenea la centru în panou la
      // redeschidere, deși pe site stătea unde fusese pusă.
      .select("id, focal_x, focal_y, focal_zoom")
      .eq("id", serviciu.cover_upload_id as string)
      .eq("site_id", session.siteId)
      .maybeSingle<{
        id: string;
        focal_x: number | null;
        focal_y: number | null;
        focal_zoom: number | null;
      }>();

    if (incarcare) {
      coperta = {
        uploadId: incarcare.id,
        url: adresaImaginii(incarcare.id),
        altText: "",
        pozitie: normalizeazaPunctFocal({
          x: incarcare.focal_x,
          y: incarcare.focal_y,
          zoom: incarcare.focal_zoom,
        }),
      };
    }
  }

  return (
    <EditorServiciu
      id={id}
      valoareInitiala={catreEditor({ ...serviciu, coperta }, CAMPURI_SERVICIU)}
      template={getTemplate(site?.template as string | null)}
      hrefPeSite={hrefPeSite}
      primaPagina={{
        sectiune: sectiuneServicii
          ? {
              variant: sectiuneServicii.variant as string | null,
              tone: ((sectiuneServicii.tone as SectionTone) ?? "deschis"),
              data: sectiuneServicii.data,
              vizibila: sectiuneServicii.visible !== false,
            }
          : null,
        servicii: publicate,
        paginaServiciiActiva,
      }}
    />
  );
}
