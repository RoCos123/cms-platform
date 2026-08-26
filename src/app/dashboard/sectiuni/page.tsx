import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ListaSectiuni, type RandSectiune } from "./lista-sectiuni";

export const metadata = { title: "Secțiunile paginii principale" };

export default async function SectiuniPage() {
  const session = await verifySession();
  const supabase = await createClient();

  // Se citește cu clientul userului, nu cu cheia secretă: în panou vrem exact
  // ce-i permite RLS să vadă. Dacă politica ar fi greșită, ecranul ar fi gol —
  // adică greșeala s-ar vedea, nu s-ar ascunde în spatele unei chei atotputernice.
  const { data, error } = await supabase
    .from("site_content")
    .select("id, key, visible, is_demo")
    .eq("site_id", session.siteId)
    .order("position", { ascending: true });

  if (error) {
    console.error("Citirea secțiunilor a eșuat:", error);
  }

  const randuri: RandSectiune[] = (data ?? []).map((rand) => ({
    id: rand.id as string,
    cheie: rand.key as string,
    vizibil: rand.visible as boolean,
    demo: Boolean(rand.is_demo),
  }));

  return (
    <div className="space-y-6 pb-24">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Pagina principală
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Secțiuni</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Ordinea de aici e ordinea de pe site. O secțiune ascunsă rămâne salvată cu tot
          conținutul ei — dispare doar de pe pagina publică.
        </p>
      </div>

      {randuri.length === 0 ? (
        <Card className="max-w-xl">
          <CardHeader
            title="Nicio secțiune încă"
            description="Pagina principală e goală."
          />
          <CardBody>
            <p className="text-sm text-muted-foreground">
              Secțiunile se adaugă la punerea în funcțiune a site-ului. Dacă vezi ecranul
              acesta și site-ul tău ar trebui să aibă conținut, scrie-ne.
            </p>
          </CardBody>
        </Card>
      ) : (
        <ListaSectiuni initiale={randuri} />
      )}
    </div>
  );
}
