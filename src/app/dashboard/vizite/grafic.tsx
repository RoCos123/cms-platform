"use client";

import { useState } from "react";
import { numara } from "@/lib/numerale";
import type { ZiDeTrafic } from "@/lib/vizite";

/**
 * Afișările pe zile, ca bare.
 *
 * O singură serie, deci fără legendă — titlul de deasupra spune ce se numără.
 * Culoarea e accentul temei, aceeași în deschis și în închis prin token, nu o
 * culoare nouă: verificată pe amândouă fundalurile.
 *
 * Bare, nu linie: zilele sunt numărători discrete, iar o linie ar sugera că
 * există valori între ele.
 */
export function GraficZilnic({
  zile,
  eticheteScurte,
}: {
  zile: ZiDeTrafic[];
  /** Ziua scrisă pe scurt („27 aug."), calculată pe server ca să fie în fusul corect. */
  eticheteScurte: string[];
}) {
  const [subDeget, setSubDeget] = useState<number | null>(null);

  const maxim = Math.max(...zile.map((z) => z.afisari), 1);
  const total = zile.reduce((s, z) => s + z.afisari, 0);
  const pozitia = subDeget === null ? 0 : ((subDeget + 0.5) / zile.length) * 100;

  return (
    <div className="space-y-3">
      <div
        className="relative flex h-40 items-end gap-0.5"
        role="img"
        aria-label={`Afișări pe zi, ultimele ${zile.length} zile. În total ${numara(total, "afișare", "afișări")}.`}
        onMouseLeave={() => setSubDeget(null)}
      >
        {zile.map((zi, i) => {
          const inaltime = (zi.afisari / maxim) * 100;

          return (
            <div
              key={zi.zi}
              className="group relative flex h-full flex-1 items-end"
              onMouseEnter={() => setSubDeget(i)}
              /* Ținta de hover e toată coloana, nu doar bara: la o zi cu două
                 afișări bara are trei pixeli înălțime și n-ai cum s-o nimerești. */
              title={`${eticheteScurte[i]} · ${numara(zi.afisari, "afișare", "afișări")}`}
            >
              <div
                className="w-full rounded-t-[4px] bg-primary transition-opacity"
                style={{
                  // Zilele cu zero rămân vizibile ca linie subțire: altfel n-ai
                  // cum să deosebești „n-a intrat nimeni" de „lipsește ziua".
                  height: zi.afisari === 0 ? "2px" : `max(4px, ${inaltime}%)`,
                  opacity: zi.afisari === 0 ? 0.25 : subDeget === null || subDeget === i ? 1 : 0.45,
                }}
              />
            </div>
          );
        })}

        {subDeget !== null && (
          <div
            className="pointer-events-none absolute -top-1 z-10 whitespace-nowrap rounded-base border border-border bg-surface px-2 py-1 text-xs shadow-sm"
            style={{
              left: `${pozitia}%`,
              /*
                Centrată pe bară, dar nu la capete: măsurat, eticheta ieșea cu
                15px în stânga cartonașului la prima zi și cu 20px în dreapta la
                ultima. La margini se agață de bară cu latura dinspre interior.
              */
              transform: `translateX(${pozitia < 12 ? "0%" : pozitia > 88 ? "-100%" : "-50%"})`,
            }}
          >
            <span className="font-medium text-foreground">{eticheteScurte[subDeget]}</span>
            <span className="text-muted-foreground">
              {" · "}
              {numara(zile[subDeget].afisari, "afișare", "afișări")}
            </span>
          </div>
        )}
      </div>

      {/* Doar capetele intervalului: o etichetă sub fiecare din cele 30 de bare
          n-ar încăpea, iar îndesate ar fi ilizibile. Restul se citesc la hover. */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{eticheteScurte[0]}</span>
        <span>{eticheteScurte[eticheteScurte.length - 1]}</span>
      </div>
    </div>
  );
}
