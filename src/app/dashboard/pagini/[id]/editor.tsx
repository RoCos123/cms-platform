"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { SaveBar } from "@/components/ui/save-bar";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast";
import { CampuriSectiune } from "@/components/dashboard/campuri-sectiune";
import { PanouPrevizualizare } from "@/components/dashboard/panou-previzualizare";
import { LinkVeziPeSite } from "@/components/dashboard/link-vezi-pe-site";
import { PaginaText } from "@/components/site/sections/pagina-text";
import type { Template } from "@/lib/templates";
import { CAMPURI_PAGINA } from "@/lib/pagini";
import { catreStocare, valideaza, type ValoareEditor } from "@/lib/sectiuni-editare";
import { comutaPublicareaPaginii, salveazaPagina } from "../actions";

export function EditorPagina({
  id,
  valoareInitiala,
  publicata: publicataInitial,
  aFostPublicata,
  template,
}: {
  id: string;
  valoareInitiala: ValoareEditor;
  publicata: boolean;
  /** A fost vreodată pe site? Decide dacă starea neactivă e „Ciornă" sau „Retrasă". */
  aFostPublicata: boolean;
  template: Template;
}) {
  const [valoare, setValoare] = useState(valoareInitiala);
  const [referinta, setReferinta] = useState(valoareInitiala);
  const [erori, setErori] = useState<Record<string, string>>({});
  const [seSalveaza, setSeSalveaza] = useState(false);
  const [eroare, setEroare] = useState<string | undefined>();
  const [publicata, setPublicata] = useState(publicataInitial);
  const [seComuta, porneste] = useTransition();
  const { show } = useToast();

  const modificat = JSON.stringify(valoare) !== JSON.stringify(referinta);
  const date = catreStocare(valoare, CAMPURI_PAGINA);
  const slug = String(date.slug ?? "");

  async function salveaza() {
    const gasite = valideaza(valoare, CAMPURI_PAGINA);
    setErori(gasite);

    if (Object.keys(gasite).length > 0) {
      setEroare("Mai lipsește ceva. Câmpurile cu probleme sunt marcate mai jos.");
      return;
    }

    setSeSalveaza(true);
    setEroare(undefined);

    const rezultat = await salveazaPagina(id, valoare);
    setSeSalveaza(false);

    if (!rezultat.ok) {
      setEroare(rezultat.mesaj);
      if (rezultat.erori) setErori(rezultat.erori);
      return;
    }

    setReferinta(valoare);
    show("Pagina a fost salvată.", "success");
  }

  function comutaPublicarea() {
    const urmatoare = !publicata;
    setPublicata(urmatoare);

    porneste(async () => {
      const rezultat = await comutaPublicareaPaginii(id, urmatoare).catch(() => null);
      if (!rezultat || !rezultat.ok) {
        setPublicata(!urmatoare);
        setEroare(rezultat?.mesaj ?? "Nu am putut salva. Verifică legătura la internet.");
        return;
      }
      show(urmatoare ? "Pagina e acum pe site." : "Pagina a fost retrasă de pe site.", "success");
    });
  }

  return (
    <div className="pb-24">
      <div className="mb-6">
        <Link href="/dashboard/pagini" className="text-sm text-muted-foreground underline">
          ← Toate paginile
        </Link>

        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {String(valoare.title ?? "") || "Pagină"}
            </h1>
            <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <StatusBadge
                status={publicata ? "published" : aFostPublicata ? "unpublished" : "draft"}
              />
              {publicata ? `Se vede la /${slug}` : "Doar tu o vezi."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {publicata && slug && (
              <LinkVeziPeSite href={`/${slug}`} eticheta="Vezi pagina pe site" />
            )}
            <Button
              variant={publicata ? "secondary" : "primary"}
              // Publicarea trimite pe site ce e SALVAT, nu ce e pe ecran. Cu
              // modificări nesalvate, apăsarea ar publica varianta veche.
              disabled={modificat || seComuta}
              onClick={comutaPublicarea}
            >
              {publicata ? "Retrage de pe site" : "Publică"}
            </Button>
          </div>
        </div>

        {modificat && (
          <p className="mt-2 text-xs text-muted-foreground">
            Salvează întâi, apoi poți {publicata ? "retrage" : "publica"}.
          </p>
        )}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:gap-8">
        <CampuriSectiune
          campuri={CAMPURI_PAGINA}
          valoare={valoare}
          onChange={setValoare}
          erori={erori}
        />

        <PanouPrevizualizare
          template={template}
          cheie={JSON.stringify(date)}
          titlu="Cum arată pagina"
          nota="Se actualizează pe măsură ce scrii. Modificările ajung pe site abia după ce apeși Salvează."
        >
          <PaginaText
            pagina={{
              titlu: String(date.title ?? "") || "Titlul paginii",
              continut: String(date.content ?? ""),
            }}
          />
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
