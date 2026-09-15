import { getSesiuneOptionala } from "@/lib/dal";
import { AdminBar } from "@/components/site/admin-bar";
import { BulaWhatsApp } from "@/components/site/bula-whatsapp";

/**
 * Frunza DEPENDENTĂ DE SESIUNE a paginilor publice: bula WhatsApp și bara de
 * administrare.
 *
 * Scoasă din `CadruSite` dinadins — e singura parte a cadrului care depinde de
 * cine se uită: proprietarul logat vede bara de administrare (cu emailul lui) și
 * bula ridicată deasupra ei; un vizitator o vede jos în colț și fără bară.
 * Ținând-o aici, ca frunză proprie care își citește singură sesiunea, restul
 * cadrului rămâne funcție doar de `siteId` — adică ceva ce se poate memora între
 * cereri fără riscul de a servi bara (sau emailul) unui proprietar altui
 * vizitator. (Pasul 1 din cache-ul pe tenant.)
 *
 * `numar` (WhatsApp) vine ca prop, din conținut: e al site-ului, nu al
 * vizitatorului. `getSesiuneOptionala` e memorat pe cerere (`cache()`), deci
 * apelul de aici se deduplică cu cel din `NumaratorVizite` — o singură
 * verificare a sesiunii pe cerere.
 */
export async function BaraAdmin({
  numar,
  linkEditare,
}: {
  numar: string | null | undefined;
  linkEditare: string;
}) {
  const sesiune = await getSesiuneOptionala();

  return (
    <>
      <BulaWhatsApp numar={numar} ridicata={sesiune !== null} />
      {sesiune && <AdminBar email={sesiune.email} linkEditare={linkEditare} />}
    </>
  );
}
