"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { DragEvent } from "react";
import { uploadImage } from "@/app/actions/upload";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/feedback";
import { cn } from "@/lib/cn";
import {
  ACCEPTED_IMAGE_LABEL,
  IMAGE_INPUT_ACCEPT,
  MAX_IMAGE_SIZE_LABEL,
  describeImageProblem,
  measureImage,
} from "@/lib/uploads";
import { normalizeazaPentruCautare, type ImagineBiblioteca } from "@/lib/imagini";
import { PanouImagine } from "./panou-imagine";

/** De la câte imagini încolo căutarea ajută mai mult decât încurcă. */
const PRAG_CAUTARE = 8;

/**
 * Biblioteca de imagini a site-ului.
 *
 * Ecranul are o singură idee: fiecare poză se încarcă o dată și se vede de unde
 * e folosită. De asta miniatura spune și ce lipsește („fără descriere"), nu doar
 * cum se cheamă fișierul — altfel biblioteca ar fi doar un sertar, iar
 * descrierile ar rămâne necompletate până când cineva ar face un audit.
 */
export function Galerie({ imagini }: { imagini: ImagineBiblioteca[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const panouRef = useRef<HTMLDivElement>(null);

  const [alesId, setAlesId] = useState<string | null>(null);
  const [cautare, setCautare] = useState("");
  const [seTrage, setSeTrage] = useState(false);
  const [progres, setProgres] = useState<{ facute: number; total: number } | null>(null);
  const [probleme, setProbleme] = useState<string[]>([]);
  const [anunt, setAnunt] = useState("");
  const [seIncarca, porneste] = useTransition();

  const gasite = useMemo(() => {
    const cautat = normalizeazaPentruCautare(cautare.trim());
    if (!cautat) return imagini;
    return imagini.filter((imagine) =>
      // Căutăm și în descriere, nu doar în numele fișierului: „IMG_4821.jpg" nu-i
      // spune nimic nimănui, dar „cabinet" a fost scris chiar de client.
      normalizeazaPentruCautare(`${imagine.numeFisier} ${imagine.descriere}`).includes(cautat),
    );
  }, [imagini, cautare]);

  // Selecția trăiește ca `id`, nu ca index: căutarea și ștergerile rearanjează
  // lista, iar un index ar arăta brusc altă imagine decât cea apăsată.
  const aleasa = imagini.find((imagine) => imagine.id === alesId) ?? null;

  /**
   * Pe ecran îngust panoul stă sub grilă, deci o poză apăsată de la mijlocul
   * listei și-ar deschide detaliile în afara ecranului: ai apăsa și n-ai vedea
   * nimic întâmplându-se.
   *
   * `block: "nearest"` face exact atât cât trebuie și nimic mai mult — pe ecran
   * lat panoul e deja vizibil (e lipit sus), deci nu se mișcă nimic.
   */
  useEffect(() => {
    if (!alesId) return;
    const panou = panouRef.current;
    if (!panou) return;

    const faraMiscare = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    panou.scrollIntoView({ block: "nearest", behavior: faraMiscare ? "auto" : "smooth" });
  }, [alesId]);

  const faraDescriere = imagini.filter((imagine) => imagine.descriere.trim() === "").length;

  function incarca(fisiere: File[]) {
    if (fisiere.length === 0) return;

    const bune: File[] = [];
    const respinse: string[] = [];

    for (const fisier of fisiere) {
      // Aceeași verificare rulează și pe server, unde e singura care contează.
      // Aici e doar ca omul să afle imediat, fără să aștepte drumul dus-întors.
      const problema = describeImageProblem({
        name: fisier.name,
        type: fisier.type,
        size: fisier.size,
      });
      if (problema) respinse.push(`${fisier.name}: ${problema}`);
      else bune.push(fisier);
    }

    setProbleme(respinse);
    if (bune.length === 0) return;

    setProgres({ facute: 0, total: bune.length });
    setAnunt(bune.length === 1 ? "Se încarcă imaginea." : `Se încarcă ${bune.length} imagini.`);

    porneste(async () => {
      const esuate: string[] = [];
      let ultimaReusita: string | null = null;

      // Una câte una, nu toate deodată: fiecare încărcare e o cerere de până la
      // 6 MB, iar zece pornite simultan de pe internetul unui cabinet înseamnă
      // zece care ies pe rând oricum, dar cu bara de progres sărind aiurea.
      for (const [index, fisier] of bune.entries()) {
        const formData = new FormData();
        formData.set("file", fisier);

        const marime = await measureImage(fisier);
        if (marime) {
          formData.set("width", String(marime.width));
          formData.set("height", String(marime.height));
        }

        // Acțiunea întoarce erorile așteptate ca `{ ok: false }`, dar apelul în
        // sine poate arunca (internet căzut, corp respins de runtime). Neprinsă,
        // excepția ar rupe ecranul în loc să arate un rând de eroare.
        const rezultat = await uploadImage(formData).catch(() => null);

        if (!rezultat) {
          esuate.push(`${fisier.name}: nu am putut trimite fișierul. Verifică legătura la internet.`);
        } else if (!rezultat.ok) {
          esuate.push(`${fisier.name}: ${rezultat.error}`);
        } else {
          ultimaReusita = rezultat.image.uploadId;
        }

        setProgres({ facute: index + 1, total: bune.length });
      }

      setProgres(null);
      setProbleme((anterioare) => [...anterioare, ...esuate]);

      const reusite = bune.length - esuate.length;

      if (ultimaReusita) {
        // Deschidem ultima imagine încărcată: pasul următor e oricum să-i scrie
        // descrierea, iar panoul deschis singur spune asta mai bine decât o
        // instrucțiune pe care nimeni n-o citește.
        setAlesId(ultimaReusita);
        // O căutare rămasă din altă dată ar ascunde exact imaginea abia adăugată.
        setCautare("");
      }

      setAnunt(
        reusite === 0
          ? "Nicio imagine nu a putut fi încărcată."
          : reusite === 1
            ? "Imaginea a fost încărcată."
            : `${reusite} imagini au fost încărcate.`,
      );
    });
  }

  function dinInput(fisiere: FileList | null) {
    incarca(fisiere ? Array.from(fisiere) : []);
    // Golim inputul: altfel, realegerea aceluiași fișier n-ar mai declanșa
    // `change` și încărcarea ar părea că nu răspunde.
    if (inputRef.current) inputRef.current.value = "";
  }

  function laTragere(eveniment: DragEvent<HTMLDivElement>) {
    if (seIncarca) return;
    // Fără fișiere în transfer (text selectat, un link tras din altă filă) nu
    // avem ce prelua — lăsăm browserul să se poarte normal.
    if (!eveniment.dataTransfer.types.includes("Files")) return;

    eveniment.preventDefault();
    eveniment.dataTransfer.dropEffect = "copy";
    setSeTrage(true);
  }

  function laIesire(eveniment: DragEvent<HTMLDivElement>) {
    // Trecerea peste un copil declanșează `dragleave` pe părinte; fără
    // verificarea asta, evidențierea ar clipi la fiecare mișcare a mausului.
    const urmator = eveniment.relatedTarget as Node | null;
    if (urmator && eveniment.currentTarget.contains(urmator)) return;
    setSeTrage(false);
  }

  function laLasare(eveniment: DragEvent<HTMLDivElement>) {
    if (seIncarca) return;
    eveniment.preventDefault();
    setSeTrage(false);
    incarca(Array.from(eveniment.dataTransfer.files));
  }

  return (
    <div
      onDragEnter={laTragere}
      onDragOver={laTragere}
      onDragLeave={laIesire}
      onDrop={laLasare}
      className="space-y-6"
    >
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_INPUT_ACCEPT}
        multiple
        onChange={(eveniment) => dinInput(eveniment.target.files)}
        className="sr-only"
      />

      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-4 rounded-base border border-dashed px-5 py-4 transition-colors",
          seTrage ? "border-primary bg-surface-hover" : "border-border-strong bg-surface-muted",
        )}
      >
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">
            Trage imagini aici sau alege-le de pe calculator
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {ACCEPTED_IMAGE_LABEL} · cel mult {MAX_IMAGE_SIZE_LABEL} fiecare · poți alege
            mai multe deodată
          </p>
        </div>

        <Button onClick={() => inputRef.current?.click()} disabled={seIncarca}>
          {/* `facute` numără terminate, deci cea în lucru e următoarea — dar după
              ultima ar da „6 din 5", iar clientul ar citi un număr imposibil. */}
          {progres
            ? `Se încarcă ${Math.min(progres.facute + 1, progres.total)} din ${progres.total}…`
            : "Încarcă imagini"}
        </Button>
      </div>

      {probleme.length > 0 && (
        <div className="space-y-2 rounded-base bg-danger-surface px-4 py-3">
          <p className="text-xs font-medium text-danger">
            {probleme.length === 1
              ? "O imagine nu a putut fi încărcată:"
              : `${probleme.length} imagini nu au putut fi încărcate:`}
          </p>
          <ul className="space-y-1 text-xs text-danger">
            {/* Indexul ca identitate: două fișiere pot pica din același motiv, cu
                exact același text, iar lista oricum nu se reordonează. */}
            {probleme.map((problema, index) => (
              <li key={index}>{problema}</li>
            ))}
          </ul>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setProbleme([])}
            className="text-danger hover:bg-danger-surface"
          >
            Am înțeles
          </Button>
        </div>
      )}

      {imagini.length === 0 ? (
        <EmptyState
          title="Nicio imagine încă"
          description="Încarcă prima poză de aici, sau direct din formularul unei secțiuni — ajunge tot în biblioteca asta."
        />
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
          <div className="space-y-4">
            {imagini.length >= PRAG_CAUTARE && (
              <TextField
                label="Caută după nume sau descriere"
                type="search"
                value={cautare}
                onChange={(eveniment) => setCautare(eveniment.target.value)}
                placeholder="ex.: cabinet"
                autoComplete="off"
                className="max-w-sm"
              />
            )}

            {faraDescriere > 0 && (
              <p className="rounded-base bg-warning-surface px-3 py-2 text-xs text-warning">
                {faraDescriere === 1
                  ? "O imagine nu are încă descriere."
                  : `${faraDescriere} imagini nu au încă descriere.`}{" "}
                Fără ea, cine nu vede poza nu află ce e în ea — iar Google nu are ce citi.
              </p>
            )}

            {gasite.length === 0 ? (
              <EmptyState
                title="Nicio imagine cu numele acesta"
                description={`Nimic din bibliotecă nu conține „${cautare.trim()}”. Încearcă doar o parte din nume.`}
                action={
                  <Button variant="secondary" onClick={() => setCautare("")}>
                    Arată toate imaginile
                  </Button>
                }
              />
            ) : (
              <ul className="grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 xl:grid-cols-4">
                {gasite.map((imagine) => (
                  <li key={imagine.id}>
                    {/*
                      Buton adevărat, nu un `div` cu rol: sunt câteva zeci de
                      imagini, deci parcurgerea cu Tab e rezonabilă, iar tastatura
                      și cititoarele de ecran funcționează fără nicio linie de cod
                      scrisă de noi. Grila cu săgeți din fereastra de alegere are
                      alt motiv: acolo ești în mijlocul altui formular și trebuie
                      să ieși repede.
                    */}
                    <button
                      type="button"
                      aria-pressed={imagine.id === alesId}
                      onClick={() => setAlesId(imagine.id)}
                      className={cn(
                        "w-full rounded-base border p-2 text-left transition-colors",
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                        imagine.id === alesId
                          ? "border-primary bg-surface-muted"
                          : "border-border bg-surface hover:bg-surface-hover",
                      )}
                    >
                      <div className="relative aspect-square overflow-hidden rounded-base bg-surface-muted">
                        {/* Miniatura e decorativă: numele de dedesubt spune deja
                            despre ce imagine e vorba, iar descrierea adevărată se
                            citește în panoul de detalii. */}
                        <Image
                          src={imagine.url}
                          alt=""
                          fill
                          sizes="(max-width: 640px) 45vw, (max-width: 1280px) 30vw, 220px"
                          className="object-cover"
                        />
                      </div>
                      <p title={imagine.numeFisier} className="mt-2 truncate text-xs text-foreground">
                        {imagine.numeFisier}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {imagine.descriere.trim() === "" ? (
                          <span className="text-warning">Fără descriere</span>
                        ) : imagine.folosiri.length === 0 ? (
                          "Nefolosită"
                        ) : (
                          imagine.folosiri[0].numeSectiune
                        )}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/*
            Pe ecran îngust panoul rămâne SUB grilă, nu deasupra: deasupra, fiecare
            selecție i-ar fi schimbat înălțimea și ar fi împins pozele în sus, așa
            că imaginea abia apăsată ar fi fugit de sub deget. Dedesubt, grila stă
            pe loc, iar `scrollIntoView` de mai sus aduce panoul în ecran.

            Cât timp n-ai ales nimic n-are ce arăta acolo, deci pe telefon nici nu
            există — pe ecran lat rămâne, cu îndemnul de a apăsa pe o poză.
          */}
          <div
            ref={panouRef}
            className={cn("lg:sticky lg:top-6", aleasa ? "block" : "hidden lg:block")}
          >
            {/* `key` pe id: la schimbarea selecției componenta se remontează, deci
                o descriere scrisă pe jumătate pentru o poză nu apare peste alta. */}
            <PanouImagine
              key={aleasa?.id ?? "fara-selectie"}
              imagine={aleasa}
              onSters={() => setAlesId(null)}
            />
          </div>
        </div>
      )}

      <p aria-live="polite" className="sr-only">
        {anunt}
      </p>
    </div>
  );
}
