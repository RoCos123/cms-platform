import type { MetadataRoute } from "next";
import { paginaEsteActiva, type Pagini } from "@/lib/setari";

/**
 * Regula după care se alege ce intră în sitemap, ruptă de citirea din bază.
 *
 * Stă separat ca să poată fi chiar probată: mediul de dezvoltare nu ajunge la
 * Supabase, deci un `sitemap.ts` care amestecă interogările cu decizia n-ar fi
 * putut fi verificat decât pe ochi. Aici intră date inventate și ies adrese,
 * fără rețea — vezi `e2e/sitemap-reguli.mjs`.
 *
 * Modulul n-are voie să capete importuri care ating rețeaua sau `next/headers`:
 * dacă le capătă, proba de mai sus nu mai pornește.
 */

/** Cât îi trebuie sitemap-ului dintr-un rând: adresa și când s-a schimbat. */
export type IntrareCitita = { slug: string; updated_at: string | null };

/** Tot ce s-a citit din baza clientului, înainte de orice decizie. */
export type ContinutulSiteului = {
  /** Comutatoarele din panou: care pagini sunt pornite. */
  pagini: Pagini;
  /** Ultima modificare a secțiunilor primei pagini. */
  modificareaPrimeiPagini?: string;
  /** Ultima modificare a unui serviciu publicat. */
  ultimaModificareServicii?: string;
  /** Articolele publicate, cele mai recent modificate întâi. */
  articole: IntrareCitita[];
  /** Paginile proprii publicate, FĂRĂ cele puse pe „Nicăieri”. */
  paginiProprii: IntrareCitita[];
  /** Se pot cere ore pe site? Modulul pornit ȘI măcar o zi bifată. */
  areProgramari?: boolean;
};

/**
 * Adresele publice ale unui site, în forma cerută de sitemap.
 *
 * Regula pe care o respectă fiecare rând: în sitemap intră EXACT ce răspunde cu
 * 200 pe site. Nimic în plus, nimic în minus. Originalul avea trei liste de
 * adrese care se contraziceau, iar sitemap-ul lui trimitea motoarele de căutare
 * în pagini inexistente (audit-site-public.md §3.2).
 *
 * De asta condițiile de aici le repetă pe cele din pagini: `/servicii` și
 * `/blog` fac `notFound()` când sunt oprite din panou, deci nici sitemap-ul nu
 * are voie să le anunțe.
 *
 * Fără `changeFrequency` și `priority`, deliberat: Google a spus public că le
 * ignoră pe amândouă, iar o cifră inventată („priority: 0,8”) arată ca o
 * informație fără să fie una. `lastModified` chiar e citit, și vine din
 * `updated_at`, întreținut de trigger (migrarea `updated_at_automat`).
 */
export function intrarileSitemapului(
  baza: URL,
  continut: ContinutulSiteului,
): MetadataRoute.Sitemap {
  const adresa = (cale: string) => new URL(cale, baza).toString();

  const intrari: MetadataRoute.Sitemap = [
    { url: baza.toString(), lastModified: continut.modificareaPrimeiPagini },
  ];

  // Oprită din panou înseamnă inexistentă, nu goală — vezi `notFound()` din
  // src/app/servicii/page.tsx. Serviciile n-au pagini proprii, doar ancore pe
  // pagina asta, deci o singură intrare (decizia e scrisă în CONTEXT.md).
  if (paginaEsteActiva(continut.pagini, "servicii")) {
    intrari.push({
      url: adresa("/servicii"),
      lastModified: continut.ultimaModificareServicii,
    });
  }

  // Comutatorul blogului stinge TOT blogul: și pagina, și articolele. Dacă am
  // lista aici articolele unui blog oprit, fiecare adresă din sitemap ar duce
  // la un 404 — exact greșeala pe care fișierul ăsta există ca s-o prevină.
  if (paginaEsteActiva(continut.pagini, "blog")) {
    intrari.push({
      url: adresa("/blog"),
      lastModified: continut.articole[0]?.updated_at ?? undefined,
    });

    for (const articol of continut.articole) {
      intrari.push({
        url: adresa(`/blog/${articol.slug}`),
        lastModified: articol.updated_at ?? undefined,
      });
    }
  }

  // Fără dată: programul se schimbă rar, dar orele libere se schimbă la
  // fiecare cerere. O dată aici ar fi ori învechită, ori mereu „acum".
  if (continut.areProgramari) intrari.push({ url: adresa("/programare") });

  for (const pagina of continut.paginiProprii) {
    intrari.push({
      url: adresa(`/${pagina.slug}`),
      lastModified: pagina.updated_at ?? undefined,
    });
  }

  return intrari;
}
