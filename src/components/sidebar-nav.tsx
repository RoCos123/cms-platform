"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

type NavItem = { label: string; href?: string };
type NavGroup = { label: string; items: NavItem[] };

// Structura recomandată din audit-dashboard.md §10 („Arhitectura informației
// propusă"), nu meniul original — fără Templates/Portfolio ca intrări separate
// (cod mort, vezi decizii-faza-0.md §6). Rutele reale se adaugă în Fazele 3-6;
// până atunci itemele fără `href` apar ca „curând".
const NAV: (NavItem | NavGroup)[] = [
  { label: "Acasă", href: "/dashboard" },
  { label: "Pagina principală", items: [{ label: "Secțiuni" }] },
  { label: "Pagini" },
  { label: "Blog", items: [{ label: "Articole" }, { label: "Categorii" }] },
  { label: "Programări" },
  { label: "Mesaje" },
  { label: "Imagini" },
  { label: "Setări" },
  { label: "Activitate" },
  { label: "Componente", href: "/dashboard/componente" },
];

function isGroup(item: NavItem | NavGroup): item is NavGroup {
  return "items" in item;
}

export function SidebarNav() {
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
          <NavLink key={item.label} item={item} pathname={pathname} />
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
      {item.label}
    </Link>
  );
}
