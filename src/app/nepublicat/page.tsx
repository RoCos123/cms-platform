import type { Metadata } from "next";
import { getTenant } from "@/lib/dal";
import { identitateaSiteului } from "@/lib/site-public";

/**
 * Ce vede un vizitator pe un site care încă nu a fost publicat.
 *
 * Ținta rescrierii din `src/proxy.ts` pentru site-urile cu `published_at` null.
 * Clientul logat NU ajunge aici: el vede site-ul adevărat, cu o bandă deasupra.
 *
 * De ce o pagină, și nu un 404: un 404 pe domeniul cabinetului i-ar spune
 * omului că adresa e greșită, iar el ar căuta alta. Aici i se spune adevărul —
 * pagina se pregătește — fără să pretindă că e site-ul gata.
 *
 * De ce nu scrie „în construcție” cu un șantier desenat: pagina asta poate fi
 * primul lucru pe care îl vede un pacient care caută ajutor. Numele cabinetului
 * și o frază liniștită sunt mai potrivite decât o glumă.
 */
export const metadata: Metadata = {
  // Nu se indexează, nici măcar ca titlu într-un rezultat. Un cabinet care intră
  // în Google cu „pagina se pregătește” pornește lansarea în pierdere.
  robots: { index: false, follow: false },
  title: "Pagina se pregătește",
};

export default async function PaginaNepublicata() {
  const { siteId } = await getTenant();
  const { site } = await identitateaSiteului(siteId);
  const nume = (site?.name as string | undefined) || "Cabinetul";

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{nume}</h1>
      <p className="max-w-md text-sm leading-relaxed text-zinc-500">
        Pagina se pregătește și va fi disponibilă în curând. Îți mulțumim pentru răbdare.
      </p>
    </div>
  );
}
