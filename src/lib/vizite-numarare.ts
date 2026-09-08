import "server-only";

import { createServiceClient } from "@/lib/supabase/admin";
import { caleaNumarata, esteRobot } from "@/lib/vizite";
import { ziuaLa } from "@/lib/zile";

/**
 * Tot ce trebuie știut despre o afișare, cules ÎN TIMPUL randării.
 *
 * De ce un obiect, și nu citiri pe loc: vezi `numaraAfisarea`.
 */
export type DateVizita = {
  siteId: string;
  /** `x-cale`, pusă de proxy. */
  cale: string;
  userAgent: string | null;
  /** Clientul își privește propriul site? Atunci nu se numără. */
  eProprietarul: boolean;
};

/**
 * O afișare în plus la pagina cerută.
 *
 * Se cheamă din `after()`, adică DUPĂ ce răspunsul a plecat spre vizitator: o
 * scriere în baza de date n-are voie să încetinească pagina unui cabinet.
 *
 * DE CE PRIMEȘTE TOTUL CA ARGUMENT, ȘI NU CITEȘTE SINGURĂ. Înăuntrul lui
 * `after()` nu se mai poate atinge cererea: nici `headers()`, nici `cookies()`,
 * deci nici `getTenant()` sau `getSesiuneOptionala()`, care le folosesc.
 * Next 16 aruncă „used `headers()` inside `after()` while rendering", iar
 * pagina întreagă cade cu 500 — chiar dacă funcția asta prinde eroarea și o
 * scrie în jurnal, cum făcea. Prima pagină a primului site provizionat a picat
 * exact așa, în producție, iar în panou nu se vedea nimic: panoul nu trece prin
 * cadrul site-ului.
 *
 * Deci cererea se citește în componenta care randează, iar aici ajung doar
 * valori simple. `CadruSite` are oricum și `siteId`, și sesiunea la îndemână.
 *
 * **Nu aruncă niciodată.** Aceeași regulă ca la jurnalul de activitate: dacă
 * numărătoarea pică, e o problemă a noastră, nu a vizitatorului, iar el a
 * primit oricum pagina întreagă.
 */
export async function numaraAfisarea(date: DateVizita): Promise<void> {
  try {
    // Clientul care își privește propriul site nu se numără singur. Altfel, un
    // psiholog care își verifică pagina de zece ori într-o seară ar vedea a
    // doua zi zece „vizite" care sunt el.
    if (date.eProprietarul) return;

    // Roboții motoarelor de căutare și previzualizările de linkuri din WhatsApp
    // pot fi, pe un site mic, mai multe decât oamenii. Nefiltrate, cifrele n-ar
    // însemna nimic pentru client.
    if (esteRobot(date.userAgent)) return;

    const cale = caleaNumarata(date.cale);
    if (!cale) return;

    const { error } = await createServiceClient().rpc("inregistreaza_afisarea", {
      p_site_id: date.siteId,
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
