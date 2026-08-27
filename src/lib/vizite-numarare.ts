import "server-only";

import { headers } from "next/headers";
import { getSesiuneOptionala, getTenant } from "@/lib/dal";
import { createServiceClient } from "@/lib/supabase/admin";
import { caleaNumarata, esteRobot } from "@/lib/vizite";
import { ziuaLa } from "@/lib/zile";

/**
 * O afișare în plus la pagina cerută.
 *
 * Se cheamă din `after()`, adică DUPĂ ce răspunsul a plecat spre vizitator: o
 * scriere în baza de date n-are voie să încetinească pagina unui cabinet.
 *
 * **Nu aruncă niciodată.** Aceeași regulă ca la jurnalul de activitate: dacă
 * numărătoarea pică, e o problemă a noastră, nu a vizitatorului, iar el a
 * primit oricum pagina întreagă.
 */
export async function numaraAfisarea(): Promise<void> {
  try {
    const antete = await headers();

    // Roboții motoarelor de căutare și previzualizările de linkuri din WhatsApp
    // pot fi, pe un site mic, mai multe decât oamenii. Nefiltrate, cifrele n-ar
    // însemna nimic pentru client.
    if (esteRobot(antete.get("user-agent"))) return;

    const cale = caleaNumarata(antete.get("x-cale") ?? "");
    if (!cale) return;

    // Clientul care își privește propriul site nu se numără singur. Altfel, un
    // psiholog care își verifică pagina de zece ori într-o seară ar vedea a
    // doua zi zece „vizite" care sunt el.
    if (await getSesiuneOptionala()) return;

    const { siteId } = await getTenant();

    const { error } = await createServiceClient().rpc("inregistreaza_afisarea", {
      p_site_id: siteId,
      // Ziua se calculează aici, pe fusul României — nu în bază. Serverul
      // rulează pe UTC, iar `current_date` acolo ar muta vizitele de seară pe
      // ziua următoare.
      p_zi: ziuaLa(new Date()),
      p_cale: cale,
    });

    if (error) console.error("Numărarea afișării a eșuat:", error);
  } catch (eroare) {
    console.error("Numărarea afișării a eșuat:", eroare);
  }
}
