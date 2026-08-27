import { getTenant, verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { COLOANE_MODULE, moduleleSiteului } from "@/lib/module";
import { oreLibere, primesteProgramari } from "@/lib/programari";
import { programulSiteului, seePotFaceProgramari } from "@/lib/programari-publice";

export const metadata = { title: "Diagnostic" };

/**
 * Ecran de diagnostic, temporar.
 *
 * Există fiindcă mediul de dezvoltare nu ajunge la site-ul din producție, iar
 * ghicitul de la distanță a mâncat deja câteva runde. Rulează pe serverul real
 * exact pașii pe care îi face cadrul site-ului ca să hotărască dacă pune linkul
 * „Programare" în meniu, și arată ce a ieșit la fiecare.
 *
 * De șters după ce se lămurește.
 */
export default async function Diagnostic() {
  const session = await verifySession();
  const linii: [string, string][] = [];

  const adauga = (eticheta: string, valoare: unknown) =>
    linii.push([eticheta, typeof valoare === "string" ? valoare : JSON.stringify(valoare)]);

  // 1. Ce tenant a rezolvat proxy-ul pentru cererea asta.
  try {
    const { siteId, domain } = await getTenant();
    adauga("1. tenant rezolvat (domain)", domain);
    adauga("1. tenant rezolvat (siteId)", siteId);
    adauga("1. siteId din sesiune", session.siteId);
    adauga("1. aceeași?", siteId === session.siteId ? "DA" : "NU — asta e problema");
  } catch (e) {
    adauga("1. getTenant A ARUNCAT", String(e));
  }

  const { siteId } = await getTenant();

  // 2. Coloana modulului, citită cu clientul userului (ca panoul).
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sites")
      .select(COLOANE_MODULE)
      .eq("id", siteId)
      .single();
    adauga("2. sites (client user) eroare", error ? `${error.code}: ${error.message}` : "niciuna");
    adauga("2. sites (client user) date", data);
    adauga("2. modul pornit?", moduleleSiteului(data).programari);
  } catch (e) {
    adauga("2. A ARUNCAT", String(e));
  }

  // 3. Aceeași coloană, dar cu cheia secretă — asta folosește site-ul public.
  try {
    const { data, error } = await createServiceClient()
      .from("sites")
      .select("name, template, appointments_enabled")
      .eq("id", siteId)
      .single();
    adauga("3. sites (cheie secretă) eroare", error ? `${error.code}: ${error.message}` : "niciuna");
    adauga("3. sites (cheie secretă) date", data);
    adauga("3. modul pornit?", moduleleSiteului(data).programari);
  } catch (e) {
    adauga("3. A ARUNCAT", String(e));
  }

  // 4. Programul, citit exact ca site-ul public.
  try {
    const { data, error } = await createServiceClient()
      .from("site_settings")
      .select("programari")
      .eq("site_id", siteId)
      .maybeSingle();
    adauga("4. site_settings eroare", error ? `${error.code}: ${error.message}` : "niciuna");
    adauga("4. programari brut", data?.programari);
  } catch (e) {
    adauga("4. A ARUNCAT", String(e));
  }

  // 5. Programul după citirea noastră, și ce iese din el.
  try {
    const program = await programulSiteului(siteId);
    adauga("5. zile păstrate", Object.keys(program.zile).join(", ") || "NICIUNA");
    adauga("5. primesteProgramari", primesteProgramari(program));
    adauga("5. zile cu ore libere", oreLibere(program, [], new Date()).length);
  } catch (e) {
    adauga("5. A ARUNCAT", String(e));
  }

  // 6. Verdictul final — ăsta hotărăște linkul din meniu.
  try {
    const { data: site } = await createServiceClient()
      .from("sites")
      .select("appointments_enabled")
      .eq("id", siteId)
      .single();
    const verdict = await seePotFaceProgramari(siteId, moduleleSiteului(site).programari);
    adauga("6. VERDICT (link în meniu?)", verdict ? "DA" : "NU");
  } catch (e) {
    adauga("6. A ARUNCAT", String(e));
  }

  // 7. Ce versiune de cod rulează.
  adauga("7. commit", process.env.VERCEL_GIT_COMMIT_SHA ?? "necunoscut");
  adauga("7. DEV_TENANT_DOMAIN e setat?", process.env.DEV_TENANT_DOMAIN ? "DA" : "nu");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Diagnostic Programări</h1>
      <p className="text-sm text-muted-foreground">
        Copiază tot tabelul de mai jos și trimite-l. Ecranul se șterge după aceea.
      </p>
      <div className="overflow-x-auto rounded-base border border-border">
        <table className="w-full text-sm">
          <tbody>
            {linii.map(([eticheta, valoare], i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="whitespace-nowrap bg-surface-muted px-3 py-2 align-top font-medium text-foreground">
                  {eticheta}
                </td>
                <td className="break-all px-3 py-2 font-mono text-xs text-muted-foreground">
                  {valoare}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
