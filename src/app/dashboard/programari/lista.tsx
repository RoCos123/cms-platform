"use client";

import { useState, useTransition } from "react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { schimbaStarea } from "./actions";

export type Cerere = {
  id: string;
  nume: string;
  email: string;
  telefon: string | null;
  serviciu: string | null;
  note: string | null;
  cand: string;
  candScris: string;
  stare: "ceruta" | "confirmata" | "refuzata" | "anulata";
  trecuta: boolean;
};

const ETICHETE: Record<Cerere["stare"], { text: string; clasa: string }> = {
  ceruta: { text: "Așteaptă răspuns", clasa: "bg-primary text-primary-foreground" },
  confirmata: { text: "Confirmată", clasa: "bg-surface-muted text-foreground" },
  refuzata: { text: "Refuzată", clasa: "bg-surface-muted text-muted-foreground" },
  anulata: { text: "Anulată", clasa: "bg-surface-muted text-muted-foreground" },
};

export function ListaCereri({ cereri }: { cereri: Cerere[] }) {
  if (cereri.length === 0) {
    return (
      <div className="rounded-base border border-border bg-surface p-6">
        <p className="text-sm text-foreground">Nicio cerere deocamdată.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Cererile apar aici imediat ce cineva alege o oră pe site. Deocamdată nu
          pleacă niciun email, nici către tine, nici către ei — deci merită să treci
          pe aici.
        </p>
      </div>
    );
  }

  return (
    <ol className="space-y-px overflow-hidden rounded-base border border-border">
      {cereri.map((cerere) => (
        <Rand key={cerere.id} cerere={cerere} />
      ))}
    </ol>
  );
}

function Rand({ cerere }: { cerere: Cerere }) {
  const [stare, setStare] = useState(cerere.stare);
  const [seLucreaza, incepe] = useTransition();
  const { show } = useToast();

  function raspunde(nou: "confirmata" | "refuzata") {
    incepe(async () => {
      const rezultat = await schimbaStarea(cerere.id, nou);
      if (!rezultat.ok) {
        show(rezultat.mesaj, "danger");
        return;
      }
      setStare(nou);
      show(nou === "confirmata" ? "Programare confirmată." : "Programare refuzată.", "success");
    });
  }

  const eticheta = ETICHETE[stare];

  return (
    <li className={cn("bg-surface px-4 py-4", cerere.trecuta && "opacity-60")}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="text-sm font-medium text-foreground">{cerere.candScris}</span>
        <span className={cn("rounded-base px-2 py-0.5 text-xs font-medium", eticheta.clasa)}>
          {eticheta.text}
        </span>
      </div>

      <p className="mt-2 text-sm text-foreground">{cerere.nume}</p>

      {/*
        Datele de contact ca linkuri pe care se apasă: fără email automat, ăsta
        e chiar felul în care clientul răspunde omului. Un text de copiat de
        mână ar fi o piedică la fiecare cerere.
      */}
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <a href={`mailto:${cerere.email}`} className="underline hover:text-foreground">
          {cerere.email}
        </a>
        {cerere.telefon && (
          <a href={`tel:${cerere.telefon.replace(/\s/g, "")}`} className="underline hover:text-foreground">
            {cerere.telefon}
          </a>
        )}
        {cerere.serviciu && <span>{cerere.serviciu}</span>}
      </div>

      {cerere.note && (
        <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{cerere.note}</p>
      )}

      {stare === "ceruta" && !cerere.trecuta && (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={seLucreaza}
            onClick={() => raspunde("confirmata")}
            className="h-8 rounded-base bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Confirmă
          </button>
          <button
            type="button"
            disabled={seLucreaza}
            onClick={() => raspunde("refuzata")}
            className="h-8 rounded-base border border-border px-3 text-sm text-foreground hover:bg-surface-hover disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Refuză
          </button>
        </div>
      )}
    </li>
  );
}
