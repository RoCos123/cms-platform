import "server-only";

import { cache } from "react";
import { createServiceClient } from "@/lib/supabase/admin";
import { serviciiPublicate } from "@/lib/servicii-publice";
import { ANCORE_SECTIUNI, type Destinatie } from "@/lib/destinatii";

/**
 * Coloanele SERVICII și CABINET din subsol, umplute din ce e publicat — nu
 * scrise de mână. Serviciile vin din Servicii; „cabinetul" e harta secțiunilor
 * VIZIBILE de pe prima pagină, plus Blog și Contact.
 *
 * Ancorele merg cu `/#…`, nu `#…`: subsolul apare pe TOATE paginile, iar un
 * `#despre` de pe pagina de blog n-ar duce nicăieri — secțiunea e pe prima
 * pagină. `/#despre` întâi ajunge acasă, apoi coboară la ea.
 */
export const coloaneleSubsolului = cache(
  async (
    siteId: string,
    optiuni: { paginaServiciiActiva: boolean; areBlog: boolean },
  ): Promise<{ servicii: Destinatie[]; cabinet: Destinatie[] }> => {
    const service = createServiceClient();

    const [servicii, { data: sectiuni }] = await Promise.all([
      serviciiPublicate(siteId),
      service.from("site_content").select("key").eq("site_id", siteId).eq("visible", true),
    ]);

    // SERVICII. Cu pagina de servicii pornită, fiecare serviciu are adresa lui;
    // fără ea, serviciile trăiesc doar pe prima pagină, deci un singur link acolo.
    const coloanaServicii: Destinatie[] = [];
    if (servicii.length > 0) {
      if (optiuni.paginaServiciiActiva) {
        coloanaServicii.push({ eticheta: "Toate serviciile", href: "/servicii" });
        for (const s of servicii.slice(0, 6)) {
          coloanaServicii.push({ eticheta: s.titlu, href: `/servicii#${s.slug}` });
        }
      } else {
        coloanaServicii.push({ eticheta: "Serviciile mele", href: "/#servicii" });
      }
    }

    // CABINET. Secțiunile vizibile, în ordinea din ANCORE_SECTIUNI, fără cele care
    // au deja loc altundeva: „Serviciile mele" (coloana Servicii) și „Articole"
    // (le acoperă linkul de Blog). Apoi Blog și Contact.
    const cheiVizibile = new Set((sectiuni ?? []).map((r) => r.key as string));
    const coloanaCabinet: Destinatie[] = [];
    for (const [cheie, { ancora, eticheta }] of Object.entries(ANCORE_SECTIUNI)) {
      if (cheie === "features" || cheie === "latestPosts") continue;
      if (!cheiVizibile.has(cheie)) continue;
      coloanaCabinet.push({ eticheta, href: `/#${ancora}` });
    }
    if (optiuni.areBlog) coloanaCabinet.push({ eticheta: "Blog", href: "/blog" });
    if (cheiVizibile.has("contact")) coloanaCabinet.push({ eticheta: "Contact", href: "/#contact" });

    return { servicii: coloanaServicii, cabinet: coloanaCabinet };
  },
);
