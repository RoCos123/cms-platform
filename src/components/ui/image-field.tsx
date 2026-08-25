"use client";

import Image from "next/image";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type DragEvent,
  type ReactNode,
} from "react";
import { uploadImage } from "@/app/actions/upload";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { InlineError } from "@/components/ui/feedback";
import { cn } from "@/lib/cn";
import {
  ACCEPTED_IMAGE_LABEL,
  IMAGE_INPUT_ACCEPT,
  MAX_IMAGE_SIZE_LABEL,
  describeImageProblem,
  type ImageValue,
} from "@/lib/uploads";

export type { ImageValue };

export type ImageFieldProps = {
  value: ImageValue | null;
  onChange: (value: ImageValue | null) => void;
  label: string;
  hint?: ReactNode;
  required?: boolean;
  /**
   * Deschide biblioteca media. E primit ca prop, nu importat: așa ImageField
   * rămâne folosibil (și testabil) fără MediaLibrary, iar cele două componente
   * nu se leagă una de alta.
   */
  onPickFromLibrary?: () => void;
  /** Eroare venită din validarea formularului părinte, ex. la salvare. */
  error?: string;
  className?: string;
};

/**
 * Dimensiunile reale ale imaginii se citesc în browser și se trimit ca metadata.
 * Server-ul nu poate deschide antetul fișierului fără o librărie în plus, iar
 * fără lățime/înălțime biblioteca media nu poate arăta „1200 × 630" nicăieri.
 */
/**
 * Acțiunea de pe server întoarce erorile așteptate ca `{ ok: false }`, dar
 * apelul în sine poate și să arunce: internet căzut, sesiune expirată, corp
 * respins de runtime. Fără un mesaj propriu, omul ar vedea doar spinnerul
 * dispărând, fără să afle ce s-a întâmplat.
 */
const NETWORK_UPLOAD_ERROR =
  "Nu am putut trimite imaginea. Verifică legătura la internet și mai încearcă o dată.";

async function measureImage(file: File): Promise<{ width: number; height: number } | null> {
  if (typeof createImageBitmap !== "function") return null;

  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    // SVG-urile fără dimensiuni intrinseci pică aici. Lipsa metadatelor nu e
    // motiv să oprim încărcarea — imaginea în sine e perfect bună.
    return null;
  }
}

export function ImageField({
  value,
  onChange,
  label,
  hint,
  required,
  onPickFromLibrary,
  error,
  className,
}: ImageFieldProps) {
  const labelId = useId();
  const hintId = useId();
  const errorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const dropZoneRef = useRef<HTMLButtonElement>(null);

  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [isUploading, startUploadTransition] = useTransition();

  /**
   * Ultima valoare *comisă*, citită din callback-uri asincrone. Closure-ul
   * încărcării vede `value` de la momentul pornirii; între timp omul poate scrie
   * în textul alternativ, iar acela e cel adevărat când răspunsul se întoarce.
   */
  const valueRef = useRef(value);
  useEffect(() => {
    const previous = valueRef.current;
    valueRef.current = value;

    // Câmpul a primit altă imagine din afară — de obicei aleasă din bibliotecă,
    // care nu trece prin `uploadFile`. O eroare rămasă de la o încărcare eșuată
    // ar acuza în roșu tocmai imaginea care acum e acolo și e bună.
    if ((previous?.uploadId ?? null) !== (value?.uploadId ?? null)) {
      setUploadError(null);
    }
  }, [value]);

  /**
   * Controlul pe care omul tocmai a apăsat dispare când câmpul trece de la gol
   * la plin (și invers): butonul care acoperă zona de drop, respectiv „Elimină".
   * Fără mutarea explicită a focusului, acesta cade pe <body> și cine navighează
   * din taste o ia de la capătul paginii.
   */
  const focusAfterChange = useRef<"altText" | "dropZone" | null>(null);
  useEffect(() => {
    const target = focusAfterChange.current;
    if (!target) return;

    const node =
      target === "altText"
        ? rootRef.current?.querySelector<HTMLInputElement>("[data-image-alt-input]")
        : dropZoneRef.current;
    // Încă nerandat (React poate comite în doi pași): păstrăm intenția pentru
    // următoarea randare în loc să pierdem focusul de tot.
    if (!node) return;

    focusAfterChange.current = null;
    node.focus();
  });

  /**
   * Un mesaj identic cu cel dinainte nu schimbă textul regiunii live, deci
   * cititorul de ecran nu-l mai citește: a doua încercare cu același fișier
   * greșit ar rămâne complet fără răspuns. Alternăm un spațiu invizibil, ca
   * textul să difere fără să se audă altceva.
   */
  const announceCount = useRef(0);
  function announce(message: string) {
    announceCount.current += 1;
    // Spațiu neîntreruptibil (U+00A0), nu unul obișnuit: pe cel obișnuit HTML
    // îl colapsează la sfârșit de text, deci șirul ar rămâne identic.
    setStatus(announceCount.current % 2 === 0 ? `${message} ` : message);
  }

  const visibleError = uploadError ?? error;
  const describedBy = [hint ? hintId : null, visibleError ? errorId : null]
    .filter(Boolean)
    .join(" ");
  const missingAltText = value !== null && value.altText.trim() === "";

  function uploadFile(file: File) {
    const problem = describeImageProblem({
      name: file.name,
      type: file.type,
      size: file.size,
    });

    // O intenție de focus rămasă de la o încercare eșuată n-are ce căuta aici.
    focusAfterChange.current = null;

    if (problem) {
      // Verificarea din browser e doar ca omul să afle imediat; aceeași regulă
      // se aplică din nou pe server, unde e singura care contează.
      setUploadError(problem);
      announce(problem);
      return;
    }

    // Când câmpul e gol, controlul apăsat acum (butonul care acoperă zona de
    // drop) dispare odată cu imaginea încărcată; focusul trebuie să aterizeze pe
    // textul alternativ, care e oricum pasul următor.
    const wasEmpty = value === null;

    setUploadError(null);
    announce("Se încarcă imaginea.");

    startUploadTransition(async () => {
      const formData = new FormData();
      formData.set("file", file);
      // Textul alternativ deja scris se păstrează la înlocuire: descrie de
      // obicei același lucru, iar dacă îl ștergem, cel mai probabil rezultat e
      // o imagine rămasă fără descriere.
      formData.set("altText", value?.altText ?? "");

      const size = await measureImage(file);
      if (size) {
        formData.set("width", String(size.width));
        formData.set("height", String(size.height));
      }

      // `uploadImage` întoarce erorile așteptate ca `{ ok: false }`, dar apelul
      // în sine poate arunca (internet căzut, corp prea mare respins de runtime).
      // Neprinsă, excepția respinge promisiunea tranziției și ajunge la error
      // boundary: ecranul se rupe în loc să arate un mesaj.
      const result = await uploadImage(formData).catch(() => null);

      if (!result) {
        setUploadError(NETWORK_UPLOAD_ERROR);
        announce(NETWORK_UPLOAD_ERROR);
        return;
      }

      if (!result.ok) {
        setUploadError(result.error);
        announce(result.error);
        return;
      }

      // Textul alternativ scris cât timp rula încărcarea e mai nou decât cel
      // trimis în `formData`; fără asta, răspunsul serverului l-ar suprascrie
      // tăcut cu varianta veche.
      const latestAltText = valueRef.current?.altText;
      const image =
        latestAltText === undefined ? result.image : { ...result.image, altText: latestAltText };

      if (wasEmpty) focusAfterChange.current = "altText";
      onChange(image);
      announce(
        image.altText
          ? "Imaginea a fost încărcată."
          : "Imaginea a fost încărcată. Mai adaugă textul alternativ.",
      );
    });
  }

  function openFilePicker() {
    inputRef.current?.click();
  }

  function handleRemove() {
    // Scoatem doar legătura din acest câmp. Fișierul rămâne în bibliotecă,
    // pentru că poate fi folosit și în alte locuri; ștergerea definitivă se
    // face din bibliotecă, unde se vede unde e folosit.
    setUploadError(null);
    announce("Imaginea a fost scoasă din acest câmp.");
    // Butonul „Elimină" dispare odată cu previzualizarea; fără mutarea
    // focusului, acesta ar cădea pe <body>.
    focusAfterChange.current = "dropZone";
    onChange(null);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    if (isUploading) return;
    // Fără fișiere în transfer (text selectat, un link tras din altă filă) nu
    // avem ce prelua — lăsăm browserul să se poarte normal.
    if (!event.dataTransfer.types.includes("Files")) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDraggingOver(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    // Trecerea peste un copil declanșează dragleave pe părinte; fără verificarea
    // asta evidențierea ar clipi la fiecare mișcare a mausului.
    const next = event.relatedTarget as Node | null;
    if (next && event.currentTarget.contains(next)) return;

    setIsDraggingOver(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    if (isUploading) return;

    event.preventDefault();
    setIsDraggingOver(false);

    const file = event.dataTransfer.files.item(0);
    if (file) uploadFile(file);
  }

  const libraryButton = onPickFromLibrary ? (
    <Button
      variant="secondary"
      size="sm"
      onClick={onPickFromLibrary}
      disabled={isUploading}
      // `relative` îl ridică peste butonul care acoperă toată zona de drop;
      // altfel apăsarea pe el ar deschide alegerea fișierului, nu biblioteca.
      className="relative"
    >
      {value ? "Bibliotecă" : "Alege din bibliotecă"}
    </Button>
  ) : null;

  return (
    <div ref={rootRef} className={cn("space-y-1.5", className)}>
      <p id={labelId} className="text-sm font-medium text-foreground">
        {label}
        {required && (
          <>
            <span aria-hidden className="ml-1 text-danger">
              *
            </span>
            <span className="sr-only"> (obligatoriu)</span>
          </>
        )}
      </p>

      <div
        role="group"
        aria-labelledby={labelId}
        aria-describedby={describedBy || undefined}
        aria-busy={isUploading || undefined}
        onDragEnter={handleDragOver}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="relative rounded-base"
      >
        {value ? (
          <div className="space-y-3">
            <div
              className={cn(
                "relative h-48 w-full overflow-hidden rounded-base border border-border bg-surface-muted",
                isDraggingOver && "border-primary",
              )}
            >
              <Image
                src={value.url}
                // Previzualizarea nu adaugă informație peste câmpul de mai jos,
                // unde utilizatorul chiar citește și scrie descrierea.
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 480px"
                className="object-contain"
              />
            </div>

            <TextField
              label="Text alternativ"
              required
              // Marcaj pentru mutarea focusului după încărcare: `FieldShell`
              // își generează singur id-ul, deci nu-l putem ținti altfel.
              data-image-alt-input=""
              value={value.altText}
              onChange={(event) => onChange({ ...value, altText: event.target.value })}
              placeholder="Ex.: Cabinet luminos, cu două fotolii și o masă joasă"
              aria-invalid={missingAltText || undefined}
              hint={
                <>
                  Descrie pe scurt ce se vede în imagine. Ajută persoanele care folosesc
                  cititoare de ecran și apare în Google.
                  {missingAltText && (
                    <span className="mt-1 block text-warning">
                      Deocamdată imaginea e fără descriere.
                    </span>
                  )}
                </>
              }
            />

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={openFilePicker}
                disabled={isUploading}
              >
                Înlocuiește
              </Button>
              {libraryButton}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={isUploading}
                className="hover:bg-danger-surface hover:text-danger"
              >
                Elimină
              </Button>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "relative flex flex-col items-center gap-3 rounded-base border border-dashed px-6 py-10 text-center transition-colors",
              isDraggingOver
                ? "border-primary bg-surface-hover"
                : "border-border-strong bg-surface-muted",
            )}
          >
            {/*
              Butonul acoperă toată zona, ca oriunde ai apăsa să se deschidă
              alegerea fișierului. Textul de dedesubt e `pointer-events-none`, ca
              apăsarea să treacă prin el la buton.
            */}
            <button
              ref={dropZoneRef}
              type="button"
              onClick={openFilePicker}
              disabled={isUploading}
              className="absolute inset-0 rounded-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <span className="sr-only">Alege o imagine de pe calculator</span>
            </button>

            <div className="pointer-events-none flex flex-col items-center gap-1">
              <ImagePlaceholderIcon />
              <p className="text-sm font-medium text-foreground">
                Trage o imagine aici sau apasă pentru a alege
              </p>
              <p className="text-xs text-muted-foreground">
                {ACCEPTED_IMAGE_LABEL} · cel mult {MAX_IMAGE_SIZE_LABEL}
              </p>
            </div>

            {libraryButton}
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-base bg-surface/80">
            <Spinner />
            <p className="text-xs font-medium text-foreground">Se încarcă imaginea…</p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_INPUT_ACCEPT}
        // `hidden` îl scoate complet din pagină și din arborele de accesibilitate;
        // controlul real, cel cu nume și focus vizibil, e butonul de mai sus.
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          // Golim controlul, altfel alegerea aceluiași fișier a doua oară (după
          // o eroare, de exemplu) nu mai declanșează nimic.
          event.target.value = "";
          if (file) uploadFile(file);
        }}
      />

      {hint && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}

      {visibleError && (
        <div id={errorId}>
          <InlineError>{visibleError}</InlineError>
        </div>
      )}

      {/* Ce se vede pe ecran trebuie și auzit: încărcare, reușită, eroare. */}
      <p aria-live="polite" className="sr-only">
        {status}
      </p>
    </div>
  );
}

function ImagePlaceholderIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="mb-1 size-7 text-muted-foreground"
    >
      <rect x="3" y="4.5" width="18" height="15" rx="2" />
      <circle cx="8.5" cy="10" r="1.5" />
      <path d="M3.5 16.5l4.5-4a2 2 0 012.7 0l3.3 3M13 15l2.2-2a2 2 0 012.7 0l2.6 2.3" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-5 animate-spin text-primary">
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        className="opacity-25"
      />
      <path
        d="M21 12a9 9 0 00-9-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
