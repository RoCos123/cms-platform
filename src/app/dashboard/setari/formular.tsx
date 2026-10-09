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
import {
  CAMPURI_CABINET,
  CAMPURI_FIRMA,
  CAMPURI_SEO,
  CAMPURI_SOCIAL,
  linkurileSociale,
  type Social,
} from "@/lib/setari";
import { TEXTE_VANZARE, dateleFirmei, rindulLegal } from "@/lib/pagina-vanzare";
import { valideaza, type ValoareEditor } from "@/lib/sectiuni-editare";
import { salveazaSetari } from "./actions";

export function FormularSetari({
  cabinetInitial,
  seoInitial,
  socialInitial,
  firmaInitial,
  domeniu,
  template,
}: {
  cabinetInitial: ValoareEditor;
  seoInitial: ValoareEditor;
  socialInitial: ValoareEditor;
  /** Doar pe pagina de vânzare: „Datele firmei". Lipsă = grupul nu există. */
  firmaInitial?: ValoareEditor;
  domeniu: string;
  template: Template;
}) {
  const [cabinet, setCabinet] = useState(cabinetInitial);
  const [seo, setSeo] = useState(seoInitial);
  const [social, setSocial] = useState(socialInitial);
  const [firma, setFirma] = useState(firmaInitial);
  const [referinta, setReferinta] = useState({
    cabinet: cabinetInitial,
    seo: seoInitial,
    social: socialInitial,
    firma: firmaInitial,
  });
  const [erori, setErori] = useState<Record<string, string>>({});
  const [seSalveaza, setSeSalveaza] = useState(false);
  const [eroare, setEroare] = useState<string | undefined>();
  const { show } = useToast();

  const modificat = JSON.stringify({ cabinet, seo, social, firma }) !== JSON.stringify(referinta);

  async function salveaza() {
    const gasite = {
      ...valideaza(cabinet, CAMPURI_CABINET),
      ...valideaza(seo, CAMPURI_SEO),
      ...valideaza(social, CAMPURI_SOCIAL),
      ...(firma ? valideaza(firma, CAMPURI_FIRMA) : {}),
    };
    setErori(gasite);

    if (Object.keys(gasite).length > 0) {
      setEroare("Mai lipsește ceva. Câmpurile cu probleme sunt marcate mai jos.");
      return;
    }

    setSeSalveaza(true);
    setEroare(undefined);

    const rezultat = await salveazaSetari(cabinet, seo, social, firma);
    setSeSalveaza(false);

    if (!rezultat.ok) {
      setEroare(rezultat.mesaj);
      if (rezultat.erori) setErori(rezultat.erori);
      return;
    }

    setReferinta({ cabinet, seo, social, firma });
    show("Setările au fost salvate.", "success");
  }

  const text = (cheie: string) => String(cabinet[cheie] ?? "").trim() || undefined;

  // Logoul e o imagine, nu un text: în editor stă ca obiect cu adresa deja
  // semnată (`url`), nu ca un șir. De aceea nu trece prin `text()` de mai sus —
  // îl citim ca obiect și-l dăm antetului și subsolului doar dacă are o adresă.
  const logoStocat = cabinet.logo as { url?: string; altText?: string } | undefined;
  const logoSemnat = logoStocat?.url
    ? { url: logoStocat.url, altText: logoStocat.altText }
    : undefined;

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

      {firma && (
        <Card>
          <CardHeader
            title="Datele firmei"
            description="Doar pe acest site. Denumirea, CUI-ul, Registrul Comerțului și sediul apar pe rândul de jos din subsol, iar TVA-ul sub preț. Telefonul, WhatsApp-ul și emailul de lângă formularul de contact se iau din „Datele cabinetului”, de mai sus. Un câmp gol nu apare nicăieri."
          />
          <CardBody>
            <CampuriSectiune campuri={CAMPURI_FIRMA} valoare={firma} onChange={setFirma} erori={erori} />
          </CardBody>
        </Card>
      )}

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
        cheie={JSON.stringify({ cabinet, social, firma })}
        titlu="Antetul și subsolul, pe orice pagină"
        nota="Se actualizează pe măsură ce scrii. Coloanele Servicii și Cabinet se umplu singure din serviciile și secțiunile site-ului — aici le arătăm cu câteva exemple, doar ca să se vadă așezarea. Modificările ajung pe site abia după ce apeși Salvează."
      >
        <SiteHeader
          data={{
            nume: text("nume") ?? domeniu,
            subtitlu: text("subtitlu"),
            logo: logoSemnat,
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
            logo: logoSemnat,
            subtitlu: text("subtitlu"),
            descriere: text("descriereSubsol"),
            telefon: text("telefon"),
            email: text("email"),
            adresa: text("adresa"),
            acreditare: text("acreditare"),
            servicii: SERVICII_EXEMPLU,
            cabinet: CABINET_EXEMPLU,
            retele: linkurileSociale(social as Social),
            // Pagina de vânzare: o singură listă în loc de coloane și rândul legal
            // al firmei, ca pe site.
            ...(firma && {
              navigare: { linkuri: NAVIGARE_EXEMPLU_VANZARE, eticheta: TEXTE_VANZARE.subsol.navigare },
              titluContact: TEXTE_VANZARE.subsol.contact,
              rindLegal: rindulLegal(dateleFirmei(firma)),
            }),
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
          setFirma(referinta.firma);
          setErori({});
          setEroare(undefined);
        }}
        error={eroare}
      />
    </div>
  );
}

/*
 * Coloanele Servicii și Cabinet ale subsolului nu se scriu din setări — pe site
 * se umplu singure din serviciile publicate și din secțiunile vizibile. Aici,
 * în previzualizare, n-avem de unde le lua, așa că punem câteva exemple, doar
 * ca omul să vadă că subsolul are patru coloane, nu două. Adresele sunt „#":
 * previzualizarea nu navighează nicăieri.
 */
const SERVICII_EXEMPLU = [
  { eticheta: "Toate serviciile", href: "#" },
  { eticheta: "Terapie individuală", href: "#" },
  { eticheta: "Terapie de cuplu", href: "#" },
];

const CABINET_EXEMPLU = [
  { eticheta: "Despre mine", href: "#" },
  { eticheta: "Blog", href: "#" },
  { eticheta: "Contact", href: "#" },
];

/** Pagina de vânzare n-are coloane în subsol, ci lista din bară; câteva intrări, ca exemplu. */
const NAVIGARE_EXEMPLU_VANZARE = [
  { eticheta: TEXTE_VANZARE.meniu.modele, href: "#" },
  { eticheta: TEXTE_VANZARE.meniu.servicii, href: "#" },
  { eticheta: TEXTE_VANZARE.meniu.contact, href: "#" },
];

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
