"use client";

import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { familiaFontului } from "@/lib/templates/fonturi";
import type { TemplateTypography } from "@/lib/templates";
import {
  FONTURI_TEXT,
  FONTURI_TITLU,
  PERECHI_FONTURI,
  fontText,
  fontTitlu,
  type AspectFonturi,
} from "@/lib/aspect/fonturi";

/**
 * Fila „Fonturi" din „Aspect": perechile gata alese și, separat, fontul titlurilor și al
 * textului. Fiecare font e scris CU EL ÎNSUȘI, pe un text românesc cu diacritice: un nume de
 * font nu-i spune nimic unui psiholog, forma literelor da.
 */

const MOSTRA_TITLU = "Ședințe în ritmul tău";
const MOSTRA_TEXT = "Îți ofer un spațiu sigur în care să înțelegi ce simți.";

/** Stilul unui font din liste, ca să se vadă cu el însuși. */
const stilTitlu = (nume: string) => {
  const font = fontTitlu(nume);
  return font ? { fontFamily: familiaFontului(font.nume, font.rezerve), fontWeight: font.greutate } : {};
};
const stilText = (nume: string) => {
  const font = fontText(nume);
  return font ? { fontFamily: familiaFontului(font.nume, font.rezerve) } : {};
};

export function AlegereFonturi({
  valoare,
  onChange,
  tipografieSablon,
  numeSablon,
}: {
  valoare: AspectFonturi;
  onChange: (fonturi: AspectFonturi) => void;
  /** Tipografia șablonului, fără nimic ales: pentru opțiunea „ca în șablon". */
  tipografieSablon: TemplateTypography;
  numeSablon: string;
}) {
  const t = tipografieSablon;
  const titluSablon = t.titluriInSecundar
    ? { nume: t.fontSecundar, rezerve: t.fallbackSecundar }
    : { nume: t.fontPrincipal, rezerve: t.fallbackPrincipal };
  const nimicAles = !valoare.titluri && !valoare.text;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Perechi gata alese"
          description="Un font pentru titluri și unul pentru text, care merg bine împreună. Apasă pe una și o vezi în dreapta."
        />
        <CardBody>
          <ul className="grid grid-cols-2 gap-2">
            {PERECHI_FONTURI.map((pereche) => {
              const activ = valoare.titluri === pereche.titluri && valoare.text === pereche.text;
              return (
                <li key={pereche.nume}>
                  <button
                    type="button"
                    aria-pressed={activ}
                    onClick={() => onChange({ titluri: pereche.titluri, text: pereche.text })}
                    className={cn(
                      "flex h-full w-full flex-col items-start gap-1 rounded-base border p-3 text-left text-foreground",
                      "hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                      activ ? "border-foreground bg-surface-hover" : "border-border",
                    )}
                  >
                    <span className="text-xs font-medium text-muted-foreground">{pereche.nume}</span>
                    <span className="text-2xl leading-tight" style={stilTitlu(pereche.titluri)}>
                      Ședințe
                    </span>
                    <span className="text-sm leading-snug" style={stilText(pereche.text)}>
                      Un text ușor de citit, în ritmul tău.
                    </span>
                    <span className="mt-1 text-[11px] text-muted-foreground">
                      {pereche.titluri} + {pereche.text}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Fontul titlurilor"
          description="Titlurile, cuvintele colorate din ele, cifrele mari și citatele."
        />
        <CardBody>
          <fieldset className="space-y-2">
            <legend className="sr-only">Fontul titlurilor</legend>
            <OptiuneFont
              nume="font-titluri"
              ales={!valoare.titluri}
              onAlege={() => onChange({ ...valoare, titluri: null })}
              eticheta={`Ca în șablon — ${titluSablon.nume}`}
              stilMostra={{ fontFamily: familiaFontului(titluSablon.nume, titluSablon.rezerve), fontWeight: t.greutateTitlu }}
              mostra={MOSTRA_TITLU}
              mare
            />
            {FONTURI_TITLU.map((font) => (
              <OptiuneFont
                key={font.nume}
                nume="font-titluri"
                ales={valoare.titluri === font.nume}
                onAlege={() => onChange({ ...valoare, titluri: font.nume })}
                eticheta={`${font.stil} — ${font.nume}`}
                stilMostra={stilTitlu(font.nume)}
                mostra={MOSTRA_TITLU}
                mare
              />
            ))}
          </fieldset>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Fontul textului"
          description="Paragrafele, meniul, butoanele și formularele. Aici fonturile seamănă mai mult între ele: toate trebuie să se citească ușor."
        />
        <CardBody>
          <fieldset className="space-y-2">
            <legend className="sr-only">Fontul textului</legend>
            <OptiuneFont
              nume="font-text"
              ales={!valoare.text}
              onAlege={() => onChange({ ...valoare, text: null })}
              eticheta={`Ca în șablon — ${t.fontPrincipal}`}
              stilMostra={{ fontFamily: familiaFontului(t.fontPrincipal, t.fallbackPrincipal) }}
              mostra={MOSTRA_TEXT}
            />
            {FONTURI_TEXT.map((font) => (
              <OptiuneFont
                key={font.nume}
                nume="font-text"
                ales={valoare.text === font.nume}
                onAlege={() => onChange({ ...valoare, text: font.nume })}
                eticheta={`${font.nume} — ${font.descriere.toLowerCase()}`}
                stilMostra={stilText(font.nume)}
                mostra={MOSTRA_TEXT}
              />
            ))}
          </fieldset>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-xs text-xs text-muted-foreground">
            Vrei să renunți la fonturile alese? Site-ul revine la fonturile șablonului „{numeSablon}”. Se aplică după
            ce apeși Salvează.
          </p>
          <Button variant="secondary" size="sm" onClick={() => onChange({ titluri: null, text: null })} disabled={nimicAles}>
            Revino la fonturile șablonului
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}

function OptiuneFont({
  nume,
  ales,
  onAlege,
  eticheta,
  stilMostra,
  mostra,
  mare,
}: {
  nume: string;
  ales: boolean;
  onAlege: () => void;
  eticheta: string;
  stilMostra: React.CSSProperties;
  mostra: string;
  /** Mostra de titlu, mai mare decât cea de text. */
  mare?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-base border px-3 py-2.5",
        "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
        ales ? "border-foreground bg-surface-hover" : "border-border hover:bg-surface-hover",
      )}
    >
      <input type="radio" name={nume} checked={ales} onChange={onAlege} className="mt-1 shrink-0" />
      <span className="min-w-0 space-y-0.5">
        <span className="block text-xs font-medium text-muted-foreground">{eticheta}</span>
        <span
          className={cn("block text-foreground", mare ? "text-xl leading-tight" : "text-[15px] leading-snug")}
          style={stilMostra}
        >
          {mostra}
        </span>
      </span>
    </label>
  );
}
