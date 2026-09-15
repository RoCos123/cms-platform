import { after } from "next/server";
import { headers } from "next/headers";
import { getSesiuneOptionala } from "@/lib/dal";
import { numaraAfisarea } from "@/lib/vizite-numarare";

/**
 * Numără o afișare a paginii publice — o frunză INVIZIBILĂ (randează `null`).
 *
 * Scoasă din `CadruSite` din același motiv ca `BaraAdmin`: citește `headers()`
 * (calea, user-agent-ul) și sesiunea (ca să nu numere vizitele proprietarului ca
 * trafic real), adică lucruri PER-CERERE. Lăsate în cadru, ar fi împiedicat
 * memorarea lui între cereri; ca frunză dinamică proprie, numărătoarea rulează la
 * FIECARE cerere chiar dacă restul paginii ar veni din cache — altfel contorul ar
 * îngheța pe un cache-hit. (Pasul 1 din cache-ul pe tenant.)
 *
 * Numărarea stă pe cadrul comun fiindcă prin el trec TOATE paginile publice și
 * numai ele: o adresă inexistentă face `notFound()` înainte, iar previzualizarea
 * din panou folosește direct antetul și subsolul, nu cadrul.
 *
 * `after()` mută scrierea după ce răspunsul a plecat — vizitatorul nu așteaptă
 * niciodată după statistici. Antetele se citesc AICI, nu înăuntrul lui `after()`:
 * acolo cererea nu mai poate fi atinsă, iar Next aruncă (vezi explicația lungă
 * din `numaraAfisarea`).
 */
export async function NumaratorVizite({ siteId }: { siteId: string }) {
  const [antete, sesiune] = await Promise.all([headers(), getSesiuneOptionala()]);

  after(() =>
    numaraAfisarea({
      siteId,
      cale: antete.get("x-cale") ?? "",
      userAgent: antete.get("user-agent"),
      eProprietarul: sesiune !== null,
    }),
  );

  return null;
}
