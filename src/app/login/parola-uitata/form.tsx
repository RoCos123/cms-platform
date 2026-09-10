"use client";

import { useActionState } from "react";
import Link from "next/link";
import { cereResetareParola } from "./actions";

const stilCard =
  "w-full max-w-sm space-y-4 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900";
const stilLink =
  "text-zinc-500 underline underline-offset-2 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200";

export function FormularParolaUitata({ linkInvalid }: { linkInvalid: boolean }) {
  const [state, action, pending] = useActionState(cereResetareParola, undefined);

  if (state?.trimis) {
    return (
      <div className={stilCard}>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Verifică-ți emailul
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Dacă adresa are un cont, ți-am trimis un link prin care îți alegi o parolă
          nouă. Deschide-l din emailul primit — e valabil un timp scurt.
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          N-a venit nimic în câteva minute? Uită-te și în „Spam”, apoi încearcă din nou.
        </p>
        <p className="text-center text-sm">
          <Link href="/login" className={stilLink}>
            Înapoi la conectare
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form action={action} className={stilCard}>
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Resetează parola
      </h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        Scrie adresa cu care intri în panou. Îți trimitem un link prin care îți alegi
        o parolă nouă.
      </p>

      {linkInvalid && (
        <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Linkul de resetare era greșit sau a expirat. Cere unul nou mai jos.
        </p>
      )}

      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
      </div>

      {state?.eroare && <p className="text-sm text-red-600 dark:text-red-400">{state.eroare}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "Se trimite…" : "Trimite-mi linkul"}
      </button>

      <p className="text-center text-sm">
        <Link href="/login" className={stilLink}>
          Înapoi la conectare
        </Link>
      </p>
    </form>
  );
}
