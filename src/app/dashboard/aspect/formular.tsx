"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SaveBar } from "@/components/ui/save-bar";
import { useToast } from "@/components/ui/toast";
import { PanouPrevizualizare } from "@/components/dashboard/panou-previzualizare";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { RenderSections, type SectionRow } from "@/components/site/render-sections";
import { cn } from "@/lib/cn";
import { getTemplate } from "@/lib/templates";
import type { Serviciu } from "@/lib/servicii";
import { normalizeazaHex } from "@/lib/aspect/culoare";
import { bazaManuala, paletaDinCuloare, verificaPerechi, PRAG_CONTRAST, type Finisaj } from "@/lib/aspect/paleta";
import { ROLURI_MANUALE, finisajul, type AspectCulori, type ModCulori, type RolManual } from "@/lib/aspect/culori";
import { COLECTII_CULOARE, CULOARE_PROPUSA } from "@/lib/aspect/salvare";
import type { AspectFonturi } from "@/lib/aspect/fonturi";
import type { PrevizualizareSite } from "@/lib/aspect/previzualizare";
import { salveazaAspect } from "./actions";
import { AlegereFonturi } from "./alegere-fonturi";

type Stare = {
  mod: ModCulori;
  principala: string | null;
  manual: Partial<Record<RolManual, string>>;
  /** Colecția aleasă deasupra mostrelor: mătăsos sau mat. Se aplică și culorii alese cu pipeta. */
  finisaj: Finisaj;
};

/** Ce s-ar salva pentru starea de pe ecran; `null` = nicio culoare proprie (culorile șablonului). */
function catreSalvare(stare: Stare, asumat: boolean): AspectCulori | null {
  // „mat" se scrie; mătăsosul e implicit, deci nu se scrie (culorile salvate înainte rămân identice).
  const finisaj = stare.finisaj === "mat" ? { finisaj: "mat" as const } : {};
  if (stare.mod === "auto") {
    return stare.principala ? { mod: "auto", principala: stare.principala, manual: {}, asumat: false, ...finisaj } : null;
  }

  const manual: Partial<Record<RolManual, string>> = {};
  for (const rol of ROLURI_MANUALE) {
    const valoare = stare.manual[rol.cheie];
    if (valoare) manual[rol.cheie] = valoare;
  }

  if (!stare.principala && Object.keys(manual).length === 0) return null;
  return { mod: "manual", principala: stare.principala, manual, asumat, ...finisaj };
}

/**
 * Aceeași alegere → același șir, indiferent în ce ordine au fost scrise cheile în bază. Fără
 * asta, o ordine diferită ar face ecranul să creadă că are modificări nesalvate.
 */
function semnatura(culori: AspectCulori | null): string {
  if (!culori) return "null";
  return JSON.stringify([
    culori.mod,
    culori.principala,
    ROLURI_MANUALE.map((rol) => culori.manual[rol.cheie] ?? null),
    culori.asumat,
    finisajul(culori),
  ]);
}

/** Fonturile de salvat: `null` când nu e ales nimic (fonturile șablonului). */
const fonturiDeSalvat = (fonturi: AspectFonturi): AspectFonturi | null =>
  fonturi.titluri || fonturi.text ? fonturi : null;

const semnaturaFonturi = (fonturi: AspectFonturi | null) => JSON.stringify([fonturi?.titluri ?? null, fonturi?.text ?? null]);

const formatRaport = (raport: number) => raport.toFixed(1).replace(".", ",");

/* ───────────────────────── câmpul unei culori ───────────────────────── */

/**
 * O culoare: pătrățelul din browser + câmpul în care se poate scrie codul. Cât scrii, ce e în
 * câmp rămâne cum scrii (ca să poți șterge și rescrie); abia când e o culoare întreagă se
 * aplică. La ieșirea din câmp, ce nu e culoare se aruncă și revine ultima valoare bună.
 */
function CampCuloare({
  id,
  valoare,
  onChange,
  eticheta,
}: {
  id: string;
  valoare: string;
  onChange: (hex: string) => void;
  /** Pentru cititoarele de ecran: ce culoare e. */
  eticheta: string;
}) {
  const [scris, setScris] = useState<string | null>(null);
  const afisat = scris ?? valoare;
  const gresit = scris !== null && normalizeazaHex(candidat(scris)) === null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="color"
        aria-label={`${eticheta} — alege din paletă`}
        value={valoare.toLowerCase()}
        onChange={(e) => {
          setScris(null);
          onChange(e.target.value.toUpperCase());
        }}
        className="size-9 shrink-0 cursor-pointer rounded-base border border-border bg-surface p-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      />
      <input
        id={id}
        type="text"
        inputMode="text"
        spellCheck={false}
        autoComplete="off"
        maxLength={7}
        aria-label={`${eticheta} — codul culorii`}
        aria-invalid={gresit || undefined}
        value={afisat}
        onChange={(e) => {
          const text = e.target.value;
          setScris(text);
          const hex = normalizeazaHex(candidat(text));
          if (hex) onChange(hex);
        }}
        onBlur={() => setScris(null)}
        className={cn(
          "h-9 w-28 rounded-base border bg-surface px-3 font-mono text-sm uppercase text-foreground",
          "focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring",
          gresit ? "border-danger" : "border-border",
        )}
      />
      {gresit && (
        <span role="alert" className="text-xs text-danger">
          Scrie culoarea ca #RRGGBB, de pildă #2E7D5B.
        </span>
      )}
    </div>
  );
}

/** Se acceptă și fără „#" în față: 6 cifre hexa sunt, fără dubiu, o culoare. */
function candidat(text: string): string {
  const curat = text.trim();
  return /^[0-9a-f]{6}$/i.test(curat) ? `#${curat}` : curat;
}

/* ───────────────────────── formularul ───────────────────────── */

export function FormularAspect({
  sablonId,
  numeSablon,
  numeSite,
  initiale,
  colectiaMata,
  initialeFonturi,
  previzualizare,
}: {
  sablonId: string;
  numeSablon: string;
  numeSite: string;
  initiale: AspectCulori | null;
  /** Are șablonul colecția „Mat & Mineral" (`matPermis`)? Fără ea, doar culorile mătăsoase, fără comutator. */
  colectiaMata: boolean;
  initialeFonturi: AspectFonturi | null;
  /** Site-ul adevărat al clientului. `null` = nicio secțiune vizibilă: se arată pagina de exemplu. */
  previzualizare: PrevizualizareSite | null;
}) {
  const [stare, setStare] = useState<Stare>({
    mod: initiale?.mod ?? "auto",
    principala: initiale?.principala ?? null,
    manual: initiale?.manual ?? {},
    finisaj: finisajul(initiale),
  });
  const [referinta, setReferinta] = useState<AspectCulori | null>(initiale);
  const [fonturi, setFonturi] = useState<AspectFonturi>(initialeFonturi ?? { titluri: null, text: null });
  const [referintaFonturi, setReferintaFonturi] = useState<AspectFonturi | null>(initialeFonturi);
  const [fila, setFila] = useState<"culori" | "fonturi">("culori");
  const [seSalveaza, setSeSalveaza] = useState(false);
  const [eroare, setEroare] = useState<string | undefined>();
  const { show } = useToast();

  const sablon = getTemplate(sablonId);

  // Paleta pe care o vede omul acum. „Asumat" se hotărăște din ea, deci se calculează după.
  const fara = catreSalvare(stare, false);
  const fonturiAlese = fonturiDeSalvat(fonturi);
  const efectiv = getTemplate(sablonId, fara, fonturiAlese);
  const slabe = verificaPerechi(efectiv.paleta).filter((pereche) => !pereche.trece);
  const asumat = stare.mod === "manual" && slabe.length > 0;
  const culori = catreSalvare(stare, asumat);

  const culoriModificate = semnatura(culori) !== semnatura(referinta);
  const fonturiModificate = semnaturaFonturi(fonturiAlese) !== semnaturaFonturi(referintaFonturi);
  const modificat = culoriModificate || fonturiModificate;
  const nimicAles = !stare.principala && Object.keys(stare.manual).length === 0;

  // Paleta calculată din culoarea principală (sau a șablonului, dacă n-a ales una): de la ea
  // pornește modul manual și cu ea se compară ce a schimbat omul. Aceeași funcție ca pe site.
  const calculat = stare.principala ? paletaDinCuloare(sablon.paleta, stare.principala, stare.finisaj) : null;
  const baza = bazaManuala(sablon.paleta, stare.principala, stare.finisaj);

  // Mostrele colecției alese: paleta fiecăreia, calculată pe șablonul ACESTUI site și cu finisajul
  // colecției, ca fâșiile să arate exact ce iese (banda închisă, butoanele, linkurile) — cu luciu la
  // „Mătăsos & Radiant", plate la „Mat & Mineral".
  const colectii = colectiaMata ? COLECTII_CULOARE : COLECTII_CULOARE.filter((c) => c.finisaj === "matasos");
  const colectie = colectii.find((c) => c.finisaj === stare.finisaj) ?? colectii[0];
  const mostre = colectie.preseturi.map((preset) => ({
    ...preset,
    paleta: paletaDinCuloare(sablon.paleta, preset.hex, colectie.finisaj).paleta,
  }));

  // Site-ul adevărat, dacă are secțiuni vizibile; altfel pagina de exemplu (de jos).
  const antet = previzualizare?.header ?? {
    nume: numeSite || "Cabinetul tău",
    telefon: "0722 000 000",
    areDespre: true,
    blog: null,
  };
  const subsol = previzualizare?.footer ?? {
    nume: numeSite || "Cabinetul tău",
    telefon: "0722 000 000",
    email: "contact@exemplu.ro",
    servicii: LINKURI_EXEMPLU,
    cabinet: LINKURI_EXEMPLU,
    retele: [],
  };
  const randuri = previzualizare?.randuri ?? RANDURI_EXEMPLU;
  const context = previzualizare?.context ?? {
    articole: [],
    servicii: SERVICII_EXEMPLU,
    paginaServiciiActiva: false,
    oreProgramare: { zile: [], luni: [] },
    paginaVanzare: null,
  };

  async function salveaza() {
    setSeSalveaza(true);
    setEroare(undefined);

    const rezultat = await salveazaAspect(culori, fonturiAlese);
    setSeSalveaza(false);

    if (!rezultat.ok) {
      setEroare(rezultat.mesaj);
      return;
    }

    setReferinta(culori);
    setReferintaFonturi(fonturiAlese);
    show(mesajSalvat(culoriModificate ? culori : undefined, fonturiModificate ? fonturiAlese : undefined), "success");
  }

  function reiaDeLaSablon() {
    setStare({ mod: "auto", principala: null, manual: {}, finisaj: "matasos" });
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 pb-24 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:gap-8">
      <div className="space-y-6">
        {/* Două file, nu un ecran lung: culorile și fonturile se aleg separat, dar se văd împreună
            în dreapta și se salvează cu același buton. */}
        <div className="inline-flex rounded-base border border-border bg-surface p-1" role="group" aria-label="Ce alegi">
          {(["culori", "fonturi"] as const).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={fila === f}
              onClick={() => setFila(f)}
              className={cn(
                "rounded-sm px-4 py-1.5 text-sm font-medium",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                fila === f ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f === "culori" ? "Culori" : "Fonturi"}
            </button>
          ))}
        </div>

        {fila === "fonturi" ? (
          <AlegereFonturi
            valoare={fonturi}
            onChange={setFonturi}
            tipografieSablon={sablon.tipografie}
            numeSablon={numeSablon}
          />
        ) : (
          <>
          <Card>
            <CardHeader
              title="Cum alegi culorile"
              description={
                <>
                  Acum site-ul folosește {culori ? "culorile alese de tine" : <>culorile șablonului „{numeSablon}”</>}.
                  Modificările ajung pe site abia după ce apeși Salvează.
                </>
              }
            />
            <CardBody>
              <fieldset className="space-y-3">
                <legend className="sr-only">Modul de alegere a culorilor</legend>

                <ModDeAlegere
                  valoare="auto"
                  ales={stare.mod === "auto"}
                  titlu="Automat"
                  recomandat
                  onAlege={() => setStare((s) => ({ ...s, mod: "auto" }))}
                >
                  Alegi o singură culoare, iar restul se potrivește singur cu ea: fundalurile capătă o nuanță din
                  culoarea ta și textul rămâne ușor de citit pe toate. Nu poți face un site greu de citit.
                </ModDeAlegere>

                <ModDeAlegere
                  valoare="manual"
                  ales={stare.mod === "manual"}
                  titlu="Manual"
                  onAlege={() => setStare((s) => ({ ...s, mod: "manual" }))}
                >
                  Alegi tu fiecare culoare în parte, pe cont propriu. Ai libertate deplină, dar nu mai verificăm noi
                  dacă se citește bine: un text galben pe fundal alb va arăta exact așa. Te avertizăm, dar nu te oprim.
                </ModDeAlegere>
              </fieldset>
            </CardBody>
          </Card>

          {stare.mod === "auto" ? (
            <Card>
              <CardHeader
                title="Culoarea principală"
                description="Din ea se calculează butoanele, linkurile, fundalurile și benzile închise."
              />
              <CardBody className="space-y-5">
                {/* Colecția = finisajul. Deasupra a tot, fiindcă se aplică și culorii scrise mai jos,
                    nu doar mostrelor. Doar unde șablonul are și colecția mată. */}
                {colectii.length > 1 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Colecția</p>
                  <div
                    className="inline-flex flex-wrap rounded-base border border-border bg-surface p-1"
                    role="group"
                    aria-label="Colecția de culori"
                  >
                    {colectii.map((c) => (
                      <button
                        key={c.finisaj}
                        type="button"
                        aria-pressed={stare.finisaj === c.finisaj}
                        onClick={() => setStare((s) => ({ ...s, finisaj: c.finisaj }))}
                        className={cn(
                          "rounded-sm px-3 py-1.5 text-sm font-medium",
                          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                          stare.finisaj === c.finisaj
                            ? "bg-foreground text-background"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {c.nume}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{colectie.descriere}</p>
                </div>
                )}

                <CampCuloare
                  id="culoare-principala"
                  eticheta="Culoarea principală"
                  valoare={stare.principala ?? CULOARE_PROPUSA}
                  onChange={(hex) => setStare((s) => ({ ...s, principala: hex }))}
                />

                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Sau pornește de la una gata aleasă{colectii.length > 1 && <> din „{colectie.nume}”</>}
                  </p>
                  <p className="mb-2 text-xs text-muted-foreground">
                    Fiecare mostră arată, de la stânga: banda închisă, butoanele și linkurile.
                  </p>
                  <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {mostre.map((preset) => {
                      const activ = stare.principala === preset.hex;
                      return (
                        <li key={preset.hex}>
                          <button
                            type="button"
                            aria-pressed={activ}
                            onClick={() => setStare((s) => ({ ...s, principala: preset.hex }))}
                            className={cn(
                              // `h-full`: un nume pe două rânduri („Rosewood Mat") nu face cartonașul mai
                              // înalt decât vecinii lui de pe rând.
                              "flex h-full w-full flex-col items-center gap-1.5 rounded-base border p-2 text-xs text-foreground",
                              "hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                              activ ? "border-foreground" : "border-border",
                            )}
                          >
                            {/* Trei fâșii, nu o pată: banda închisă (50%), butoanele (30%) și
                                linkurile (20%), exact cum ies pe site — cu mătasea lor la colecția
                                mătăsoasă, plate la cea mată (paleta mată n-are roluri de mătase).
                                Fundalul cardurilor nu e aici: e același alabastru la toate culorile. */}
                            <span aria-hidden className="flex h-8 w-full gap-0.5">
                              <span
                                className="rounded-sm"
                                style={{ flex: "50 1 0", background: preset.paleta.fundalInchisMatase ?? preset.paleta.fundalInchis }}
                              />
                              <span
                                className="rounded-sm"
                                style={{ flex: "30 1 0", background: preset.paleta.accentMatase ?? preset.paleta.accent }}
                              />
                              <span
                                className="rounded-sm"
                                style={{ flex: "20 1 0", background: preset.paleta.accentInteractiv }}
                              />
                            </span>
                            {preset.nume}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {calculat?.accentAjustat && (
                  <p className="rounded-base bg-warning-surface px-3 py-2 text-xs text-foreground" role="status">
                    <span
                      aria-hidden
                      className="mr-1.5 inline-block size-3 translate-y-0.5 rounded-sm border border-border"
                      style={{ background: calculat.accentObtinut }}
                    />
                    Culoarea aleasă ({calculat.culoareaAleasa}) e prea deschisă ca butoanele și linkurile scrise cu ea să
                    se citească pe un fundal deschis. Pe site apare puțin mai închisă ({calculat.accentObtinut}), ca
                    să se vadă bine.
                  </p>
                )}

                {stare.principala && !calculat?.accentAjustat && (
                  <p className="text-xs text-muted-foreground">
                    Verificat: toate textele de pe site se citesc pe fundalurile lor (contrast de cel puțin{" "}
                    {formatRaport(PRAG_CONTRAST)}:1).
                  </p>
                )}
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardHeader
                title="Fiecare culoare, separat"
                description={
                  stare.principala ? (
                    <>
                      Pornești de la culorile calculate din {stare.principala}
                      {colectii.length > 1 && <>, în colecția „{colectie.nume}”</>}. Ca să schimbi punctul de pornire,
                      treci pe Automat, alege altă culoare{colectii.length > 1 && " sau altă colecție"} și revino aici.
                    </>
                  ) : (
                    <>Pornești de la culorile șablonului „{numeSablon}”.</>
                  )
                }
              />
              <CardBody className="space-y-5">
                {ROLURI_MANUALE.map((rol) => {
                  const schimbat = stare.manual[rol.cheie] !== undefined;
                  const id = `culoare-${rol.cheie}`;
                  return (
                    <div key={rol.cheie} className="space-y-1.5">
                      <label htmlFor={id} className="block text-sm font-medium text-foreground">
                        {rol.nume}
                      </label>
                      <p className="text-xs text-muted-foreground">{rol.explicatie}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <CampCuloare
                          id={id}
                          eticheta={rol.nume}
                          valoare={stare.manual[rol.cheie] ?? baza[rol.cheie] ?? baza.accent}
                          onChange={(hex) => setStare((s) => ({ ...s, manual: { ...s.manual, [rol.cheie]: hex } }))}
                        />
                        {schimbat && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setStare((s) => {
                                const manual = { ...s.manual };
                                delete manual[rol.cheie];
                                return { ...s, manual };
                              })
                            }
                          >
                            Revino la cea calculată
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {slabe.length > 0 ? (
                  <div className="space-y-2 rounded-base bg-warning-surface px-3 py-3 text-xs text-foreground" role="status">
                    <p className="font-medium">Atenție: unele combinații se citesc greu</p>
                    <ul className="list-disc space-y-1 pl-4">
                      {slabe.map((pereche) => (
                        <li key={pereche.nume}>
                          {pereche.nume}: contrast {formatRaport(pereche.raport)}:1 (se recomandă cel puțin{" "}
                          {formatRaport(pereche.minim)}:1)
                        </li>
                      ))}
                    </ul>
                    <p>
                      Poți salva oricum — alegerea e a ta, iar site-ul va arăta exact cum ai ales. Dacă vrei să fii sigur
                      că se citește, treci pe Automat.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Cu culorile de acum, textele se citesc bine pe fundalurile lor.
                  </p>
                )}
              </CardBody>
            </Card>
          )}

          <Card>
            <CardBody className="flex flex-wrap items-center justify-between gap-3">
              <p className="max-w-xs text-xs text-muted-foreground">
                Vrei să renunți la tot ce ai ales? Site-ul revine la culorile șablonului „{numeSablon}”. Se aplică
                după ce apeși Salvează.
              </p>
              <Button variant="secondary" size="sm" onClick={reiaDeLaSablon} disabled={nimicAles}>
                Revino la culorile șablonului
              </Button>
            </CardBody>
          </Card>
          </>
        )}
      </div>

      <PanouPrevizualizare
        template={efectiv}
        cheie={`${semnatura(culori)}|${semnaturaFonturi(fonturiAlese)}`}
        titlu="Cum arată cu ce ai ales"
        // Ca proprietarul să vadă și culoarea butoanelor la hover, nu doar pe site.
        hoverPeButoane
        nota={
          previzualizare
            ? "Ce vezi e site-ul tău, cu textele și pozele tale, cu culorile și fonturile pe care le alegi. Se actualizează pe măsură ce alegi; derulează pagina ca să vezi tot. Modificările ajung pe site abia după ce apeși Salvează."
            : "Site-ul tău nu are încă nicio secțiune vizibilă, așa că aici vezi o pagină de exemplu, ca să se vadă culorile și fonturile. Se actualizează pe măsură ce alegi; derulează pagina ca să vezi tot. Modificările ajung pe site abia după ce apeși Salvează."
        }
      >
        <SiteHeader data={antet} friendly={efectiv.asezari.antetPastila} />
        <RenderSections rows={randuri} context={{ ...context, asezari: efectiv.asezari }} />
        <SiteFooter data={subsol} />
      </PanouPrevizualizare>

      <SaveBar
        isDirty={modificat}
        isSaving={seSalveaza}
        onSave={salveaza}
        onDiscard={() => {
          setStare({
            mod: referinta?.mod ?? "auto",
            principala: referinta?.principala ?? null,
            manual: referinta?.manual ?? {},
            finisaj: finisajul(referinta),
          });
          setFonturi(referintaFonturi ?? { titluri: null, text: null });
          setEroare(undefined);
        }}
        error={eroare}
      />
    </div>
  );
}

/** Ce i se spune omului după salvare: doar despre ce a schimbat (`undefined` = neschimbat). */
function mesajSalvat(culori: AspectCulori | null | undefined, fonturi: AspectFonturi | null | undefined): string {
  if (culori !== undefined && fonturi !== undefined) return "Culorile și fonturile au fost salvate.";
  if (fonturi !== undefined) return fonturi ? "Fonturile au fost salvate." : "Site-ul a revenit la fonturile șablonului.";
  return culori ? "Culorile au fost salvate." : "Site-ul a revenit la culorile șablonului.";
}

function ModDeAlegere({
  valoare,
  ales,
  titlu,
  recomandat,
  onAlege,
  children,
}: {
  valoare: ModCulori;
  ales: boolean;
  titlu: string;
  recomandat?: boolean;
  onAlege: () => void;
  children: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-base border p-3 text-sm",
        "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
        ales ? "border-foreground bg-surface-hover" : "border-border hover:bg-surface-hover",
      )}
    >
      <input type="radio" name="mod-culori" value={valoare} checked={ales} onChange={onAlege} className="mt-1" />
      <span className="space-y-1">
        <span className="block font-medium text-foreground">
          {titlu}
          {recomandat && <span className="ml-2 text-xs font-normal text-muted-foreground">(recomandat)</span>}
        </span>
        <span className="block text-xs leading-relaxed text-muted-foreground">{children}</span>
      </span>
    </label>
  );
}

/* ───────────────────────── exemplele din previzualizare ─────────────────────────
 *
 * Secțiunile sunt cele de pe site, cu texte de exemplu: culorile nu se pot judeca pe un
 * ecran gol. Câte una din fiecare ton (deschis, nuanțat, relief, închis), ca omul să vadă
 * toate fundalurile și textele de pe ele odată.
 *
 * „Închisul" îl poartă întrebările frecvente, nu citatul: la „Căldură" banda de citat stă
 * mereu pe relief (`citatRelief`), deci un citat pus pe închis n-ar fi arătat niciodată
 * fundalul închis, iar clientul ar fi ales o culoare pentru ceva ce nu vede.
 */

const SERVICII_EXEMPLU: Serviciu[] = [
  {
    id: "exemplu-1",
    slug: "consiliere",
    titlu: "Consiliere psihologică",
    descriereScurta: "Un spațiu sigur în care vorbim despre ce te apasă.",
    descriereCompleta: "",
    pret: "250 lei",
    durata: "50 min",
  },
  {
    id: "exemplu-2",
    slug: "psihoterapie",
    titlu: "Psihoterapie individuală",
    descriereScurta: "Ședințe regulate, în ritmul tău, pentru schimbări de durată.",
    descriereCompleta: "",
    pret: "300 lei",
    durata: "50 min",
  },
  {
    id: "exemplu-3",
    slug: "evaluare",
    titlu: "Evaluare psihologică",
    descriereScurta: "O imagine clară a punctelor tale forte și a ce poți îmbunătăți.",
    descriereCompleta: "",
    pret: "350 lei",
    durata: "90 min",
  },
];

const RANDURI_EXEMPLU: SectionRow[] = [
  {
    id: "exemplu-hero",
    key: "hero",
    variant: null,
    tone: "deschis",
    data: {
      eyebrow: "Cabinet de psihologie",
      titlu: "Un loc calm în care",
      titluAccent: "te poți asculta.",
      subtitlu: "Text de exemplu, ca să vezi cum arată culorile alese.",
      butonPrincipal: { text: "Programează-te", href: "#" },
      butonSecundar: { text: "Află mai multe", href: "#" },
    },
  },
  {
    id: "exemplu-servicii",
    key: "features",
    variant: null,
    tone: "nuantat",
    data: { eyebrow: "Servicii", titlu: "Cum te pot", titluAccent: "ajuta", intro: "Trei exemple de servicii." },
  },
  {
    id: "exemplu-citat",
    key: "quote",
    variant: null,
    tone: "relief",
    data: { citat: "Schimbarea începe cu o conversație sinceră.", autor: "Text de exemplu" },
  },
  {
    id: "exemplu-intrebari",
    key: "faq",
    variant: null,
    tone: "inchis",
    data: {
      eyebrow: "Întrebări frecvente",
      titlu: "Ce poți",
      titluAccent: "întreba",
      intrebari: [
        { intrebare: "Cât durează o ședință?", raspuns: "O ședință durează aproximativ 50 de minute." },
        { intrebare: "Cum mă pregătesc pentru prima întâlnire?", raspuns: "Nu e nevoie de nicio pregătire." },
      ],
    },
  },
];

const LINKURI_EXEMPLU = [
  { eticheta: "Consiliere psihologică", href: "#" },
  { eticheta: "Psihoterapie individuală", href: "#" },
  { eticheta: "Evaluare psihologică", href: "#" },
];
