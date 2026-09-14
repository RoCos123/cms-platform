import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { imaginileBibliotecii, documenteleBibliotecii } from "@/lib/imagini-panou";
import { Galerie } from "./galerie";
import { Documente } from "./documente";

export const metadata = { title: "Bibliotecă" };

export default async function ImaginiPage() {
  const session = await verifySession();
  const [imagini, documente] = await Promise.all([
    imaginileBibliotecii(session.siteId),
    documenteleBibliotecii(session.siteId),
  ]);

  return (
    <div className="space-y-10 pb-12">
      <section className="space-y-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Panou
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">Bibliotecă</h1>
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
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Documente</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Fișe, formulare, acorduri — PDF sau Word, pe care pacienții le pot descărca.
            Ca să pui unul pe site, leagă-l de un buton „Descarcă” la un program, în{" "}
            <Link href="/dashboard/sectiuni" className="underline hover:text-foreground">
              „Programe și materiale”
            </Link>
            .
          </p>
        </div>

        <Documente documente={documente} />
      </section>
    </div>
  );
}
