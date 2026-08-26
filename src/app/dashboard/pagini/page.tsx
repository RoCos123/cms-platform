import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { StatusValue } from "@/components/ui/feedback";
import { esteLocMeniu } from "@/lib/pagini";
import { ListaPagini, type RandPaginaLista } from "./lista";
import { creeazaPagina } from "./actions";

export const metadata = { title: "Pagini" };

const STARI: StatusValue[] = ["draft", "published", "unpublished"];

function stare(brut: unknown): StatusValue {
  return STARI.includes(brut as StatusValue) ? (brut as StatusValue) : "draft";
}

/**
 * Ce pagini are de obicei un cabinet.
 *
 * Nu le creăm noi: textele sunt ale clientului, iar unul dintre ele are și
 * greutate juridică. Dar cineva care deschide ecranul gol nu știe nici măcar ce
 * să caute — iar lipsa politicii de confidențialitate e cea mai frecventă la
 * site-urile mici cu formular de contact.
 */
const SUGESTII = [
  {
    titlu: "Politica de confidențialitate",
    de_ce:
      "Formularul de contact strânge nume, email și mesaj — adică date personale. Legea cere să scrii undeva ce faci cu ele, cât le ții și cui le dai. Cere textul de la cine te ajută cu partea juridică; nu-l inventa.",
  },
  {
    titlu: "Tarife",
    de_ce:
      "Dacă preferi să nu pui prețul pe fiecare serviciu, o pagină separată răspunde la întrebarea pe care oricum o primești la primul telefon.",
  },
  {
    titlu: "Cabinetul",
    de_ce: "Cum arată locul, cum ajungi, unde parchezi. Liniștește pe cineva care vine prima oară.",
  },
];

export default async function PaginiPage() {
  const session = await verifySession();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pages")
    .select("id, title, slug, status, nav_location")
    .eq("site_id", session.siteId)
    .order("position", { ascending: true });

  if (error) console.error("Citirea paginilor a eșuat:", error);

  const randuri: RandPaginaLista[] = (data ?? []).map((rand) => ({
    id: rand.id as string,
    titlu: rand.title as string,
    slug: rand.slug as string,
    stare: stare(rand.status),
    loc: esteLocMeniu(rand.nav_location) ? rand.nav_location : "footer",
  }));

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Panou
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">Pagini</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Pagini de sine stătătoare, în afara primei pagini: tarife, cabinetul, politica de
            confidențialitate. Fiecare are adresa ei și poate fi legată din meniul de sus sau
            din subsol.
          </p>
        </div>

        {/* Formular, nu link: creează un rând în baza de date, deci e o acțiune. */}
        <form action={creeazaPagina}>
          <Button type="submit">+ Pagină nouă</Button>
        </form>
      </div>

      {randuri.length > 0 && <ListaPagini initiale={randuri} />}

      <Card className="max-w-2xl">
        <CardHeader
          title={randuri.length === 0 ? "Nicio pagină încă" : "Ce mai are de obicei un cabinet"}
          description="Trei pagini care lipsesc cel mai des."
        />
        <CardBody>
          <dl className="space-y-4">
            {SUGESTII.map((sugestie) => (
              <div key={sugestie.titlu}>
                <dt className="text-sm font-medium text-foreground">{sugestie.titlu}</dt>
                <dd className="mt-0.5 text-sm text-muted-foreground">{sugestie.de_ce}</dd>
              </div>
            ))}
          </dl>
        </CardBody>
      </Card>
    </div>
  );
}
