type Props = {
  searchParams: Promise<{ host?: string }>;
};

// Țintă de rewrite din proxy.ts pentru host-uri nerezolvate la niciun tenant
// (preview-uri Vercel *.vercel.app, sau un domeniu real neconfigurat încă în
// tabelul `sites`) — vezi decizii-faza-0.md §2.
export default async function SiteUnavailablePage({ searchParams }: Props) {
  const { host } = await searchParams;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        {host ? "Domeniu neconfigurat" : "Platformă sitepsihologi.ro"}
      </h1>
      <p className="max-w-md text-sm text-zinc-500">
        {host
          ? `Domeniul „${host}” nu e asociat niciunui tenant încă.`
          : "Acesta e un preview de platformă, fără tenant asociat."}
      </p>
    </div>
  );
}
