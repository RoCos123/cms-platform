"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { EVENIMENT_ARATA_POZA, tintaDerulare } from "@/lib/arata-poza";
import { Button } from "@/components/ui/button";
import { CadruPrevizualizare } from "./cadru-previzualizare";
import { LimitaEroare } from "./limita-eroare";
import { templateStyle, type Template } from "@/lib/templates";
import { templateFontStyle } from "@/lib/templates/fonturi";

const LATIMI = [
  { eticheta: "Laptop", valoare: 1180 },
  { eticheta: "Telefon", valoare: 390 },
] as const;

/**
 * Coloana de previzualizare, aceeași peste tot în panou.
 *
 * Extrasă când a fost nevoie de ea a doua oară (secțiuni și setări). Dacă
 * fiecare ecran și-ar fi construit-o singur, comutatorul Laptop/Telefon ar fi
 * ajuns să arate altfel într-un loc decât în celălalt, iar plasa de siguranță
 * ar fi lipsit exact de unde n-a pus-o nimeni.
 */
export function PanouPrevizualizare({
  template,
  cheie,
  titlu = "Cum arată pe site",
  nota,
  children,
}: {
  template: Template;
  /** Se schimbă odată cu conținutul — repornește previzualizarea după o eroare. */
  cheie: unknown;
  /** De obicei un text; poate fi și un comutator (ex. „Prima pagină / Pagina de servicii"). */
  titlu?: ReactNode;
  nota: ReactNode;
  children: ReactNode;
}) {
  const [latime, setLatime] = useState<number>(LATIMI[0].valoare);
  const fereastraRef = useRef<HTMLDivElement>(null);

  /*
    Când tragi de o poză în formular (sau îi schimbi mărimea), previzualizarea
    se derulează până la ea — altfel, la un hero înalt, poza stătea sub marginea
    ecranului și n-o vedeai mișcându-se (4 oct. 2026). Vezi `arata-poza.ts`.
  */
  useEffect(() => {
    function arata(e: Event) {
      const src = (e as CustomEvent<{ src?: string }>).detail?.src;
      const fereastra = fereastraRef.current;
      const iframe = fereastra?.querySelector("iframe");
      const doc = iframe?.contentDocument;
      if (!src || !fereastra || !iframe || !doc) return;

      const poza = Array.from(doc.querySelectorAll<HTMLElement>("[data-poza]")).find(
        (el) => el.dataset.poza === src,
      );
      if (!poza) return;

      // Iframe-ul e micșorat cu `transform`: dimensiunile din el se înmulțesc cu
      // scara ca să ajungă în pixelii ferestrei.
      const scara = iframe.getBoundingClientRect().width / (iframe.offsetWidth || 1);
      const r = poza.getBoundingClientRect();
      const susIframe =
        iframe.getBoundingClientRect().top - fereastra.getBoundingClientRect().top + fereastra.scrollTop;

      // Contează doar partea din fereastră care e pe ECRAN: până se lipește
      // sus, fereastra poate coborî sub marginea de jos a ecranului — iar jos
      // stă bara „Ai modificări nesalvate", care acoperă ce e sub ea.
      const f = fereastra.getBoundingClientRect();
      const bara = document.querySelector("[data-bara-salvare]")?.getBoundingClientRect();
      const josEcran = Math.min(window.innerHeight, bara && bara.top > 0 ? bara.top : window.innerHeight);
      const ascunsSus = Math.max(0, -f.top);
      const vizibilJos = Math.min(f.height, josEcran - f.top);

      const tinta = tintaDerulare({
        sus: susIframe + r.top * scara,
        inaltime: r.height * scara,
        derulareAcum: fereastra.scrollTop + ascunsSus,
        inaltimeFereastra: Math.max(0, vizibilJos - ascunsSus),
      });
      if (tinta !== null) {
        // Sincronizarea cu pagina tace cât ține mișcarea, ca să n-o anuleze.
        fereastra.dataset.sincronDupa = String(Date.now() + 1500);
        fereastra.scrollTo({ top: Math.max(0, tinta - ascunsSus), behavior: "smooth" });
      }
    }

    window.addEventListener(EVENIMENT_ARATA_POZA, arata);
    return () => window.removeEventListener(EVENIMENT_ARATA_POZA, arata);
  }, []);

  /*
    Fereastra previzualizării se derulează ÎMPREUNĂ CU PAGINA (5 oct. 2026).

    De ce: pe ecran lat fereastra n-are bară proprie (pâlpâia în Edge — vezi
    clasa de mai jos), iar o secțiune mai înaltă decât ecranul rămânea cu partea
    de jos de nevăzut: proprietarul a pus a doua bulină, jos pe poză, și n-o
    vedea nicăieri. Acum, cât derulezi pagina (formularul), fereastra alunecă
    proporțional prin secțiune: cu pagina sus vezi începutul, cu pagina jos
    capătul — orice loc al previzualizării se poate vedea, fără nicio bară.

    După o derulare cerută de o poză (`arata`, mai sus), sincronizarea tace o
    vreme, ca să nu tragă fereastra înapoi din mișcarea abia făcută.
  */
  useEffect(() => {
    const fereastra = fereastraRef.current;
    if (!fereastra) return;

    const sincronizeaza = () => {
      if (Date.now() < +(fereastra.dataset.sincronDupa ?? 0)) return;
      const deDerulatPagina = document.documentElement.scrollHeight - window.innerHeight;
      const deDerulatFereastra = fereastra.scrollHeight - fereastra.clientHeight;
      if (deDerulatPagina <= 0 || deDerulatFereastra <= 0) return;
      fereastra.scrollTop = (window.scrollY / deDerulatPagina) * deDerulatFereastra;
    };

    window.addEventListener("scroll", sincronizeaza, { passive: true });
    window.addEventListener("resize", sincronizeaza);
    return () => {
      window.removeEventListener("scroll", sincronizeaza);
      window.removeEventListener("resize", sincronizeaza);
    };
  }, []);

  return (
    // Pe ecran lat stă în dreapta formularului și rămâne lipită sus cât derulezi.
    // Pe ecran îngust cele două coloane se așază una sub alta, iar previzualizarea
    // trece DEASUPRA: sub formular ar ajunge după zeci de câmpuri, adică s-ar
    // scrie fără s-o vadă nimeni.
    <div className="sticky top-0 z-10 order-first bg-background pb-4 lg:order-none lg:top-6 lg:pb-0">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="text-sm font-medium text-foreground">{titlu}</div>
        <div className="flex gap-1" role="group" aria-label="Lățimea previzualizării">
          {LATIMI.map((optiune) => (
            <Button
              key={optiune.valoare}
              size="sm"
              variant={latime === optiune.valoare ? "secondary" : "ghost"}
              aria-pressed={latime === optiune.valoare}
              onClick={() => setLatime(optiune.valoare)}
            >
              {optiune.eticheta}
            </Button>
          ))}
        </div>
      </div>

      {/*
        Fereastra previzualizării nu trece de marginea ecranului: pe ecran lat stă
        lipită sus, deci tot ce ieșea sub ea (poza unui hero înalt) nu se mai
        vedea deloc. Acum se derulează în interior.
      */}
      <div
        ref={fereastraRef}
        // `pb-24` pe ecran lat: loc liber sub previzualizare, ca o poză aflată
        // chiar la capătul ei să poată fi derulată deasupra barei de salvare.
        //
        // `scrollbar-gutter: stable` — locul barei de derulare e rezervat MEREU.
        // Fără el, previzualizarea pâlpâia (5 oct. 2026, prins de proprietar):
        // când conținutul era cât fereastra, apărea bara, lățimea scădea cu
        // ~15px, previzualizarea se micșora (scara urmează lățimea), încăpea,
        // bara dispărea, lățimea creștea la loc, nu mai încăpea — la fiecare
        // cadru. Reprodus la ferestre de 876–884px înălțime: lățimea se schimba
        // în 29 din 30 de cadre. Cu locul rezervat, lățimea nu mai depinde de
        // bară, deci bucla n-are de unde porni.
        // Pe ecran lat, `overflow-y-HIDDEN`, nu `auto` (5 oct. 2026, Edge):
        // chiar cu locul barei rezervat, derularea paginii peste fereastra
        // derulabilă cu iframe-ul micșorat pâlpâia la proprietar. `hidden` scoate
        // bara cu totul — exact ca înainte de 4 oct., când nu pâlpâia — dar
        // rămâne derulabil DIN COD (`scrollTo` merge pe `hidden`), deci
        // aducerea pozei în vedere nu se pierde.
        className="max-h-[52vh] overflow-y-auto overscroll-contain rounded-base [scrollbar-gutter:stable] lg:max-h-[calc(100vh-10rem)] lg:overflow-y-hidden lg:[scrollbar-gutter:auto] lg:pb-24"
      >
        <LimitaEroare
          cheie={cheie}
          fallback={
            <div className="rounded-base border border-border bg-surface p-6 text-sm text-muted-foreground">
              Previzualizarea nu s-a putut afișa pentru ce e scris acum în formular.
              Continuă să scrii — se reia singură. Ce ai completat nu s-a pierdut.
            </div>
          }
        >
          <CadruPrevizualizare latime={latime}>
            <div
              style={{
                ...templateStyle(template),
          ...templateFontStyle(template),
                background: "var(--t-fundal)",
                color: "var(--t-text)",
                fontFamily: "var(--t-font-principal)",
              }}
            >
              {children}
            </div>
          </CadruPrevizualizare>
        </LimitaEroare>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">{nota}</p>
    </div>
  );
}
