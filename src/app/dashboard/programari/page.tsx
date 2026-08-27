import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { COLOANE_MODULE, moduleleSiteului } from "@/lib/module";

export const metadata = { title: "Programări" };

export default async function ProgramariPage() {
  const session = await verifySession();
  const supabase = await createClient();

  const { data: site } = await supabase
    .from("sites")
    .select(COLOANE_MODULE)
    .eq("id", session.siteId)
    .single();

  const modulele = moduleleSiteului(site);

  if (!modulele.programari) return <Neactivat />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Panou</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Programări</h1>
      </div>
      <div className="rounded-base border border-border bg-surface p-6">
        <p className="text-sm text-muted-foreground">Modulul e pornit. Ecranul se construiește.</p>
      </div>
    </div>
  );
}

/**
 * Ce vede un client care n-are modulul.
 *
 * Nu o eroare și nici o pagină goală: e singurul loc din panou unde află că
 * lucrul ăsta există. Scris ca o ofertă, nu ca un refuz — dar fără să promită
 * ceva ce nu se poate ține, fiindcă cine citește e chiar cel care ar plăti.
 */
function Neactivat() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Panou</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Programări</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Nu e pornit pe site-ul tău. Uite ce face, dacă te interesează.
        </p>
      </div>

      <div className="rounded-base border border-border bg-surface p-6">
        <ul className="space-y-4 text-sm">
          <li className="flex gap-3">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
            <span className="text-foreground">
              <b className="font-medium">Oamenii își aleg singuri ora</b>, dintr-un
              calendar pe care îl umpli tu cu intervalele în care primești. Nu mai
              răspunzi la telefon ca să spui „marți nu pot”.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
            <span className="text-foreground">
              <b className="font-medium">Programările apar aici</b>, cu nume, telefon
              și serviciul cerut. Le confirmi sau le refuzi dintr-un buton.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
            <span className="text-foreground">
              <b className="font-medium">Rămâi cu telefonul, dacă vrei.</b> Formularul
              nu înlocuiește vorbitul — unii oameni au nevoie să audă pe cineva
              înainte de prima ședință, iar numărul tău rămâne la vedere.
            </span>
          </li>
        </ul>

        <p className="mt-6 border-t border-border pt-6 text-sm text-muted-foreground">
          Scrie-ne dacă vrei să-l pornim. Se activează pe site-ul tău fără să pierzi
          nimic din ce ai scris până acum.
        </p>
      </div>
    </div>
  );
}
