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
import type { PunctFocal } from "@/lib/punct-focal";
import {
  CAMPURI_SERVICIU,
  campuriServiciuPentru,
  rezumatServiciu,
  serviciiPentruPrevizualizare,
  type Serviciu,
} from "@/lib/servicii";
import { catreStocare, valideaza, type ValoareEditor } from "@/lib/sectiuni-editare";
import { textDimensiuni } from "@/lib/dimensiuni-poze";
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
  // `{ uploadId, url, altText, pozitie }`, iar blocul de serviciu cere adresa și
  // punctul focal. Fără `pozitie`, previzualizarea nu se mișca la tragerea pozei,
  // deși câmpul din stânga da (prins de proprietar, 3 oct. 2026) — ca la blog,
  // care îl trimite deja.
  const copertaPreview = (() => {
    const c = date.coperta as { url?: unknown; pozitie?: PunctFocal } | null | undefined;
    return typeof c?.url === "string" && c.url ? { url: c.url, pozitie: c.pozitie } : null;
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

  /*
    Rama în care tragi poza trebuie să fie EXACT rama din previzualizarea pe care
    o vezi — altfel tragi degeaba. `object-fit: cover` lasă poza să se miște doar
    pe axa pe care îi prisosește ceva, iar axa aia diferă de la o ramă la alta: la
    bannerul lat de pe pagina de servicii (16/7) se trage sus-jos, la cercul de
    pe prima pagină (doar Liniște, pătrat) se trage stânga-dreapta.
    Fără asta, rama rămânea pătrată și tragerea muta tocmai axa pe care cealaltă
    ramă n-o taie, deci previzualizarea nu se mișca (prins de proprietar, 3 oct.).

    Pe celelalte șabloane cartonașele de pe prima pagină sunt FĂRĂ poză (hotărât
    tot pe 3 oct.), deci singura ramă a pozei e bannerul de pe pagina de servicii
    — și rama rămâne aceea, oricare ar fi previzualizarea aleasă.
  */
  const raportCoperta =
    vedere === "primaPagina" && template.asezari.serviciiImagine ? "1 / 1" : "16 / 7";

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
          // Textele de ajutor potrivite șablonului (unde apare poza).
          campuri={campuriServiciuPentru(Boolean(template.asezari.serviciiImagine))}
          valoare={valoare}
          onChange={setValoare}
          erori={erori}
          // Serviciul are un singur câmp de imagine (coperta), deci rama din
          // previzualizarea aleasă, indiferent de drum.
          raportPentru={() => raportCoperta}
          // Poza e aceeași în ambele previzualizări, deci și textul: la șablonul cu
          // cerc pe prima pagină spune și ce se întâmplă cu cercul.
          dimensiuniPentru={() =>
            textDimensiuni(template.asezari.serviciiImagine ? "serviciuRotund" : "serviciuBanda")
          }
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
