"use client";

import { useActionState } from "react";
import { schimbaParola } from "./actions";

const stilCamp =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50";

export function FormularParolaNoua() {
  const [state, action, pending] = useActionState(schimbaParola, undefined);

  return (
    <form
      action={action}
      className="w-full max-w-sm space-y-4 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Alege o parolă nouă
      </h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        Scrie noua parolă de două ori, ca să fim siguri că e cea pe care o vrei.
      </p>

      <div className="space-y-1">
        <label htmlFor="parola" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Parolă nouă
        </label>
        <input
          id="parola"
          name="parola"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={stilCamp}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="confirma" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Încă o dată
        </label>
        <input
          id="confirma"
          name="confirma"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={stilCamp}
        />
      </div>

      {state?.eroare && <p className="text-sm text-red-600 dark:text-red-400">{state.eroare}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "Se salvează…" : "Salvează parola"}
      </button>
    </form>
  );
}
