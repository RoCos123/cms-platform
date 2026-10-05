"use client";

import { useEffect, useRef, useState, useTransition, type KeyboardEvent, type PointerEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { InlineError, StatusBadge, type StatusValue } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast";
import { formateazaDataArticolului } from "@/lib/blog";
import { locDeLasare, mutaInLista, tintaPentruPas, type Directie } from "@/lib/ordine-articole";
import { comutaPublicareaArticolului, mutaArticolul, stergeArticol } from "./actions";

export type RandArticol = {
  id: string;
  titlu: string;
  extras: string;
  stare: StatusValue;
  publicatLa: string | null;
};

/**
 * Lista articolelor.
 *
 * Ordinea de aici e ordinea de pe site. Un articol nou se pune primul (deci „cel
 * mai nou primul" rămâne purtarea implicită), iar de mânerul „⋯" al rândului
 * poate fi tras în sus sau în jos — cerut de proprietar pe 5 oct. 2026. Până
 * atunci blogul se aranja singur, după dată, iar lista fusese făcută fără
 * mutare tocmai pe motivul ăsta. Întâi a fost un meniu cu „Mută mai sus/jos";
 * proprietarul l-a vrut tragere („ții apăsat pe cele trei puncte și muți").
 *
 * Tragerea e făcută cu evenimente de pointer, nu cu `draggable` nativ: aceea nu
 * merge pe telefon, iar panoul se folosește și de acolo. Mânerul are `touch-none`
 * (altfel degetul ar derula pagina în loc să tragă) și captează pointerul, deci
 * tragerea nu se pierde când degetul iese din buton. Pentru cine nu poate trage,
 * același mâner răspunde la săgețile sus/jos.
 *
 * Mutarea se salvează pe loc, ca publicarea: nu e o modificare de adunat și
 * trimis împreună cu altele.
 *
 * Publicarea se salvează pe loc, fără bară de jos: aici nu mai există altceva
 * de salvat împreună cu ea, deci o bară care așteaptă ar fi doar un pas în plus.
 */
export function ListaArticolePanou({ initiale }: { initiale: RandArticol[] }) {
  const [randuri, setRanduri] = useState(initiale);
  const [eroare, setEroare] = useState<string | null>(null);
  const [deSters, setDeSters] = useState<RandArticol | null>(null);
  const [seLucreaza, porneste] = useTransition();
  const [anunt, setAnunt] = useState("");
  const { show } = useToast();

  // O singură mutare odată: două apăsări repezi ar pleca amândouă din aceeași
  // listă veche, iar a doua ar strica rezultatul primeia. Un ref, nu o stare —
  // starea ar ajunge prea târziu pentru a doua apăsare din același moment.
  const seMuta = useRef(false);

  // Rândul mutat își schimbă locul în listă, iar browserul își pierde focusul
  // când i se mută nodul. Punem focusul înapoi pe mânerul aceluiași articol, ca
  // cine folosește tastatura să-și poată continua de unde a rămas.
  const manere = useRef(new Map<string, HTMLButtonElement | null>());
  const dupaMutare = useRef<string | null>(null);

  useEffect(() => {
    if (dupaMutare.current === null) return;
    manere.current.get(dupaMutare.current)?.focus();
    dupaMutare.current = null;
  }, [randuri]);

  function muta(rand: RandArticol, inaintea: string | null) {
    if (seMuta.current) return;

    const urmatoare = mutaInLista(randuri, rand.id, inaintea);
    if (!urmatoare) return;

    seMuta.current = true;
    setEroare(null);
    const anterioare = randuri;

    // Rândul se mută imediat; dacă serverul refuză, se întoarce la loc.
    dupaMutare.current = rand.id;
    setRanduri(urmatoare);
    setAnunt(
      `${rand.titlu}: poziția ${urmatoare.findIndex((r) => r.id === rand.id) + 1} din ${urmatoare.length}.`,
    );

    porneste(async () => {
      const rezultat = await mutaArticolul(rand.id, inaintea).catch(() => null);
      seMuta.current = false;

      if (!rezultat || !rezultat.ok) {
        dupaMutare.current = rand.id;
        setRanduri(anterioare);
        setEroare(rezultat?.mesaj ?? "Nu am putut salva. Verifică legătura la internet.");
        return;
      }

      // Ordinea de pe server câștigă: dacă între timp s-a mai mutat ceva dintr-un
      // alt panou, lista noastră se potrivește cu ea, nu invers. Rândurile
      // dispărute între timp se pierd aici; cele apărute vin la următoarea încărcare.
      setRanduri((curente) => {
        const dupaId = new Map(curente.map((r) => [r.id, r]));
        const potrivite = rezultat.ordine.flatMap((id) => dupaId.get(id) ?? []);
        return potrivite.length === curente.length ? potrivite : curente;
      });
    });
  }

  // --- Tragerea ----------------------------------------------------------
  //
  // Măsurătorile se iau O DATĂ, la apăsare, în coordonate de pagină (cu derularea
  // inclusă): în timpul tragerii rândul tras se mișcă cu `transform`, iar
  // celelalte stau pe loc, deci ce am măsurat rămâne valabil. În coordonate de
  // pagină, ca derularea din mers (când tragi spre marginea ecranului) să nu le
  // strice.
  const lista = useRef<HTMLUListElement>(null);
  const liuri = useRef(new Map<string, HTMLLIElement | null>());
  const sesiune = useRef<{
    id: string;
    indexInitial: number;
    startPagina: number;
    centruStart: number;
    listaSus: number;
    ceilalti: { id: string; sus: number; jos: number }[];
    clientY: number;
    slot: number;
  } | null>(null);
  // `linie` = unde se desenează linia „aici ajunge" (px, față de lista), sau `null`
  // cât rândul e încă pe locul lui. Se socotește aici, nu la randare: ține de
  // măsurătorile din `sesiune`, care e un ref.
  const [tragere, setTragere] = useState<{ id: string; dy: number; linie: number | null } | null>(null);

  function actualizeazaTragerea(clientY: number) {
    const s = sesiune.current;
    if (!s) return;
    s.clientY = clientY;
    const dy = clientY + window.scrollY - s.startPagina;
    s.slot = locDeLasare(
      s.ceilalti.map((rand) => (rand.sus + rand.jos) / 2),
      s.centruStart + dy,
    );
    // Linia stă în spațiul dintre rânduri (8px): 4px deasupra celui dinaintea
    // căruia ajunge, sau 4px sub ultimul când ajunge la coadă.
    const lipsit = s.slot < s.ceilalti.length ? s.ceilalti[s.slot].sus - 4 : s.ceilalti[s.ceilalti.length - 1].jos + 4;
    setTragere({ id: s.id, dy, linie: s.slot === s.indexInitial ? null : lipsit - s.listaSus - 1 });
  }

  function incepeTragerea(eveniment: PointerEvent<HTMLButtonElement>, rand: RandArticol) {
    // Doar butonul principal; și nu cât o mutare e în curs spre server.
    if (eveniment.button !== 0 || seMuta.current || sesiune.current) return;
    eveniment.preventDefault();
    eveniment.currentTarget.setPointerCapture(eveniment.pointerId);
    eveniment.currentTarget.focus();

    const derulare = window.scrollY;
    const masurate = randuri.flatMap((r) => {
      const dreptunghi = liuri.current.get(r.id)?.getBoundingClientRect();
      return dreptunghi ? [{ id: r.id, sus: dreptunghi.top + derulare, jos: dreptunghi.bottom + derulare }] : [];
    });
    const propriu = masurate.find((r) => r.id === rand.id);
    if (!propriu || !lista.current) return;

    const indexInitial = randuri.findIndex((r) => r.id === rand.id);
    sesiune.current = {
      id: rand.id,
      indexInitial,
      startPagina: eveniment.clientY + derulare,
      centruStart: (propriu.sus + propriu.jos) / 2,
      listaSus: lista.current.getBoundingClientRect().top + derulare,
      ceilalti: masurate.filter((r) => r.id !== rand.id),
      clientY: eveniment.clientY,
      slot: indexInitial,
    };
    setTragere({ id: rand.id, dy: 0, linie: null });
  }

  function incheieTragerea(comite: boolean) {
    const s = sesiune.current;
    if (!s) return;
    sesiune.current = null;
    setTragere(null);

    if (!comite || s.slot === s.indexInitial) return;
    const rand = randuri.find((r) => r.id === s.id);
    if (rand) muta(rand, s.ceilalti[s.slot]?.id ?? null);
  }

  function laTastaPeManer(eveniment: KeyboardEvent<HTMLButtonElement>, rand: RandArticol) {
    const directie: Directie | null =
      eveniment.key === "ArrowUp" ? "sus" : eveniment.key === "ArrowDown" ? "jos" : null;
    if (!directie) return;
    eveniment.preventDefault();

    const tinta = tintaPentruPas(
      randuri.map((r) => r.id),
      rand.id,
      directie,
    );
    if (tinta !== undefined) muta(rand, tinta);
  }

  // Cât ține tragerea: Escape o anulează, marginea ecranului derulează pagina
  // (altfel un articol din capătul unei liste lungi n-ar putea fi dus la celălalt
  // capăt), iar cursorul și selecția de text rămân cele de tragere oriunde ar fi
  // pointerul.
  const seTrage = tragere !== null;
  useEffect(() => {
    if (!seTrage) return;

    function laTasta(eveniment: globalThis.KeyboardEvent) {
      if (eveniment.key === "Escape") incheieTragerea(false);
    }
    window.addEventListener("keydown", laTasta);

    document.body.classList.add("se-trage-un-rand");

    let cadru = 0;
    function deruleaza() {
      const s = sesiune.current;
      if (s) {
        const margine = 80;
        const viteza = (depasire: number) => Math.min(24, 4 + depasire / 4);
        let pas = 0;
        if (s.clientY < margine) pas = -viteza(margine - s.clientY);
        else if (s.clientY > window.innerHeight - margine) pas = viteza(s.clientY - (window.innerHeight - margine));
        if (pas !== 0) {
          const inainte = window.scrollY;
          window.scrollBy(0, pas);
          if (window.scrollY !== inainte) actualizeazaTragerea(s.clientY);
        }
      }
      cadru = requestAnimationFrame(deruleaza);
    }
    cadru = requestAnimationFrame(deruleaza);

    return () => {
      window.removeEventListener("keydown", laTasta);
      cancelAnimationFrame(cadru);
      document.body.classList.remove("se-trage-un-rand");
    };
    // `incheieTragerea`/`actualizeazaTragerea` citesc doar ref-uri și starea
    // curentă prin închidere; reabonarea la fiecare randare ar fi degeaba.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seTrage]);

  function comuta(rand: RandArticol, publicat: boolean) {
    setEroare(null);
    const anterioare = randuri;

    // Bifa se mișcă imediat, ca apăsarea să aibă un răspuns; dacă serverul
    // refuză, se pune la loc mai jos.
    setRanduri((precedente) =>
      precedente.map((r) =>
        r.id === rand.id
          ? {
              ...r,
              stare: publicat ? "published" : "unpublished",
              publicatLa: r.publicatLa ?? (publicat ? new Date().toISOString() : null),
            }
          : r,
      ),
    );

    porneste(async () => {
      const rezultat = await comutaPublicareaArticolului(rand.id, publicat).catch(() => null);

      if (!rezultat || !rezultat.ok) {
        setRanduri(anterioare);
        setEroare(rezultat?.mesaj ?? "Nu am putut salva. Verifică legătura la internet.");
        return;
      }

      show(publicat ? "Articolul e acum pe site." : "Articolul a fost retras de pe site.", "success");
    });
  }

  return (
    <>
      <p aria-live="polite" className="sr-only">
        {anunt}
      </p>

      {eroare && <InlineError>{eroare}</InlineError>}

      <ul ref={lista} className="relative space-y-2">
        {randuri.map((rand) => {
          const data = formateazaDataArticolului(rand.publicatLa);
          const tras = tragere?.id === rand.id;

          return (
            <li
              key={rand.id}
              ref={(element) => {
                liuri.current.set(rand.id, element);
              }}
              // Rândul tras urmărește pointerul și stă deasupra celorlalte; restul
              // rămân pe loc, iar linia de mai jos arată unde va ajunge.
              style={tras ? { transform: `translateY(${tragere.dy}px)` } : undefined}
              className={`flex flex-wrap items-center gap-x-4 gap-y-3 rounded-base border bg-surface p-4 ${
                tras ? "relative z-10 border-primary shadow-lg" : "border-border"
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-medium text-foreground">
                  {rand.titlu}
                  <StatusBadge status={rand.stare} />
                </p>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {rand.extras || "Fără descriere scurtă."}
                </p>
                {data && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {rand.stare === "published" ? "Publicat pe" : "Publicat prima oară pe"} {data}
                  </p>
                )}
              </div>

              <Link
                href={`/dashboard/blog/${rand.id}`}
                className="shrink-0 rounded-base px-3 py-1.5 text-sm font-medium text-foreground underline hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Editează
              </Link>

              <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={rand.stare === "published"}
                  disabled={seLucreaza}
                  onChange={(eveniment) => comuta(rand, eveniment.target.checked)}
                  className="size-4 accent-primary"
                />
                Pe site
              </label>

              <Button
                variant="ghost"
                size="sm"
                disabled={seLucreaza}
                onClick={() => setDeSters(rand)}
                aria-label={`Șterge articolul ${rand.titlu}`}
                className="shrink-0"
              >
                <span aria-hidden>🗑</span>
              </Button>

              {/* Cu un singur articol n-are ce muta. Mâner de tras (mouse și deget) care
                  răspunde și la săgețile sus/jos. */}
              {randuri.length > 1 && (
                <Button
                  ref={(element) => {
                    manere.current.set(rand.id, element);
                  }}
                  variant="ghost"
                  size="sm"
                  aria-label={`Mută articolul ${rand.titlu}: ține apăsat și trage în sus sau în jos, sau apasă săgeata sus ori jos`}
                  title="Ține apăsat și trage ca să muți articolul"
                  onPointerDown={(eveniment) => incepeTragerea(eveniment, rand)}
                  onPointerMove={(eveniment) => {
                    if (sesiune.current?.id === rand.id) actualizeazaTragerea(eveniment.clientY);
                  }}
                  onPointerUp={() => incheieTragerea(true)}
                  onPointerCancel={() => incheieTragerea(false)}
                  onKeyDown={(eveniment) => laTastaPeManer(eveniment, rand)}
                  className="shrink-0 cursor-grab touch-none select-none active:cursor-grabbing"
                >
                  <span aria-hidden className="text-base leading-none">
                    ⋯
                  </span>
                </Button>
              )}
            </li>
          );
        })}

        {tragere?.linie != null && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 z-20 h-0.5 rounded-full bg-primary"
            style={{ top: tragere.linie }}
          />
        )}
      </ul>

      <ConfirmDialog
        open={deSters !== null}
        onOpenChange={(deschis) => !deschis && setDeSters(null)}
        title="Ștergi articolul?"
        description={
          deSters ? `„${deSters.titlu}” dispare de pe site și din panou, cu tot textul lui.` : undefined
        }
        warning="Dacă vrei doar să nu se mai vadă pe site, debifează „Pe site” în loc să ștergi."
        confirmLabel="Șterge"
        tone="danger"
        pending={seLucreaza}
        onConfirm={() => {
          const articol = deSters;
          if (!articol) return;
          setDeSters(null);
          porneste(async () => {
            const rezultat = await stergeArticol(articol.id).catch(() => null);
            if (!rezultat || !rezultat.ok) {
              setEroare(rezultat?.mesaj ?? "Nu am putut șterge. Verifică legătura la internet.");
              return;
            }
            setRanduri((precedente) => precedente.filter((r) => r.id !== articol.id));
            show("Articolul a fost șters.", "success");
          });
        }}
      />
    </>
  );
}
