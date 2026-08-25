import type { ReactNode } from "react";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { SidebarNav } from "@/components/sidebar-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOut } from "./actions";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await verifySession();
  const supabase = await createClient();
  const { data: site } = await supabase
    .from("sites")
    .select("name, domain")
    .eq("id", session.siteId)
    .single();

  return (
    <div className="flex flex-1 bg-zinc-50 dark:bg-zinc-950">
      <aside className="flex w-64 shrink-0 flex-col border-r border-zinc-200 dark:border-zinc-800">
        <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
          <p className="font-semibold text-zinc-900 dark:text-zinc-50">{site?.name ?? "Panou"}</p>
          <p className="text-xs text-zinc-500">{site?.domain}</p>
        </div>
        <SidebarNav />
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-3 dark:border-zinc-800">
          <p className="text-sm text-zinc-500">Panou de administrare</p>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">{session.email}</span>
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                Deconectare
              </button>
            </form>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
