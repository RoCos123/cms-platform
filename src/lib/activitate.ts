import type { ActiuneAudit, EntitateAudit } from "@/lib/audit";

/**
 * Cum se citește jurnalul de activitate: ce scrie pe fiecare rând și cum se
 * grupează rândurile pe zile.
 *
 * Stă rupt de citirea din bază ca să poată fi probat fără Supabase — aceeași
 * despărțire ca la `sitemap-reguli.ts`. Importul din `audit.ts` e doar de
 * tipuri, deci `server-only` de acolo nu ajunge aici.
 *
 * Fusul e scris explicit: serverul rulează pe UTC, iar clienții sunt în
 * România. Fără el, tot ce se întâmplă după ora 3 dimineața vara ar fi grupat
 * la ziua următoare — adică „azi" ar apărea sub „mâine".
 */
const FUSUL = "Europe/Bucharest";

/** Forma gramaticală a subiectului, de care ascultă verbul. */
type Forma = "m" | "f" | "plural";

/**
 * Cum se numesc lucrurile în românește, cu genul lor.
 *
 * Genul nu e decor: „o pagină a fost șters" e greșit, iar clientul citește
 * rândurile astea ca pe niște propoziții, nu ca pe un log de server.
 */
const ENTITATI: Record<EntitateAudit, { subiect: string; forma: Forma }> = {
  Page: { subiect: "O pagină", forma: "f" },
  Service: { subiect: "Un serviciu", forma: "m" },
  Appointment: { subiect: "O programare", forma: "f" },
  BlogArticle: { subiect: "Un articol", forma: "m" },
  BlogCategory: { subiect: "O categorie", forma: "f" },
  SiteContent: { subiect: "O secțiune", forma: "f" },
  SiteSettings: { subiect: "Setările", forma: "plural" },
  Upload: { subiect: "O imagine", forma: "f" },
  ContactSubmission: { subiect: "Un mesaj", forma: "m" },
  Session: { subiect: "Sesiunea", forma: "f" },
};

const VERBE: Record<
  Exclude<ActiuneAudit, "login" | "logout">,
  Record<Forma, string>
> = {
  create: { m: "a fost creat", f: "a fost creată", plural: "au fost create" },
  update: { m: "a fost modificat", f: "a fost modificată", plural: "au fost modificate" },
  delete: { m: "a fost șters", f: "a fost ștearsă", plural: "au fost șterse" },
  publish: { m: "a fost publicat", f: "a fost publicată", plural: "au fost publicate" },
  unpublish: { m: "a fost retras", f: "a fost retrasă", plural: "au fost retrase" },
};

/**
 * Ce scrie pe rând.
 *
 * Aproape toate acțiunile își pun singure un rezumat scris de om („Pagina
 * «Tarife» a fost publicată”), fiindcă doar ele știu despre CE anume e vorba.
 * Când lipsește — o acțiune nouă care a uitat să-l scrie, sau una veche
 * dinainte să existe obiceiul — se compune unul din acțiune și entitate.
 *
 * Fără plasa asta, rândul ar fi gol: clientul ar vedea o oră și nimic altceva,
 * adică fix opusul motivului pentru care se uită în jurnal.
 */
export function descrieIntrarea(intrare: {
  actiune: ActiuneAudit;
  entitate: EntitateAudit;
  rezumat?: string | null;
}): string {
  const scris = intrare.rezumat?.trim();
  if (scris) return scris;

  if (intrare.actiune === "login") return "Conectare în panou.";
  if (intrare.actiune === "logout") return "Deconectare din panou.";

  const entitate = ENTITATI[intrare.entitate];
  const verb = VERBE[intrare.actiune];

  // O acțiune sau o entitate necunoscută (adăugată în bază, dar nu și aici) nu
  // are voie să dărâme ecranul — jurnalul e ultimul loc unde vrei o eroare.
  if (!entitate || !verb) return "S-a făcut o modificare.";

  return `${entitate.subiect} ${verb[entitate.forma]}.`;
}

export type IntrareJurnal = {
  id: string;
  text: string;
  /** Emailul celui care a făcut-o. Lipsește când a făcut-o chiar cine se uită. */
  autor?: string;
  /** Momentul, ISO, așa cum vine din bază. */
  cand: string;
};

export type ZiDeJurnal = { cheie: string; eticheta: string; intrari: IntrareJurnal[] };

const ZIUA_SORTABILA = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSUL,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const ZIUA_SCRISA = new Intl.DateTimeFormat("ro-RO", {
  timeZone: FUSUL,
  day: "numeric",
  month: "long",
  year: "numeric",
});

const ORA = new Intl.DateTimeFormat("ro-RO", {
  timeZone: FUSUL,
  hour: "2-digit",
  minute: "2-digit",
});

/** Ora la care s-a întâmplat, în fusul clientului. */
export function oraIntrarii(cand: string): string {
  return ORA.format(new Date(cand));
}

/**
 * Grupează intrările pe zile, cele mai noi întâi.
 *
 * Pe zile, nu cu „acum două ore”: un timp relativ calculat pe server rămâne
 * înțepenit cât timp pagina stă deschisă, iar peste o oră minte. Ziua plus ora
 * exactă nu îmbătrânesc.
 *
 * `acum` se dă din afară ca „Azi” și „Ieri” să poată fi probate fără să depindă
 * de ceasul mașinii pe care rulează testul.
 */
export function grupeazaPeZile(intrari: IntrareJurnal[], acum: Date): ZiDeJurnal[] {
  const azi = ZIUA_SORTABILA.format(acum);
  const ieri = ZIUA_SORTABILA.format(new Date(acum.getTime() - 24 * 60 * 60 * 1000));

  const zile = new Map<string, ZiDeJurnal>();

  for (const intrare of intrari) {
    const moment = new Date(intrare.cand);
    const cheie = ZIUA_SORTABILA.format(moment);

    if (!zile.has(cheie)) {
      zile.set(cheie, {
        cheie,
        eticheta: cheie === azi ? "Azi" : cheie === ieri ? "Ieri" : ZIUA_SCRISA.format(moment),
        intrari: [],
      });
    }

    zile.get(cheie)!.intrari.push(intrare);
  }

  // Ordinea vine din interogare (cele mai noi întâi) și se păstrează prin Map,
  // dar o sortare explicită costă nimic și nu lasă ecranul la mila ei.
  return [...zile.values()].sort((a, b) => b.cheie.localeCompare(a.cheie));
}
