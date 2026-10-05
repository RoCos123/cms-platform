"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";

export type ActiuneMeniu = {
  eticheta: string;
  /** Semn scurt dinaintea textului (ex. „↑"); ascuns cititoarelor de ecran. */
  semn?: string;
  /** Dezactivată = se vede, dar nu se poate alege (ex. „Mută mai sus" la primul articol). */
  dezactivata?: boolean;
  onAlege: () => void;
};

/**
 * Meniul „⋯" al unui rând: un buton cu trei puncte care deschide o listă scurtă
 * de acțiuni.
 *
 * Fără bibliotecă, fiindcă proiectul n-are una de meniuri și pentru două-trei
 * acțiuni nu merită una. În schimb se poartă ca orice meniu pe care îl știe un
 * cititor de ecran sau cine nu folosește mouse-ul (tipar „menu button"):
 *   • se deschide cu click, Enter, Spațiu sau săgeata în jos, și pune focusul pe
 *     prima acțiune alegibilă;
 *   • săgeți sus/jos, Home și End umblă prin acțiuni (le sar pe cele dezactivate);
 *   • Escape îl închide și întoarce focusul pe buton; Tab și un click în afară îl
 *     închid;
 *   • după alegere, focusul se întoarce pe buton — rândul se poate să se fi mutat,
 *     iar cine ține lista deschisă citește mai departe de unde a rămas.
 */
export function MeniuActiuni({
  eticheta,
  actiuni,
  declansatorRef,
}: {
  /** Numele butonului pentru cititoarele de ecran, ex. „Acțiuni pentru articolul X". */
  eticheta: string;
  actiuni: ActiuneMeniu[];
  /**
   * Primește butonul „⋯" (și `null` când dispare), ca cine ține lista să poată
   * pune focusul înapoi pe el după o reordonare. Funcție, nu obiect `ref`: aici
   * se cheamă din propriul nostru `ref`, iar o funcție nu cere scrierea într-un
   * prop.
   */
  declansatorRef?: (element: HTMLButtonElement | null) => void;
}) {
  const [deschis, setDeschis] = useState(false);
  const radacina = useRef<HTMLDivElement>(null);
  const declansator = useRef<HTMLButtonElement | null>(null);
  const elemente = useRef<(HTMLButtonElement | null)[]>([]);
  const idMeniu = useId();

  function leagaDeclansator(element: HTMLButtonElement | null) {
    declansator.current = element;
    declansatorRef?.(element);
  }

  const alegibile = () =>
    elemente.current.filter((element): element is HTMLButtonElement => !!element && !element.disabled);

  function inchide(inapoiPeButon: boolean) {
    setDeschis(false);
    if (inapoiPeButon) declansator.current?.focus();
  }

  // La deschidere, focusul intră în meniu. Fără el, tastatura ar rămâne pe buton,
  // iar săgețile ar derula pagina în loc să umble prin acțiuni.
  useEffect(() => {
    if (deschis) alegibile()[0]?.focus();
  }, [deschis]);

  // Un click în afară îl închide. `pointerdown`, nu `click`: se închide înainte
  // ca apăsarea să ajungă pe altceva, deci nu rămân două meniuri deschise.
  useEffect(() => {
    if (!deschis) return;
    function laApasare(eveniment: PointerEvent) {
      if (!radacina.current?.contains(eveniment.target as Node)) setDeschis(false);
    }
    document.addEventListener("pointerdown", laApasare);
    return () => document.removeEventListener("pointerdown", laApasare);
  }, [deschis]);

  function laTastaPeButon(eveniment: KeyboardEvent<HTMLButtonElement>) {
    if (eveniment.key === "ArrowDown") {
      eveniment.preventDefault();
      setDeschis(true);
    }
  }

  function laTastaInMeniu(eveniment: KeyboardEvent<HTMLDivElement>) {
    const lista = alegibile();
    const curent = lista.indexOf(document.activeElement as HTMLButtonElement);

    switch (eveniment.key) {
      case "ArrowDown":
        eveniment.preventDefault();
        lista[(curent + 1) % lista.length]?.focus();
        break;
      case "ArrowUp":
        eveniment.preventDefault();
        lista[(curent - 1 + lista.length) % lista.length]?.focus();
        break;
      case "Home":
        eveniment.preventDefault();
        lista[0]?.focus();
        break;
      case "End":
        eveniment.preventDefault();
        lista[lista.length - 1]?.focus();
        break;
      case "Escape":
        eveniment.preventDefault();
        inchide(true);
        break;
      case "Tab":
        // Nu se oprește tabularea: lăsăm browserul să meargă mai departe, doar
        // închidem lista ca să nu rămână deschisă în urma lui.
        setDeschis(false);
        break;
    }
  }

  return (
    <div ref={radacina} className="relative shrink-0">
      <Button
        ref={leagaDeclansator}
        variant="ghost"
        size="sm"
        aria-label={eticheta}
        aria-haspopup="menu"
        aria-expanded={deschis}
        aria-controls={deschis ? idMeniu : undefined}
        onClick={() => setDeschis((acum) => !acum)}
        onKeyDown={laTastaPeButon}
      >
        <span aria-hidden className="text-base leading-none">
          ⋯
        </span>
      </Button>

      {deschis && (
        <div
          id={idMeniu}
          role="menu"
          aria-label={eticheta}
          onKeyDown={laTastaInMeniu}
          className="absolute right-0 top-full z-20 mt-1 min-w-48 rounded-base border border-border bg-surface p-1 shadow-lg"
        >
          {actiuni.map((actiune, index) => (
            <button
              key={actiune.eticheta}
              ref={(element) => {
                elemente.current[index] = element;
              }}
              type="button"
              role="menuitem"
              disabled={actiune.dezactivata}
              tabIndex={-1}
              onClick={() => {
                inchide(true);
                actiune.onAlege();
              }}
              className="flex w-full items-center gap-2 rounded-base px-3 py-2 text-left text-sm text-foreground hover:bg-surface-hover focus-visible:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50"
            >
              {actiune.semn && (
                <span aria-hidden className="w-4 text-center text-muted-foreground">
                  {actiune.semn}
                </span>
              )}
              {actiune.eticheta}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
