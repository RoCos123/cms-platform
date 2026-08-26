"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { InlineError, StatusBadge, type StatusValue } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast";
import { formateazaDataArticolului } from "@/lib/blog";
import { comutaPublicareaArticolului, stergeArticol } from "./actions";

export type RandArticol = {
  id: string;
  titlu: string;
  extras: string;
  stare: StatusValue;
  publicatLa: string | null;
};

/**
 * Lista articolelor.
 *
 * Fără reordonare, spre deosebire de servicii: articolele se așază singure, de
 * la cel mai nou. Ordinea într-un blog e cronologia, nu o preferință — iar un
 * client care ar putea muta articolele ar sfârși mutându-le degeaba.
 *
 * Publicarea se salvează pe loc, fără bară de jos: aici nu mai există altceva
 * de salvat împreună cu ea, deci o bară care așteaptă ar fi doar un pas în plus.
 */
export function ListaArticolePanou({ initiale }: { initiale: RandArticol[] }) {
  const [randuri, setRanduri] = useState(initiale);
  const [eroare, setEroare] = useState<string | null>(null);
  const [deSters, setDeSters] = useState<RandArticol | null>(null);
  const [seLucreaza, porneste] = useTransition();
  const { show } = useToast();

  function comuta(rand: RandArticol, publicat: boolean) {
    setEroare(null);
    const anterioare = randuri;

    // Bifa se mișcă imediat, ca apăsarea să aibă un răspuns; dacă serverul
    // refuză, se pune la loc mai jos.
    setRanduri((precedente) =>
      precedente.map((r) =>
        r.id === rand.id
          ? {
              ...r,
              stare: publicat ? "published" : "unpublished",
              publicatLa: r.publicatLa ?? (publicat ? new Date().toISOString() : null),
            }
          : r,
      ),
    );

    porneste(async () => {
      const rezultat = await comutaPublicareaArticolului(rand.id, publicat).catch(() => null);

      if (!rezultat || !rezultat.ok) {
        setRanduri(anterioare);
        setEroare(rezultat?.mesaj ?? "Nu am putut salva. Verifică legătura la internet.");
        return;
      }

      show(publicat ? "Articolul e acum pe site." : "Articolul a fost retras de pe site.", "success");
    });
  }

  return (
    <>
      {eroare && <InlineError>{eroare}</InlineError>}

      <ul className="space-y-2">
        {randuri.map((rand) => {
          const data = formateazaDataArticolului(rand.publicatLa);

          return (
            <li
              key={rand.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-base border border-border bg-surface p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-medium text-foreground">
                  {rand.titlu}
                  <StatusBadge status={rand.stare} />
                </p>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {rand.extras || "Fără descriere scurtă."}
                </p>
                {data && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {rand.stare === "published" ? "Publicat pe" : "Publicat prima oară pe"} {data}
                  </p>
                )}
              </div>

              <Link
                href={`/dashboard/blog/${rand.id}`}
                className="shrink-0 rounded-base px-3 py-1.5 text-sm font-medium text-foreground underline hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Editează
              </Link>

              <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={rand.stare === "published"}
                  disabled={seLucreaza}
                  onChange={(eveniment) => comuta(rand, eveniment.target.checked)}
                  className="size-4 accent-primary"
                />
                Pe site
              </label>

              <Button
                variant="ghost"
                size="sm"
                disabled={seLucreaza}
                onClick={() => setDeSters(rand)}
                aria-label={`Șterge articolul ${rand.titlu}`}
                className="shrink-0"
              >
                <span aria-hidden>🗑</span>
              </Button>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={deSters !== null}
        onOpenChange={(deschis) => !deschis && setDeSters(null)}
        title="Ștergi articolul?"
        description={
          deSters ? `„${deSters.titlu}” dispare de pe site și din panou, cu tot textul lui.` : undefined
        }
        warning="Dacă vrei doar să nu se mai vadă pe site, debifează „Pe site” în loc să ștergi."
        confirmLabel="Șterge"
        tone="danger"
        pending={seLucreaza}
        onConfirm={() => {
          const articol = deSters;
          if (!articol) return;
          setDeSters(null);
          porneste(async () => {
            const rezultat = await stergeArticol(articol.id).catch(() => null);
            if (!rezultat || !rezultat.ok) {
              setEroare(rezultat?.mesaj ?? "Nu am putut șterge. Verifică legătura la internet.");
              return;
            }
            setRanduri((precedente) => precedente.filter((r) => r.id !== articol.id));
            show("Articolul a fost șters.", "success");
          });
        }}
      />
    </>
  );
}
