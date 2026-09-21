"use client";

import { useEffect, useRef, useState } from "react";
import { alegeFurnizor, type Furnizor, type NumeFurnizor } from "@/lib/captcha";

type OptiuniWidget = {
  sitekey: string;
  theme?: "light" | "dark";
  hl?: string;
  language?: string;
};

type ApiCaseta = {
  render: (element: HTMLElement, optiuni: OptiuniWidget) => string | undefined;
  remove?: (widgetId: string) => void;
  reset?: (widgetId: string) => void;
};

declare global {
  interface Window {
    hcaptcha?: ApiCaseta;
    turnstile?: ApiCaseta;
  }
}

/** Cât așteptăm scriptul înainte să-i spunem omului că nu s-a încărcat. */
const RABDARE_MS = 12_000;

const numeCallback = (furnizor: NumeFurnizor) => `__casetaAntispamGata_${furnizor}`;

/**
 * O singură încărcare pe furnizor, oricâte casete ar fi pe pagină. Contactul și
 * newsletterul stau des pe aceeași pagină, iar două `<script>` identice ar
 * însemna două SDK-uri care se calcă unul pe altul.
 */
const incarcari = new Map<NumeFurnizor, Promise<void>>();

/**
 * Randare EXPLICITĂ, nu implicită.
 *
 * Varianta implicită (scriptul caută singur casetele la încărcare) pare mai
 * simplă, dar se rupe exact în cazul obișnuit: cineva ajunge pe pagina de
 * contact navigând din site, deci după ce scriptul s-a încărcat deja. Scriptul
 * nu mai scanează a doua oară, widgetul nu apare, iar formularul devine
 * netrimisibil fără niciun mesaj.
 *
 * Semnalul „e gata” e callbackul global din `?onload=`, nu evenimentul `load` al
 * tagului: documentația hCaptcha cere explicit să nu chemi `render()` pe `load`,
 * fiindcă SDK-ul poate fi încă în curs de pornire. `load` rămâne doar ca plasă
 * de siguranță, pentru cazul în care scriptul vine din cache fără să mai cheme
 * callbackul.
 *
 * Primul argument al lui `render()` e un NOD, nu un id de container — verificat
 * în componenta React oficială hCaptcha (`@hcaptcha/react-hcaptcha`, care face
 * exact `this._hcaptcha.render(this.ref.current, …)`), fiindcă documentația
 * scrisă spune „container ID” și cele două nu se potrivesc. Rețelele către
 * hCaptcha sunt blocate din mediul în care s-a scris codul ăsta, deci n-a putut
 * fi probat cu widgetul viu: de verificat cu ochii pe ecran la prima punere a
 * cheilor.
 */
function incarcaScript(furnizor: Furnizor): Promise<void> {
  if (window[furnizor.global]) return Promise.resolve();

  const inCurs = incarcari.get(furnizor.nume);
  if (inCurs) return inCurs;

  const promisiune = new Promise<void>((rezolva, respinge) => {
    // Ceasul e prima linie fiindcă restul se sprijină pe el: fără o limită de
    // răbdare, un script care se încarcă dar nu pornește lasă promisiunea
    // nerezolvată pe veci — nicio casetă, niciun mesaj, iar omul rămâne cu un
    // formular care pare bun și e respins la trimitere.
    const ceas = setTimeout(() => reject(new Error("scriptul nu a pornit la timp")), RABDARE_MS);

    // Declarații de funcție, ca să poată fi chemate de ceasul de mai sus.
    function resolve() {
      clearTimeout(ceas);
      rezolva();
    }
    function reject(motiv: Error) {
      clearTimeout(ceas);
      respinge(motiv);
    }

    const numele = numeCallback(furnizor.nume);
    const fereastra = window as unknown as Record<string, unknown>;
    fereastra[numele] = () => resolve();

    const script = document.createElement("script");
    script.src = furnizor.script(numele);
    script.async = true;
    script.defer = true;
    script.dataset.caseta = furnizor.nume;

    script.addEventListener("error", () => reject(new Error("scriptul nu s-a încărcat")), {
      once: true,
    });
    script.addEventListener("load", () => {
      if (window[furnizor.global]) resolve();
    }, { once: true });

    document.head.appendChild(script);
  });

  incarcari.set(furnizor.nume, promisiune);
  // O pană de moment nu trebuie să strice și încercările următoare: promisiunea
  // respinsă se scoate din cache, ca o remontare să poată încerca din nou.
  promisiune.catch(() => incarcari.delete(furnizor.nume));

  return promisiune;
}

/**
 * Caseta anti-spam.
 *
 * Randează un input ascuns cu tokenul (`h-captcha-response` la hCaptcha,
 * `cf-turnstile-response` la Turnstile) pe care Server Action-ul îl verifică
 * prin `verificaCaptcha`. Dacă platforma n-are cheie configurată, componenta nu
 * se folosește deloc (vezi secțiunile de contact, newsletter și programare) —
 * iar serverul, la rândul lui, sare peste verificare. Cele două decizii trebuie
 * să rămână împreună.
 *
 * Tokenul e de unică folosință: după fiecare trimitere, formularul schimbă
 * `key`-ul componentei, React o remontează, iar widgetul cere un token nou.
 */
export function Caseta({
  siteKey,
  furnizor: numeFurnizor,
  tema,
}: {
  siteKey: string;
  furnizor?: string | null;
  tema: "light" | "dark";
}) {
  const container = useRef<HTMLDivElement>(null);
  const [esuat, setEsuat] = useState(false);

  useEffect(() => {
    const furnizor = alegeFurnizor(numeFurnizor);
    let anulat = false;
    let widgetId: string | undefined;

    incarcaScript(furnizor)
      .then(() => {
        const api = window[furnizor.global];
        if (anulat || !container.current || !api) return;
        widgetId = api.render(container.current, {
          sitekey: siteKey,
          theme: tema,
          // Engleză dinadins, deși site-ul e în română: proprietarul a ales „I am
          // human" în locul „Eu sunt om" — i se pare mai îngrijit. E singurul text
          // din casetă pe care îl putem influența; restul îl scrie furnizorul.
          [furnizor.campLimba]: "en",
        });
      })
      .catch(() => {
        if (!anulat) setEsuat(true);
      });

    return () => {
      anulat = true;
      if (!widgetId) return;
      const api = window[furnizor.global];
      // `remove` curăță tot; `reset` e ce au unele versiuni. Fără niciunul,
      // nodul dispare oricum odată cu containerul.
      if (api?.remove) api.remove(widgetId);
      else if (api?.reset) api.reset(widgetId);
    };
  }, [siteKey, numeFurnizor, tema]);

  if (esuat) {
    /*
      Textul spune adevărul, chiar dacă e mai puțin plăcut. Serverul respinge
      trimiterea fără token atunci când platforma are cheie pusă (vezi
      `verificaCaptcha`) — un „poți trimite mesajul oricum” ar fi trimis omul
      într-un buton care nu funcționează. „Reîncarcă pagina” e singurul sfat
      care chiar rezolvă, fiindcă de obicei e o blocare de moment.
    */
    return (
      <p role="alert" style={{ margin: 0, fontSize: "14px", color: "var(--s-eroare)" }}>
        Verificarea anti-spam nu s-a încărcat. Reîncarcă pagina, te rugăm — fără ea mesajul nu
        poate fi trimis.
      </p>
    );
  }

  return <div ref={container} />;
}

/**
 * Caseta anti-spam, dar încărcată abia când chiar se apropie momentul.
 *
 * De ce există: SDK-ul hCaptcha e enorm (~730 KiB cu tot cu iframe-ul lui) și, la
 * montarea `Caseta`, pornește imediat. Formularul de newsletter și cel de contact
 * stau pe prima pagină, dar SUB primul ecran — deci pe un site abia deschis se
 * descărcau ~730 KiB de captcha înainte ca vizitatorul să apuce să vadă titlul.
 * În Lighthouse asta ținea lanțul critic și LCP-ul la ~4s degeaba.
 *
 * Acum widgetul se montează abia când: (1) locul lui ajunge la ~800px de ecran
 * (deci apucă să se încarce înainte să derulezi până la el), SAU (2) atingi/pui
 * focus în formularul din jur. Oricare vine prima. Pe o pagină unde formularul e
 * deja pe primul ecran, observatorul pornește pe loc, deci nu se pierde nimic.
 *
 * Tokenul rămâne de unică folosință: `key`-ul de pe componentă (din formular) o
 * remontează după fiecare trimitere, la fel ca înainte.
 */
export function CasetaAmanata(props: {
  siteKey: string;
  furnizor?: string | null;
  tema: "light" | "dark";
}) {
  const ancora = useRef<HTMLDivElement>(null);
  const [activ, setActiv] = useState(false);

  useEffect(() => {
    if (activ) return;
    const nod = ancora.current;
    if (!nod) return;

    let pornit = false;
    const porneste = () => {
      if (pornit) return;
      pornit = true;
      setActiv(true);
    };

    // Aproape de ecran. `rootMargin` generos, ca widgetul să fie deja acolo când
    // ajungi la el. Observatorul cheamă callbackul pe loc dacă locul e deja în
    // cadru (ex. formularul e pe primul ecran, sau remontare după trimitere).
    const observator = new IntersectionObserver(
      (intrari) => {
        if (intrari.some((i) => i.isIntersecting)) porneste();
      },
      { rootMargin: "800px 0px" },
    );
    observator.observe(nod);

    // Sau prima atingere a formularului din jur — dacă cineva pune focus pe câmp
    // înainte ca locul casetei să intre în raza de mai sus.
    const form = nod.closest("form");
    form?.addEventListener("focusin", porneste, { once: true });
    form?.addEventListener("pointerdown", porneste, { once: true });

    return () => {
      observator.disconnect();
      form?.removeEventListener("focusin", porneste);
      form?.removeEventListener("pointerdown", porneste);
    };
  }, [activ]);

  if (activ) return <Caseta {...props} />;

  // Cât timp e amânată, un loc gol de înălțime zero. Nu rezervăm înălțimea
  // widgetului: se activează cu 800px înainte să intre în ecran, deci e încărcat
  // până ajungi la el — nu se vede niciun salt de așezare.
  return <div ref={ancora} aria-hidden />;
}
