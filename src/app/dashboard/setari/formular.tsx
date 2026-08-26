"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { SaveBar } from "@/components/ui/save-bar";
import { useToast } from "@/components/ui/toast";
import { CampuriSectiune } from "@/components/dashboard/campuri-sectiune";
import { CAMPURI_CABINET, CAMPURI_SEO } from "@/lib/setari";
import { valideaza, type ValoareEditor } from "@/lib/sectiuni-editare";
import { salveazaSetari } from "./actions";

export function FormularSetari({
  cabinetInitial,
  seoInitial,
  domeniu,
}: {
  cabinetInitial: ValoareEditor;
  seoInitial: ValoareEditor;
  domeniu: string;
}) {
  const [cabinet, setCabinet] = useState(cabinetInitial);
  const [seo, setSeo] = useState(seoInitial);
  const [referinta, setReferinta] = useState({ cabinet: cabinetInitial, seo: seoInitial });
  const [erori, setErori] = useState<Record<string, string>>({});
  const [seSalveaza, setSeSalveaza] = useState(false);
  const [eroare, setEroare] = useState<string | undefined>();
  const { show } = useToast();

  const modificat =
    JSON.stringify({ cabinet, seo }) !== JSON.stringify(referinta);

  async function salveaza() {
    const gasite = { ...valideaza(cabinet, CAMPURI_CABINET), ...valideaza(seo, CAMPURI_SEO) };
    setErori(gasite);

    if (Object.keys(gasite).length > 0) {
      setEroare("Mai lipsește ceva. Câmpurile cu probleme sunt marcate mai jos.");
      return;
    }

    setSeSalveaza(true);
    setEroare(undefined);

    const rezultat = await salveazaSetari(cabinet, seo);
    setSeSalveaza(false);

    if (!rezultat.ok) {
      setEroare(rezultat.mesaj);
      if (rezultat.erori) setErori(rezultat.erori);
      return;
    }

    setReferinta({ cabinet, seo });
    show("Setările au fost salvate.", "success");
  }

  return (
    <div className="space-y-6 pb-24">
      <Card className="max-w-2xl">
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

      <Card className="max-w-2xl">
        <CardHeader
          title="Cum apare în Google"
          description="Textul pe care îl citește cineva care te caută, înainte să intre pe site."
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

      <Card className="max-w-2xl">
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

      <SaveBar
        isDirty={modificat}
        isSaving={seSalveaza}
        onSave={salveaza}
        onDiscard={() => {
          setCabinet(referinta.cabinet);
          setSeo(referinta.seo);
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
    <div className="mt-6 rounded-base border border-border bg-surface p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Aproximativ așa
      </p>
      <p className="text-xs text-muted-foreground">{domeniu}</p>
      <p className="mt-0.5 text-lg leading-snug text-primary">
        {titlu || "Numele tău"}
      </p>
      <p className="mt-1 text-sm leading-snug text-muted-foreground">
        {descriere || "Scrie o descriere ca să vezi cum arată aici."}
      </p>
    </div>
  );
}
