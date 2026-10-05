"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { InlineError, StatusBadge, type StatusValue } from "@/components/ui/feedback";
import { MeniuActiuni } from "@/components/ui/meniu-actiuni";
import { useToast } from "@/components/ui/toast";
import { formateazaDataArticolului } from "@/lib/blog";
import { mutaInLista, type Directie } from "@/lib/ordine-articole";
import { comutaPublicareaArticolului, mutaArticolul, stergeArticol } from "./actions";

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
 * Ordinea de aici e ordinea de pe site. Un articol nou se pune primul (deci „cel
 * mai nou primul" rămâne purtarea implicită), iar din meniul „⋯" al rândului
 * poate fi mutat mai sus sau mai jos — cerut de proprietar pe 5 oct. 2026. Până
 * atunci blogul se aranja singur, după dată, iar lista fusese făcută fără
 * mutare tocmai pe motivul ăsta.
 *
 * Mutarea se salvează pe loc, ca publicarea: nu e o modificare de adunat și
 * trimis împreună cu altele.
 *
 * Publicarea se salvează pe loc, fără bară de jos: aici nu mai există altceva
 * de salvat împreună cu ea, deci o bară care așteaptă ar fi doar un pas în plus.
 */
export function ListaArticolePanou({ initiale }: { initiale: RandArticol[] }) {
  const [randuri, setRanduri] = useState(initiale);
  const [eroare, setEroare] = useState<string | null>(null);
  const [deSters, setDeSters] = useState<RandArticol | null>(null);
  const [seLucreaza, porneste] = useTransition();
  const [anunt, setAnunt] = useState("");
  const { show } = useToast();

  // O singură mutare odată: două apăsări repezi ar pleca amândouă din aceeași
  // listă veche, iar a doua ar strica rezultatul primeia. Un ref, nu o stare —
  // starea ar ajunge prea târziu pentru a doua apăsare din același moment.
  const seMuta = useRef(false);

  // Rândul mutat își schimbă locul în listă, iar browserul își pierde focusul
  // când i se mută nodul. Punem focusul înapoi pe butonul „⋯" al aceluiași
  // articol, ca cine folosește tastatura să-și poată continua de unde a rămas.
  const declansatoare = useRef(new Map<string, HTMLButtonElement | null>());
  const dupaMutare = useRef<string | null>(null);

  useEffect(() => {
    if (dupaMutare.current === null) return;
    declansatoare.current.get(dupaMutare.current)?.focus();
    dupaMutare.current = null;
  }, [randuri]);

  function muta(rand: RandArticol, directie: Directie) {
    if (seMuta.current) return;

    const urmatoare = mutaInLista(randuri, rand.id, directie);
    if (!urmatoare) return;

    seMuta.current = true;
    setEroare(null);
    const anterioare = randuri;

    // Rândul se mută imediat; dacă serverul refuză, se întoarce la loc.
    dupaMutare.current = rand.id;
    setRanduri(urmatoare);
    setAnunt(
      `${rand.titlu}: poziția ${urmatoare.findIndex((r) => r.id === rand.id) + 1} din ${urmatoare.length}.`,
    );

    porneste(async () => {
      const rezultat = await mutaArticolul(rand.id, directie).catch(() => null);
      seMuta.current = false;

      if (!rezultat || !rezultat.ok) {
        dupaMutare.current = rand.id;
        setRanduri(anterioare);
        setEroare(rezultat?.mesaj ?? "Nu am putut salva. Verifică legătura la internet.");
        return;
      }

      // Ordinea de pe server câștigă: dacă între timp s-a mai mutat ceva dintr-un
      // alt panou, lista noastră se potrivește cu ea, nu invers. Rândurile
      // dispărute între timp se pierd aici; cele apărute vin la următoarea încărcare.
      setRanduri((curente) => {
        const dupaId = new Map(curente.map((r) => [r.id, r]));
        const potrivite = rezultat.ordine.flatMap((id) => dupaId.get(id) ?? []);
        return potrivite.length === curente.length ? potrivite : curente;
      });
    });
  }

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
      <p aria-live="polite" className="sr-only">
        {anunt}
      </p>

      {eroare && <InlineError>{eroare}</InlineError>}

      <ul className="space-y-2">
        {randuri.map((rand, index) => {
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

              {/* Cu un singur articol n-are ce muta: meniul ar avea doar acțiuni stinse. */}
              {randuri.length > 1 && (
                <MeniuActiuni
                  eticheta={`Mută articolul ${rand.titlu}`}
                  declansatorRef={(element) => {
                    declansatoare.current.set(rand.id, element);
                  }}
                  actiuni={[
                    {
                      eticheta: "Mută mai sus",
                      semn: "↑",
                      dezactivata: index === 0,
                      onAlege: () => muta(rand, "sus"),
                    },
                    {
                      eticheta: "Mută mai jos",
                      semn: "↓",
                      dezactivata: index === randuri.length - 1,
                      onAlege: () => muta(rand, "jos"),
                    },
                  ]}
                />
              )}
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
