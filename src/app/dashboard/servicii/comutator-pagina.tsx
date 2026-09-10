"use client";

import { useState, useTransition } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { InlineError } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast";
import { comutaPaginaServicii } from "./actions";

/**
 * Comutatorul paginii de servicii.
 *
 * Se salvează pe loc, nu cu bara de jos. E o singură bifă cu efect mare — o
 * pagină apare sau dispare de pe site — iar amestecul cu ordinea serviciilor,
 * care se salvează împreună, ar fi făcut neclar ce anume așteaptă salvarea.
 */
export function ComutatorPaginaServicii({ activaInitial }: { activaInitial: boolean }) {
  const [activa, setActiva] = useState(activaInitial);
  const [eroare, setEroare] = useState<string | null>(null);
  const [seSalveaza, porneste] = useTransition();
  const { show } = useToast();

  function comuta(urmatoarea: boolean) {
    const precedenta = activa;
    setActiva(urmatoarea);
    setEroare(null);

    porneste(async () => {
      const rezultat = await comutaPaginaServicii(urmatoarea);
      if (!rezultat.ok) {
        // Bifa se pune la loc: altfel ar arăta o stare pe care serverul n-a
        // acceptat-o, iar clientul ar crede că site-ul s-a schimbat.
        setActiva(precedenta);
        setEroare(rezultat.mesaj);
        return;
      }
      show(
        urmatoarea
          ? "Pagina de servicii e acum pe site."
          : "Pagina de servicii a fost oprită.",
        "success",
      );
    });
  }

  return (
    <Card>
      <CardHeader
        title="Pagina cu serviciile descrise pe larg"
        description="O pagină separată, la adresa /servicii, unde fiecare serviciu are descrierea completă."
      />
      <CardBody>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={activa}
            disabled={seSalveaza}
            onChange={(eveniment) => comuta(eveniment.target.checked)}
            className="mt-0.5 size-4 accent-primary"
          />
          <span className="text-sm">
            <span className="font-medium text-foreground">Arată pagina pe site</span>
            <span className="mt-1 block text-muted-foreground">
              Oprită, cartonașele de pe prima pagină rămân, dar fără „Află mai multe” —
              serviciile se văd doar pe cartonaș (numele și primul rând al descrierii).
              Descrierea întreagă nu se pierde, doar n-are unde să apară.
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
