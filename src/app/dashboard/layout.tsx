import type { ReactNode } from "react";
import type { Metadata } from "next";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { BibliotecaImagini } from "@/components/dashboard/biblioteca-imagini";
import { CadruPanou } from "@/components/dashboard/cadru-panou";
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
  const [
    { data: site },
    { count: mesajeNecitite },
    { count: programariDeRaspuns },
  ] = await Promise.all([
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
    // Numărul de lângă „Programări". Aceleași două condiții ca pe ecranul
    // Programări: cerere fără răspuns ȘI ora încă n-a trecut. O cerere pentru
    // marțea trecută nu mai are ce aștepta, iar un număr care n-are cum să
    // ajungă la zero ar fi învățat clientul să-l ignore.
    supabase
      .from("appointments")
      .select("id", { head: true, count: "exact" })
      .eq("site_id", session.siteId)
      .eq("status", "ceruta")
      .gte("starts_at", new Date().toISOString()),
  ]);

  return (
    // Provider-ul înfășoară doar zona autentificată: notificările apar ca urmare
    // a acțiunilor din panou, iar site-ul public nu are ce face cu ele.
    <ToastProvider>
      <CadruPanou
        antetSite={
          <div className="border-b border-border p-4">
            <p className="truncate font-semibold text-foreground">{site?.name ?? "Panou"}</p>
            <p className="truncate text-xs text-muted-foreground">{site?.domain}</p>
          </div>
        }
        nav={
          <SidebarNav
            mesajeNecitite={mesajeNecitite ?? 0}
            programariDeRaspuns={programariDeRaspuns ?? 0}
          />
        }
        unelteAntet={
          <>
            <ThemeToggle />
            {/* Emailul pleacă primul pe telefon: e o comoditate (contează doar
                dacă ai două conturi), iar antetul îngust n-are loc de el. */}
            <span className="hidden truncate text-sm text-muted-foreground sm:inline">
              {session.email}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="whitespace-nowrap text-sm text-muted-foreground underline hover:text-foreground"
              >
                Deconectare
              </button>
            </form>
          </>
        }
      >
        <BibliotecaImagini>{children}</BibliotecaImagini>
      </CadruPanou>
    </ToastProvider>
  );
}
