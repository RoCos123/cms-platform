"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState, InlineError } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { marcheazaCitit, mutaLaSterse, restaureaza, stergeDefinitiv } from "./actions";
import { LinkStergereDate } from "@/components/dashboard/link-stergere-date";

export type Mesaj = {
  id: string;
  nume: string;
  /** Poate lipsi: formularul nu-l mai cere, e opțional. */
  email: string | null;
  telefon: string | null;
  /** Lipsește la cererile primite după 28 aug. 2026 — vezi `contact_fara_mesaj`. */
  text: string | null;
  primitLa: string;
  citit: boolean;
  sters: boolean;
};

/**
 * Ora se formatează cu fusul României scris explicit, nu cu cel al mașinii.
 *
 * Serverul rulează pe UTC, browserul pe fusul vizitatorului. Fără fus fix, cele
 * două ar produce ore diferite pentru același mesaj, iar React ar semnala
 * nepotrivire la hidratare — și, mai rău, clientul ar vedea o oră greșită.
 */
const FORMAT_DATA = new Intl.DateTimeFormat("ro-RO", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Europe/Bucharest",
});

export function ListaMesaje({
  mesaje,
  vedere,
  domeniu,
}: {
  mesaje: Mesaj[];
  vedere: "toate" | "necitite" | "sterse";
  domeniu: string;
}) {
  const [seLucreaza, porneste] = useTransition();
  const [eroare, setEroare] = useState<string | null>(null);
  const [deSters, setDeSters] = useState<Mesaj | null>(null);
  const { show } = useToast();

  function ruleaza(actiune: () => Promise<{ ok: true } | { ok: false; mesaj: string }>, succes?: string) {
    setEroare(null);
    porneste(async () => {
      const rezultat = await actiune();
      if (!rezultat.ok) {
        setEroare(rezultat.mesaj);
        return;
      }
      if (succes) show(succes, "success");
    });
  }

  if (mesaje.length === 0) {
    return (
      <Card>
        <CardBody>
          <EmptyState
            title={
              vedere === "necitite"
                ? "Niciun mesaj necitit"
                : vedere === "sterse"
                  ? "Coșul e gol"
                  : "Niciun mesaj încă"
            }
            description={
              vedere === "toate"
                ? "Aici ajung mesajele trimise prin formularul de contact de pe site."
                : undefined
            }
          />
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      {eroare && <InlineError>{eroare}</InlineError>}

      <ul className="space-y-3">
        {mesaje.map((mesaj) => (
          <li key={mesaj.id}>
            <article
              className={cn(
                "rounded-base border bg-surface p-4",
                mesaj.citit || mesaj.sters ? "border-border" : "border-primary/40",
              )}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="flex flex-wrap items-center gap-2 font-medium text-foreground">
                  {mesaj.nume}
                  {!mesaj.citit && !mesaj.sters && (
                    <span className="rounded-base bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                      Nou
                    </span>
                  )}
                </p>
                <time
                  dateTime={mesaj.primitLa}
                  className="text-sm text-muted-foreground"
                >
                  {FORMAT_DATA.format(new Date(mesaj.primitLa))}
                </time>
              </div>

              {/*
                Telefonul primul: e calea principală de răspuns de când
                formularul nu mai cere mesajul. Amândouă ca linkuri pe care se
                apasă — pe telefon, apasă și sună.
              */}
              <p className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {mesaj.telefon && (
                  <a
                    href={`tel:${mesaj.telefon.replace(/\s/g, "")}`}
                    className="text-muted-foreground underline underline-offset-2"
                  >
                    {mesaj.telefon}
                  </a>
                )}
                {mesaj.email && (
                  <a
                    href={`mailto:${mesaj.email}`}
                    className="text-muted-foreground underline underline-offset-2"
                  >
                    {mesaj.email}
                  </a>
                )}
              </p>

              {/* `whitespace-pre-wrap`: omul a scris pe rânduri, nu într-un bloc. */}
              {mesaj.text && (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {mesaj.text}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {mesaj.sters ? (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={seLucreaza}
                      onClick={() => ruleaza(() => restaureaza(mesaj.id), "Mesajul a fost restaurat.")}
                    >
                      Pune înapoi
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={seLucreaza}
                      onClick={() => setDeSters(mesaj)}
                    >
                      Șterge definitiv
                    </Button>
                  </>
                ) : (
                  <>
                    {/*
                      Ancoră reală: e navigare, nu o acțiune. Sună dacă nu există
                      email — de când formularul cere telefonul, ăla e cazul
                      obișnuit, iar un `mailto:` gol n-ar duce nicăieri.
                    */}
                    <a
                      href={
                        mesaj.email
                          ? `mailto:${mesaj.email}?subject=${encodeURIComponent(`Răspuns la mesajul tău de pe ${domeniu}`)}`
                          : `tel:${(mesaj.telefon ?? "").replace(/\s/g, "")}`
                      }
                      className="inline-flex h-8 items-center justify-center rounded-base bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      {mesaj.email ? "Răspunde" : "Sună"}
                    </a>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={seLucreaza}
                      onClick={() => ruleaza(() => marcheazaCitit(mesaj.id, !mesaj.citit))}
                    >
                      {mesaj.citit ? "Marchează necitit" : "Marchează citit"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={seLucreaza}
                      onClick={() => ruleaza(() => mutaLaSterse(mesaj.id), "Mesajul a fost mutat la șterse.")}
                    >
                      Șterge
                    </Button>
                    {/*
                      Altceva decât „Șterge”: ăla mută mesajul la coș, de unde se
                      poate lua înapoi. Ăsta e răspunsul la o cerere GDPR — șterge
                      TOT ce ține de omul ăsta, din toate locurile, definitiv.
                    */}
                    <LinkStergereDate telefon={mesaj.telefon} email={mesaj.email} />
                  </>
                )}
              </div>
            </article>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={deSters !== null}
        onOpenChange={(deschis) => !deschis && setDeSters(null)}
        title="Ștergi definitiv mesajul?"
        description={
          deSters
            ? `Mesajul de la ${deSters.nume} dispare din baza de date. Nu mai poate fi recuperat.`
            : undefined
        }
        warning="Dacă persoana ți-a cerut ștergerea datelor, asta e opțiunea corectă."
        confirmLabel="Șterge definitiv"
        tone="danger"
        pending={seLucreaza}
        onConfirm={() => {
          const mesaj = deSters;
          if (!mesaj) return;
          setDeSters(null);
          ruleaza(() => stergeDefinitiv(mesaj.id), "Mesajul a fost șters definitiv.");
        }}
      />
    </>
  );
}
