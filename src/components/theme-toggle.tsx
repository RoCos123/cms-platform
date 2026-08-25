"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // Evită mismatch de hidratare: tema reală nu e cunoscută până la montare pe
  // client. useSyncExternalStore (nu useEffect+useState) — snapshot diferit
  // server/client fără randare sincronă suplimentară.
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!mounted) {
    return <div className="h-7 w-20" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Comută la modul luminos" : "Comută la modul întunecat"}
      className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
    >
      {isDark ? "Luminos" : "Întunecat"}
    </button>
  );
}
