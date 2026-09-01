import { verifySession } from "@/lib/dal";
import { Cautare } from "./cautare";

export const metadata = { title: "Datele unei persoane" };

export default async function DatePersonalePage() {
  await verifySession();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Panou</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Datele unei persoane</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Dacă cineva îți cere să nu-i mai păstrezi datele, de aici le găsești și le ștergi. Caută
          după numărul de telefon sau adresa de email pe care ți le-a lăsat — nu contează cum le
          scrii, cu spații, cu prefix de țară sau fără.
        </p>
      </div>

      <Cautare />
    </div>
  );
}
