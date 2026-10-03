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
      .select(
        "id, slug, title, excerpt, content, price_label, duration_label, cover_upload_id, cover_focal_x, cover_focal_y, cover_focal_zoom, status",
      )
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

  // Coperta stă în bază ca referință (`cover_upload_id`) plus propria încadrare
  // (`cover_focal_*`, pe rândul serviciului — a LOCULUI, nu a pozei); formularul
  // lucrează cu adresa și punctul focal. `on delete set null` pe cheia externă
  // face ca un `cover_upload_id` prezent să însemne că poza mai există, deci
  // adresa se semnează direct din id, fără o interogare care s-o confirme.
  let coperta: { uploadId: string; url: string; altText: string; pozitie?: PunctFocal } | null =
    null;

  if (serviciu.cover_upload_id) {
    const coverId = serviciu.cover_upload_id as string;
    coperta = {
      uploadId: coverId,
      url: adresaImaginii(coverId),
      altText: "",
      pozitie: normalizeazaPunctFocal({
        x: serviciu.cover_focal_x,
        y: serviciu.cover_focal_y,
        zoom: serviciu.cover_focal_zoom,
      }),
    };
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
