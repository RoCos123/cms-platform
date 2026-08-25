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
      className="rounded-base border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-surface-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {isDark ? "Luminos" : "Întunecat"}
    </button>
  );
}
