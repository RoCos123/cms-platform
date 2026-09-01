import { verifySession } from "@/lib/dal";
import { Cautare } from "./cautare";
import { cautaPersoana } from "./actions";

export const metadata = { title: "Datele unei persoane" };

export default async function DatePersonalePage({
  searchParams,
}: {
  searchParams: Promise<{ cauta?: string }>;
}) {
  await verifySession();

  /*
   * `?cauta=` vine din linkul de pe un mesaj sau o programare. Căutarea se face
   * AICI, pe server, nu într-un efect din browser: altfel ecranul s-ar deschide
   * gol și ar sări la rezultate o clipă mai târziu, exact când psihologul are
   * omul pe fir și se uită la ce urmează să șteargă.
   */
  const { cauta } = await searchParams;
  const termen = (cauta ?? "").trim();
  const initial = termen === "" ? null : await cautaPersoana(termen);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Panou</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Datele unei persoane</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Dacă cineva îți cere să nu-i mai păstrezi datele, de aici le găsești și le ștergi. Caută
          după numărul de telefon sau adresa de email pe care ți le-a lăsat — nu contează cum le
          scrii, cu spații, cu prefix de țară sau fără. Poți ajunge aici și cu un clic de pe un
          mesaj sau de pe o cerere de programare.
        </p>
      </div>

      <Cautare
        termenInitial={termen}
        gasiriInitiale={initial?.ok ? initial.gasiri : null}
        mesajInitial={initial && !initial.ok ? initial.mesaj : null}
      />
    </div>
  );
}
