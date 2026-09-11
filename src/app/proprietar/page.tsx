import Link from "next/link";
import { verificaProprietar } from "@/lib/proprietar";
import { createServiceClient } from "@/lib/supabase/admin";
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
  searchParams: Promise<{ eroare?: string }>;
}) {
  const proprietar = await verificaProprietar();
  const { eroare } = await searchParams;

  const service = createServiceClient();

  const { data: siteuri } = await service
    .from("sites")
    .select("id, domain, name, template, published_at, appointments_enabled")
    .order("name", { ascending: true });

  // Contul legat de fiecare site, pentru coloana „Cont" și pentru butonul de
  // intrare (fără cont, n-ai în ce panou să intri).
  const { data: conturi } = await service.from("users").select("site_id, email");
  const emailDupaSite = new Map<string, string>(
    (conturi ?? []).map((c: { site_id: string; email: string | null }) => [
      c.site_id,
      c.email ?? "",
    ]),
  );

  const randuri: RandSite[] = ((siteuri ?? []) as Array<{
    id: string;
    domain: string;
    name: string;
    template: string;
    published_at: string | null;
    appointments_enabled: boolean;
  }>).map((s) => ({
    id: s.id,
    domain: s.domain,
    name: s.name,
    template: s.template,
    publicat: s.published_at !== null,
    programari: s.appointments_enabled,
    email: emailDupaSite.get(s.id) ?? "",
  }));

  const mesajEroare = eroare ? MESAJE_EROARE[eroare] : undefined;

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

        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          {randuri.length === 1 ? "Un site" : `${randuri.length} site-uri`}
        </p>

        <TabelSiteuri randuri={randuri} />
      </main>
    </div>
  );
}
