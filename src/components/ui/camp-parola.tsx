"use client";

import { useState } from "react";

/**
 * Câmp de parolă cu un ochi care arată sau ascunde ce ai scris. Stă într-un
 * singur loc ca toate ecranele de conectare și de parolă nouă să se poarte la fel.
 * Câmpul rămâne un `<input>` obișnuit cu `name`, deci formularul îl trimite ca până
 * acum — se schimbă doar `type`.
 */
export function CampParola({
  id,
  name,
  autoComplete,
  minLength,
}: {
  id: string;
  name: string;
  autoComplete: "current-password" | "new-password";
  minLength?: number;
}) {
  const [vizibila, setVizibila] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={vizibila ? "text" : "password"}
        required
        minLength={minLength}
        autoComplete={autoComplete}
        className="w-full rounded-md border border-zinc-300 bg-white py-2 pl-3 pr-10 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
      />
      <button
        type="button"
        onClick={() => setVizibila((v) => !v)}
        aria-label={vizibila ? "Ascunde parola" : "Arată parola"}
        aria-pressed={vizibila}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
          {vizibila && <path d="M3 3l18 18" />}
        </svg>
      </button>
    </div>
  );
}
