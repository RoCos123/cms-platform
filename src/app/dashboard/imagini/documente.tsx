"use client";

import { useRef, useState, useTransition } from "react";
import type { DragEvent } from "react";
import { uploadDocument } from "@/app/actions/upload";
import { stergeImaginea } from "./actions";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { cn } from "@/lib/cn";
import {
  ACCEPTED_DOCUMENT_LABEL,
  DOCUMENT_INPUT_ACCEPT,
  MAX_DOCUMENT_SIZE_LABEL,
  describeDocumentProblem,
} from "@/lib/uploads";
import type { DocumentBiblioteca } from "@/lib/imagini-panou";

/** Mărimea pe înțelesul omului: „340 KB", „1,2 MB". */
function marimeCitibila(octeti: number): string {
  if (octeti < 1024) return `${octeti} B`;
  const kb = octeti / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1).replace(".", ",")} MB`;
}

/**
 * Documentele de descărcat, în bibliotecă.
 *
 * Deosebit de galeria de imagini dinadins: un document nu are miniatură, nici
 * poziție, nici descriere de completat — se încarcă, se descarcă, se șterge. O
 * listă simplă spune asta mai bine decât o grilă de plăcuțe goale.
 *
 * Ștergerea trece prin `stergeImaginea` (aceeași acțiune: scoate încărcarea din
 * secțiuni, apoi rândul, apoi fișierul). Lista se reîmprospătează singură:
 * acțiunile reîncarcă `/dashboard`, deci `documente` vine din nou de pe server.
 */
export function Documente({ documente }: { documente: DocumentBiblioteca[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [seTrage, setSeTrage] = useState(false);
  const [progres, setProgres] = useState<{ facute: number; total: number } | null>(null);
  const [probleme, setProbleme] = useState<string[]>([]);
  const [anunt, setAnunt] = useState("");
  const [seIncarca, porneste] = useTransition();
  const [seSterge, setSeSterge] = useState<string | null>(null);

  function incarca(fisiere: File[]) {
    if (fisiere.length === 0) return;

    const bune: File[] = [];
    const respinse: string[] = [];
    for (const fisier of fisiere) {
      // Aceeași verificare rulează și pe server (singura care contează); aici e
      // doar ca omul să afle imediat, fără drumul dus-întors.
      const problema = describeDocumentProblem({ name: fisier.name, type: fisier.type, size: fisier.size });
      if (problema) respinse.push(`${fisier.name}: ${problema}`);
      else bune.push(fisier);
    }

    setProbleme(respinse);
    if (bune.length === 0) return;

    setProgres({ facute: 0, total: bune.length });
    setAnunt(bune.length === 1 ? "Se încarcă documentul." : `Se încarcă ${bune.length} documente.`);

    porneste(async () => {
      const esuate: string[] = [];
      for (const [index, fisier] of bune.entries()) {
        const formData = new FormData();
        formData.set("file", fisier);

        const rezultat = await uploadDocument(formData).catch(() => null);
        if (!rezultat) {
          esuate.push(`${fisier.name}: nu am putut trimite fișierul. Verifică legătura la internet.`);
        } else if (!rezultat.ok) {
          esuate.push(`${fisier.name}: ${rezultat.error}`);
        }
        setProgres({ facute: index + 1, total: bune.length });
      }

      setProgres(null);
      setProbleme((anterioare) => [...anterioare, ...esuate]);

      const reusite = bune.length - esuate.length;
      setAnunt(
        reusite === 0
          ? "Niciun document nu a putut fi încărcat."
          : reusite === 1
            ? "Documentul a fost încărcat."
            : `${reusite} documente au fost încărcate.`,
      );
    });
  }

  function dinInput(fisiere: FileList | null) {
    incarca(fisiere ? Array.from(fisiere) : []);
    if (inputRef.current) inputRef.current.value = "";
  }

  function laTragere(eveniment: DragEvent<HTMLDivElement>) {
    if (seIncarca) return;
    if (!eveniment.dataTransfer.types.includes("Files")) return;
    eveniment.preventDefault();
    eveniment.dataTransfer.dropEffect = "copy";
    setSeTrage(true);
  }

  function laIesire(eveniment: DragEvent<HTMLDivElement>) {
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

  function sterge(doc: DocumentBiblioteca) {
    if (seSterge) return;
    setSeSterge(doc.id);
    porneste(async () => {
      const rezultat = await stergeImaginea(doc.id).catch(() => null);
      setSeSterge(null);
      if (!rezultat || !rezultat.ok) {
        setProbleme((anterioare) => [
          ...anterioare,
          `Nu am putut șterge „${doc.numeFisier}”. Mai încearcă o dată.`,
        ]);
      } else {
        setAnunt(`Documentul „${doc.numeFisier}” a fost șters.`);
      }
    });
  }

  return (
    <div onDragEnter={laTragere} onDragOver={laTragere} onDragLeave={laIesire} onDrop={laLasare} className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept={DOCUMENT_INPUT_ACCEPT}
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
            Trage documente aici sau alege-le de pe calculator
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {ACCEPTED_DOCUMENT_LABEL} · cel mult {MAX_DOCUMENT_SIZE_LABEL} fiecare
          </p>
        </div>

        <Button onClick={() => inputRef.current?.click()} disabled={seIncarca}>
          {progres
            ? `Se încarcă ${Math.min(progres.facute + 1, progres.total)} din ${progres.total}…`
            : "Încarcă documente"}
        </Button>
      </div>

      {probleme.length > 0 && (
        <div className="space-y-2 rounded-base bg-danger-surface px-4 py-3">
          <ul className="space-y-1 text-xs text-danger">
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

      {documente.length === 0 ? (
        <EmptyState
          title="Niciun document încă"
          description="Încarcă un PDF sau un Word (o fișă, un formular), apoi leagă-l de un buton „Descarcă” la un pachet."
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-base border border-border">
          {documente.map((doc) => (
            <li key={doc.id} className="flex items-center gap-3 px-4 py-3">
              <svg
                aria-hidden
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="shrink-0 text-muted-foreground"
              >
                <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                <path d="M15 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
              </svg>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground" title={doc.numeFisier}>
                  {doc.numeFisier}
                </p>
                <p className="text-xs text-muted-foreground">{marimeCitibila(doc.marimeOcteti)}</p>
              </div>

              <a
                href={doc.url}
                className="whitespace-nowrap text-sm font-medium text-primary underline hover:no-underline"
              >
                Descarcă
              </a>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => sterge(doc)}
                disabled={seSterge === doc.id}
                className="text-danger hover:bg-danger-surface"
              >
                {seSterge === doc.id ? "Se șterge…" : "Șterge"}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <p aria-live="polite" className="sr-only">
        {anunt}
      </p>
    </div>
  );
}
