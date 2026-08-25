"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./button";
import { TextField } from "./field";

/**
 * Litere care NU se rezolvă prin descompunere Unicode: „ș" și „ț" apar în texte
 * și în forma cu sedilă (U+015F, U+0163) — moștenire din documentele vechi și din
 * tastaturile prost configurate — iar „ß" sau „æ" nu sunt litere cu semn diacritic,
 * ci litere de sine stătătoare, care fără mapare ar dispărea pur și simplu.
 */
const SPECIAL_LETTERS: Record<string, string> = {
  "ș": "s",
  "Ș": "s",
  "ş": "s",
  "Ş": "s",
  "ț": "t",
  "Ț": "t",
  "ţ": "t",
  "Ţ": "t",
  "ă": "a",
  "Ă": "a",
  "â": "a",
  "Â": "a",
  "î": "i",
  "Î": "i",
  "ß": "ss",
  "æ": "ae",
  "Æ": "ae",
  "œ": "oe",
  "Œ": "oe",
  "ø": "o",
  "Ø": "o",
  "đ": "d",
  "Đ": "d",
  "ł": "l",
  "Ł": "l",
};

/**
 * Forma „în curs de scriere": nu taie cratimele de la capete, altfel n-ai putea
 * tasta niciodată o cratimă — ar fi ștearsă în aceeași clipă în care o scrii.
 */
function slugifyLoose(input: string): string {
  return (
    Array.from(input)
      .map((character) => SPECIAL_LETTERS[character] ?? character)
      .join("")
      /*
       * Maparea de mai sus prinde diacriticele precompuse (un singur caracter);
       * NFD le desface pe cele compuse din literă + semn (ă = a + U+0306), iar
       * ștergerea intervalului de semne le aduce pe amândouă la aceeași literă ASCII.
       */
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      // Apostrofurile dispar, nu devin cratime: „cabinetul lui O'Neill" → „oneill".
      .replace(/['‘’ʼ`]/g, "")
      // Orice altceva (spații, punctuație, semne) devine o singură cratimă.
      .replace(/[^a-z0-9]+/g, "-")
  );
}

/** Forma finală a unei adrese: doar litere mici, cifre și cratime, fără cratime la capete. */
export function slugify(input: string): string {
  return slugifyLoose(input).replace(/^-+|-+$/g, "");
}

type Availability = "idle" | "checking" | "free" | "taken" | "failed";

const STATUS_TEXT: Record<
  Availability,
  { text: string; tone: "muted" | "success" | "danger" } | null
> = {
  idle: null,
  checking: { text: "Se verifică…", tone: "muted" },
  free: { text: "Disponibil", tone: "success" },
  taken: { text: "Există deja un element cu acest link", tone: "danger" },
  // Fără promisiunea unei reîncercări care nu vine de la sine: verificarea repornește
  // doar când se schimbă adresa, așa că mesajul spune exact atât.
  failed: {
    text: "Nu am putut verifica dacă adresa e liberă. Încercăm din nou dacă o modifici.",
    tone: "muted",
  },
};

export type SlugFieldProps = {
  value: string;
  onChange: (value: string) => void;
  /** Titlul din care se generează adresa la apăsarea butonului. */
  sourceValue: string;
  /** Partea fixă a adresei, doar de afișat (ex. „/blog/"). */
  prefix?: string;
  error?: string;
  /**
   * Întreabă serverul dacă adresa e liberă. La editarea unui element existent,
   * verificarea trebuie să ignore chiar elementul editat — altfel propria adresă
   * apare mereu ca ocupată.
   */
  checkAvailability?: (slug: string) => Promise<boolean>;
  label?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
};

export function SlugField({
  value,
  onChange,
  sourceValue,
  prefix,
  error,
  checkAvailability,
  label = "Adresa paginii",
  name,
  required,
  disabled,
}: SlugFieldProps) {
  /*
   * Răspunsul se ține împreună cu adresa pentru care a venit. Așa, un rezultat
   * întârziat pentru o adresă veche nu poate ajunge să descrie adresa scrisă
   * între timp, iar starea „se verifică" se deduce, nu se mai setează separat.
   */
  const [answer, setAnswer] = useState<{ slug: string; outcome: Availability } | null>(null);
  const statusId = useId();

  /*
   * Funcția de verificare vine de obicei ca funcție anonimă, deci se schimbă la
   * fiecare randare a formularului. Ținută într-un ref, cronometrul de așteptare
   * nu se resetează de fiecare dată când se tastează în alt câmp al paginii.
   */
  const checkRef = useRef(checkAvailability);
  useEffect(() => {
    checkRef.current = checkAvailability;
  });

  const slug = slugify(value);
  const canCheck = Boolean(checkAvailability);

  useEffect(() => {
    if (!canCheck || !slug) return;

    let abandoned = false;
    // Așteptăm o pauză în tastare: altfel un titlu de 30 de litere ar porni 30 de cereri.
    const timer = setTimeout(() => {
      const check = checkRef.current;
      if (!check) return;

      check(slug)
        .then((free) => {
          if (!abandoned) setAnswer({ slug, outcome: free ? "free" : "taken" });
        })
        .catch(() => {
          if (!abandoned) setAnswer({ slug, outcome: "failed" });
        });
    }, 400);

    return () => {
      abandoned = true;
      clearTimeout(timer);
    };
  }, [slug, canCheck]);

  const generated = slugify(sourceValue);
  const canRegenerate = Boolean(generated) && generated !== slug && !disabled;

  const availability: Availability = !canCheck || !slug
    ? "idle"
    : answer?.slug === slug
      ? answer.outcome
      : "checking";

  const taken = availability === "taken";
  const status = STATUS_TEXT[availability];

  return (
    <div className="space-y-2">
      <TextField
        label={label}
        name={name}
        required={required}
        disabled={disabled}
        value={value}
        // Normalizarea se face în timp ce se scrie, ca să nu apară în câmp
        // caractere pe care adresa nu le acceptă și care ar fi respinse la salvare.
        onChange={(event) => onChange(slugifyLoose(event.target.value))}
        // Cratimele rămase la capete se taie abia la ieșirea din câmp.
        onBlur={() => {
          if (slug !== value) onChange(slug);
        }}
        type="text"
        inputMode="url"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        aria-invalid={Boolean(error) || taken || undefined}
        // `aria-invalid` singur spune doar „e greșit", nu și de ce: cine revine cu
        // Tab pe câmp după ce anunțul live a trecut ar auzi „câmp nevalid" și atât.
        aria-describedby={status ? statusId : undefined}
        error={error}
        className={cn("font-mono", taken && !error && "border-danger")}
        hint="Adresa la care se va vedea pagina. Doar litere mici, cifre și cratime."
      />

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="min-w-0 space-y-0.5">
          {slug && (
            <p className="truncate text-xs text-muted-foreground">
              Se va vedea la{" "}
              <span className="font-mono text-foreground">
                {prefix}
                {slug}
              </span>
            </p>
          )}

          {/*
           * Zona de stare există și goală: dacă ar fi montată abia la prima
           * verificare, cititoarele de ecran n-ar avea ce anunța.
           */}
          <p
            id={statusId}
            aria-live="polite"
            className={cn(
              "text-xs",
              status?.tone === "success" && "text-success",
              status?.tone === "danger" && "text-danger",
              status?.tone === "muted" && "text-muted-foreground",
            )}
          >
            {status?.text ?? ""}
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          disabled={!canRegenerate}
          onClick={() => onChange(generated)}
        >
          Regenerează din titlu
        </Button>
      </div>
    </div>
  );
}
