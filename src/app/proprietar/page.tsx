import Link from "next/link";
import { verificaProprietar } from "@/lib/proprietar";
import { createServiceClient } from "@/lib/supabase/admin";
import {
  parseStatus,
  curataCautarea,
  parsePagina,
  intervalul,
  numarPagini,
  filtruCautare,
} from "@/lib/proprietar-lista";
import { signOutProprietar } from "./actions";
import { TabelSiteuri, type RandSite } from "./tabel-site-uri";

// Nu în motoarele de căutare. robots.txt îl oprește deja; asta e plasa pe pagină.
export const metadata = { robots: { index: false, follow: false } };

const MESAJE_EROARE: Record<string, string> = {
  "fara-cont": "Site-ul acela n-are încă un cont legat, așa că nu pot intra în panoul lui.",
  link: "N-am putut pregăti accesul în panou. Mai încearcă o dată.",
};

export default async function PanouProprietar({
  searchParams,
}: {
  searchParams: Promise<{ eroare?: string; q?: string; status?: string; p?: string }>;
}) {
  const proprietar = await verificaProprietar();
  const sp = await searchParams;

  const pagina = parsePagina(sp.p);
  const qCurat = curataCautarea(sp.q);
  const status = parseStatus(sp.status);
  const cautaSauFiltreaza = qCurat !== "" || status !== "toate";

  const service = createServiceClient();

  // Emailul stă în alt tabel (`users`), deci căutarea după email trece întâi pe
  // acolo: aflăm ce site-uri au un cont cu emailul potrivit, apoi le cerem între
  // celelalte. `.ilike` e parametrizat de client, nu construit ca șir.
  let siteIdsEmail: string[] = [];
  if (qCurat) {
    const { data: potriviteEmail } = await service
      .from("users")
      .select("site_id")
      .ilike("email", `%${qCurat}%`);
    siteIdsEmail = ((potriviteEmail ?? []) as Array<{ site_id: string | null }>)
      .map((c) => c.site_id)
      .filter((id): id is string => Boolean(id));
  }

  let interogare = service
    .from("sites")
    .select("id, domain, name, template, published_at, appointments_enabled", { count: "exact" });

  const filtru = filtruCautare(qCurat, siteIdsEmail);
  if (filtru) interogare = interogare.or(filtru);
  if (status === "publicat") interogare = interogare.not("published_at", "is", null);
  else if (status === "draft") interogare = interogare.is("published_at", null);

  const { de, la } = intervalul(pagina);
  const { data: siteuri, count } = await interogare
    .order("name", { ascending: true })
    .range(de, la);

  const total = count ?? 0;
  const pagini = numarPagini(total);

  // Conturile DOAR pentru site-urile de pe pagina asta — nu toți utilizatorii
  // platformei. Asta e jumătatea de scală a schimbării: cererea rămâne mică
  // oricâți clienți ar fi în total.
  const randuriBrute = (siteuri ?? []) as Array<{
    id: string;
    domain: string;
    name: string;
    template: string;
    published_at: string | null;
    appointments_enabled: boolean;
  }>;
  const idPagina = randuriBrute.map((s) => s.id);

  const { data: conturi } = idPagina.length
    ? await service.from("users").select("site_id, email").in("site_id", idPagina)
    : { data: [] as Array<{ site_id: string; email: string | null }> };

  const emailDupaSite = new Map<string, string>(
    ((conturi ?? []) as Array<{ site_id: string; email: string | null }>).map((c) => [
      c.site_id,
      c.email ?? "",
    ]),
  );

  const randuri: RandSite[] = randuriBrute.map((s) => ({
    id: s.id,
    domain: s.domain,
    name: s.name,
    template: s.template,
    publicat: s.published_at !== null,
    programari: s.appointments_enabled,
    email: emailDupaSite.get(s.id) ?? "",
  }));

  const mesajEroare = sp.eroare ? MESAJE_EROARE[sp.eroare] : undefined;

  // Linkurile de paginare păstrează căutarea și filtrul; pagina 1 nu pune `p`.
  function linkPagina(p: number): string {
    const params = new URLSearchParams();
    if (sp.q) params.set("q", sp.q);
    if (status !== "toate") params.set("status", status);
    if (p > 1) params.set("p", String(p));
    const qs = params.toString();
    return qs ? `/proprietar?${qs}` : "/proprietar";
  }

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Panoul proprietarului
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Toate site-urile platformei, într-un singur loc.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/proprietar/client-nou"
              className="rounded-md bg-zinc-900 px-3 py-1.5 font-medium text-white hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Client nou
            </Link>
            <span className="hidden text-zinc-500 sm:inline dark:text-zinc-400">
              {proprietar.email}
            </span>
            <form action={signOutProprietar}>
              <button
                type="submit"
                className="rounded-md border border-zinc-300 px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Ieși
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {mesajEroare && (
          <p className="mb-6 rounded-md bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
            {mesajEroare}
          </p>
        )}

        {/* Căutare + filtru: un formular GET, fără JavaScript — se poate marca și
            trimite din tastatură, iar adresa rezultată e de pus la favorite.

            Pe telefon caseta de căutare ia rândul ei întreg, iar filtrul și
            butonul stau pe rândul de sub ea. Înghesuite toate trei pe un rând,
            caseta rămânea atât de scurtă încât îi tăia și textul de îndrumare
            („Caută după domeniu, nume sa…"). */}
        <form method="get" className="mb-4 flex flex-wrap items-center gap-2">
          <input
            type="search"
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Caută după domeniu, nume sau email"
            aria-label="Caută site"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 sm:w-auto sm:min-w-56 sm:flex-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <select
            name="status"
            defaultValue={status}
            aria-label="Filtrează după stare"
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="toate">Toate stările</option>
            <option value="publicat">Publicate</option>
            <option value="draft">Nepublicate</option>
          </select>
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Caută
          </button>
          {cautaSauFiltreaza && (
            <Link
              href="/proprietar"
              className="rounded-md px-2 py-1.5 text-sm text-zinc-500 underline-offset-2 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Șterge
            </Link>
          )}
        </form>

        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          {total === 1 ? "Un site" : `${total} site-uri`}
          {cautaSauFiltreaza ? " (filtrate)" : ""}
          {pagini > 1 ? ` · pagina ${pagina} din ${pagini}` : ""}
        </p>

        <TabelSiteuri
          randuri={randuri}
          mesajGol={
            cautaSauFiltreaza
              ? "Niciun site pentru căutarea sau filtrul ales."
              : undefined
          }
        />

        {pagini > 1 && (
          <nav className="mt-6 flex items-center justify-between gap-3 text-sm" aria-label="Paginare">
            {pagina > 1 ? (
              <Link
                href={linkPagina(pagina - 1)}
                rel="prev"
                className="rounded-md border border-zinc-300 px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                ← Înapoi
              </Link>
            ) : (
              <span aria-hidden />
            )}
            <span className="text-zinc-500 dark:text-zinc-400">
              Pagina {pagina} din {pagini}
            </span>
            {pagina < pagini ? (
              <Link
                href={linkPagina(pagina + 1)}
                rel="next"
                className="rounded-md border border-zinc-300 px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Înainte →
              </Link>
            ) : (
              <span aria-hidden />
            )}
          </nav>
        )}
      </main>
    </div>
  );
}
