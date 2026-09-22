"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { MediaLibrary, type MediaUpload } from "@/components/ui/media-library";
import { incarcaBibliotecaImagini } from "@/app/dashboard/imagini/actions";
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
 * Stă în aranjamentul panoului, nu în fiecare ecran cu formular, fiindcă
 * formularul secțiunilor se cheamă pe el însuși pentru listele dinăuntru — un
 * câmp de imagine poate fi la al treilea nivel de adâncime, iar trecerea unei
 * funcții „deschide" prin toate nivelurile ar fi însemnat props de care nimic de
 * pe drum n-are nevoie.
 *
 * DAR lista de imagini se aduce abia la DESCHIDEREA ferestrei, nu în layout.
 * Înainte se citea o dată pe fiecare pagină din dashboard, chiar pe Mesaje sau
 * Setări, unde nu se alege nicio imagine; la mii de as-turi era cost degeaba pe
 * fiecare navigare (findingul F09). O ținem minte între deschideri și o
 * reîmprospătăm în fundal, ca a doua deschidere să n-aibă clipa de așteptare.
 */
export function BibliotecaImagini({ children }: { children: ReactNode }) {
  const [deschisa, setDeschisa] = useState(false);
  const [imagini, setImagini] = useState<ImagineBiblioteca[] | null>(null);
  const [incarca, setIncarca] = useState(false);
  /**
   * Ce câmp așteaptă răspunsul. `useRef`, nu `useState`: se schimbă odată cu
   * deschiderea ferestrei și nu are ce randa, deci o stare ar fi cerut o
   * randare în plus la fiecare apăsare pe „Alege din bibliotecă".
   */
  const laAlegere = useRef<((imagine: ImageValue) => void) | null>(null);

  const reincarca = useCallback(async () => {
    setIncarca(true);
    try {
      setImagini(await incarcaBibliotecaImagini());
    } catch {
      // Un eșec (rețea căzută, sesiune expirată) nu trebuie să lase butonul mort:
      // lista rămâne cum era (poate goală, poate cea de data trecută), iar
      // fereastra arată ori imaginile vechi, ori starea de gol. Se reîncearcă la
      // următoarea deschidere.
    } finally {
      setIncarca(false);
    }
  }, []);

  const biblioteca = useMemo<Biblioteca>(
    () => ({
      deschide(callback) {
        laAlegere.current = callback;
        setDeschisa(true);
        void reincarca();
      },
    }),
    [reincarca],
  );

  const incarcari = useMemo<MediaUpload[]>(
    () =>
      (imagini ?? []).map((imagine) => ({
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
        loading={incarca}
        onClose={() => {
          setDeschisa(false);
          laAlegere.current = null;
        }}
        uploads={incarcari}
        onSelect={(aleasa) => {
          // Poziția aleasă a pozei vine cu ea din bibliotecă, ca la o poză pusă
          // într-o nouă secțiune să pornească de unde a lăsat-o clientul, nu de
          // la centru.
          const originala = (imagini ?? []).find((imagine) => imagine.id === aleasa.id);
          laAlegere.current?.({
            uploadId: aleasa.id,
            url: aleasa.url,
            altText: aleasa.altText,
            ...(originala?.pozitie ? { pozitie: originala.pozitie } : {}),
            // Și măsurile, din același motiv: o poză pusă într-o secțiune care
            // o arată întreagă trebuie să-și ducă raportul cu ea. Pe drumul
            // ăsta își recapătă măsurile și pozele încărcate înainte ca ele să
            // se salveze în secțiune — se alege din nou din bibliotecă, fără
            // să mai fie încărcat fișierul.
            ...(originala?.latime && originala?.inaltime
              ? { latime: originala.latime, inaltime: originala.inaltime }
              : {}),
          });
        }}
      />
    </Context.Provider>
  );
}
