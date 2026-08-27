"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { SaveBar } from "@/components/ui/save-bar";
import { useToast } from "@/components/ui/toast";
import type { Program } from "@/lib/programari";
import { salveazaProgramul } from "./actions";

const ZILE = [
  { cheie: "1", nume: "Luni" },
  { cheie: "2", nume: "Marți" },
  { cheie: "3", nume: "Miercuri" },
  { cheie: "4", nume: "Joi" },
  { cheie: "5", nume: "Vineri" },
  { cheie: "6", nume: "Sâmbătă" },
  { cheie: "7", nume: "Duminică" },
];

/**
 * Editorul programului de lucru.
 *
 * Un singur interval pe zi, deși baza acceptă mai multe: un cabinet care ia
 * pauză de prânz are nevoie de două, dar l-am lăsat pentru când cineva chiar
 * cere — un al doilea rând pe fiecare zi complică ecranul pentru toți.
 */
export function EditorProgram({ initial }: { initial: Program }) {
  const [program, setProgram] = useState(initial);
  const [referinta, setReferinta] = useState(initial);
  const [seSalveaza, setSeSalveaza] = useState(false);
  const [eroare, setEroare] = useState<string | undefined>();
  const { show } = useToast();

  const modificat = JSON.stringify(program) !== JSON.stringify(referinta);

  function schimbaZiua(cheie: string, pornita: boolean, de?: string, pana?: string) {
    setProgram((vechi) => {
      const zile = { ...vechi.zile };
      if (!pornita) delete zile[cheie];
      else zile[cheie] = [{ de: de ?? "10:00", pana: pana ?? "18:00" }];
      return { ...vechi, zile };
    });
  }

  async function salveaza() {
    setSeSalveaza(true);
    setEroare(undefined);
    const rezultat = await salveazaProgramul(program);
    setSeSalveaza(false);

    if (!rezultat.ok) {
      setEroare(rezultat.mesaj);
      return;
    }
    setReferinta(program);
    show("Programul a fost salvat.", "success");
  }

  const numar = (
    eticheta: string,
    cheie: "durataMinute" | "pauzaMinute" | "preavizOre" | "orizontZile",
    hint: string,
  ) => (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-foreground">{eticheta}</span>
      <input
        type="number"
        min={0}
        value={program[cheie]}
        onChange={(e) =>
          setProgram((v) => ({ ...v, [cheie]: Number(e.target.value) }))
        }
        className="h-9 w-28 rounded-base border border-border-strong bg-surface px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      />
      <span className="text-xs text-muted-foreground">{hint}</span>
    </label>
  );

  return (
    <>
      <Card>
        <CardHeader
          title="Când primești"
          description="Bifează zilele în care lucrezi și pune intervalul. Oamenii vor vedea doar ore din interiorul lui."
        />
        <CardBody>
          <div className="space-y-3">
            {ZILE.map((zi) => {
              const interval = program.zile[zi.cheie]?.[0];
              const pornita = Boolean(interval);

              return (
                <div key={zi.cheie} className="flex flex-wrap items-center gap-3">
                  <label className="flex w-32 shrink-0 items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={pornita}
                      onChange={(e) => schimbaZiua(zi.cheie, e.target.checked)}
                      className="size-4"
                    />
                    {zi.nume}
                  </label>

                  {pornita ? (
                    <div className="flex items-center gap-2 text-sm">
                      <input
                        type="time"
                        value={interval.de}
                        onChange={(e) => schimbaZiua(zi.cheie, true, e.target.value, interval.pana)}
                        className="h-9 rounded-base border border-border-strong bg-surface px-2 text-foreground"
                      />
                      <span className="text-muted-foreground">–</span>
                      <input
                        type="time"
                        value={interval.pana}
                        onChange={(e) => schimbaZiua(zi.cheie, true, interval.de, e.target.value)}
                        className="h-9 rounded-base border border-border-strong bg-surface px-2 text-foreground"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">nu primesc</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap gap-6 border-t border-border pt-6">
            {numar("Cât ține o ședință", "durataMinute", "minute")}
            {numar("Pauză între ședințe", "pauzaMinute", "minute")}
            {numar("Cu cât timp înainte", "preavizOre", "ore — sub atât, ora nu se mai oferă")}
            {numar("Cât de departe", "orizontZile", "zile — mai încolo nu se poate cere")}
          </div>

          {Object.keys(program.zile).length === 0 && (
            <p className="mt-6 rounded-base border border-border bg-surface-muted p-3 text-sm text-muted-foreground">
              Cât timp nicio zi nu e bifată, formularul de programare nu apare pe site.
              Nimeni nu poate cere o oră pe care n-ai promis-o.
            </p>
          )}
        </CardBody>
      </Card>

      <SaveBar
        isDirty={modificat}
        isSaving={seSalveaza}
        onSave={salveaza}
        onDiscard={() => {
          setProgram(referinta);
          setEroare(undefined);
        }}
        error={eroare}
      />
    </>
  );
}
