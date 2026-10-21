"use client";

import { useState, useTransition } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { InlineError } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast";
import { comutaLimbile } from "./actions";

/**
 * Bifa care pune pe site alegerea limbii (bulina cu steag: română, engleză, germană).
 *
 * Se salvează pe loc, ca bifa paginii de servicii: o singură hotărâre, cu efect pe tot
 * site-ul, care n-are de ce să aștepte bara de salvare a formularului de mai jos.
 *
 * Textul spune dinainte ce NU face traducerea, fiindcă exact acolo s-ar împiedica un
 * client: nu o scrie el, nu o poate corecta, și nu-l aduce mai sus în căutările din
 * altă limbă.
 */
export function ComutatorLimbi({ pornitInitial }: { pornitInitial: boolean }) {
  const [pornit, setPornit] = useState(pornitInitial);
  const [eroare, setEroare] = useState<string | null>(null);
  const [seSalveaza, porneste] = useTransition();
  const { show } = useToast();

  function comuta(urmatoarea: boolean) {
    const precedenta = pornit;
    setPornit(urmatoarea);
    setEroare(null);

    porneste(async () => {
      const rezultat = await comutaLimbile(urmatoarea);
      if (!rezultat.ok) {
        // Bifa se pune la loc: altfel ar arăta o stare pe care serverul n-a acceptat-o.
        setPornit(precedenta);
        setEroare(rezultat.mesaj);
        return;
      }
      show(
        urmatoarea
          ? "Bulina cu steag apare acum sus, în antetul site-ului."
          : "Bulina cu steag a fost scoasă de pe site.",
        "success",
      );
    });
  }

  return (
    <Card>
      <CardHeader
        title="Site-ul în engleză și germană"
        description="Sus, în antet, o bulină cu steagul limbii. Cine o apasă alege English sau Deutsch și citește site-ul tradus automat de Google."
      />
      <CardBody>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={pornit}
            disabled={seSalveaza}
            onChange={(eveniment) => comuta(eveniment.target.checked)}
            className="mt-0.5 size-4 accent-primary"
          />
          <span className="text-sm">
            <span className="font-medium text-foreground">Arată alegerea limbii pe site</span>
            <span className="mt-1 block text-muted-foreground">
              Traducerea o face Google, pe loc: nu scrii nimic în plus, dar nici nu poți corecta
              ce iese, iar la texte despre psihologie poate suna stângaci. Până nu alege cineva
              altă limbă, site-ul nu încarcă nimic de la Google. Pagina tradusă nu te aduce mai sus
              în căutările în engleză sau germană — ajută doar omul ajuns deja pe site.
            </span>
            <span className="mt-1 block text-muted-foreground">
              Dacă o pornești, politica de confidențialitate trebuie să aibă și paragraful despre
              traducere.
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
