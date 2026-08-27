"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

type NavItem = {
  label: string;
  href?: string;
  /** Numărul afișat lângă etichetă (ex. mesaje necitite). Zero nu se arată. */
  numar?: number;
};
type NavGroup = { label: string; items: NavItem[] };

// Structura recomandată din audit-dashboard.md §10 („Arhitectura informației
// propusă"), nu meniul original — fără Templates/Portfolio ca intrări separate
// (cod mort, vezi decizii-faza-0.md §6). Rutele reale se adaugă în Fazele 3-6;
// până atunci itemele fără `href` apar ca „curând".
//
// „Componente" nu e aici intenționat: galeria de la /dashboard/componente e
// bancul de lucru al dezvoltării (un câmp de text, un tabel, o bară de salvare),
// nu o unealtă de client. Ruta există în continuare pentru cine o caută, dar
// n-are ce face într-un meniu pe care îl vede un psiholog.
const NAV: (NavItem | NavGroup)[] = [
  { label: "Acasă", href: "/dashboard" },
  // Un grup cu un singur element înăuntru cerea două clicuri și punea aceleași
  // cuvinte în două locuri („Pagina principală" în meniu, „Secțiuni" înăuntru și
  // ca titlu de pagină). Celelalte pagini ale site-ului stau la „Pagini".
  { label: "Pagina principală", href: "/dashboard/sectiuni" },
  { label: "Servicii", href: "/dashboard/servicii" },
  { label: "Pagini", href: "/dashboard/pagini" },
  // Fără subgrup: „Articole" era singurul lucru dinăuntru care există, iar un
  // grup cu un singur element cerea două clicuri și punea aceleași cuvinte în
  // două locuri. Categoriile se adaugă când un cabinet chiar are atâtea articole
  // încât să nu le mai găsească.
  { label: "Blog", href: "/dashboard/blog" },
  { label: "Programări", href: "/dashboard/programari" },
  { label: "Mesaje", href: "/dashboard/mesaje" },
  { label: "Imagini", href: "/dashboard/imagini" },
  { label: "Setări", href: "/dashboard/setari" },
  { label: "Vizite", href: "/dashboard/vizite" },
  { label: "Activitate", href: "/dashboard/activitate" },
];

function isGroup(item: NavItem | NavGroup): item is NavGroup {
  return "items" in item;
}

export function SidebarNav({ mesajeNecitite = 0 }: { mesajeNecitite?: number }) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto p-3 text-sm">
      {NAV.map((item) =>
        isGroup(item) ? (
          <div key={item.label}>
            <button
              type="button"
              aria-expanded={Boolean(openGroups[item.label])}
              onClick={() =>
                setOpenGroups((prev) => ({ ...prev, [item.label]: !prev[item.label] }))
              }
              className="flex w-full items-center justify-between rounded-base px-3 py-2 font-medium text-foreground hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {item.label}
              <span aria-hidden>{openGroups[item.label] ? "−" : "+"}</span>
            </button>
            {openGroups[item.label] && (
              <div className="ml-3 space-y-1 border-l border-border pl-3">
                {item.items.map((sub) => (
                  <NavLink key={sub.label} item={sub} pathname={pathname} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <NavLink
            key={item.label}
            item={item.label === "Mesaje" ? { ...item, numar: mesajeNecitite } : item}
            pathname={pathname}
          />
        ),
      )}
    </nav>
  );
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  if (!item.href) {
    return (
      <span className="flex items-center justify-between rounded-base px-3 py-2 text-muted-foreground opacity-60">
        {item.label}
        <span className="text-xs">curând</span>
      </span>
    );
  }

  const isActive = pathname === item.href;

  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "block rounded-base px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-foreground hover:bg-surface-hover",
      )}
    >
      <span className="flex items-center justify-between gap-2">
        {item.label}
        {Boolean(item.numar) && (
          <span
            className={cn(
              "rounded-base px-1.5 text-xs font-medium",
              isActive ? "bg-primary-foreground/20" : "bg-primary text-primary-foreground",
            )}
          >
            {item.numar}
          </span>
        )}
      </span>
    </Link>
  );
}
