import Link from "next/link";
import { verificaProprietar } from "@/lib/proprietar";
import { createServiceClient } from "@/lib/supabase/admin";
import { listTemplates } from "@/lib/templates";
import { ClientNouForm } from "./client-nou-form";

export const metadata = { robots: { index: false, follow: false } };

export default async function ClientNouPage() {
  await verificaProprietar();

  // Opțiunile de șablon se calculează pe server și se dau formularului: lista e
  // una singură (`listTemplates`), iar clientul nu importă tot registrul de
  // șabloane în pachetul lui.
  const sabloane = listTemplates().map((t) => ({ id: t.id, nume: t.nume }));

  // Site-urile existente, ca surse posibile de clonare.
  const service = createServiceClient();
  const { data: siteuri } = await service
    .from("sites")
    .select("domain, name")
    .order("name", { ascending: true });
  const surse = ((siteuri ?? []) as { domain: string; name: string }[]).map((s) => ({
    domeniu: s.domain,
    nume: s.name,
  }));

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
          <Link
            href="/proprietar"
            className="text-sm text-zinc-500 underline underline-offset-2 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            ← Toate site-urile
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl justify-center px-4 py-8 sm:px-6">
        <ClientNouForm sabloane={sabloane} surse={surse} />
      </main>
    </div>
  );
}
