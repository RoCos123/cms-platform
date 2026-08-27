import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { formateazaNumar, numara } from "@/lib/numerale";
import { rezumatulTraficului, type RandDeTrafic } from "@/lib/vizite";
import { cuZileInUrma, ziuaLa, ziuaScurta } from "@/lib/zile";
import { GraficZilnic } from "./grafic";

export const metadata = { title: "Vizite" };

/** Fereastra pe care se uită ecranul. O lună e cât ține minte cineva ce a scris. */
const ZILE = 30;

export default async function VizitePage() {
  const session = await verifySession();
  const supabase = await createClient();

  const acum = new Date();
  const dinZi = ziuaLa(cuZileInUrma(acum, ZILE - 1));

  const { data, error } = await supabase
    .from("page_views_daily")
    .select("day, path, views")
    .eq("site_id", session.siteId)
    .gte("day", dinZi);

  if (error) console.error("Citirea cifrelor de trafic a eșuat:", error);

  const rezumat = rezumatulTraficului((data ?? []) as unknown as RandDeTrafic[], acum, ZILE);

  // Etichetele se scriu pe server, ca să fie în fusul României indiferent de
  // ceasul calculatorului pe care e deschis panoul.
  const eticheteScurte = rezumat.perZi.map((zi) =>
    // Ora 12 și nu miezul nopții: la miezul nopții, o zi scrisă din UTC ar putea
    // cădea cu o zi mai devreme.
    ziuaScurta(new Date(`${zi.zi}T12:00:00Z`)),
  );

  const areCeva = rezumat.total > 0;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Panou</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Vizite</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Câte pagini s-au citit pe site-ul tău în ultimele {ZILE} de zile, și care
          anume. Nu punem cookie-uri și nu urmărim pe nimeni — numărăm doar paginile
          servite, iar vizitele tale, când ești conectat, nu se socotesc.
        </p>
      </div>

      {!areCeva ? (
        <div className="rounded-base border border-border bg-surface p-6">
          <p className="text-sm text-foreground">Încă nicio vizită înregistrată.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cifrele apar pe măsură ce oamenii intră pe site. Roboții motoarelor de
            căutare nu se numără, ca să nu-ți umfle degeaba socoteala.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-base border border-border bg-surface p-6">
            {/*
              Cifra mare, singură, înaintea graficului: la întrebarea „a intrat
              cineva pe site?" răspunde un număr, nu o formă.
            */}
            <p className="text-sm text-muted-foreground">În ultimele {ZILE} de zile</p>
            <p className="mt-1 text-4xl font-semibold tabular-nums text-foreground">
              {formateazaNumar(rezumat.total)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {rezumat.total === 1 ? "afișare de pagină" : "afișări de pagină"}
            </p>

            <div className="mt-6">
              <GraficZilnic zile={rezumat.perZi} eticheteScurte={eticheteScurte} />
            </div>
          </div>

          <section className="space-y-3">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Cele mai citite pagini
            </h2>

            <ol className="space-y-px overflow-hidden rounded-base border border-border">
              {rezumat.topPagini.map((pagina) => (
                <li
                  key={pagina.cale}
                  className="flex items-baseline justify-between gap-4 bg-surface px-4 py-3"
                >
                  <span className="min-w-0 truncate text-sm text-foreground">{pagina.cale}</span>
                  <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                    {numara(pagina.afisari, "afișare", "afișări")}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}
    </div>
  );
}
