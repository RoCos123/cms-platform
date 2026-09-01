"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { schimbaPublicarea } from "./actions";

/**
 * Comutatorul de lansare, așa cum îl vede clientul.
 *
 * Stă în capul paginii de Setări, nu jos și nu într-un meniu: e singurul buton
 * din tot panoul după care se schimbă cine vede site-ul. Cât timp nu e apăsat,
 * clientul poate scrie liniștit — nimeni din afară nu vede nimic.
 *
 * Retragerea nu cere confirmare, dar publicarea nici atât: amândouă se pot da
 * înapoi cu aceeași apăsare, imediat, iar o fereastră de „ești sigur?” peste o
 * acțiune reversibilă nu adaugă siguranță, doar un pas.
 */
export function ComutatorPublicare({
  publicat,
  domeniu,
  politicaEsteCiorna,
}: {
  publicat: boolean;
  domeniu: string;
  politicaEsteCiorna: boolean;
}) {
  const [seLucreaza, porneste] = useTransition();
  const [eroare, setEroare] = useState<string | null>(null);

  function comuta() {
    setEroare(null);
    porneste(async () => {
      const rezultat = await schimbaPublicarea(!publicat);
      if (!rezultat.ok) setEroare(rezultat.mesaj);
    });
  }

  return (
    <Card>
      <CardHeader
        title={publicat ? "Site-ul e publicat" : "Site-ul nu e încă publicat"}
        description={
          publicat
            ? `Oricine intră pe ${domeniu} vede site-ul.`
            : `Deocamdată îl vezi doar tu. Cine intră pe ${domeniu} vede o pagină scurtă, care spune că site-ul se pregătește.`
        }
      />
      <CardBody className="space-y-4">
        {!publicat && politicaEsteCiorna && (
          /*
            Avertisment, nu piedică. Legea îi cere CLIENTULUI politica de
            confidențialitate înainte să strângă date prin formulare — dar
            hotărârea când publică rămâne a lui, nu a panoului. Un buton care
            refuză fără să explice ar fi trimis omul la telefon.
          */
          <p className="rounded-base bg-warning-surface px-3 py-2 text-sm text-warning">
            Politica de confidențialitate e încă ciornă. Formularele de pe site
            strâng nume și numere de telefon, iar legea cere ca pagina asta să fie
            publicată înainte. O găsești în <strong>Pagini</strong>.
          </p>
        )}

        {eroare && <p className="text-sm text-danger">{eroare}</p>}

        <Button
          onClick={comuta}
          disabled={seLucreaza}
          variant={publicat ? "secondary" : "primary"}
        >
          {seLucreaza
            ? "Se salvează…"
            : publicat
              ? "Retrage site-ul de pe internet"
              : "Publică site-ul"}
        </Button>
      </CardBody>
    </Card>
  );
}
