"use client";

import { TextAreaField, TextField } from "@/components/ui/field";
import { ImageField, type ImageValue } from "@/components/ui/image-field";
import { RepeaterList } from "@/components/ui/repeater-list";
import { SlugField } from "@/components/ui/slug-field";
import type { CampSchema } from "@/lib/sectiuni";
import { catreEditor, type ElementListaEditor, type ValoareEditor } from "@/lib/sectiuni-editare";

/**
 * Formularul unei secțiuni, construit din descrierea ei.
 *
 * Nu există „formularul secțiunii Servicii" și „formularul secțiunii Păreri" —
 * există unul singur, care citește ce câmpuri are secțiunea. Douăsprezece
 * formulare scrise separat ar începe identice și ar diverge: unul ar valida
 * altfel, altul ar arăta altfel, al treilea ar uita o etichetă.
 *
 * Se cheamă și pe sine, pentru elementele listelor (un serviciu are propriile
 * câmpuri, un program are chiar și o listă înăuntrul lui).
 */
export function CampuriSectiune({
  campuri,
  valoare,
  onChange,
  erori,
  prefix = "",
}: {
  campuri: CampSchema[];
  valoare: ValoareEditor;
  onChange: (valoare: ValoareEditor) => void;
  /** Erorile întregii secțiuni, cu cheia = drumul până la câmp. */
  erori: Record<string, string>;
  /** Drumul până aici, pentru căutarea erorilor. Gol la nivelul de sus. */
  prefix?: string;
}) {
  function seteaza(cheie: string, nou: unknown) {
    onChange({ ...valoare, [cheie]: nou });
  }

  return (
    <div className="space-y-5">
      {campuri.map((camp) => {
        const drum = prefix ? `${prefix}.${camp.cheie}` : camp.cheie;
        const eroare = erori[drum];

        switch (camp.tip) {
          case "textLung":
            return (
              <TextAreaField
                key={camp.cheie}
                label={camp.eticheta}
                hint={camp.hint}
                error={eroare}
                required={camp.obligatoriu}
                rows={camp.randuri ?? 3}
                maxLength={camp.max}
                value={String(valoare[camp.cheie] ?? "")}
                onChange={(event) => seteaza(camp.cheie, event.target.value)}
              />
            );

          case "numar":
            return (
              <TextField
                key={camp.cheie}
                type="number"
                label={camp.eticheta}
                hint={camp.hint}
                error={eroare}
                min={camp.min}
                max={camp.maxim}
                className="max-w-32"
                value={String(valoare[camp.cheie] ?? "")}
                onChange={(event) => seteaza(camp.cheie, event.target.value)}
              />
            );

          case "link": {
            const link = (valoare[camp.cheie] ?? {}) as { text?: string; href?: string };
            return (
              <Grup key={camp.cheie} eticheta={camp.eticheta} hint={camp.hint}>
                {/*
                  Unul sub altul, mereu. Două coloane ar fi încăput la nivelul de
                  sus, dar nu și în interiorul unei liste — iar `sm:` se uită la
                  fereastră, nu la lățimea reală a locului în care stă câmpul,
                  deci ar fi rupt eticheta „Textul de pe buton" pe două rânduri.
                */}
                <div className="space-y-4">
                  <TextField
                    label="Textul de pe buton"
                    value={link.text ?? ""}
                    onChange={(event) =>
                      seteaza(camp.cheie, { ...link, text: event.target.value })
                    }
                  />
                  <TextField
                    label="Unde duce"
                    hint="Ex.: /contact sau #contact"
                    error={erori[`${drum}.href`]}
                    value={link.href ?? ""}
                    onChange={(event) =>
                      seteaza(camp.cheie, { ...link, href: event.target.value })
                    }
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Lasă textul gol dacă nu vrei buton.
                </p>
              </Grup>
            );
          }

          case "imagine": {
            const stocata = valoare[camp.cheie] as Partial<ImageValue> | null;
            const imagine: ImageValue | null =
              stocata && stocata.url
                ? {
                    uploadId: stocata.uploadId ?? "",
                    url: stocata.url,
                    altText: stocata.altText ?? "",
                  }
                : null;

            return (
              <ImageField
                key={camp.cheie}
                label={camp.eticheta}
                hint={camp.hint}
                error={eroare}
                value={imagine}
                onChange={(noua) => seteaza(camp.cheie, noua)}
              />
            );
          }

          case "slug":
            return (
              <SlugField
                key={camp.cheie}
                label={camp.eticheta}
                value={String(valoare[camp.cheie] ?? "")}
                onChange={(nou) => seteaza(camp.cheie, nou)}
                // Sursa e alt câmp al aceluiași formular, numit în descriere.
                sourceValue={String(valoare[camp.dinCheia] ?? "")}
                prefix={camp.prefix}
                required={camp.obligatoriu}
                error={eroare}
              />
            );

          case "listaText": {
            // O singură casetă, câte un element pe rând — nu o listă cu mâner,
            // săgeți și buton de ștergere pentru fiecare rând.
            //
            // Verificat prin randare: două liste una în alta (detaliile unui
            // program, în lista de programe) lăsau câmpului o lățime de vreo 45
            // de pixeli, în care „14–16 martie" se rupea pe patru rânduri. Iar
            // pentru texte scurte, uneltele de reordonare costă mai mult decât
            // valorează: mutarea unui rând e oricum mai rapidă prin editare.
            const lista = (valoare[camp.cheie] ?? []) as string[];
            return (
              <TextAreaField
                key={camp.cheie}
                label={camp.eticheta}
                hint={camp.hint ?? "Câte unul pe rând."}
                error={eroare}
                required={camp.obligatoriu}
                rows={Math.min(Math.max(lista.length + 1, 3), 8)}
                value={lista.join("\n")}
                onChange={(event) => seteaza(camp.cheie, event.target.value.split("\n"))}
              />
            );
          }

          case "lista": {
            const lista = (valoare[camp.cheie] ?? []) as ElementListaEditor[];
            return (
              <Grup key={camp.cheie} eticheta={camp.eticheta} hint={camp.hint} eroare={eroare}>
                <RepeaterList<ElementListaEditor>
                  items={lista}
                  onChange={(urmatoare) => seteaza(camp.cheie, urmatoare)}
                  getKey={(element) => element._cheie}
                  addLabel={`+ Adaugă ${camp.etichetaElement}`}
                  itemLabel={camp.etichetaElement}
                  max={camp.max}
                  // Elementul nou se construiește tot din descriere, prin aceeași
                  // funcție care încarcă datele existente: altfel un câmp adăugat
                  // în descriere ar lipsi din elementele noi.
                  onAdd={() => ({ _cheie: crypto.randomUUID(), ...catreEditor({}, camp.campuri) })}
                  renderItem={(element, index) => (
                    <CampuriSectiune
                      campuri={camp.campuri}
                      valoare={element}
                      erori={erori}
                      prefix={`${drum}.${index}`}
                      onChange={(nou) =>
                        seteaza(
                          camp.cheie,
                          // `_cheie` se pune la loc: e identitatea rândului, iar
                          // formularul dinăuntru nu știe și nu trebuie să știe de ea.
                          lista.map((el, i) => (i === index ? { ...nou, _cheie: el._cheie } : el)),
                        )
                      }
                    />
                  )}
                />
              </Grup>
            );
          }

          default:
            return (
              <TextField
                key={camp.cheie}
                type={camp.tip === "email" ? "email" : "text"}
                label={camp.eticheta}
                hint={camp.hint}
                error={eroare}
                required={camp.obligatoriu}
                maxLength={camp.max}
                value={String(valoare[camp.cheie] ?? "")}
                onChange={(event) => seteaza(camp.cheie, event.target.value)}
              />
            );
        }
      })}
    </div>
  );
}

/**
 * Un grup de câmpuri care ține de același lucru (o listă, o pereche
 * text + adresă). `<fieldset>` cu `<legend>`, nu un `<div>` cu un titlu: așa
 * cititoarele de ecran anunță „Servicii, grup" înainte de fiecare câmp dinăuntru,
 * iar omul știe unde se află.
 */
function Grup({
  eticheta,
  hint,
  eroare,
  children,
}: {
  eticheta: string;
  hint?: string;
  eroare?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="text-sm font-medium text-foreground">{eticheta}</legend>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      {eroare && <p className="mt-1 text-xs text-danger">{eroare}</p>}
      <div className="mt-3">{children}</div>
    </fieldset>
  );
}
