"use client";

import { useActionState } from "react";
import Link from "next/link";
import { creeazaClientNou } from "./actions";

const eticheta = "text-sm font-medium text-zinc-700 dark:text-zinc-300";
const camp =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50";

export function ClientNouForm({ sabloane }: { sabloane: { id: string; nume: string }[] }) {
  const [state, action, pending] = useActionState(creeazaClientNou, undefined);

  if (state && "ok" in state) {
    return (
      <div className="w-full max-w-lg space-y-4 rounded-xl border border-green-200 bg-green-50 p-8 dark:border-green-900 dark:bg-green-950">
        <h1 className="text-xl font-semibold text-green-900 dark:text-green-200">
          Gata — site-ul {state.ok.domeniu} e creat.
        </h1>
        {state.ok.pasi.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-green-900 dark:text-green-200">Ce mai ai de făcut:</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-green-800 dark:text-green-300">
              {state.ok.pasi.map((pas, i) => (
                <li key={i}>{pas}</li>
              ))}
            </ul>
          </div>
        )}
        <Link
          href="/proprietar"
          className="inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Înapoi la lista site-urilor
        </Link>
      </div>
    );
  }

  return (
    <form
      action={action}
      className="w-full max-w-lg space-y-4 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Client nou</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Face contul de login și site-ul dintr-o mișcare. Domeniul îl conectezi separat în Vercel.
        </p>
      </div>

      <div className="space-y-1">
        <label htmlFor="nume" className={eticheta}>
          Numele cabinetului
        </label>
        <input id="nume" name="nume" type="text" required maxLength={120} className={camp} />
      </div>

      <div className="space-y-1">
        <label htmlFor="domeniu" className={eticheta}>
          Domeniu
        </label>
        <input
          id="domeniu"
          name="domeniu"
          type="text"
          required
          placeholder="cabinet-rodica.ro"
          className={camp}
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Doar adresa, fără https:// și fără cale. Poate fi și un subdomeniu .vercel.app pentru probă.
        </p>
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className={eticheta}>
          Emailul clientului
        </label>
        <input id="email" name="email" type="email" required maxLength={200} className={camp} />
      </div>

      <div className="space-y-1">
        <label htmlFor="parola" className={eticheta}>
          Parola inițială
        </label>
        <input
          id="parola"
          name="parola"
          type="text"
          required
          minLength={8}
          autoComplete="off"
          className={camp}
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          I-o dai clientului; el și-o schimbă apoi. Cel puțin 8 caractere.
        </p>
      </div>

      <div className="space-y-1">
        <label htmlFor="sablon" className={eticheta}>
          Șablon
        </label>
        <select id="sablon" name="sablon" defaultValue="caldura" className={camp}>
          {sabloane.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nume}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        <input type="checkbox" name="programari" className="h-4 w-4" />
        Cu modulul Programări
      </label>

      {state && "error" in state && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? "Se creează…" : "Creează site-ul"}
        </button>
        <Link
          href="/proprietar"
          className="text-sm text-zinc-500 underline underline-offset-2 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          Renunță
        </Link>
      </div>
    </form>
  );
}
