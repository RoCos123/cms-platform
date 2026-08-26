import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { paginaServiciiEsteActiva, type Pagini } from "@/lib/setari";
import { ComutatorPaginaServicii } from "./comutator-pagina";
import { ListaServicii, type RandServiciuLista } from "./lista-servicii";
import { creeazaServiciu } from "./actions";

export const metadata = { title: "Servicii" };

export default async function ServiciiPage() {
  const session = await verifySession();
  const supabase = await createClient();

  const [{ data, error }, { data: setari }] = await Promise.all([
    supabase
      .from("services")
      .select("id, title, excerpt, status")
      .eq("site_id", session.siteId)
      .order("position", { ascending: true }),
    supabase.from("site_settings").select("pagini").eq("site_id", session.siteId).maybeSingle(),
  ]);

  if (error) console.error("Citirea serviciilor a eșuat:", error);

  const randuri: RandServiciuLista[] = (data ?? []).map((rand) => ({
    id: rand.id as string,
    titlu: rand.title as string,
    descriereScurta: (rand.excerpt as string) ?? "",
    publicat: rand.status === "published",
  }));

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Panou
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">Servicii</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Fiecare serviciu se scrie o singură dată, aici. Cartonașele de pe prima pagină
            iau numele și descrierea scurtă; pagina de servicii le arată pe toate, pe larg.
          </p>
        </div>

        {/* Formular, nu link: creează un rând în baza de date, deci e o acțiune. */}
        <form action={creeazaServiciu}>
          <Button type="submit">+ Serviciu nou</Button>
        </form>
      </div>

      {randuri.length === 0 ? (
        <Card className="max-w-xl">
          <CardHeader
            title="Niciun serviciu încă"
            description="Secțiunea „Serviciile mele” nu apare pe site cât timp lista e goală."
          />
          <CardBody>
            <p className="text-sm text-muted-foreground">
              Începe cu unul singur, scris bine. E mai bine decât șase scrise pe fugă —
              cine caută un psiholog citește, nu numără.
            </p>
          </CardBody>
        </Card>
      ) : (
        <>
          <ListaServicii initiale={randuri} />
          <ComutatorPaginaServicii
            activaInitial={paginaServiciiEsteActiva((setari?.pagini ?? {}) as Pagini)}
          />
        </>
      )}
    </div>
  );
}
