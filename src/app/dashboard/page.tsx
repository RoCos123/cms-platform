import { verifySession } from "@/lib/dal";

export default async function DashboardOverviewPage() {
  const session = await verifySession();

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Dashboard</p>
      <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Bine ai revenit
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        Conectat ca {session.email}. Restul ecranelor (secțiuni, blog, programări…) vin în
        fazele următoare.
      </p>
    </div>
  );
}
