"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { SaveBar } from "@/components/ui/save-bar";
import { useToast } from "@/components/ui/toast";
import { CampuriSectiune } from "@/components/dashboard/campuri-sectiune";
import { PanouPrevizualizare } from "@/components/dashboard/panou-previzualizare";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import type { Template } from "@/lib/templates";
import { CAMPURI_CABINET, CAMPURI_SEO, CAMPURI_SOCIAL, linkurileSociale, type Social } from "@/lib/setari";
import { valideaza, type ValoareEditor } from "@/lib/sectiuni-editare";
import { salveazaSetari } from "./actions";

export function FormularSetari({
  cabinetInitial,
  seoInitial,
  socialInitial,
  domeniu,
  template,
}: {
  cabinetInitial: ValoareEditor;
  seoInitial: ValoareEditor;
  socialInitial: ValoareEditor;
  domeniu: string;
  template: Template;
}) {
  const [cabinet, setCabinet] = useState(cabinetInitial);
  const [seo, setSeo] = useState(seoInitial);
  const [social, setSocial] = useState(socialInitial);
  const [referinta, setReferinta] = useState({
    cabinet: cabinetInitial,
    seo: seoInitial,
    social: socialInitial,
  });
  const [erori, setErori] = useState<Record<string, string>>({});
  const [seSalveaza, setSeSalveaza] = useState(false);
  const [eroare, setEroare] = useState<string | undefined>();
  const { show } = useToast();

  const modificat = JSON.stringify({ cabinet, seo, social }) !== JSON.stringify(referinta);

  async function salveaza() {
    const gasite = {
      ...valideaza(cabinet, CAMPURI_CABINET),
      ...valideaza(seo, CAMPURI_SEO),
      ...valideaza(social, CAMPURI_SOCIAL),
    };
    setErori(gasite);

    if (Object.keys(gasite).length > 0) {
      setEroare("Mai lipsește ceva. Câmpurile cu probleme sunt marcate mai jos.");
      return;
    }

    setSeSalveaza(true);
    setEroare(undefined);

    const rezultat = await salveazaSetari(cabinet, seo, social);
    setSeSalveaza(false);

    if (!rezultat.ok) {
      setEroare(rezultat.mesaj);
      if (rezultat.erori) setErori(rezultat.erori);
      return;
    }

    setReferinta({ cabinet, seo, social });
    show("Setările au fost salvate.", "success");
  }

  const text = (cheie: string) => String(cabinet[cheie] ?? "").trim() || undefined;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 pb-24 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:gap-8">
      <div className="space-y-6">
      <Card>
        <CardHeader
          title="Datele cabinetului"
          description="Apar în antetul și în subsolul fiecărei pagini de pe site."
        />
        <CardBody>
          <CampuriSectiune
            campuri={CAMPURI_CABINET}
            valoare={cabinet}
            onChange={setCabinet}
            erori={erori}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Cum apari în căutările Google"
          description="Când cineva caută un psiholog, Google arată o listă. Aici scrii ce apare în dreptul site-ului tău."
        />
        <CardBody>
          <CampuriSectiune campuri={CAMPURI_SEO} valoare={seo} onChange={setSeo} erori={erori} />

          <PreviewGoogle
            titlu={String(seo.titlu ?? "") || String(cabinet.nume ?? "")}
            descriere={String(seo.descriere ?? "")}
            domeniu={domeniu}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Unde te mai găsesc"
          description="Profilurile tale de pe rețele. Apar ca linkuri în subsolul site-ului și îi spun lui Google că paginile acelea și site-ul sunt aceeași persoană."
        />
        <CardBody>
          <CampuriSectiune
            campuri={CAMPURI_SOCIAL}
            valoare={social}
            onChange={setSocial}
            erori={erori}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Adresa site-ului"
          description="Se schimbă doar de noi — o modificare aici înseamnă și mutarea domeniului."
        />
        <CardBody>
          <p className="text-sm text-foreground">{domeniu}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Dacă vrei alt domeniu, scrie-ne și îl mutăm împreună, ca site-ul să nu rămână
            nicio clipă inaccesibil.
          </p>
        </CardBody>
      </Card>

      </div>

      {/*
        Antetul și subsolul, exact componentele de pe site. Sunt singurul loc în
        care se vede ce fac datele astea: apar pe fiecare pagină, nu într-o
        secțiune anume, deci fără previzualizare clientul schimbă un telefon și
        nu are unde să verifice că a ieșit bine.
      */}
      <PanouPrevizualizare
        template={template}
        cheie={JSON.stringify({ cabinet, social })}
        titlu="Antetul și subsolul, pe orice pagină"
        nota="Se actualizează pe măsură ce scrii. Modificările ajung pe site abia după ce apeși Salvează."
      >
        <SiteHeader
          data={{
            nume: text("nume") ?? domeniu,
            subtitlu: text("subtitlu"),
            telefon: text("telefon"),
          }}
        />

        {/* Locul conținutului paginii: fără el, subsolul s-ar lipi de antet și
            n-ar mai fi limpede că între ele e restul site-ului. */}
        <div
          style={{
            display: "grid",
            placeItems: "center",
            paddingBlock: "56px",
            color: "var(--t-text-secundar)",
            fontSize: "14px",
          }}
        >
          conținutul paginii
        </div>

        <SiteFooter
          data={{
            nume: text("nume") ?? domeniu,
            descriere: text("descriereSubsol"),
            telefon: text("telefon"),
            email: text("email"),
            adresa: text("adresa"),
            acreditare: text("acreditare"),
            retele: linkurileSociale(social as Social),
          }}
        />
      </PanouPrevizualizare>

      <SaveBar
        isDirty={modificat}
        isSaving={seSalveaza}
        onSave={salveaza}
        onDiscard={() => {
          setCabinet(referinta.cabinet);
          setSeo(referinta.seo);
          setSocial(referinta.social);
          setErori({});
          setEroare(undefined);
        }}
        error={eroare}
      />
    </div>
  );
}

/**
 * Cum arată rezultatul în Google. Nu e o randare exactă — Google rescrie
 * oricând titlul dacă găsește ceva mai potrivit în pagină — dar arată lungimea,
 * care e lucrul pe care nimeni nu-l estimează corect din cap.
 */
function PreviewGoogle({
  titlu,
  descriere,
  domeniu,
}: {
  titlu: string;
  descriere: string;
  domeniu: string;
}) {
  return (
    <div className="mt-6">
      <p className="mb-2 text-sm font-medium text-foreground">
        Așa va arăta în lista de rezultate
      </p>

      <div className="rounded-base border border-border bg-surface p-4">
        <p className="text-xs text-muted-foreground">{domeniu}</p>
        <p className="mt-0.5 text-lg leading-snug text-primary">{titlu || "Numele tău"}</p>
        <p className="mt-1 text-sm leading-snug text-muted-foreground">
          {descriere || "Scrie o descriere ca să vezi cum arată aici."}
        </p>
      </div>

      {/*
        Spus explicit, ca să nu pară un defect al panoului mai târziu: Google
        chiar rescrie uneori titlul și descrierea, dacă găsește în pagină ceva ce
        i se pare mai potrivit pentru ce a căutat omul. Nu putem promite că ce
        scrie aici apare cuvânt cu cuvânt.
      */}
      <p className="mt-2 text-xs text-muted-foreground">
        Google alege uneori singur alt text, dacă găsește în pagină ceva mai potrivit
        pentru ce a căutat omul. De cele mai multe ori îl folosește pe al tău.
      </p>
    </div>
  );
}
