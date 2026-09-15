"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent, PointerEvent, SyntheticEvent } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/feedback";
import { TextField } from "@/components/ui/field";
import { cn } from "@/lib/cn";

export type MediaUpload = {
  id: string;
  url: string;
  filename: string;
  altText: string;
  sizeBytes: number;
  width: number;
  height: number;
  /** Dată ISO; e formatată abia la afișare, în fusul cititorului. */
  createdAt: string;
  /**
   * Câte secțiuni ale site-ului folosesc imaginea. Lipsa proprietății înseamnă
   * „nu s-au numărat referințele", nu „zero" — de aceea nu are valoare implicită:
   * un 0 inventat ar liniști utilizatorul exact înainte de o ștergere periculoasă.
   */
  usageCount?: number;
};

export type MediaLibraryProps = {
  open: boolean;
  /** Chemat la Escape, click pe fundal, butonul de închidere și după ce s-a ales o imagine. */
  onClose: () => void;
  uploads: MediaUpload[];
  onSelect: (upload: MediaUpload) => void;
  /** Lipsește când utilizatorul curent doar alege imagini, fără drept de ștergere. */
  onDelete?: (upload: MediaUpload) => void | Promise<void>;
  /**
   * Lista se aduce la deschidere (nu mai stă în layout — findingul F09), deci
   * prima deschidere are o clipă de așteptare. Fără steagul ăsta, ecranul gol de
   * atunci s-ar citi ca „n-ai nicio imagine", exact înainte să apară toate.
   */
  loading?: boolean;
};

const KILOBYTE = 1024;
const MEGABYTE = KILOBYTE * KILOBYTE;

const decimalFormat = new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 1 });
const dateFormat = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** Mărimea în unitatea pe care o recunoaște oricine, nu în octeți. */
function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "necunoscută";
  if (bytes >= MEGABYTE) return `${decimalFormat.format(bytes / MEGABYTE)} MB`;
  // Sub 1 KB rotunjirea ar da „0 KB", care arată a fișier stricat.
  return `${decimalFormat.format(Math.max(1, Math.round(bytes / KILOBYTE)))} KB`;
}

function formatDate(iso: string): string | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : dateFormat.format(date);
}

/**
 * În română, numeralele de la 20 în sus cer „de" înaintea substantivului
 * („21 de locuri"), iar 1 schimbă și prepoziția („într-un loc").
 */
function formatPlaces(count: number): string {
  const needsDe = count % 100 === 0 || count % 100 > 19;
  return `${count}${needsDe ? " de" : ""} locuri`;
}

function describeUsage(count: number): string {
  return count === 1 ? "Folosită într-un loc" : `Folosită în ${formatPlaces(count)}`;
}

function describeDeleteConsequence(count: number): string {
  return count === 1
    ? "Această imagine e folosită într-un loc. Ștergerea o va elimina de acolo."
    : `Această imagine e folosită în ${formatPlaces(count)}. Ștergerea o va elimina din toate.`;
}

/**
 * Fără număr de referințe nu avem voie să tăcem: tăcerea din dialogul de
 * ștergere se citește exact ca un „nu e folosită nicăieri" verificat, adică
 * fix liniștea falsă pe care `usageCount` opțional o refuză prin definiție.
 */
const UNCOUNTED_USAGE_WARNING =
  "Nu am putut afla în câte locuri e folosită. Dacă e pusă undeva pe site, acolo va rămâne un gol.";

/**
 * `onDelete` poate să și arunce (rețea căzută, sesiune expirată, refuz de la
 * server). ConfirmDialog ține dialogul deschis la eroare, dar textul din el vine
 * de aici: fără mesaj, omul ar vedea butonul revenindu-și și ar apăsa la nesfârșit.
 */
const DELETE_FAILED_MESSAGE =
  "Nu am putut șterge imaginea. Verifică legătura la internet și mai încearcă o dată.";

function describeDeleteWarning(upload: MediaUpload | null): string | undefined {
  if (!upload) return undefined;
  if (typeof upload.usageCount !== "number") return UNCOUNTED_USAGE_WARNING;
  if (upload.usageCount === 0) return undefined;
  return describeDeleteConsequence(upload.usageCount);
}

/**
 * Căutarea ignoră diacriticele și literele mari: cine scrie „poza cabinet"
 * trebuie să găsească „Poză-Cabinet.JPG", altfel căutarea pare stricată.
 */
function normalizeForSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function MediaLibrary({
  open,
  onClose,
  uploads,
  onSelect,
  onDelete,
  loading = false,
}: MediaLibraryProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const pointerDownOnBackdrop = useRef(false);
  const refocusAfterDelete = useRef(false);

  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  /** Ce se vede pe ecran după o ștergere trebuie și auzit — vezi regiunea live. */
  const [status, setStatus] = useState("");

  const titleId = useId();
  const descriptionId = useId();

  const filtered = useMemo(() => {
    const needle = normalizeForSearch(query.trim());
    if (!needle) return uploads;
    return uploads.filter((upload) =>
      normalizeForSearch(upload.filename).includes(needle),
    );
  }, [uploads, query]);

  // Selecția trăiește ca `id`, nu ca index: căutarea și ștergerile rearanjează lista.
  const selected = filtered.find((upload) => upload.id === selectedId) ?? null;
  const pendingDelete = uploads.find((upload) => upload.id === pendingDeleteId) ?? null;

  const selectedIndex = filtered.findIndex((upload) => upload.id === selectedId);
  // Un singur punct de intrare cu Tab în grilă (roving tabindex); restul se ating cu săgețile.
  const activeIndex = selectedIndex >= 0 ? selectedIndex : 0;

  const restoreFocus = useCallback(() => {
    const trigger = triggerRef.current;
    triggerRef.current = null;
    if (trigger?.isConnected) trigger.focus();
  }, []);

  /**
   * Aduce focusul înapoi în dialog, pe căutare. Câmpul de căutare există doar cât
   * timp biblioteca are imagini: după ștergerea ultimei, un `focus()` pe nimic ar
   * lăsa focusul pe <body>, adică în afara modalului, de unde tastatura nu mai
   * ajunge nicăieri. De aceea butonul de închidere e plasa de siguranță — el nu
   * dispare niciodată.
   */
  const focusInsideDialog = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    // Două interogări, nu o listă de selectori: `querySelector` cu listă întoarce
    // primul element din DOM, adică butonul de închidere, care e scris mai sus.
    const target =
      dialog.querySelector<HTMLElement>("[data-media-initial-focus]") ??
      dialog.querySelector<HTMLElement>("[data-media-close]");
    target?.focus();
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!open) {
      if (dialog.open) dialog.close();
      return;
    }

    if (!dialog.open) {
      triggerRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
      // Biblioteca se redeschide curată: o căutare rămasă din data trecută ar
      // arăta „nicio imagine" peste o bibliotecă plină.
      setQuery("");
      setSelectedId(null);
      setPendingDeleteId(null);
      setDeleteError(null);
      setStatus("");
    }

    focusInsideDialog();
  }, [open, focusInsideDialog]);

  useEffect(() => () => restoreFocus(), [restoreFocus]);

  /**
   * După ștergere, butonul care a deschis confirmarea nu mai există (panoul de
   * detalii s-a golit), iar focusul ar rămâne nicăieri. Îl aducem pe căutare.
   */
  useEffect(() => {
    if (pendingDeleteId !== null || !refocusAfterDelete.current) return;
    refocusAfterDelete.current = false;
    focusInsideDialog();
  }, [pendingDeleteId, focusInsideDialog]);

  function requestClose() {
    onClose();
  }

  function handleNativeClose(event: SyntheticEvent<HTMLDialogElement>) {
    // React propagă `close` prin arborele de componente, deși evenimentul nativ nu
    // urcă: fără verificare, închiderea unui alt dialog ar închide și biblioteca.
    if (event.target !== dialogRef.current) return;
    restoreFocus();
    // Escape închide dialogul nativ fără să treacă prin React; starea trebuie să afle.
    if (open) requestClose();
  }

  /**
   * „Pe fundal" înseamnă în afara dreptunghiului dialogului, nu doar „ținta e
   * <dialog>": ținta e tot dialogul și când gestul doar începe sau se termină pe
   * el (`click` se declanșează pe strămoșul comun al apăsării și al ridicării),
   * plus pe chenarul lui de 1px.
   */
  function isOnBackdrop(event: {
    target: EventTarget | null;
    clientX: number;
    clientY: number;
  }) {
    const dialog = dialogRef.current;
    if (!dialog || event.target !== dialog) return false;
    const rect = dialog.getBoundingClientRect();
    return (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    );
  }

  function handlePointerDown(event: PointerEvent<HTMLDialogElement>) {
    pointerDownOnBackdrop.current = isOnBackdrop(event);
  }

  function handleClick(event: MouseEvent<HTMLDialogElement>) {
    // Cerem fundalul la ambele capete ale gestului: nici selecția de text începută
    // înăuntru și terminată pe fundal, nici tragerea pornită de pe fundal și
    // terminată peste conținut nu sunt o intenție de închidere. Steagul se stinge
    // pe orice ieșire, altfel ar supraviețui până la următorul click.
    const onBackdrop = pointerDownOnBackdrop.current && isOnBackdrop(event);
    pointerDownOnBackdrop.current = false;
    if (onBackdrop) requestClose();
  }

  function choose(upload: MediaUpload) {
    onSelect(upload);
    requestClose();
  }

  /**
   * Numărul de coloane se citește din grila reală, nu dintr-o constantă: layoutul
   * are alt număr de coloane pe telefon și pe laptop, iar săgeata jos trebuie să
   * ajungă exact sub imaginea curentă.
   */
  function columnCount(): number {
    const grid = gridRef.current;
    if (!grid) return 1;
    const template = window.getComputedStyle(grid).gridTemplateColumns;
    return Math.max(1, template.split(" ").filter(Boolean).length);
  }

  function focusTile(index: number) {
    gridRef.current
      ?.querySelector<HTMLElement>(`[data-media-tile="${index}"]`)
      ?.focus();
  }

  /**
   * Un rând mai jos, nu „oriunde în față". Când sub imaginea curentă nu mai e
   * nimic pentru că ultimul rând e incomplet, coborâm pe ultima imagine din el;
   * dar din chiar ultimul rând nu există unde coborî, iar o simplă limitare la
   * capătul listei ar muta focusul lateral — adică în altă parte decât cea cerută.
   */
  function rowNeighbour(index: number, direction: 1 | -1, last: number): number {
    const columns = columnCount();
    const target = index + direction * columns;
    if (target >= 0 && target <= last) return target;
    if (direction === -1) return index;
    return Math.floor(last / columns) > Math.floor(index / columns) ? last : index;
  }

  function handleTileKeyDown(event: KeyboardEvent<HTMLDivElement>, index: number) {
    const last = filtered.length - 1;
    let next: number;

    switch (event.key) {
      case "Enter":
      case " ":
        event.preventDefault();
        choose(filtered[index]);
        return;
      case "ArrowRight":
        next = Math.min(index + 1, last);
        break;
      case "ArrowLeft":
        next = Math.max(index - 1, 0);
        break;
      case "ArrowDown":
        next = rowNeighbour(index, 1, last);
        break;
      case "ArrowUp":
        next = rowNeighbour(index, -1, last);
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = last;
        break;
      default:
        return;
    }

    event.preventDefault();
    // Mutarea focusului declanșează `onFocus`, care actualizează și panoul de detalii.
    focusTile(next);
  }

  async function handleConfirmDelete() {
    if (!pendingDelete || !onDelete) return;
    setDeleteError(null);

    try {
      await onDelete(pendingDelete);
    } catch (error) {
      // Aruncăm mai departe: ConfirmDialog ține dialogul deschis doar dacă
      // `onConfirm` respinge, iar acolo omul citește mesajul de mai sus și
      // reîncearcă. Nimic nu s-a șters, deci nici selecția nu se pierde.
      setDeleteError(DELETE_FAILED_MESSAGE);
      throw error;
    }

    setSelectedId(null);
    setStatus(`„${pendingDelete.filename}” a fost ștearsă din bibliotecă.`);
    refocusAfterDelete.current = true;
  }

  function showAllImages() {
    setQuery("");
    // Butonul care tocmai a fost apăsat dispare odată cu starea goală; fără mutarea
    // asta, focusul ar cădea pe <body>, în afara modalului.
    focusInsideDialog();
  }

  const hasUploads = uploads.length > 0;
  const deleteWarning = describeDeleteWarning(pendingDelete);
  const uploadedAt = selected ? formatDate(selected.createdAt) : null;

  return (
    <>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClose={handleNativeClose}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
        className={cn(
          "m-auto w-[calc(100%-2rem)] max-w-4xl max-h-[calc(100dvh-4rem)] overflow-hidden",
          "rounded-base border border-border bg-surface p-0 text-foreground shadow-xl",
          "backdrop:bg-background/70 backdrop:backdrop-blur-sm",
        )}
      >
        {/* Flexul stă pe un copil, nu pe <dialog>: un `display` propriu pe dialog ar
            învinge regula browserului care îl ascunde cât timp e închis. */}
        <div className="flex max-h-[calc(100dvh-4rem)] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div className="space-y-1">
              <h2 id={titleId} className="text-base font-semibold text-foreground">
                Biblioteca de imagini
              </h2>
              <p id={descriptionId} className="text-xs text-muted-foreground">
                Alege o imagine încărcată deja. Aceeași imagine poate fi folosită în mai
                multe locuri pe site.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Închide biblioteca"
              onClick={requestClose}
              data-media-close=""
              className="size-8 shrink-0 px-0"
            >
              <CloseIcon />
            </Button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col md:flex-row">
            <div className="flex min-h-0 flex-1 flex-col gap-3 p-5">
              {hasUploads && (
                <TextField
                  label="Caută după numele fișierului"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="ex.: cabinet"
                  autoComplete="off"
                  data-media-initial-focus=""
                />
              )}

              <div className="min-h-0 flex-1 overflow-y-auto">
                {!hasUploads && loading && (
                  <p className="flex h-full items-center justify-center py-10 text-center text-sm text-muted-foreground">
                    Se încarcă biblioteca…
                  </p>
                )}

                {!hasUploads && !loading && (
                  <EmptyState
                    title="Nicio imagine încărcată încă."
                    description="Imaginile pe care le încarci în paginile site-ului ajung aici și le poți refolosi oricând."
                  />
                )}

                {hasUploads && filtered.length === 0 && (
                  <EmptyState
                    title="Nicio imagine cu numele acesta"
                    description={`Niciun fișier din bibliotecă nu conține „${query.trim()}”. Încearcă doar o parte din nume.`}
                    action={
                      <Button variant="secondary" onClick={showAllImages}>
                        Arată toate imaginile
                      </Button>
                    }
                  />
                )}

                {filtered.length > 0 && (
                  <div
                    ref={gridRef}
                    role="listbox"
                    aria-label="Imagini încărcate"
                    className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
                  >
                    {filtered.map((upload, index) => {
                      const isSelected = upload.id === selected?.id;

                      return (
                        <div
                          key={upload.id}
                          role="option"
                          aria-selected={isSelected}
                          aria-label={
                            typeof upload.usageCount === "number" && upload.usageCount > 0
                              ? `${upload.filename} — ${describeUsage(upload.usageCount).toLowerCase()}`
                              : upload.filename
                          }
                          tabIndex={index === activeIndex ? 0 : -1}
                          data-media-tile={index}
                          onFocus={() => setSelectedId(upload.id)}
                          onClick={() => setSelectedId(upload.id)}
                          onDoubleClick={() => choose(upload)}
                          onKeyDown={(event) => handleTileKeyDown(event, index)}
                          className={cn(
                            "cursor-pointer select-none rounded-base border p-2 transition-colors",
                            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                            isSelected
                              ? "border-primary bg-surface-muted"
                              : "border-border bg-surface hover:bg-surface-hover",
                          )}
                        >
                          <div className="relative aspect-square overflow-hidden rounded-base bg-surface-muted">
                            {/* Miniatura e decorativă: numele de dedesubt și eticheta
                                opțiunii spun deja despre ce imagine e vorba. */}
                            <Image
                              src={upload.url}
                              alt=""
                              fill
                              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 200px"
                              className="object-cover"
                            />
                            {isSelected && (
                              <span
                                aria-hidden
                                className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                              >
                                <CheckIcon />
                              </span>
                            )}
                          </div>
                          <p
                            title={upload.filename}
                            className="mt-2 truncate text-xs text-foreground"
                          >
                            {upload.filename}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {filtered.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Treci de la o imagine la alta cu săgețile și alege-o cu tasta Enter.
                </p>
              )}
            </div>

            <aside
              aria-label="Detaliile imaginii alese"
              className="shrink-0 overflow-y-auto border-t border-border bg-surface-muted p-5 md:w-72 md:border-l md:border-t-0"
            >
              {selected ? (
                <div className="space-y-4">
                  <div className="relative aspect-video overflow-hidden rounded-base border border-border bg-surface">
                    <Image
                      src={selected.url}
                      alt={selected.altText || ""}
                      fill
                      sizes="(max-width: 768px) 90vw, 240px"
                      className="object-contain"
                    />
                  </div>

                  <div className="space-y-1">
                    <p className="break-all text-sm font-medium text-foreground">
                      {selected.filename}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selected.width > 0 && selected.height > 0
                        ? `${selected.width} × ${selected.height} pixeli · ${formatFileSize(selected.sizeBytes)}`
                        : formatFileSize(selected.sizeBytes)}
                    </p>
                    {uploadedAt && (
                      <p className="text-xs text-muted-foreground">
                        Încărcată pe {uploadedAt}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium text-foreground">Text alternativ</p>
                    {selected.altText ? (
                      <p className="text-xs text-muted-foreground">{selected.altText}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Nu are încă o descriere. Fără ea, cine nu vede imaginea nu află ce
                        e în ea.
                      </p>
                    )}
                  </div>

                  {typeof selected.usageCount === "number" &&
                    (selected.usageCount > 0 ? (
                      <p className="rounded-base bg-warning-surface px-3 py-2 text-xs text-warning">
                        {describeUsage(selected.usageCount)} pe site.
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Nu e folosită nicăieri pe site.
                      </p>
                    ))}

                  <div className="space-y-2">
                    <Button className="w-full" onClick={() => choose(selected)}>
                      Folosește imaginea
                    </Button>
                    {onDelete && (
                      <Button
                        variant="ghost"
                        className="w-full hover:bg-danger-surface hover:text-danger"
                        onClick={() => setPendingDeleteId(selected.id)}
                      >
                        Șterge imaginea
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {hasUploads
                    ? "Apasă pe o imagine ca să-i vezi detaliile aici."
                    : "Aici apar detaliile imaginii alese: numele, dimensiunile și în câte locuri e folosită."}
                </p>
              )}
            </aside>
          </div>

          {/*
            Ștergerea se vede pe ecran (imaginea dispare din grilă), dar cine nu
            se uită la ecran nu află nimic — focusul doar sare pe căutare.
            Regiunea stă în interiorul dialogului: cât timp modalul e deschis,
            restul paginii e inert și anunțurile de acolo se pot pierde.
          */}
          <p aria-live="polite" className="sr-only">
            {status}
          </p>
        </div>
      </dialog>

      {/* Confirmarea stă în afara <dialog>-ului bibliotecii: browserul o pune oricum
          deasupra (top layer), iar React nu-i mai poate ridica evenimentul `close`
          până la biblioteca de dedesubt. */}
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(next) => {
          if (!next) {
            setPendingDeleteId(null);
            setDeleteError(null);
          }
        }}
        title="Ștergi imaginea?"
        description={
          pendingDelete
            ? `„${pendingDelete.filename}” dispare din bibliotecă și nu mai poate fi recuperată.`
            : ""
        }
        warning={
          deleteError ? (
            <>
              <span className="block font-medium">{deleteError}</span>
              {deleteWarning && <span className="mt-1 block">{deleteWarning}</span>}
            </>
          ) : (
            deleteWarning
          )
        }
        confirmLabel="Șterge definitiv"
        cancelLabel="Păstrează"
        // Tonul de pericol nu depinde de numărul de referințe — ștergerea e oricum
        // fără drum de întoarcere; avertismentul de mai sus e cel care spune cât costă.
        tone="danger"
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      aria-hidden
      className="size-4"
    >
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="size-3"
    >
      <path d="M3.5 8.5l3 3 6-6" />
    </svg>
  );
}
