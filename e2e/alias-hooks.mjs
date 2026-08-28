import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * Rezolvă `@/…` la `src/…`, ca Node să poată încărca direct module scrise
 * pentru Next (unde aliasul vine din tsconfig, nu din runtime).
 *
 * Există ca logica pură — reguli, parsere, validări — să poată fi probată fără
 * server și fără Supabase, așa cum cere CONVENTII.md. Se înregistrează prin
 * `alias.mjs`, nu direct.
 */
const radacina = path.resolve(import.meta.dirname, "..");

/** Extensiile pe care le-ar încerca TypeScript, în ordinea lui. */
function cuExtensie(baza) {
  // Directorul se sare dinadins: `import "@/lib/templates"` trebuie să ajungă
  // la `index.ts`, nu la folder — Node refuză importul unui director.
  const candidati =
    existsSync(baza) && statSync(baza).isDirectory()
      ? [path.join(baza, "index.ts"), path.join(baza, "index.tsx")]
      : [`${baza}.ts`, `${baza}.tsx`, baza];

  return candidati.find((c) => existsSync(c) && statSync(c).isFile()) ?? null;
}

export function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const gasit = cuExtensie(path.join(radacina, "src", specifier.slice(2)));
    if (gasit) return nextResolve(pathToFileURL(gasit).href, context);
    return nextResolve(specifier, context);
  }

  /*
   * Importurile relative dintre fișiere TypeScript se scriu fără extensie
   * (`import { caldura } from "./caldura"`), iar Node nu le completează singur.
   * Fără linia asta, un modul împărțit în mai multe fișiere — cum e stratul de
   * șabloane — nu poate fi probat deloc: aliasul ducea la `index.ts`, iar acolo
   * primul import relativ pica.
   */
  if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
    const parinte = fileURLToPath(context.parentURL);
    if (/\.tsx?$/.test(parinte) && !/\.[a-z]+$/i.test(specifier)) {
      const gasit = cuExtensie(path.resolve(path.dirname(parinte), specifier));
      if (gasit) return nextResolve(pathToFileURL(gasit).href, context);
    }
  }

  return nextResolve(specifier, context);
}
