"use client";

import { isValidElement, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./button";
import { Card } from "./card";
import { TextField } from "./field";
import { EmptyState } from "./feedback";

export type SortableValue = string | number | boolean | Date | null | undefined;

export type DataTableColumn<T> = {
  /** Numele câmpului din rând; ține loc și de identificator al coloanei la sortare. */
  key: string;
  header: ReactNode;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  /**
   * Valoarea după care se compară, când ce se vede nu e ce se sortează —
   * o dată afișată ca „acum 6 ore" trebuie sortată după timpul real. Fără ea se
   * folosește valoarea din rând, iar dacă rândul n-are câmpul, textul afișat.
   */
  sortValue?: (row: T) => SortableValue;
  align?: "left" | "right";
  /** Clase pe coloană, în general o lățime („w-32"). Restul își împart spațiul rămas. */
  className?: string;
};

export type DataTableProps<T> = {
  rows: T[];
  columns: DataTableColumn<T>[];
  /** Cheie stabilă per rând — sortarea și filtrarea rearanjează lista permanent. */
  getKey: (row: T) => string;
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  /** Ce se vede când nu există niciun rând. Cazul „căutare fără rezultate" e tratat separat. */
  emptyState?: ReactNode;
  actions?: (row: T) => ReactNode;
  /** Numele listei, citit de cititoarele de ecran (ex. „Articole de blog"). */
  label?: string;
  className?: string;
};

/**
 * Comparare pe limba română: „Ș" trebuie să stea lângă „S", nu la coada
 * alfabetului, iar „Articol 10" după „Articol 9", nu înaintea lui.
 */
const collator = new Intl.Collator("ro", { numeric: true, sensitivity: "base" });

/**
 * Căutarea ignoră diacriticele și literele mari: cine scrie „sedinta" trebuie să
 * găsească „Ședință", altfel căutarea pare stricată.
 */
function normalizeForSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Rândurile pot fi orice formă; citirea unei chei nu are voie să arunce pe primitive. */
function readField<T>(row: T, key: string): unknown {
  if (row === null || typeof row !== "object") return undefined;
  return (row as Record<string, unknown>)[key];
}

/**
 * Proprietăți din care se poate scoate text de căutat, când conținutul unei celule
 * e o componentă, nu copii direcți (ex. `<PrimaryCell title=… secondary=… />`).
 * Lista e scurtă intenționat: `className` sau `id` ar face ca orice căutare să
 * potrivească toate rândurile.
 */
const TEXTUAL_PROPS = ["title", "secondary", "label", "alt", "value"] as const;

function nodeToText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map((child) => nodeToText(child)).join(" ");

  if (isValidElement(node)) {
    const props = node.props as Record<string, unknown>;
    const parts: string[] = [];

    for (const name of TEXTUAL_PROPS) {
      const value = props[name];
      if (typeof value === "string" || typeof value === "number") parts.push(String(value));
    }
    parts.push(nodeToText(props.children as ReactNode));

    return parts.filter(Boolean).join(" ");
  }

  return "";
}

function searchTextFor<T>(columns: DataTableColumn<T>[], row: T): string {
  const parts: string[] = [];

  for (const column of columns) {
    const raw = readField(row, column.key);
    if (typeof raw === "string" || typeof raw === "number") parts.push(String(raw));
    // Ce se vede contează mai mult decât ce e în date: slug-ul de sub titlu sau
    // eticheta unei stări apar doar în rezultatul lui `render`.
    if (column.render) parts.push(nodeToText(column.render(row)));
  }

  return normalizeForSearch(parts.join(" "));
}

function sortValueFor<T>(column: DataTableColumn<T>, row: T): SortableValue {
  if (column.sortValue) return column.sortValue(row);

  const raw = readField(row, column.key);
  if (
    typeof raw === "string" ||
    typeof raw === "number" ||
    typeof raw === "boolean" ||
    raw instanceof Date
  ) {
    return raw;
  }

  return column.render ? nodeToText(column.render(row)) : "";
}

function isMissing(value: SortableValue): boolean {
  return value === null || value === undefined || value === "";
}

/** Datele ajung text ISO ca să rămână comparabile și când coloana amestecă `Date` cu șiruri. */
function asText(value: SortableValue): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

function compareValues(a: SortableValue, b: SortableValue): number {
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);

  return collator.compare(asText(a), asText(b));
}

/**
 * Fus orar fix: tabelul se randează întâi pe server și apoi în browser, iar o dată
 * formatată în fusul fiecăruia ar da două rezultate diferite pentru același rând.
 */
const dateFormatter = new Intl.DateTimeFormat("ro-RO", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

/** Afișarea implicită a unei celule fără `render`, ca lipsa unei valori să nu apară ca gol suspect. */
function defaultCell(raw: unknown): ReactNode {
  if (raw === null || raw === undefined || raw === "") {
    return <span className="text-muted-foreground">—</span>;
  }
  if (raw instanceof Date) return dateFormatter.format(raw);
  if (typeof raw === "boolean") return raw ? "Da" : "Nu";
  if (typeof raw === "string" || typeof raw === "number") return String(raw);

  return <span className="text-muted-foreground">—</span>;
}

type SortState = { key: string; direction: "asc" | "desc" } | null;

const HEAD_CELL = "px-4 py-2.5 text-left text-xs font-medium text-muted-foreground";
const BODY_CELL = "px-4 py-3 align-middle text-sm text-foreground";

export function DataTable<T>({
  rows,
  columns,
  getKey,
  searchable = false,
  searchPlaceholder = "Caută după titlu…",
  pageSize = 10,
  emptyState,
  actions,
  label = "Listă",
  className,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortState>(null);
  const [requestedPage, setRequestedPage] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);

  const perPage = Math.max(1, Math.floor(pageSize));

  // Textul de căutat se pregătește o dată per set de rânduri, nu la fiecare tastă.
  const prepared = useMemo(
    () =>
      rows.map((row) => ({
        row,
        key: getKey(row),
        haystack: searchable ? searchTextFor(columns, row) : "",
      })),
    [rows, columns, getKey, searchable],
  );

  const needle = normalizeForSearch(query.trim());
  const filtered = useMemo(
    () => (needle ? prepared.filter((entry) => entry.haystack.includes(needle)) : prepared),
    [prepared, needle],
  );

  const sortedColumn = sort ? columns.find((column) => column.key === sort.key) : undefined;
  const sorted = useMemo(() => {
    if (!sort || !sortedColumn) return filtered;

    const withValues = filtered.map((entry) => ({
      entry,
      value: sortValueFor(sortedColumn, entry.row),
    }));

    withValues.sort((a, b) => {
      const aMissing = isMissing(a.value);
      const bMissing = isMissing(b.value);
      // Rândurile fără valoare rămân la coadă în ambele sensuri: la inversarea
      // ordinii, un articol fără categorie n-are ce căuta în capul listei.
      if (aMissing || bMissing) return aMissing === bMissing ? 0 : aMissing ? 1 : -1;

      const result = compareValues(a.value, b.value);
      return sort.direction === "asc" ? result : -result;
    });

    return withValues.map((item) => item.entry);
  }, [filtered, sort, sortedColumn]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / perPage));
  // Pagina se limitează la randare, nu într-un efect: după o ștergere sau o
  // căutare care taie lista, pagina 5 din 5 nu mai există și ecranul ar rămâne gol.
  const page = Math.min(requestedPage, pageCount - 1);
  const start = page * perPage;
  const pageRows = sorted.slice(start, start + perPage);

  function toggleSort(key: string) {
    setSort((current) => {
      if (!current || current.key !== key) return { key, direction: "asc" };
      if (current.direction === "asc") return { key, direction: "desc" };
      return null;
    });
    setRequestedPage(0);
  }

  function handleQueryChange(next: string) {
    setQuery(next);
    setRequestedPage(0);
  }

  function clearSearch() {
    handleQueryChange("");
    // Butonul tocmai apăsat dispare odată cu starea „niciun rezultat"; fără mutarea
    // asta focusul ar cădea pe <body>, adică cine navighează de la tastatură ar fi
    // aruncat înapoi la începutul paginii, departe de lista pe care o citea.
    searchRef.current?.querySelector<HTMLElement>("[data-table-search]")?.focus();
  }

  const total = prepared.length;
  const shown = sorted.length;
  const rangeText =
    shown === 0
      ? "Niciun rezultat"
      : `${start + 1}–${start + pageRows.length} din ${shown}` +
        (shown !== total ? ` (filtrate dintr-un total de ${total})` : "");

  const hasNoRows = total === 0;
  const hasNoMatches = !hasNoRows && shown === 0;

  return (
    <Card className={cn("overflow-hidden", className)}>
      {searchable && (
        <div ref={searchRef} className="border-b border-border px-4 py-3">
          <div className="max-w-xs">
            <TextField
              label="Caută în listă"
              type="search"
              value={query}
              placeholder={searchPlaceholder}
              autoComplete="off"
              onChange={(event) => handleQueryChange(event.target.value)}
              data-table-search=""
            />
          </div>
        </div>
      )}

      {hasNoRows ? (
        emptyState ?? (
          <EmptyState
            title="Nu ai niciun element aici încă"
            description="După ce adaugi primul, îl vei vedea în lista asta."
          />
        )
      ) : hasNoMatches ? (
        <EmptyState
          title={`Nimic găsit pentru „${query.trim()}”`}
          description="Încearcă alt cuvânt sau șterge căutarea ca să vezi din nou toată lista."
          action={
            <Button variant="secondary" size="sm" onClick={clearSearch}>
              Șterge căutarea
            </Button>
          }
        />
      ) : (
        <>
          {/*
           * Pe ecran îngust tabelul se derulează în interiorul lui, nu împinge
           * pagina. Zona derulabilă e focusabilă, ca să poată fi parcursă și
           * de la tastatură, nu doar cu degetul sau cu mouse-ul.
           */}
          <div
            role="region"
            aria-label={label}
            tabIndex={0}
            className="overflow-x-auto focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
          >
            <table className="w-full min-w-[36rem] border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-muted">
                  {columns.map((column) => {
                    const active = sort?.key === column.key;
                    const direction = active ? sort.direction : null;

                    return (
                      <th
                        key={column.key}
                        scope="col"
                        aria-sort={
                          column.sortable
                            ? direction === "asc"
                              ? "ascending"
                              : direction === "desc"
                                ? "descending"
                                : "none"
                            : undefined
                        }
                        className={cn(
                          HEAD_CELL,
                          column.align === "right" && "text-right",
                          column.className,
                        )}
                      >
                        {column.sortable ? (
                          <button
                            type="button"
                            onClick={() => toggleSort(column.key)}
                            className={cn(
                              "-mx-1.5 inline-flex items-center gap-1.5 rounded-base px-1.5 py-1",
                              "hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                              active && "text-foreground",
                            )}
                          >
                            <span>{column.header}</span>
                            <SortIndicator direction={direction} />
                            <span className="sr-only">
                              {direction === null
                                ? "Sortează crescător"
                                : direction === "asc"
                                  ? "Sortează descrescător"
                                  : "Renunță la sortare"}
                            </span>
                          </button>
                        ) : (
                          column.header
                        )}
                      </th>
                    );
                  })}

                  {actions && (
                    <th scope="col" className={cn(HEAD_CELL, "w-px text-right")}>
                      <span className="sr-only">Acțiuni</span>
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {pageRows.map(({ row, key }) => (
                  <tr
                    key={key}
                    className="border-b border-border last:border-b-0 hover:bg-surface-hover"
                  >
                    {columns.map((column, columnIndex) => {
                      const content = column.render
                        ? column.render(row)
                        : defaultCell(readField(row, column.key));

                      const cellClass = cn(
                        BODY_CELL,
                        column.align === "right" && "text-right",
                        column.className,
                      );

                      // Prima coloană e antetul rândului: cititoarele de ecran
                      // anunță „Titlu articol" înaintea fiecărei celule din rând.
                      // `th` e centrat implicit de browser, deci alinierea la stânga
                      // se scrie explicit — dar numai când coloana n-a cerut dreapta,
                      // altfel ar anula tăcut `align: "right"` pe prima coloană.
                      return columnIndex === 0 ? (
                        <th
                          key={column.key}
                          scope="row"
                          className={cn(
                            cellClass,
                            "font-normal",
                            column.align !== "right" && "text-left",
                          )}
                        >
                          {content}
                        </th>
                      ) : (
                        <td key={column.key} className={cellClass}>
                          {content}
                        </td>
                      );
                    })}

                    {actions && (
                      <td className={cn(BODY_CELL, "whitespace-nowrap text-right")}>
                        <div className="flex items-center justify-end gap-1">{actions(row)}</div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
            <p role="status" className="text-xs tabular-nums text-muted-foreground">
              {rangeText}
            </p>

            <div role="group" aria-label="Paginare" className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 0}
                onClick={() => setRequestedPage(Math.max(0, page - 1))}
              >
                Înapoi
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= pageCount - 1}
                onClick={() => setRequestedPage(Math.min(pageCount - 1, page + 1))}
              >
                Înainte
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

/**
 * Celula primară pe două niveluri, ca în tabelul auditat: titlul, iar sub el
 * adresa la care se vede pagina. Textul secundar intră și în căutare.
 */
export function PrimaryCell({
  title,
  secondary,
}: {
  title: ReactNode;
  secondary?: ReactNode;
}) {
  return (
    <span className="flex min-w-0 flex-col gap-0.5">
      <span className="truncate font-medium text-foreground">{title}</span>
      {secondary && (
        <span className="truncate text-xs text-muted-foreground">{secondary}</span>
      )}
    </span>
  );
}

function SortIndicator({ direction }: { direction: "asc" | "desc" | null }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn("size-3.5 shrink-0", direction ? "text-foreground" : "opacity-40")}
    >
      {direction === "asc" && <path d="M4 9.5L8 5.5l4 4" />}
      {direction === "desc" && <path d="M4 6.5l4 4 4-4" />}
      {direction === null && <path d="M5 6.75L8 3.75l3 3M5 9.25l3 3 3-3" />}
    </svg>
  );
}
