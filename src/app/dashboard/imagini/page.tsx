import Link from "next/link";
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
          Toate pozele încărcate pe site-ul tău. Aici le ții la un loc, le descrii și
          vezi unde e pusă fiecare.
        </p>
        {/*
          Întrebarea firească după prima încărcare e „și acum cum o pun pe site?".
          Răspunsul stă aici, nu într-un manual: pozele nu se așază de pe ecranul
          ăsta, ci din secțiunea în care le vrei.
        */}
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Ca să pui una pe site, deschide{" "}
          <Link href="/dashboard/sectiuni" className="underline hover:text-foreground">
            secțiunea în care o vrei
          </Link>{" "}
          și apasă „Alege din bibliotecă”.
        </p>
      </div>

      <Galerie imagini={imagini} />
    </div>
  );
}
