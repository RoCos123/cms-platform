"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SaveBar } from "@/components/ui/save-bar";
import { useToast } from "@/components/ui/toast";
import { CampuriSectiune } from "@/components/dashboard/campuri-sectiune";
import { CadruPrevizualizare } from "@/components/dashboard/cadru-previzualizare";
import { RenderSections, type SectionRow } from "@/components/site/render-sections";
import type { Articol } from "@/components/site/sections/latest-posts";
import { templateFontsHref, templateStyle, type SectionTone, type Template } from "@/lib/templates";
import type { MetaSectiune } from "@/lib/sectiuni";
import { catreStocare, valideaza, type ValoareEditor } from "@/lib/sectiuni-editare";
import { salveazaSectiune } from "../actions";

const LATIMI = [
  { eticheta: "Laptop", valoare: 1180 },
  { eticheta: "Telefon", valoare: 390 },
] as const;

export function EditorSectiune({
  id,
  meta,
  tone,
  valoareInitiala,
  template,
  articole,
}: {
  id: string;
  meta: MetaSectiune;
  tone: SectionTone;
  valoareInitiala: ValoareEditor;
  template: Template;
  articole: Articol[];
}) {
  const [valoare, setValoare] = useState(valoareInitiala);
  const [referinta, setReferinta] = useState(valoareInitiala);
  const [erori, setErori] = useState<Record<string, string>>({});
  const [seSalveaza, setSeSalveaza] = useState(false);
  const [eroare, setEroare] = useState<string | undefined>();
  const [latime, setLatime] = useState<number>(LATIMI[0].valoare);
  const { show } = useToast();

  const modificat = JSON.stringify(valoare) !== JSON.stringify(referinta);

  // Previzualizarea folosește exact componenta de pe site, cu datele din
  // formular trecute prin aceeași conversie ca la salvare. Dacă ar folosi
  // direct forma din editor, ar arăta altceva decât se salvează.
  const randPreviz: SectionRow = {
    id,
    key: meta.cheie,
    variant: null,
    tone,
    data: catreStocare(valoare, meta.campuri),
  };

  async function salveaza() {
    const gasite = valideaza(valoare, meta.campuri);
    setErori(gasite);

    if (Object.keys(gasite).length > 0) {
      setEroare("Mai lipsește ceva. Câmpurile cu probleme sunt marcate mai jos.");
      return;
    }

    setSeSalveaza(true);
    setEroare(undefined);

    const rezultat = await salveazaSectiune(id, catreStocare(valoare, meta.campuri));
    setSeSalveaza(false);

    if (!rezultat.ok) {
      setEroare(rezultat.mesaj);
      return;
    }

    setReferinta(valoare);
    show("Secțiunea a fost salvată.", "success");
  }

  return (
    <div className="pb-24">
      <div className="mb-6">
        <Link href="/dashboard/sectiuni" className="text-sm text-muted-foreground underline">
          ← Toate secțiunile
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">{meta.nume}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{meta.descriere}</p>

        {meta.continutDinAltaParte && (
          <p className="mt-3 max-w-2xl rounded-base border border-border bg-surface p-3 text-sm text-muted-foreground">
            {meta.continutDinAltaParte}
          </p>
        )}
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
        <CampuriSectiune
          campuri={meta.campuri}
          valoare={valoare}
          onChange={setValoare}
          erori={erori}
        />

        <div className="lg:sticky lg:top-6">
          <div className="mb-3 flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-foreground">Cum arată pe site</p>
            <div className="flex gap-1" role="group" aria-label="Lățimea previzualizării">
              {LATIMI.map((optiune) => (
                <Button
                  key={optiune.valoare}
                  size="sm"
                  variant={latime === optiune.valoare ? "secondary" : "ghost"}
                  aria-pressed={latime === optiune.valoare}
                  onClick={() => setLatime(optiune.valoare)}
                >
                  {optiune.eticheta}
                </Button>
              ))}
            </div>
          </div>

          <CadruPrevizualizare latime={latime} fonturi={templateFontsHref(template)}>
            <div
              style={{
                ...templateStyle(template),
                background: "var(--t-fundal)",
                color: "var(--t-text)",
                fontFamily: "var(--t-font-principal)",
              }}
            >
              <RenderSections rows={[randPreviz]} context={{ articole }} />
            </div>
          </CadruPrevizualizare>

          <p className="mt-2 text-xs text-muted-foreground">
            Se actualizează pe măsură ce scrii. Modificările ajung pe site abia după ce
            apeși Salvează.
          </p>
        </div>
      </div>

      <SaveBar
        isDirty={modificat}
        isSaving={seSalveaza}
        onSave={salveaza}
        onDiscard={() => {
          setValoare(referinta);
          setErori({});
          setEroare(undefined);
        }}
        error={eroare}
      />
    </div>
  );
}
