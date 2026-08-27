import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Rezolvă `@/…` la `src/…`, ca Node să poată încărca direct module scrise
 * pentru Next (unde aliasul vine din tsconfig, nu din runtime).
 *
 * Există ca logica pură — reguli, parsere, validări — să poată fi probată fără
 * server și fără Supabase, așa cum cere CONVENTII.md. Se înregistrează prin
 * `alias.mjs`, nu direct.
 */
const radacina = path.resolve(import.meta.dirname, "..");

export function resolve(specifier, context, nextResolve) {
  if (!specifier.startsWith("@/")) return nextResolve(specifier, context);

  const baza = path.join(radacina, "src", specifier.slice(2));

  // Aliasul se scrie fără extensie; le încercăm în ordinea în care le-ar căuta
  // și TypeScript.
  for (const candidat of [baza, `${baza}.ts`, `${baza}.tsx`, path.join(baza, "index.ts")]) {
    if (existsSync(candidat)) {
      return nextResolve(pathToFileURL(candidat).href, context);
    }
  }

  return nextResolve(specifier, context);
}
