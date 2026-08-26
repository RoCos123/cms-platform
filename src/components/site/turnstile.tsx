"use client";

import { useEffect, useRef, useState } from "react";

type OptiuniWidget = {
  sitekey: string;
  theme?: "light" | "dark";
  language?: string;
};

type ApiTurnstile = {
  render: (element: HTMLElement, optiuni: OptiuniWidget) => string | undefined;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: ApiTurnstile;
  }
}

const SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/**
 * Randare EXPLICITĂ, nu implicită.
 *
 * Varianta implicită (scriptul caută singur `.cf-turnstile` la încărcare) pare
 * mai simplă, dar se rupe exact în cazul obișnuit: cineva ajunge pe pagina de
 * contact navigând din site, deci după ce scriptul s-a încărcat deja. Scriptul
 * nu mai scanează a doua oară, widgetul nu apare, iar formularul devine
 * netrimisibil fără niciun mesaj.
 */
function incarcaScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();

  let script = document.querySelector<HTMLScriptElement>("script[data-turnstile]");

  if (!script) {
    script = document.createElement("script");
    script.src = SRC;
    script.async = true;
    script.dataset.turnstile = "";
    document.head.appendChild(script);
  }

  const elementul = script;

  return new Promise((resolve, reject) => {
    if (window.turnstile) return resolve();
    elementul.addEventListener("load", () => resolve(), { once: true });
    elementul.addEventListener("error", () => reject(new Error("Turnstile nu s-a încărcat")), {
      once: true,
    });
  });
}

/**
 * Caseta anti-spam Cloudflare Turnstile.
 *
 * Randează un `<input name="cf-turnstile-response">` pe care Server Action-ul îl
 * verifică. Dacă platforma n-are cheie configurată, componenta nu se folosește
 * deloc (vezi secțiunile de contact și newsletter) — iar serverul, la rândul
 * lui, sare peste verificare. Cele două decizii trebuie să rămână împreună.
 *
 * Tokenul e de unică folosință: după fiecare trimitere, formularul schimbă
 * `key`-ul componentei, React o remontează, iar widgetul cere un token nou.
 */
export function Turnstile({ siteKey, tema }: { siteKey: string; tema: "light" | "dark" }) {
  const container = useRef<HTMLDivElement>(null);
  const [esuat, setEsuat] = useState(false);

  useEffect(() => {
    let anulat = false;
    let widgetId: string | undefined;

    incarcaScript()
      .then(() => {
        if (anulat || !container.current || !window.turnstile) return;
        widgetId = window.turnstile.render(container.current, {
          sitekey: siteKey,
          theme: tema,
          language: "ro",
        });
      })
      .catch(() => {
        if (!anulat) setEsuat(true);
      });

    return () => {
      anulat = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [siteKey, tema]);

  if (esuat) {
    // Serverul lasă să treacă cererile când verificatorul e inaccesibil (vezi
    // src/lib/antispam.ts), deci nu blocăm omul aici. Îi spunem doar de ce nu
    // vede caseta, ca să nu creadă că pagina e stricată.
    return (
      <p style={{ margin: 0, fontSize: "14px", color: "var(--s-text-secundar)" }}>
        Verificarea anti-spam nu s-a putut încărca. Poți trimite mesajul oricum.
      </p>
    );
  }

  return <div ref={container} />;
}
