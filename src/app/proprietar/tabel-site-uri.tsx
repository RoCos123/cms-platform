import { ButonIntra } from "./buton-intra";

/** Un rând din lista de site-uri, gata de arătat — datele deja pregătite în pagină. */
export type RandSite = {
  id: string;
  domain: string;
  name: string;
  template: string;
  publicat: boolean;
  programari: boolean;
  /** Contul legat. Gol dacă site-ul n-are cont — atunci nu se poate intra în panou. */
  email: string;
};

/** Numele șablonului, așa cum îl recunoști tu — nu cheia din baza de date. */
const NUME_SABLON: Record<string, string> = {
  caldura: "Căldură",
  liniste: "Liniște",
  lumina: "Lumină",
  apropiere: "Apropiere",
  claritate: "Claritate",
};

function numeSablon(template: string): string {
  return NUME_SABLON[template] ?? template;
}

/**
 * Pastila de stare. Scrisă o dată, folosită și în tabel, și pe cartonașele de
 * telefon: două copii ar fi ajuns să difere la prima schimbare de culoare.
 */
function Stare({ publicat }: { publicat: boolean }) {
  return publicat ? (
    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-950 dark:text-green-300">
      Publicat
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
      Nepublicat
    </span>
  );
}

function Adresa({ domain }: { domain: string }) {
  return (
    <a
      href={`https://${domain}`}
      target="_blank"
      rel="noopener noreferrer"
      // `break-all`: un domeniu lung n-are spații în el, deci fără asta iese din
      // cartonaș pe telefon și împinge toată pagina la dreapta.
      className="break-all text-zinc-600 underline underline-offset-2 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
    >
      {domain}
    </a>
  );
}

/**
 * Lista cu toate site-urile platformei. Separată de pagină ca să poată fi
 * probată vizual cu date inventate, fără Supabase (mediul de dezvoltare nu ajunge
 * la el) — iar ce se probează e chiar ce se randează, nu o copie.
 *
 * DOUĂ ÎNFĂȚIȘĂRI, nu una singură care se strâmbă. Pe ecran de calculator, un
 * tabel cu șase coloane. Pe telefon, cartonașe stivuite — fiindcă din șase
 * coloane încap două, iar restul rămân după marginea ecranului. Derularea
 * laterală există (`overflow-x-auto`), dar nimic nu-ți spune că e acolo: pe 22
 * sept. 2026 proprietarul a deschis lista pe telefon și a văzut doar „Cabinet"
 * și „Adresă", fără să bănuiască că mai sunt patru coloane.
 *
 * Aceleași date în amândouă, nimic ascuns pe telefon: cine administrează
 * platforma de pe telefon are nevoie de aceleași lucruri ca de pe calculator.
 */
export function TabelSiteuri({
  randuri,
  mesajGol = "Încă niciun site. Primul se face din Supabase, cu SQL-ul de provizionare.",
}: {
  randuri: RandSite[];
  /** Ce arătăm când lista e goală. Diferă între „n-ai niciun site" și „căutarea n-a găsit nimic". */
  mesajGol?: string;
}) {
  if (randuri.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        {mesajGol}
      </p>
    );
  }

  return (
    <>
      {/* Telefon: cartonașe. */}
      <ul className="grid gap-3 sm:hidden">
        {randuri.map((site) => (
          <li
            key={site.id}
            className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium text-zinc-900 dark:text-zinc-50">{site.name}</div>
                {site.email && (
                  <div className="break-all text-xs text-zinc-500 dark:text-zinc-400">
                    {site.email}
                  </div>
                )}
              </div>
              {/* `shrink-0`: pastila nu se turtește când numele e lung. */}
              <div className="shrink-0">
                <Stare publicat={site.publicat} />
              </div>
            </div>

            <div className="mt-2 text-sm">
              <Adresa domain={site.domain} />
            </div>

            <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              {numeSablon(site.template)}
              {site.programari ? " · Programări pornite" : ""}
            </div>

            <div className="mt-3">
              <ButonIntra siteId={site.id} faraCont={!site.email} />
            </div>
          </li>
        ))}
      </ul>

      {/* Calculator: tabelul de dinainte, neatins. */}
      <div className="hidden overflow-x-auto rounded-lg border border-zinc-200 bg-white sm:block dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Cabinet</th>
              <th className="px-4 py-3 font-medium">Adresă</th>
              <th className="px-4 py-3 font-medium">Șablon</th>
              <th className="px-4 py-3 font-medium">Stare</th>
              <th className="px-4 py-3 font-medium">Programări</th>
              <th className="px-4 py-3 text-right font-medium">Panou</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {randuri.map((site) => (
              <tr key={site.id} className="text-zinc-800 dark:text-zinc-200">
                <td className="px-4 py-3">
                  <div className="font-medium text-zinc-900 dark:text-zinc-50">{site.name}</div>
                  {site.email && (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">{site.email}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Adresa domain={site.domain} />
                </td>
                <td className="px-4 py-3">{numeSablon(site.template)}</td>
                <td className="px-4 py-3">
                  <Stare publicat={site.publicat} />
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {site.programari ? "Pornite" : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <ButonIntra siteId={site.id} faraCont={!site.email} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
