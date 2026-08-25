"use client";

import { useEffect, useRef, useState, type DragEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./button";
import { Card } from "./card";
import { EmptyState } from "./feedback";
import { ConfirmDialog } from "./confirm-dialog";

export type RepeaterListProps<T> = {
  items: T[];
  /** Primește lista completă, în noua ordine — componenta nu ține copii ale datelor. */
  onChange: (items: T[]) => void;
  renderItem: (item: T, index: number) => ReactNode;
  /**
   * Cheie stabilă per element. Indexul nu e suficient: la reordonare React ar
   * refolosi câmpurile altui element și textul tastat ar „sări" pe alt rând.
   */
  getKey: (item: T, index: number) => string;
  /** Textul butonului de adăugare, ex. „+ Adaugă serviciu". */
  addLabel: string;
  /** Construiește elementul nou (gol). */
  onAdd: () => T;
  /**
   * Numele elementului cu articol — „serviciul", „testimonialul", „întrebarea".
   * Apare în întrebarea de confirmare și pe butonul de ștergere.
   */
  itemLabel: string;
  /** Limită opțională de elemente. Peste ea, butonul de adăugare se blochează. */
  max?: number;
  className?: string;
};

/**
 * Ce anume trebuie să primească focusul după ce lista s-a schimbat. Ținem cererea
 * într-un ref, nu în state: nu trebuie să declanșeze o re-randare, doar să fie
 * citită o dată, după ce DOM-ul nou e pe ecran.
 */
type FocusRequest =
  | { kind: "move"; index: number; direction: "up" | "down" }
  | { kind: "delete"; index: number }
  | { kind: "add"; index: number };

/** Primul lucru de completat dintr-un rând nou — restul e decorul din jurul lui. */
const CONTENT_CONTROLS =
  "input:not([type='hidden']):not([disabled]), textarea:not([disabled]), select:not([disabled]), [contenteditable='true']";

function moveItem<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function RepeaterList<T>({
  items,
  onChange,
  renderItem,
  getKey,
  addLabel,
  onAdd,
  itemLabel,
  max,
  className,
}: RepeaterListProps<T>) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  /**
   * Tragerea se activează doar după apăsarea mânerului: dacă `draggable` ar sta
   * permanent pe rând, selectarea textului din câmpurile dinăuntru ar porni un drag.
   */
  const [grabbedIndex, setGrabbedIndex] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ index: number; key: string } | null>(null);
  const [status, setStatus] = useState("");

  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const focusRequest = useRef<FocusRequest | null>(null);
  /**
   * Aceeași valoare ca `grabbedIndex`, dar citibilă imediat. `dragstart` ajunge
   * la noi înaintea oricărei re-randări, iar decizia „tragerea a pornit de la
   * mâner?" nu are voie să depindă de momentul în care React a apucat să comite.
   */
  const grabbedRef = useRef<number | null>(null);

  /**
   * După o mutare cu tastatura, rândul se re-randează cu altă cheie și focusul
   * s-ar pierde pe <body> — utilizatorul ar trebui să navigheze de la capăt ca
   * să mai apese o dată „Mută mai sus”. Îl punem înapoi pe același buton.
   *
   * La ștergere e și mai rău: ConfirmDialog readuce focusul pe butonul care l-a
   * deschis, dar acel buton tocmai a dispărut din DOM odată cu rândul, deci
   * nimeni nu-l mai poate primi. Îl mutăm noi pe vecinul rămas.
   */
  useEffect(() => {
    const target = focusRequest.current;
    if (!target) return;
    focusRequest.current = null;

    const rows = listRef.current
      ? Array.from(listRef.current.querySelectorAll<HTMLElement>("[data-repeater-row]"))
      : [];

    const addButtonEl = rootRef.current?.querySelector<HTMLButtonElement>("[data-repeater-add]");

    if (target.kind === "delete") {
      // Rândul de pe aceeași poziție (sau ultimul, dacă am șters de la coadă);
      // dacă lista s-a golit, singurul lucru rămas de făcut e adăugarea.
      const row = rows[Math.min(target.index, rows.length - 1)];
      (row?.querySelector<HTMLButtonElement>("[data-repeater-delete]") ?? addButtonEl)?.focus();
      return;
    }

    if (target.kind === "add") {
      // La primul element, butonul de adăugare se mută din starea goală în rândul
      // de sub listă: elementul apăsat dispare din DOM și focusul ar cădea pe
      // <body>. Îl ducem în câmpul nou-apărut — oricum acolo urmează să scrie.
      const content = rows[target.index]?.querySelector<HTMLElement>("[data-repeater-content]");
      (content?.querySelector<HTMLElement>(CONTENT_CONTROLS) ?? addButtonEl)?.focus();
      return;
    }

    const row = rows[target.index];
    if (!row) return;

    const wanted = row.querySelector<HTMLButtonElement>(`[data-move="${target.direction}"]`);
    // La capetele listei butonul cerut e dezactivat, deci trecem pe cel opus.
    if (wanted && !wanted.disabled) wanted.focus();
    else row.querySelector<HTMLButtonElement>(`[data-move="${target.direction === "up" ? "down" : "up"}"]`)?.focus();
  });

  /**
   * Plasă de siguranță: dacă mânerul a fost apăsat dar tragerea nu a mai pornit,
   * `draggable` ar rămâne activ pe rând și ar bloca selectarea textului din câmpuri.
   *
   * Ascultăm doar `pointerup`, nu și `pointercancel`: browserul trimite
   * `pointercancel` exact în clipa în care pornește o tragere nativă, deci l-am
   * folosi ca să anulăm chiar tragerea pe care utilizatorul tocmai a cerut-o.
   * Sfârșitul unei trageri reale îl aflăm din `dragend`.
   */
  useEffect(() => {
    if (grabbedIndex === null) return;

    const release = () => {
      grabbedRef.current = null;
      setGrabbedIndex(null);
    };
    window.addEventListener("pointerup", release);
    return () => window.removeEventListener("pointerup", release);
  }, [grabbedIndex]);

  const atLimit = typeof max === "number" && items.length >= max;

  function announceMove(position: number, total: number) {
    setStatus(`Mutat pe poziția ${position} din ${total}.`);
  }

  function handleMove(from: number, direction: "up" | "down") {
    const to = direction === "up" ? from - 1 : from + 1;
    if (to < 0 || to >= items.length) return;

    focusRequest.current = { kind: "move", index: to, direction };
    onChange(moveItem(items, from, to));
    announceMove(to + 1, items.length);
  }

  function grabHandle(index: number) {
    grabbedRef.current = index;
    setGrabbedIndex(index);
  }

  function releaseHandle() {
    grabbedRef.current = null;
    setGrabbedIndex(null);
  }

  function resetDrag() {
    setDragIndex(null);
    setDropIndex(null);
    releaseHandle();
  }

  function handleDragStart(event: DragEvent<HTMLLIElement>, index: number) {
    if (grabbedRef.current !== index) {
      // Tragere pornită din altă parte decât mânerul (ex. text selectat).
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = "move";
    // Firefox nu pornește tragerea fără date în dataTransfer.
    event.dataTransfer.setData("text/plain", String(index));
    setDragIndex(index);
  }

  function handleDragOver(event: DragEvent<HTMLLIElement>, index: number) {
    if (dragIndex === null) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    const rect = event.currentTarget.getBoundingClientRect();
    const belowMiddle = event.clientY - rect.top > rect.height / 2;
    setDropIndex(belowMiddle ? index + 1 : index);
  }

  function handleDrop(event: DragEvent<HTMLUListElement>) {
    event.preventDefault();
    if (dragIndex === null || dropIndex === null) {
      resetDrag();
      return;
    }

    // `dropIndex` e poziția dintre elemente; după scoaterea celui tras, tot ce e
    // mai jos urcă cu unu.
    const to = dropIndex > dragIndex ? dropIndex - 1 : dropIndex;
    if (to !== dragIndex) {
      onChange(moveItem(items, dragIndex, to));
      announceMove(to + 1, items.length);
    }
    resetDrag();
  }

  function handleDragLeave(event: DragEvent<HTMLUListElement>) {
    const next = event.relatedTarget as Node | null;
    if (next && event.currentTarget.contains(next)) return;
    setDropIndex(null);
  }

  function handleAdd() {
    if (atLimit) return;
    focusRequest.current = { kind: "add", index: items.length };
    onChange([...items, onAdd()]);
    setStatus(`Element nou adăugat pe poziția ${items.length + 1}.`);
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    const { key } = pendingDelete;

    // Lista se putea schimba cât timp dialogul era deschis (altă filă, salvare
    // automată, o reordonare). Ștergem după cheie, nu după poziția memorată:
    // dacă elementul confirmat s-a mutat între timp, tot pe el îl vrem șters, nu
    // pe vecinul care i-a luat locul — și nici nu vrem un „Șterge” fără efect.
    const index = items.findIndex((item, i) => getKey(item, i) === key);
    if (index !== -1) {
      onChange(items.filter((_, i) => i !== index));
      setStatus(`Element șters de pe poziția ${index + 1}.`);
      focusRequest.current = { kind: "delete", index };
    }
    setPendingDelete(null);
  }

  /** Linia de inserție se ascunde când mutarea n-ar schimba nimic. */
  function showMarkerAt(position: number) {
    if (dragIndex === null || dropIndex !== position) return false;
    return position !== dragIndex && position !== dragIndex + 1;
  }

  const addButton = (
    <Button variant="secondary" onClick={handleAdd} disabled={atLimit} data-repeater-add="">
      {addLabel}
    </Button>
  );

  return (
    <div ref={rootRef} className={cn("space-y-3", className)}>
      {items.length === 0 ? (
        <Card className="border-dashed">
          <EmptyState
            title="Nu ai adăugat încă nimic aici"
            description={`Apasă „${addLabel}” ca să începi. După aceea poți schimba ordinea oricând, trăgând elementele de mâner sau cu butoanele săgeată.`}
            action={addButton}
          />
        </Card>
      ) : (
        <>
          <ul
            ref={listRef}
            /* Preflight scoate bulinele, iar VoiceOver pierde odată cu ele și semantica de listă. */
            role="list"
            className="flex flex-col gap-2"
            onDragOver={(event) => {
              // Fără preventDefault pe container, browserul refuză drop-ul în spațiile dintre rânduri.
              if (dragIndex !== null) event.preventDefault();
            }}
            onDrop={handleDrop}
            onDragLeave={handleDragLeave}
          >
            {items.map((item, index) => {
              const isDragged = dragIndex === index;
              const isLast = index === items.length - 1;

              return (
                <li
                  key={getKey(item, index)}
                  data-repeater-row
                  draggable={grabbedIndex === index}
                  onDragStart={(event) => handleDragStart(event, index)}
                  onDragOver={(event) => handleDragOver(event, index)}
                  onDragEnd={resetDrag}
                  className="relative"
                >
                  {showMarkerAt(index) && <DropMarker position="top" />}
                  {isLast && showMarkerAt(index + 1) && <DropMarker position="bottom" />}

                  <Card
                    className={cn(
                      "flex items-start gap-2 p-3 transition-opacity",
                      isDragged && "opacity-50",
                    )}
                  >
                    <div className="flex shrink-0 items-center gap-1 pt-1">
                      <button
                        type="button"
                        aria-label="Trage pentru reordonare"
                        /**
                         * Scos din ordinea de tabulare: tragerea nu se poate face de la
                         * tastatură, iar calea reală sunt butoanele „Mută mai sus/jos".
                         */
                        tabIndex={-1}
                        onPointerDown={() => grabHandle(index)}
                        className="cursor-grab rounded-base p-1 text-muted-foreground hover:bg-surface-hover hover:text-foreground active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      >
                        <GripIcon />
                      </button>
                      <span
                        aria-hidden
                        className="w-4 text-center text-xs tabular-nums text-muted-foreground"
                      >
                        {index + 1}
                      </span>
                    </div>

                    <div data-repeater-content className="min-w-0 flex-1">
                      {renderItem(item, index)}
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      {/*
                       * Poziția intră în fiecare etichetă: altfel toate rândurile ar avea
                       * exact același nume accesibil („Mută mai sus"), iar la parcurgerea
                       * cu cititorul de ecran nimic n-ar spune pe care element ești.
                       */}
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Mută ${itemLabel} de pe poziția ${index + 1} mai sus`}
                        data-move="up"
                        disabled={index === 0}
                        onClick={() => handleMove(index, "up")}
                        className="size-8 px-0"
                      >
                        <ChevronIcon direction="up" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Mută ${itemLabel} de pe poziția ${index + 1} mai jos`}
                        data-move="down"
                        disabled={isLast}
                        onClick={() => handleMove(index, "down")}
                        className="size-8 px-0"
                      >
                        <ChevronIcon direction="down" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Șterge ${itemLabel} de pe poziția ${index + 1}`}
                        data-repeater-delete=""
                        onClick={() => setPendingDelete({ index, key: getKey(item, index) })}
                        className="size-8 px-0 hover:bg-danger-surface hover:text-danger"
                      >
                        <TrashIcon />
                      </Button>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-3">
            {addButton}
            {atLimit && (
              <p className="text-xs text-muted-foreground">
                Ai ajuns la limita de {max} elemente. Șterge unul ca să poți adăuga altul.
              </p>
            )}
          </div>
        </>
      )}

      {/* Reordonarea se vede pe ecran, dar trebuie și auzită de cititoarele de ecran. */}
      <p aria-live="polite" className="sr-only">
        {status}
      </p>

      <ConfirmDialog
        open={pendingDelete !== null}
        // Fără tonul de pericol, „Șterge definitiv" ar fi butonul principal albastru
        // — aceeași culoare cu „Salvează" din restul aplicației.
        tone="danger"
        title={`Ștergi ${itemLabel}?`}
        description={
          pendingDelete
            ? `Elementul de pe poziția ${pendingDelete.index + 1} dispare împreună cu tot ce ai completat în el. Nu îl mai poți recupera după ce salvezi.`
            : ""
        }
        confirmLabel="Șterge definitiv"
        cancelLabel="Păstrează"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

/** Linia care arată unde va ateriza elementul tras; stă în afara fluxului, ca lista să nu salte. */
function DropMarker({ position }: { position: "top" | "bottom" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-0 h-0.5 rounded-full bg-primary",
        position === "top" ? "-top-1" : "-bottom-1",
      )}
    />
  );
}

function GripIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden className="size-4">
      <circle cx="6" cy="3.5" r="1.25" />
      <circle cx="10" cy="3.5" r="1.25" />
      <circle cx="6" cy="8" r="1.25" />
      <circle cx="10" cy="8" r="1.25" />
      <circle cx="6" cy="12.5" r="1.25" />
      <circle cx="10" cy="12.5" r="1.25" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "up" | "down" }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="size-4"
    >
      <path d={direction === "up" ? "M4 10L8 6l4 4" : "M4 6l4 4 4-4"} />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="size-4"
    >
      <path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.5 8h6l.5-8M6.75 7v3.5M9.25 7v3.5" />
    </svg>
  );
}
