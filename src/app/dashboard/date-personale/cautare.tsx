"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cautaPersoana, stergePersoana, type Gasire } from "./actions";

const NUME_FEL: Record<Gasire["fel"], string> = {
  mesaj: "Mesaj de contact",
  programare: "Cerere de programare",
  newsletter: "Abonare la newsletter",
};

function dataScrisa(iso: string): string {
  return new Intl.DateTimeFormat("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

/**
 * Căutarea și ștergerea datelor unei persoane.
 *
 * În doi pași dinadins: întâi se arată CE s-a găsit, abia apoi se poate șterge.
 * O ștergere pornită direct din căsuța de căutare ar fi însemnat că psihologul
 * apasă fără să vadă ce dispare — iar asta nu se mai poate da înapoi.
 */
export function Cautare({
  termenInitial = "",
  gasiriInitiale = null,
  mesajInitial = null,
}: {
  /** Ce a venit prin `?cauta=`, dintr-un link de pe un mesaj sau o programare. */
  termenInitial?: string;
  /** Rezultatele deja căutate pe server, ca ecranul să nu se deschidă gol. */
  gasiriInitiale?: Gasire[] | null;
  mesajInitial?: string | null;
}) {
  const [termen, setTermen] = useState(termenInitial);
  /** `null` = încă nu s-a căutat. Gol = s-a căutat și nu s-a găsit nimic. */
  const [gasiri, setGasiri] = useState<Gasire[] | null>(gasiriInitiale);
  const [cautat, setCautat] = useState(termenInitial);
  const [mesaj, setMesaj] = useState<string | null>(mesajInitial);
  const [reusita, setReusita] = useState<string | null>(null);
  const [confirmare, setConfirmare] = useState(false);
  const [seLucreaza, porneste] = useTransition();

  function cauta(eveniment: React.FormEvent) {
    eveniment.preventDefault();
    setMesaj(null);
    setReusita(null);

    porneste(async () => {
      const rezultat = await cautaPersoana(termen);
      if (!rezultat.ok) {
        setMesaj(rezultat.mesaj);
        setGasiri(null);
        return;
      }
      setGasiri(rezultat.gasiri);
      setCautat(termen.trim());
    });
  }

  function sterge() {
    setMesaj(null);
    porneste(async () => {
      const rezultat = await stergePersoana(cautat);
      setConfirmare(false);

      if (!rezultat.ok) {
        setMesaj(rezultat.mesaj);
        return;
      }

      setGasiri([]);
      setReusita(
        rezultat.rezumateAlbite > 0
          ? `S-au șters ${rezultat.sterse} ${rezultat.sterse === 1 ? "înregistrare" : "înregistrări"}. Numele a fost scos și din ${rezultat.rezumateAlbite} ${rezultat.rezumateAlbite === 1 ? "rând" : "rânduri"} din Activitate.`
          : `S-au șters ${rezultat.sterse} ${rezultat.sterse === 1 ? "înregistrare" : "înregistrări"}.`,
      );
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardBody>
          <form onSubmit={cauta} className="flex flex-wrap items-end gap-3">
            <div className="min-w-64 flex-1">
              <label
                htmlFor="cauta-persoana"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Telefon sau email
              </label>
              <input
                id="cauta-persoana"
                value={termen}
                onChange={(e) => setTermen(e.target.value)}
                placeholder="0721 123 456"
                autoComplete="off"
                className="h-9 w-full rounded-base border border-border bg-surface px-3 text-sm text-foreground"
              />
            </div>
            <Button type="submit" disabled={seLucreaza || termen.trim() === ""}>
              {seLucreaza ? "Se caută…" : "Caută"}
            </Button>
          </form>

          {mesaj && <p className="mt-3 text-sm text-danger">{mesaj}</p>}
          {reusita && (
            <p className="mt-3 rounded-base bg-success-surface px-3 py-2 text-sm text-success">
              {reusita}
            </p>
          )}
        </CardBody>
      </Card>

      {gasiri !== null && gasiri.length === 0 && !reusita && (
        <Card>
          <CardBody>
            <p className="text-sm text-muted-foreground">
              Nu s-a găsit nimic pentru <strong className="text-foreground">{cautat}</strong>. Dacă
              omul ți-a lăsat altă dată alt număr sau altă adresă, caută și după acelea.
            </p>
          </CardBody>
        </Card>
      )}

      {gasiri !== null && gasiri.length > 0 && (
        <Card>
          <CardHeader
            title={`${gasiri.length} ${gasiri.length === 1 ? "înregistrare găsită" : "înregistrări găsite"}`}
            description={`Tot ce ține de ${cautat}.`}
          />
          <CardBody className="space-y-4">
            <ul className="divide-y divide-border">
              {gasiri.map((gasire) => (
                <li
                  key={`${gasire.fel}-${gasire.id}`}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5"
                >
                  <span className="text-sm text-foreground">
                    {NUME_FEL[gasire.fel]}
                    {gasire.nume !== "—" && <span className="text-muted-foreground"> · {gasire.nume}</span>}
                  </span>
                  <span className="text-xs text-muted-foreground">{dataScrisa(gasire.cand)}</span>
                </li>
              ))}
            </ul>

            <p className="text-sm leading-relaxed text-muted-foreground">
              Ștergerea e definitivă: nu merge la coș și nu se poate da înapoi. Dacă printre ele e o
              programare pe care ai confirmat-o, ora se eliberează.
            </p>

            <Button variant="danger" onClick={() => setConfirmare(true)} disabled={seLucreaza}>
              Șterge definitiv aceste date
            </Button>
          </CardBody>
        </Card>
      )}

      <ConfirmDialog
        open={confirmare}
        onOpenChange={setConfirmare}
        title="Ștergi definitiv datele acestei persoane?"
        description={`Se șterg ${gasiri?.length ?? 0} ${gasiri?.length === 1 ? "înregistrare" : "înregistrări"} legate de ${cautat}, iar numele dispare și din Activitate.`}
        warning="Nu se poate da înapoi."
        confirmLabel="Da, șterge"
        tone="danger"
        pending={seLucreaza}
        onConfirm={sterge}
      />
    </div>
  );
}
