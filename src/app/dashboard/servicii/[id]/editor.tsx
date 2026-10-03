"use client";

import { useState } from "react";
import Link from "next/link";
import { SaveBar } from "@/components/ui/save-bar";
import { useToast } from "@/components/ui/toast";
import { CampuriSectiune } from "@/components/dashboard/campuri-sectiune";
import { PanouPrevizualizare } from "@/components/dashboard/panou-previzualizare";
import { LinkVeziPeSite } from "@/components/dashboard/link-vezi-pe-site";
import { BlocServiciu } from "@/components/site/sections/servicii-detaliate";
import { Section } from "@/components/site/section";
import { Features, type FeaturesData } from "@/components/site/sections/features";
import { Button } from "@/components/ui/button";
import type { SectionTone, Template } from "@/lib/templates";
import {
  CAMPURI_SERVICIU,
  rezumatServiciu,
  serviciiPentruPrevizualizare,
  type Serviciu,
} from "@/lib/servicii";
import { catreStocare, valideaza, type ValoareEditor } from "@/lib/sectiuni-editare";
import { salveazaServiciu } from "../actions";

export function EditorServiciu({
  id,
  valoareInitiala,
  template,
  hrefPeSite,
  primaPagina,
}: {
  id: string;
  valoareInitiala: ValoareEditor;
  template: Template;
  /** Adresa serviciului pe site, calculată din starea salvată. `null` la ciornă. */
  hrefPeSite?: string | null;
  /** Ce trebuie ca să se arate secțiunea „Serviciile mele" exact ca pe prima pagină. */
  primaPagina: {
    sectiune: { variant: string | null; tone: SectionTone; data: unknown; vizibila: boolean } | null;
    servicii: Serviciu[];
    paginaServiciiActiva: boolean;
  };
}) {
  const [valoare, setValoare] = useState(valoareInitiala);
  /*
    Previzualizarea arată implicit PRIMA PAGINĂ: acolo se taie textul, deci acolo
    trebuie să vadă clientul cât încape cât scrie (cerut pe 3 oct. 2026). Pagina
    de servicii, cu descrierea întreagă, e la un clic.
  */
  const [vedere, setVedere] = useState<"primaPagina" | "paginaServicii">("primaPagina");
  const [referinta, setReferinta] = useState(valoareInitiala);
  const [erori, setErori] = useState<Record<string, string>>({});
  const [seSalveaza, setSeSalveaza] = useState(false);
  const [eroare, setEroare] = useState<string | undefined>();
  const { show } = useToast();

  const modificat = JSON.stringify(valoare) !== JSON.stringify(referinta);
  const date = catreStocare(valoare, CAMPURI_SERVICIU);

  // Coperta, ca s-o arate previzualizarea: câmpul de imagine o ține ca
  // `{ uploadId, url, altText }`, iar blocul de serviciu cere doar adresa.
  const copertaPreview = (() => {
    const c = date.coperta as { url?: unknown } | null | undefined;
    return typeof c?.url === "string" && c.url ? { url: c.url } : null;
  })();

  const serviciuPreview: Serviciu = {
    id,
    slug: String(date.slug ?? ""),
    titlu: String(date.title ?? "") || "Numele serviciului",
    descriereScurta: rezumatServiciu(String(date.content ?? "")),
    descriereCompleta: String(date.content ?? ""),
    pret: String(date.price_label ?? "") || null,
    durata: String(date.duration_label ?? "") || null,
    coperta: copertaPreview,
  };

  const dateSectiune = (primaPagina.sectiune?.data ?? { titlu: "Serviciile mele" }) as FeaturesData;
  // „Câte se văd" contează doar cu pagina de servicii pornită — exact ca în `Features`.
  const numar = primaPagina.paginaServiciiActiva ? dateSectiune.numar : undefined;
  const { servicii: serviciiPrimaPagina, motiv } = serviciiPentruPrevizualizare(
    primaPagina.servicii,
    serviciuPreview,
    numar,
  );

  // De ce cartonașul din previzualizare NU e acum pe prima pagină, dacă nu e.
  const avertisment = !primaPagina.sectiune?.vizibila
    ? "Secțiunea „Serviciile mele” e ascunsă acum, deci pe prima pagină nu se vede niciun cartonaș."
    : motiv === "ciorna"
      ? "Serviciul nu e publicat încă: așa va arăta cartonașul după ce îl publici."
      : motiv === "dincoloDeNumar"
        ? `Pe prima pagină se văd doar primele ${numar} servicii, iar acesta nu e printre ele. Așa ar arăta cartonașul lui.`
        : null;

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
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/dashboard/servicii" className="text-sm text-muted-foreground underline">
            ← Toate serviciile
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">
            {String(valoare.title ?? "") || "Serviciu"}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Pe cartonașul din prima pagină apar numele și începutul descrierii, cât încape;
            descrierea întreagă, pe pagina de servicii. Le vezi pe amândouă în dreapta.
          </p>
        </div>

        {/* Doar când serviciul e publicat (altfel n-are ce vedea pe site). */}
        {hrefPeSite && <LinkVeziPeSite href={hrefPeSite} eticheta="Vezi serviciul pe site" />}
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
          cheie={JSON.stringify(date) + vedere}
          titlu={
            <div className="flex gap-1" role="group" aria-label="Ce pagină arată previzualizarea">
              <Button
                size="sm"
                variant={vedere === "primaPagina" ? "secondary" : "ghost"}
                aria-pressed={vedere === "primaPagina"}
                onClick={() => setVedere("primaPagina")}
              >
                Prima pagină
              </Button>
              <Button
                size="sm"
                variant={vedere === "paginaServicii" ? "secondary" : "ghost"}
                aria-pressed={vedere === "paginaServicii"}
                onClick={() => setVedere("paginaServicii")}
              >
                Pagina de servicii
              </Button>
            </div>
          }
          nota={
            <>
              {vedere === "primaPagina" &&
                "Cartonașul arată doar cât încape din descriere; textul care nu încape se termină în „…”. "}
              {vedere === "primaPagina" && avertisment && (
                <span className="block font-medium text-foreground">{avertisment}</span>
              )}
              Se actualizează pe măsură ce scrii. Modificările ajung pe site abia după ce apeși Salvează.
            </>
          }
        >
          {vedere === "primaPagina" ? (
            <Features
              data={dateSectiune}
              servicii={serviciiPrimaPagina}
              paginaDetaliata={primaPagina.paginaServiciiActiva}
              variant={primaPagina.sectiune?.variant}
              tone={primaPagina.sectiune?.tone}
              friendly={template.asezari.serviciiFriendly}
              imagine={template.asezari.serviciiImagine}
            />
          ) : (
            <Section tone="deschis">
              <BlocServiciu serviciu={serviciuPreview} />
            </Section>
          )}
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
