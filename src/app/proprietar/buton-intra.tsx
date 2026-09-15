"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { intraInPanou } from "./actions";

/**
 * „Intră în panou", dar într-o FILĂ NOUĂ — ca lista cu toate site-urile să rămână
 * deschisă în fila veche (cerut de proprietar: înainte îi era înlocuită și o
 * pierdea).
 *
 * De ce un buton client, și nu un formular cu `target="_blank"`: pe un formular
 * legat de un Server Action, `target` e ignorat când e JS — Next preia trimiterea
 * și navighează tot fila curentă. Așa că deschidem noi fila.
 *
 * Fila se deschide SINCRON, pe click, înainte de orice `await`: altfel browserul
 * o taie ca fereastră pop-up. O umplem cu un semn de așteptare, iar când acțiunea
 * întoarce adresa semnată, o trimitem acolo. Dacă pică, o închidem și arătăm
 * eroarea în fila veche, pe banner-ul care există deja.
 */
export function ButonIntra({
  siteId,
  faraCont,
}: {
  siteId: string;
  /** Site fără cont legat: n-are panou în care să intri, butonul stă stins. */
  faraCont: boolean;
}) {
  const router = useRouter();
  const [inCurs, setInCurs] = useState(false);

  async function intra() {
    if (inCurs) return;
    setInCurs(true);

    const fila = window.open("", "_blank");
    if (fila) {
      fila.document.write(
        `<!doctype html><meta charset="utf-8"><title>Se deschide panoul…</title>` +
          `<body style="margin:0;font:16px/1.5 system-ui,sans-serif;color:#3f3f46;padding:2.5rem">` +
          `Se deschide panoul site-ului…`,
      );
      fila.document.close();
    }

    try {
      const rezultat = await intraInPanou(siteId);

      if (rezultat.ok) {
        // Adresa e a host-ului cabinetului (alt domeniu), nu o rută internă: aici
        // chiar trebuie `location`, nu `router`.
        if (fila) {
          fila.location.href = rezultat.url;
          // Fila veche rămâne pe listă: eliberăm butonul, poate intra și la altul.
          setInCurs(false);
        } else {
          // Fila blocată (rar, fiind deschisă pe click): măcar intră în fila asta.
          window.location.href = rezultat.url;
        }
        return;
      }

      fila?.close();
      setInCurs(false);
      if (rezultat.eroare === "neautentificat") router.push("/proprietar/login");
      else router.push(`/proprietar?eroare=${rezultat.eroare}`);
    } catch (e) {
      // O cădere de rețea nu trebuie să lase butonul agățat pe „Se deschide…".
      console.error("[proprietar] intra:", e);
      fila?.close();
      setInCurs(false);
      router.push("/proprietar?eroare=link");
    }
  }

  return (
    <button
      type="button"
      onClick={intra}
      disabled={faraCont || inCurs}
      title={faraCont ? "Site fără cont legat" : undefined}
      className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
    >
      {inCurs ? "Se deschide…" : "Intră în panou"}
    </button>
  );
}
