"use client";

import { useActionState } from "react";
import { CampParola } from "@/components/ui/camp-parola";
import { schimbaParola } from "./actions";

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
        <CampParola id="parola" name="parola" minLength={8} autoComplete="new-password" />
      </div>

      <div className="space-y-1">
        <label htmlFor="confirma" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Încă o dată
        </label>
        <CampParola id="confirma" name="confirma" minLength={8} autoComplete="new-password" />
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
