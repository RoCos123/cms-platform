import { headers } from "next/headers";

// Placeholder pentru site-ul public al tenantului rezolvat — randarea reală a
// secțiunilor vine în Faza 4. Deocamdată dovedește că rezolvarea tenantului
// (proxy.ts -> x-site-id) funcționează capăt la capăt.
export default async function PublicHomePage() {
  const headerList = await headers();
  const siteId = headerList.get("x-site-id");
  const domain = headerList.get("x-site-domain");

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
      <p className="text-sm text-zinc-500">Site public — conținut vine în Faza 3–4</p>
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{domain}</h1>
      <p className="text-xs text-zinc-400">site_id: {siteId}</p>
    </div>
  );
}
