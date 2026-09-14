"use client";

import { useState } from "react";
import Link from "next/link";
import { SaveBar } from "@/components/ui/save-bar";
import { useToast } from "@/components/ui/toast";
import { CampuriSectiune } from "@/components/dashboard/campuri-sectiune";
import { PanouPrevizualizare } from "@/components/dashboard/panou-previzualizare";
import type { OreDePrimaPagina } from "@/components/site/sections/programare";
import { RenderSections, type SectionRow } from "@/components/site/render-sections";
import type { ArticolListat } from "@/lib/blog";
import type { Serviciu } from "@/lib/servicii";
import type { SectionTone, Template } from "@/lib/templates";
import type { MetaSectiune } from "@/lib/sectiuni";
import type { Destinatie } from "@/lib/destinatii";
import type { OptiuneDocument } from "@/lib/uploads";
import { catreStocare, valideaza, type ValoareEditor } from "@/lib/sectiuni-editare";
import { salveazaSectiune } from "../actions";

export function EditorSectiune({
  id,
  meta,
  tone,
  variant,
  valoareInitiala,
  template,
  articole,
  servicii,
  paginaServiciiActiva,
  oreProgramare,
  destinatii,
  documente,
}: {
  id: string;
  meta: MetaSectiune;
  tone: SectionTone;
  /**
   * Așezarea aleasă pentru rândul ăsta. Trebuie să ajungă până aici, altfel
   * previzualizarea desenează varianta obișnuită și clientul vede în panou
   * altceva decât are pe site — exact minciuna pe care ecranul ăsta există ca
   * s-o prevină.
   */
  variant: string | null;
  valoareInitiala: ValoareEditor;
  template: Template;
  articole: ArticolListat[];
  servicii: Serviciu[];
  paginaServiciiActiva: boolean;
  oreProgramare: OreDePrimaPagina;
  /** Unde poate duce un buton din secțiune: alte secțiuni de pe pagină, pagini. */
  destinatii: Destinatie[];
  /** Documentele din bibliotecă, pentru materialele de sub un program. */
  documente: OptiuneDocument[];
}) {
  const [valoare, setValoare] = useState(valoareInitiala);
  const [referinta, setReferinta] = useState(valoareInitiala);
  const [erori, setErori] = useState<Record<string, string>>({});
  const [seSalveaza, setSeSalveaza] = useState(false);
  const [eroare, setEroare] = useState<string | undefined>();
  const { show } = useToast();

  const modificat = JSON.stringify(valoare) !== JSON.stringify(referinta);

  // Previzualizarea folosește exact componenta de pe site, cu datele din
  // formular trecute prin aceeași conversie ca la salvare. Dacă ar folosi
  // direct forma din editor, ar arăta altceva decât se salvează.
  const datePreviz = catreStocare(valoare, meta.campuri);

  const randPreviz: SectionRow = {
    id,
    key: meta.cheie,
    variant,
    tone,
    data: datePreviz,
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

      {/*
        `minmax(0, 1fr)` și pe o singură coloană, nu doar pe două.
        Fără el, coloana se lățea până la lățimea reală a ferestrei simulate
        (1180px), fiindcă asta e mărimea conținutului ei. Previzualizarea își
        calculează micșorarea din lățimea coloanei — deci coloana rămânea largă,
        micșorarea ieșea 1, iar previzualizarea ieșea din ecran. `minmax(0, …)`
        îi spune coloanei că are voie să fie mai îngustă decât ce conține.
      */}
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:gap-8">
        <CampuriSectiune
          campuri={meta.campuri}
          valoare={valoare}
          onChange={setValoare}
          erori={erori}
          destinatii={destinatii}
          documente={documente}
        />

        <PanouPrevizualizare
          template={template}
          cheie={JSON.stringify(datePreviz)}
          nota="Se actualizează pe măsură ce scrii. Modificările ajung pe site abia după ce apeși Salvează."
        >
          <RenderSections rows={[randPreviz]} context={{ articole, servicii, paginaServiciiActiva, oreProgramare, asezari: template.asezari }} />
        </PanouPrevizualizare>
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
