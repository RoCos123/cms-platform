"use client";

import { useState } from "react";
import Link from "next/link";
import { useBibliotecaImagini } from "@/components/dashboard/biblioteca-imagini";
import { pozitioneazaImagine } from "@/app/dashboard/imagini/actions";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { ImageField, type ImageValue } from "@/components/ui/image-field";
import { RepeaterList } from "@/components/ui/repeater-list";
import { SlugField } from "@/components/ui/slug-field";
import type { CampSchema } from "@/lib/sectiuni";
import type { Destinatie } from "@/lib/destinatii";
import type { OptiuneDocument } from "@/lib/uploads";
import { cn } from "@/lib/cn";
import { blocuriText, numaraCuvinte, opresteLaLimita } from "@/lib/blocuri-text";
import { formateazaNumar, numara } from "@/lib/numerale";
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
  destinatii = [],
  documente = [],
  prefix = "",
}: {
  campuri: CampSchema[];
  valoare: ValoareEditor;
  onChange: (valoare: ValoareEditor) => void;
  /** Erorile întregii secțiuni, cu cheia = drumul până la câmp. */
  erori: Record<string, string>;
  /**
   * Unde poate duce un buton: secțiunile de pe pagină și paginile site-ului.
   * Gol în afara editorului de secțiuni (galeria de componente) — atunci câmpul
   * de link rămâne o casetă liberă, ca înainte.
   */
  destinatii?: Destinatie[];
  /** Documentele din bibliotecă, pentru alegătorul de materiale. Gol în afara editorului. */
  documente?: OptiuneDocument[];
  /** Drumul până aici, pentru căutarea erorilor. Gol la nivelul de sus. */
  prefix?: string;
}) {
  // `null` în afara panoului (galeria de componente): atunci `ImageField` nu mai
  // arată butonul „Alege din bibliotecă", iar restul câmpului merge la fel.
  const biblioteca = useBibliotecaImagini();

  function seteaza(cheie: string, nou: unknown) {
    onChange({ ...valoare, [cheie]: nou });
  }

  return (
    <div className="space-y-5">
      {campuri.map((camp) => {
        const drum = prefix ? `${prefix}.${camp.cheie}` : camp.cheie;
        const eroare = erori[drum];

        switch (camp.tip) {
          case "textLung": {
            const scris = String(valoare[camp.cheie] ?? "");

            const casetă = (
              <TextAreaField
                label={camp.eticheta}
                hint={
                  <>
                    {camp.hint}
                    {camp.cuSubtitluri && <ReguliScriere />}
                    {/*
                      Contorul dispare când câmpul are o eroare: eroarea spune
                      deja și limita, și cât ai scris. Amândouă odată ar fi fost
                      aceeași propoziție de două ori, una sub alta.
                    */}
                    {camp.maxCuvinte && !eroare && (
                      <ContorCuvinte text={scris} limita={camp.maxCuvinte} />
                    )}
                  </>
                }
                error={eroare}
                required={camp.obligatoriu}
                rows={camp.randuri ?? 3}
                maxLength={camp.max}
                value={scris}
                onChange={(event) =>
                  seteaza(
                    camp.cheie,
                    // Limita în cuvinte oprește scrisul, ca cea în caractere:
                    // altfel n-ar fi o limită, ar fi o părere.
                    camp.maxCuvinte
                      ? opresteLaLimita(event.target.value, scris, camp.maxCuvinte)
                      : event.target.value,
                  )
                }
              />
            );

            // Regulile de scriere stau în `hint` (deci sunt citite la intrarea
            // în câmp), iar exemplul dedesubt, în afara lui: e prea lung pentru
            // ceva anunțat la fiecare focus, și oricum se citește cu ochii.
            if (!camp.cuSubtitluri) return <div key={camp.cheie}>{casetă}</div>;

            return (
              <div key={camp.cheie}>
                {casetă}
                <ExempluScriere />
              </div>
            );
          }

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

          case "link":
            return (
              <CampLink
                key={camp.cheie}
                eticheta={camp.eticheta}
                hint={camp.hint}
                link={(valoare[camp.cheie] ?? {}) as { text?: string; href?: string }}
                eroareHref={erori[`${drum}.href`]}
                destinatii={destinatii}
                onChange={(nou) => seteaza(camp.cheie, nou)}
              />
            );

          case "imagine": {
            const stocata = valoare[camp.cheie] as Partial<ImageValue> | null;
            const imagine: ImageValue | null =
              stocata && stocata.url
                ? {
                    uploadId: stocata.uploadId ?? "",
                    url: stocata.url,
                    altText: stocata.altText ?? "",
                    // Punctul focal se păstrează la dus-întorsul prin formular:
                    // fără el, reconstrucția de aici l-ar șterge la prima
                    // deschidere a secțiunii, iar poza s-ar recentra singură.
                    pozitie: stocata.pozitie,
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
                // Toate pozele de secțiune se afișează tăiate (`object-fit:
                // cover`), deci toate se pot repoziționa (trase în ramă).
                cuRepozitionare
                // Poziția e a POZEI, nu a acestui loc: o salvăm și pe poză, ca să
                // apară la fel peste tot unde e pusă. În câmp se vede imediat
                // (`onChange`), iar aici se scrie și-n bibliotecă și-n celelalte
                // secțiuni. Dacă scrierea asta pică, poziția din câmp tot se
                // salvează la salvarea secțiunii — deci nu blocăm nimic pe ea.
                onReposition={(uploadId, pozitie) => {
                  void pozitioneazaImagine(uploadId, pozitie.x, pozitie.y).catch(() => {});
                }}
                // Aceeași poză a cabinetului se pune în mai multe secțiuni. Fără
                // butonul ăsta ar fi trebuit încărcată din nou de fiecare dată,
                // iar biblioteca s-ar fi umplut de copii ale aceluiași fișier —
                // fiecare cu descrierea ei, fiecare de întreținut separat.
                onPickFromLibrary={biblioteca ? biblioteca.deschide : undefined}
              />
            );
          }

          case "document":
            return (
              <CampDocument
                key={camp.cheie}
                eticheta={camp.eticheta}
                hint={camp.hint}
                valoare={(valoare[camp.cheie] ?? {}) as { fisierId?: string; url?: string }}
                documente={documente}
                onChange={(nou) => seteaza(camp.cheie, nou)}
              />
            );

          case "slug":
            return (
              <SlugField
                key={camp.cheie}
                label={camp.eticheta}
                hint={camp.hint}
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
                      destinatii={destinatii}
                      documente={documente}
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
 * Regulile de scriere ale unui text lung, în două propoziții.
 *
 * Stau în `hint`, adică legate de câmp prin `aria-describedby`: cine folosește
 * un cititor de ecran le aude la intrarea în casetă, nu după ce a scris tot
 * articolul ca pe un bloc compact.
 *
 * Doar elemente de tip text înăuntru: `hint` se randează într-un `<p>`, iar un
 * `<div>` sau un `<pre>` acolo ar închide paragraful mai devreme și ar rupe
 * randarea. Exemplul, care are nevoie de amândouă, stă separat mai jos.
 */
function ReguliScriere() {
  return (
    <span className="mt-1.5 block">
      <strong className="font-medium text-foreground">Enter</strong> face un paragraf nou.{" "}
      {/* Fără spațiul de după: regula îl acceptă și fără, iar în chip s-ar fi
          văzut doar ca o pată de fundal mai lată, fără să spună nimic. */}
      <code className="rounded bg-surface-muted px-1 py-0.5 font-mono text-foreground">##</code>{" "}
      la începutul unui rând îl face subtitlu.
    </span>
  );
}

/** Textul din exemplu. Scurt, dar cu toate cele trei situații înăuntru. */
const EXEMPLU_SCRIERE = [
  "Prima ședință e doar cu voi, fără copil.",
  "De la a doua, lucrăm pe situații concrete.",
  "## Cum decurge",
  "Ne vedem o dată pe săptămână, câte 50 de minute.",
].join("\n");

/**
 * Aceleași rânduri, o dată așa cum se scriu și o dată așa cum ies.
 *
 * O regulă scrisă în cuvinte („un rând care începe cu ## devine subtitlu") cere
 * un efort de imaginație pe care nu-l face nimeni în mijlocul scrisului. Două
 * casete alăturate se înțeleg dintr-o privire.
 *
 * Partea din dreapta trece prin exact funcția care randează site-ul, deci
 * exemplul nu poate ajunge vreodată să arate altceva decât produce regula.
 */
function ExempluScriere() {
  const blocuri = blocuriText(EXEMPLU_SCRIERE);

  return (
    <details className="mt-2 rounded-base border border-border bg-surface-muted">
      <summary className="cursor-pointer select-none px-3 py-2 text-xs font-medium text-foreground">
        Vezi un exemplu
      </summary>

      <div className="space-y-3 border-t border-border p-3">
        <div>
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Ce scrii
          </p>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-base bg-surface p-2.5 font-mono text-xs text-foreground">
            {EXEMPLU_SCRIERE}
          </pre>
        </div>

        <div>
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Cum apare pe site
          </p>
          <div className="rounded-base bg-surface p-2.5">
            {blocuri.map((bloc, i) =>
              bloc.tip === "subtitlu" ? (
                <p
                  key={i}
                  className={cn("text-sm font-semibold text-foreground", i > 0 && "mt-3")}
                >
                  {bloc.text}
                </p>
              ) : (
                <p key={i} className={cn("text-xs text-muted-foreground", i > 0 && "mt-1.5")}>
                  {bloc.text}
                </p>
              ),
            )}
          </div>
        </div>
      </div>
    </details>
  );
}

/**
 * Cât ai scris, sub casetă.
 *
 * Un număr, nu o bară: pentru un articol, „câte cuvinte am" e o întrebare la
 * care omul vrea răspunsul exact, ca să-l compare cu ce a mai scris. O bară
 * care se umple ar sugera în plus că ținta e s-o umpli.
 *
 * Trei trepte, ca omul să vadă limita venind, nu să se lovească de ea: gri până
 * pe ultima zecime, chihlimbariu pe ea, roșu la capăt — acolo unde caseta chiar
 * nu mai primește cuvinte noi.
 */
function ContorCuvinte({ text, limita }: { text: string; limita: number }) {
  const scrise = numaraCuvinte(text);
  const ramase = limita - scrise;

  const ton =
    ramase <= 0 ? "text-danger" : scrise >= limita * 0.9 ? "text-warning" : "text-muted-foreground";

  const mesaj =
    ramase < 0
      ? // Se poate ajunge aici doar cu un text scris înainte să existe limita:
        // de scris peste ea nu se mai poate. Spunem cât e de tăiat.
        `${numara(scrise, "cuvânt", "cuvinte")} — cu ${numara(-ramase, "cuvânt", "cuvinte")} peste limită.`
      : ramase === 0
        ? `${numara(limita, "cuvânt", "cuvinte")} — ai ajuns la limită. Șterge ceva ca să poți scrie mai departe.`
        : `${numara(scrise, "cuvânt", "cuvinte")} din ${formateazaNumar(limita)}.`;

  return (
    <>
      <span className={cn("mt-1 block tabular-nums", ton)}>{mesaj}</span>

      {/*
        Cine nu vede ecranul ar apăsa taste fără să se întâmple nimic: contorul
        de mai sus stă în `aria-describedby`, care se citește la intrarea în
        câmp, nu la fiecare tastă. Regiunea asta are text DOAR la limită, deci
        vorbește o singură dată, când chiar s-a schimbat ceva.
      */}
      <span aria-live="polite" className="sr-only">
        {ramase <= 0 ? `Ai ajuns la limita de ${numara(limita, "cuvânt", "cuvinte")}.` : ""}
      </span>
    </>
  );
}

/**
 * Câmpul unui buton: textul de pe el și UNDE DUCE.
 *
 * „Unde duce" era o casetă liberă, cu exemplul „/contact" — iar `/contact` nu e o
 * pagină, ci o secțiune la care se ajunge cu `#contact`. Cine urma exemplul
 * ajungea la o pagină inexistentă. Acum alege dintr-o listă cu locurile care
 * CHIAR există pe site-ul lui (secțiuni, pagini); „O altă adresă" rămâne, pentru
 * un link în afară. Fără listă (în afara editorului de secțiuni) rămâne caseta
 * liberă, ca înainte.
 */
function CampLink({
  eticheta,
  hint,
  link,
  eroareHref,
  destinatii,
  onChange,
}: {
  eticheta: string;
  hint?: string;
  link: { text?: string; href?: string };
  eroareHref?: string;
  destinatii: Destinatie[];
  onChange: (link: { text?: string; href?: string }) => void;
}) {
  const href = link.href ?? "";
  const potrivita = destinatii.find((destinatie) => destinatie.href === href);

  // „Altă adresă" se ține minte separat de href: cine alege „altă adresă" și n-a
  // scris încă nimic tot trebuie să vadă caseta — un href gol singur n-ar spune
  // dacă e „încă nimic ales" sau „altă adresă, deocamdată goală".
  const [altaAdresa, setAltaAdresa] = useState(potrivita === undefined && href !== "");

  const faraLista = destinatii.length === 0;
  const modText = faraLista || altaAdresa || (href !== "" && potrivita === undefined);
  const valSelect = potrivita ? potrivita.href : modText ? "__alta__" : "";

  return (
    <Grup eticheta={eticheta} hint={hint}>
      <div className="space-y-4">
        <TextField
          label="Textul de pe buton"
          value={link.text ?? ""}
          onChange={(event) => onChange({ ...link, text: event.target.value })}
        />

        {faraLista ? (
          <TextField
            label="Unde duce"
            hint="O adresă din site (începe cu / sau #) ori un link întreg (https://…)."
            error={eroareHref}
            value={href}
            onChange={(event) => onChange({ ...link, href: event.target.value })}
          />
        ) : (
          <>
            <SelectField
              label="Unde duce"
              hint="Alege un loc de pe site — butonul nu mai poate ajunge la o pagină care nu există."
              value={valSelect}
              onChange={(event) => {
                const ales = event.target.value;
                if (ales === "__alta__") {
                  setAltaAdresa(true);
                  // Golim o destinație aleasă înainte: omul vrea să scrie altceva.
                  onChange({ ...link, href: potrivita ? "" : href });
                } else {
                  setAltaAdresa(false);
                  onChange({ ...link, href: ales });
                }
              }}
            >
              <option value="">— alege —</option>
              {destinatii.map((destinatie) => (
                <option key={destinatie.href} value={destinatie.href}>
                  {destinatie.eticheta}
                </option>
              ))}
              <option value="__alta__">O altă adresă (alt site)</option>
            </SelectField>

            {modText && (
              <TextField
                label="Adresa"
                hint="Un link întreg (https://…) sau o pagină din site (/tarife)."
                error={eroareHref}
                value={href}
                onChange={(event) => onChange({ ...link, href: event.target.value })}
              />
            )}
          </>
        )}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Lasă textul gol dacă nu vrei buton.</p>
    </Grup>
  );
}

/**
 * Alegătorul unui material: care document din bibliotecă descarcă butonul.
 *
 * O listă cu documentele deja încărcate — nu o casetă de adresă, fiindcă
 * fișierul e la noi, nu în afară. Alegerea ține minte și `url`-ul de descărcare
 * (semnat), pe lângă `fisierId`; la randare, `url`-ul se re-semnează oricum din
 * `fisierId`, dar cel din câmp face ca previzualizarea să meargă pe loc.
 *
 * Fără niciun document încă (sau în afara panoului) → un îndemn spre bibliotecă,
 * nu un dropdown gol care nu spune ce lipsește.
 */
function CampDocument({
  eticheta,
  hint,
  valoare,
  documente,
  onChange,
}: {
  eticheta: string;
  hint?: string;
  valoare: { fisierId?: string; url?: string };
  documente: OptiuneDocument[];
  onChange: (valoare: { fisierId?: string; url?: string }) => void;
}) {
  const fisierId = valoare.fisierId ?? "";
  const gasit = documente.some((doc) => doc.id === fisierId);

  if (documente.length === 0) {
    return (
      <Grup eticheta={eticheta} hint={hint}>
        <p className="text-sm text-muted-foreground">
          N-ai încă niciun document.{" "}
          <Link href="/dashboard/imagini" className="underline hover:text-foreground">
            Încarcă unul în Bibliotecă
          </Link>
          , apoi îl poți alege aici.
        </p>
      </Grup>
    );
  }

  return (
    <Grup eticheta={eticheta} hint={hint}>
      <SelectField
        label="Documentul de descărcat"
        value={fisierId}
        onChange={(event) => {
          const ales = event.target.value;
          const doc = documente.find((d) => d.id === ales);
          onChange(doc ? { fisierId: doc.id, url: doc.url } : {});
        }}
      >
        <option value="">— alege un document —</option>
        {documente.map((doc) => (
          <option key={doc.id} value={doc.id}>
            {doc.numeFisier}
          </option>
        ))}
        {/* Un document ales înainte și șters între timp: îl arătăm ca opțiune
            „ruptă", ca omul să vadă că trebuie reales, nu să dispară tăcut. */}
        {fisierId !== "" && !gasit && <option value={fisierId}>(document lipsă — alege altul)</option>}
      </SelectField>
    </Grup>
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
