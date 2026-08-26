"use client";

import { useState, useTransition } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { InlineError } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast";
import { comutaBlogul } from "./actions";

/**
 * Comutatorul blogului. Se salvează pe loc: e o singură bifă cu efect mare, iar
 * o bară de salvare care așteaptă ar face neclar dacă site-ul s-a schimbat deja.
 */
export function ComutatorBlog({ activInitial }: { activInitial: boolean }) {
  const [activ, setActiv] = useState(activInitial);
  const [eroare, setEroare] = useState<string | null>(null);
  const [seSalveaza, porneste] = useTransition();
  const { show } = useToast();

  function comuta(urmator: boolean) {
    const precedent = activ;
    setActiv(urmator);
    setEroare(null);

    porneste(async () => {
      const rezultat = await comutaBlogul(urmator).catch(() => null);
      if (!rezultat || !rezultat.ok) {
        // Bifa se pune la loc: altfel ar arăta o stare pe care serverul n-a
        // acceptat-o, iar clientul ar crede că site-ul s-a schimbat.
        setActiv(precedent);
        setEroare(rezultat?.mesaj ?? "Nu am putut salva. Verifică legătura la internet.");
        return;
      }
      show(urmator ? "Blogul e acum pe site." : "Blogul a fost oprit.", "success");
    });
  }

  return (
    <Card>
      <CardHeader
        title="Blogul pe site"
        description="Pagina /blog, paginile articolelor și secțiunea „Articole recente” de pe prima pagină."
      />
      <CardBody>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={activ}
            disabled={seSalveaza}
            onChange={(eveniment) => comuta(eveniment.target.checked)}
            className="mt-0.5 size-4 accent-primary"
          />
          <span className="text-sm">
            <span className="font-medium text-foreground">Arată blogul pe site</span>
            <span className="mt-1 block text-muted-foreground">
              Oprit, dispare tot: pagina, articolele, secțiunea de pe prima pagină și
              „Blog” din meniu. Nimic nu se șterge — articolele rămân aici, scrise, și
              reapar întregi când îl pornești la loc.
            </span>
          </span>
        </label>

        {eroare && (
          <div className="mt-3">
            <InlineError>{eroare}</InlineError>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
