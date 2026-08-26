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
import { ArticolComplet } from "@/components/site/sections/articol-complet";
import type { Template } from "@/lib/templates";
import { CAMPURI_ARTICOL } from "@/lib/blog";
import { catreStocare, valideaza, type ValoareEditor } from "@/lib/sectiuni-editare";
import { comutaPublicareaArticolului, salveazaArticol } from "../actions";

export function EditorArticol({
  id,
  valoareInitiala,
  publicat: publicatInitial,
  publicatLa,
  template,
}: {
  id: string;
  valoareInitiala: ValoareEditor;
  publicat: boolean;
  publicatLa: string | null;
  template: Template;
}) {
  const [valoare, setValoare] = useState(valoareInitiala);
  const [referinta, setReferinta] = useState(valoareInitiala);
  const [erori, setErori] = useState<Record<string, string>>({});
  const [seSalveaza, setSeSalveaza] = useState(false);
  const [eroare, setEroare] = useState<string | undefined>();
  const [publicat, setPublicat] = useState(publicatInitial);
  const [seComuta, porneste] = useTransition();
  const { show } = useToast();

  const modificat = JSON.stringify(valoare) !== JSON.stringify(referinta);
  const date = catreStocare(valoare, CAMPURI_ARTICOL);
  const coperta = date.coperta as { url?: string; altText?: string } | undefined;
  const slug = String(date.slug ?? "");

  async function salveaza() {
    const gasite = valideaza(valoare, CAMPURI_ARTICOL);
    setErori(gasite);

    if (Object.keys(gasite).length > 0) {
      setEroare("Mai lipsește ceva. Câmpurile cu probleme sunt marcate mai jos.");
      return;
    }

    setSeSalveaza(true);
    setEroare(undefined);

    const rezultat = await salveazaArticol(id, valoare);
    setSeSalveaza(false);

    if (!rezultat.ok) {
      setEroare(rezultat.mesaj);
      if (rezultat.erori) setErori(rezultat.erori);
      return;
    }

    setReferinta(valoare);
    show("Articolul a fost salvat.", "success");
  }

  function comutaPublicarea() {
    const urmator = !publicat;
    setPublicat(urmator);

    porneste(async () => {
      const rezultat = await comutaPublicareaArticolului(id, urmator).catch(() => null);
      if (!rezultat || !rezultat.ok) {
        setPublicat(!urmator);
        setEroare(rezultat?.mesaj ?? "Nu am putut salva. Verifică legătura la internet.");
        return;
      }
      show(urmator ? "Articolul e acum pe site." : "Articolul a fost retras de pe site.", "success");
    });
  }

  return (
    <div className="pb-24">
      <div className="mb-6">
        <Link href="/dashboard/blog" className="text-sm text-muted-foreground underline">
          ← Toate articolele
        </Link>

        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {String(valoare.title ?? "") || "Articol"}
            </h1>
            <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <StatusBadge status={publicat ? "published" : publicatLa ? "unpublished" : "draft"} />
              {publicat ? "Oricine îl poate citi." : "Doar tu îl vezi."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {publicat && slug && (
              <LinkVeziPeSite href={`/blog/${slug}`} eticheta="Vezi articolul pe site" />
            )}
            <Button
              variant={publicat ? "secondary" : "primary"}
              // Publicarea trimite pe site ce e SALVAT, nu ce e pe ecran. Cu
              // modificări nesalvate, apăsarea ar publica varianta veche — iar
              // clientul ar jura că a publicat ce tocmai scrisese.
              disabled={modificat || seComuta}
              onClick={comutaPublicarea}
            >
              {publicat ? "Retrage de pe site" : "Publică"}
            </Button>
          </div>
        </div>

        {modificat && (
          <p className="mt-2 text-xs text-muted-foreground">
            Salvează întâi, apoi poți {publicat ? "retrage" : "publica"}.
          </p>
        )}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:gap-8">
        <CampuriSectiune
          campuri={CAMPURI_ARTICOL}
          valoare={valoare}
          onChange={setValoare}
          erori={erori}
        />

        <PanouPrevizualizare
          template={template}
          cheie={JSON.stringify(date)}
          titlu="Cum arată pagina articolului"
          nota="Se actualizează pe măsură ce scrii. Modificările ajung pe site abia după ce apeși Salvează."
        >
          <ArticolComplet
            articol={{
              id,
              slug,
              titlu: String(date.title ?? "") || "Titlul articolului",
              extras: String(date.excerpt ?? ""),
              continut: String(date.content ?? ""),
              publicatLa,
              coperta: coperta?.url ? { url: coperta.url, altText: coperta.altText ?? "" } : null,
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
