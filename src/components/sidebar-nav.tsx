"use client";

import { useState } from "react";
import Link from "next/link";

type NavItem = { label: string; href?: string };
type NavGroup = { label: string; items: NavItem[] };

// Structura recomandată din audit-dashboard.md §10 („Arhitectura informației
// propusă"), nu meniul original — fără Templates/Portfolio (cod mort, vezi
// decizii-faza-0.md §6). Rutele reale se adaugă în Fazele 2-6; până atunci
// itemele fără `href` apar ca „curând".
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
];

function isGroup(item: NavItem | NavGroup): item is NavGroup {
  return "items" in item;
}

export function SidebarNav() {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto p-3 text-sm">
      {NAV.map((item) =>
        isGroup(item) ? (
          <div key={item.label}>
            <button
              type="button"
              onClick={() =>
                setOpenGroups((prev) => ({ ...prev, [item.label]: !prev[item.label] }))
              }
              className="flex w-full items-center justify-between rounded-md px-3 py-2 font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              {item.label}
              <span aria-hidden>{openGroups[item.label] ? "−" : "+"}</span>
            </button>
            {openGroups[item.label] && (
              <div className="ml-3 space-y-1 border-l border-zinc-200 pl-3 dark:border-zinc-800">
                {item.items.map((sub) => (
                  <NavLink key={sub.label} item={sub} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <NavLink key={item.label} item={item} />
        ),
      )}
    </nav>
  );
}

function NavLink({ item }: { item: NavItem }) {
  if (!item.href) {
    return (
      <span className="flex items-center justify-between rounded-md px-3 py-2 text-zinc-400 dark:text-zinc-600">
        {item.label}
        <span className="text-xs">curând</span>
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      className="block rounded-md px-3 py-2 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
    >
      {item.label}
    </Link>
  );
}
