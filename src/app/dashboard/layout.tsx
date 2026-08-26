import type { ReactNode } from "react";
import type { Metadata } from "next";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { imaginileBibliotecii } from "@/lib/imagini-panou";
import { BibliotecaImagini } from "@/components/dashboard/biblioteca-imagini";
import { SidebarNav } from "@/components/sidebar-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { ToastProvider } from "@/components/ui/toast";
import { signOut } from "./actions";

export const metadata: Metadata = {
  title: { template: "%s · Panou", default: "Panou" },
};

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await verifySession();
  const supabase = await createClient();
  const [{ data: site }, { count: mesajeNecitite }, imagini] = await Promise.all([
    supabase.from("sites").select("name, domain").eq("id", session.siteId).single(),
    // Numărul de lângă „Mesaje" din meniu. Fără el, un mesaj primit ar fi
    // invizibil până când clientul s-ar gândi singur să intre acolo — iar
    // notificarea pe email încă nu există.
    supabase
      .from("contact_messages")
      .select("id", { head: true, count: "exact" })
      .eq("site_id", session.siteId)
      .is("deleted_at", null)
      .is("read_at", null),
    // Fereastra „Alege din bibliotecă" trebuie să fie la îndemână din orice
    // formular cu imagini, deci lista se citește o dată aici, nu de fiecare
    // ecran în parte. `imaginileBibliotecii` e memorată pe cerere: ecranul
    // Imagini o cere și el, fără o a doua interogare.
    imaginileBibliotecii(session.siteId),
  ]);

  return (
    // Provider-ul înfășoară doar zona autentificată: notificările apar ca urmare
    // a acțiunilor din panou, iar site-ul public nu are ce face cu ele.
    <ToastProvider>
      <div className="flex flex-1 bg-background">
        <aside className="flex w-64 shrink-0 flex-col border-r border-border">
          <div className="border-b border-border p-4">
            <p className="font-semibold text-foreground">{site?.name ?? "Panou"}</p>
            <p className="text-xs text-muted-foreground">{site?.domain}</p>
          </div>
          <SidebarNav mesajeNecitite={mesajeNecitite ?? 0} />
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-border px-6 py-3">
            <p className="text-sm text-muted-foreground">Panou de administrare</p>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <span className="text-sm text-muted-foreground">{session.email}</span>
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-sm text-muted-foreground underline hover:text-foreground"
                >
                  Deconectare
                </button>
              </form>
            </div>
          </header>
          <main className="flex-1 p-6">
            <BibliotecaImagini imagini={imagini}>{children}</BibliotecaImagini>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
