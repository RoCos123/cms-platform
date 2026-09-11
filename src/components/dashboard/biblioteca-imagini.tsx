"use client";

import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { MediaLibrary, type MediaUpload } from "@/components/ui/media-library";
import type { ImagineBiblioteca } from "@/lib/imagini";
import type { ImageValue } from "@/lib/uploads";

type Biblioteca = {
  /** Deschide fereastra de alegere. `laAlegere` primește imaginea apăsată. */
  deschide: (laAlegere: (imagine: ImageValue) => void) => void;
};

const Context = createContext<Biblioteca | null>(null);

/**
 * `null` când nu există niciun furnizor deasupra — și e un răspuns valid, nu o
 * eroare: `ImageField` ascunde butonul „Alege din bibliotecă" dacă nu i se dă ce
 * să facă la apăsare, deci câmpul rămâne folosibil oriunde (inclusiv în galeria
 * de componente, unde nu există un site din care să citim).
 */
export function useBibliotecaImagini(): Biblioteca | null {
  return useContext(Context);
}

/**
 * O singură fereastră de alegere pentru tot panoul.
 *
 * Stă în aranjamentul panoului, nu în fiecare ecran cu formular, din două
 * motive. Întâi, lista de imagini se citește o dată pe cerere, nu de fiecare
 * câmp în parte. Apoi, formularul secțiunilor se cheamă pe el însuși pentru
 * listele dinăuntru — un câmp de imagine poate fi la al treilea nivel de
 * adâncime, iar trecerea unei funcții „deschide" prin toate nivelurile ar fi
 * însemnat props de care nimic de pe drum n-are nevoie.
 */
export function BibliotecaImagini({
  imagini,
  children,
}: {
  imagini: ImagineBiblioteca[];
  children: ReactNode;
}) {
  const [deschisa, setDeschisa] = useState(false);
  /**
   * Ce câmp așteaptă răspunsul. `useRef`, nu `useState`: se schimbă odată cu
   * deschiderea ferestrei și nu are ce randa, deci o stare ar fi cerut o
   * randare în plus la fiecare apăsare pe „Alege din bibliotecă".
   */
  const laAlegere = useRef<((imagine: ImageValue) => void) | null>(null);

  const biblioteca = useMemo<Biblioteca>(
    () => ({
      deschide(callback) {
        laAlegere.current = callback;
        setDeschisa(true);
      },
    }),
    [],
  );

  const incarcari = useMemo<MediaUpload[]>(
    () =>
      imagini.map((imagine) => ({
        id: imagine.id,
        url: imagine.url,
        filename: imagine.numeFisier,
        altText: imagine.descriere,
        sizeBytes: imagine.marimeOcteti,
        // Fereastra verifică ea însăși `> 0` înainte să scrie „1200 × 630":
        // pentru un SVG fără dimensiuni intrinseci nu avem ce trece aici.
        width: imagine.latime ?? 0,
        height: imagine.inaltime ?? 0,
        createdAt: imagine.incarcataLa,
        usageCount: new Set(imagine.folosiri.map((folosire) => folosire.href)).size,
      })),
    [imagini],
  );

  return (
    <Context.Provider value={biblioteca}>
      {children}
      {/*
        Fără `onDelete`: aici ești în mijlocul altui formular, iar ștergerea unei
        imagini o scoate și din paginile în care e pusă. Locul acelei decizii e
        ecranul Imagini, unde se vede negru pe alb unde e folosită.
      */}
      <MediaLibrary
        open={deschisa}
        onClose={() => {
          setDeschisa(false);
          laAlegere.current = null;
        }}
        uploads={incarcari}
        onSelect={(aleasa) => {
          // Poziția aleasă a pozei vine cu ea din bibliotecă, ca la o poză pusă
          // într-o nouă secțiune să pornească de unde a lăsat-o clientul, nu de
          // la centru.
          const originala = imagini.find((imagine) => imagine.id === aleasa.id);
          laAlegere.current?.({
            uploadId: aleasa.id,
            url: aleasa.url,
            altText: aleasa.altText,
            ...(originala?.pozitie ? { pozitie: originala.pozitie } : {}),
          });
        }}
      />
    </Context.Provider>
  );
}
