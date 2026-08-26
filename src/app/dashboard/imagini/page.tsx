import { verifySession } from "@/lib/dal";
import { imaginileBibliotecii } from "@/lib/imagini-panou";
import { Galerie } from "./galerie";

export const metadata = { title: "Imagini" };

export default async function ImaginiPage() {
  const session = await verifySession();
  const imagini = await imaginileBibliotecii(session.siteId);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Panou
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Imagini</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Toate pozele încărcate pe site-ul tău. Fiecare se încarcă o singură dată și
          poate fi pusă apoi în oricâte locuri — aici vezi și în care anume.
        </p>
      </div>

      <Galerie imagini={imagini} />
    </div>
  );
}
