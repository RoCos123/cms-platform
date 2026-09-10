"use client";

import { useState } from "react";
import Link from "next/link";
import { SaveBar } from "@/components/ui/save-bar";
import { useToast } from "@/components/ui/toast";
import { CampuriSectiune } from "@/components/dashboard/campuri-sectiune";
import { PanouPrevizualizare } from "@/components/dashboard/panou-previzualizare";
import { BlocServiciu } from "@/components/site/sections/servicii-detaliate";
import { Section } from "@/components/site/section";
import type { Template } from "@/lib/templates";
import { CAMPURI_SERVICIU, rezumatServiciu } from "@/lib/servicii";
import { catreStocare, valideaza, type ValoareEditor } from "@/lib/sectiuni-editare";
import { salveazaServiciu } from "../actions";

export function EditorServiciu({
  id,
  valoareInitiala,
  template,
}: {
  id: string;
  valoareInitiala: ValoareEditor;
  template: Template;
}) {
  const [valoare, setValoare] = useState(valoareInitiala);
  const [referinta, setReferinta] = useState(valoareInitiala);
  const [erori, setErori] = useState<Record<string, string>>({});
  const [seSalveaza, setSeSalveaza] = useState(false);
  const [eroare, setEroare] = useState<string | undefined>();
  const { show } = useToast();

  const modificat = JSON.stringify(valoare) !== JSON.stringify(referinta);
  const date = catreStocare(valoare, CAMPURI_SERVICIU);

  async function salveaza() {
    const gasite = valideaza(valoare, CAMPURI_SERVICIU);
    setErori(gasite);

    if (Object.keys(gasite).length > 0) {
      setEroare("Mai lipsește ceva. Câmpurile cu probleme sunt marcate mai jos.");
      return;
    }

    setSeSalveaza(true);
    setEroare(undefined);

    const rezultat = await salveazaServiciu(id, valoare);
    setSeSalveaza(false);

    if (!rezultat.ok) {
      setEroare(rezultat.mesaj);
      if (rezultat.erori) setErori(rezultat.erori);
      return;
    }

    setReferinta(valoare);
    show("Serviciul a fost salvat.", "success");
  }

  return (
    <div className="pb-24">
      <div className="mb-6">
        <Link href="/dashboard/servicii" className="text-sm text-muted-foreground underline">
          ← Toate serviciile
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">
          {String(valoare.title ?? "") || "Serviciu"}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Se vede pe pagina de servicii, iar pe cartonașul din prima pagină apar numele și
          primul rând al descrierii.
        </p>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:gap-8">
        <CampuriSectiune
          campuri={CAMPURI_SERVICIU}
          valoare={valoare}
          onChange={setValoare}
          erori={erori}
        />

        <PanouPrevizualizare
          template={template}
          cheie={JSON.stringify(date)}
          titlu="Cum arată pe pagina de servicii"
          nota="Se actualizează pe măsură ce scrii. Modificările ajung pe site abia după ce apeși Salvează."
        >
          <Section tone="deschis">
            <BlocServiciu
              serviciu={{
                id,
                slug: String(date.slug ?? ""),
                titlu: String(date.title ?? "") || "Numele serviciului",
                descriereScurta: rezumatServiciu(String(date.content ?? "")),
                descriereCompleta: String(date.content ?? ""),
                pret: String(date.price_label ?? "") || null,
                durata: String(date.duration_label ?? "") || null,
              }}
            />
          </Section>
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
