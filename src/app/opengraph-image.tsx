import { ImageResponse } from "next/og";
import { getTenant } from "@/lib/dal";
import { identitateaSiteului } from "@/lib/site-public";
import { MARIMEA_CARTONASULUI } from "@/lib/cartonas-masuri";
import { cartonasulCabinetului } from "@/lib/cartonas-og";

/**
 * Cartonașul care se vede când cineva dă linkul cabinetului pe WhatsApp sau
 * Facebook. Se desenează singur din Setări, ca niciun site să nu rămână fără.
 *
 * Originalul n-avea niciunul, iar fără imagine rețelele arată un dreptunghi gol
 * cu adresa scrisă mic — cel mai prost moment posibil, fiindcă e exact clipa în
 * care cineva recomandă cabinetul altcuiva.
 *
 * Deliberat fără poză de fundal: singurul lucru sigur existent la orice client e
 * numele lui. O copertă încărcată ar fi mai frumoasă, dar atunci cine n-a
 * încărcat una rămâne iar fără nimic — adică exact problema pe care ruta asta o
 * rezolvă.
 *
 * Desenul e în `src/lib/cartonas-og.tsx`; aici stă doar citirea.
 */
export const alt = "Cartonașul de prezentare al cabinetului";
export const size = MARIMEA_CARTONASULUI;
export const contentType = "image/png";

export default async function ImagineaCartonasului() {
  const { siteId, domain } = await getTenant();
  const { site, brand } = await identitateaSiteului(siteId);

  return new ImageResponse(
    cartonasulCabinetului({
      nume: site?.name ?? domain,
      subtitlu: brand.subtitlu,
      acreditare: brand.acreditare,
      domeniu: domain,
    }),
    size,
  );
}
