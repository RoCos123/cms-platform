import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { COLOANE_MODULE, moduleleSiteului } from "@/lib/module";
import { citesteProgramul } from "@/lib/programari";
import { oraLa, ziuaScrisa } from "@/lib/zile";
import { EditorProgram } from "./program";
import { ListaCereri, type Cerere } from "./lista";

export const metadata = { title: "Programări" };

/** Cât de departe în trecut se mai arată cererile. Mai vechi de-atât nu ajută. */
const ZILE_INAPOI = 30;

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

  const acum = new Date();
  const deLa = new Date(acum.getTime() - ZILE_INAPOI * 24 * 60 * 60 * 1000);

  const [{ data: setari }, { data: randuri, error }] = await Promise.all([
    supabase.from("site_settings").select("programari").eq("site_id", session.siteId).maybeSingle(),
    supabase
      .from("appointments")
      .select("id, name, email, phone, service, notes, starts_at, status")
      .eq("site_id", session.siteId)
      .gte("starts_at", deLa.toISOString())
      // Cele mai apropiate întâi: ce urmează contează mai mult decât ce a fost.
      .order("starts_at", { ascending: true }),
  ]);

  if (error) console.error("Citirea programărilor a eșuat:", error);

  const cereri: Cerere[] = (randuri ?? []).map((rand) => {
    const cand = new Date(rand.starts_at as string);
    return {
      id: rand.id as string,
      nume: rand.name as string,
      email: rand.email as string,
      telefon: (rand.phone as string | null) ?? null,
      motiv: (rand.service as string | null) ?? null,
      note: (rand.notes as string | null) ?? null,
      cand: rand.starts_at as string,
      candScris: `${ziuaScrisa(cand)}, ora ${oraLa(cand)}`,
      stare: rand.status as Cerere["stare"],
      trecuta: cand.getTime() < acum.getTime(),
    };
  });

  const deRaspuns = cereri.filter((c) => c.stare === "ceruta" && !c.trecuta).length;

  return (
    <div className="space-y-6 pb-24">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Panou</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Programări</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {deRaspuns > 0
            ? `Ai ${deRaspuns === 1 ? "o cerere care așteaptă" : `${deRaspuns} cereri care așteaptă`} răspuns.`
            : "Cererile primite prin site și orele în care primești."}
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Cereri
        </h2>
        <ListaCereri cereri={cereri} />
      </section>

      <EditorProgram initial={citesteProgramul(setari?.programari)} />
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
              și motivul programării. Le confirmi sau le refuzi dintr-un buton.
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
