import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { isPlatformHost } from "@/lib/tenant";
import { adresaAbsoluta, adresaSiteului } from "@/lib/seo";
import { DISALLOW_ROBOTS } from "@/lib/rute";

/**
 * Ce nu are ce căuta în Google, nici măcar ca titlu într-un rezultat.
 *
 * `/site-unavailable` e în listă fiindcă e o rută adevărată, nu doar ținta unei
 * rescrieri: cine îi nimerește adresa pe domeniul unui client primește pagina,
 * iar un motor de căutare ar indexa-o ca pagină a cabinetului.
 *
 * Lista vine din `src/lib/rute.ts`, scrisă ca să se potrivească pe segment de
 * cale, nu pe prefix de text: `Disallow: /dashboard` ar fi ținut afară din
 * Google și o pagină a clientului numită `dashboard-ul-meu`.
 */
const RUTE_NEPUBLICE = DISALLOW_ROBOTS;

/**
 * `robots.txt`, scris pe domeniul clientului, nu pe al nostru.
 *
 * Ruta e dinamică fiindcă citește antetele cererii — vezi nota din
 * node_modules/next/dist/docs/.../metadata/robots.md: fișierul e memorat
 * implicit, dar orice API care depinde de cerere îl face dinamic. Aici chiar
 * trebuie: același cod servește toți clienții, iar răspunsul diferă per domeniu.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const gazda = (await headers()).get("host") ?? "";

  /**
   * Pe gazdele platformei (preview Vercel, dezvoltare) nu se indexează nimic.
   *
   * Nu e exces de prudență: cu `DEV_TENANT_DOMAIN` setat, orice adresă
   * `*.vercel.app` servește site-ul unui client real (vezi src/proxy.ts). Fără
   * linia asta, aceleași pagini ar fi indexabile pe două domenii — cabinetul ar
   * concura cu sine însuși, iar varianta de preview ar putea ieși prima.
   *
   * CONTEXT.md cere ca variabila aia să lipsească din Production. Refuzul de
   * aici e plasa pentru ziua în care cineva o setează totuși.
   */
  if (isPlatformHost(gazda)) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  /*
   * Site nepublicat: nu e nimic de indexat, nici măcar pagina de așteptare.
   *
   * Contează mai mult decât pare. Un cabinet care intră prima dată în Google cu
   * „pagina se pregătește" își începe viața în căutare cu pagina aia — și rămâne
   * așa săptămâni, fiindcă reindexarea nu se cere, se așteaptă.
   *
   * Merge la pachet cu `noindex` din layoutul rădăcină și cu sitemap-ul gol.
   * Cele trei se schimbă mereu împreună.
   */
  if ((await headers()).get("x-nepublicat") === "1") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  const baza = await adresaSiteului();

  return {
    rules: { userAgent: "*", allow: "/", disallow: RUTE_NEPUBLICE },
    sitemap: adresaAbsoluta(baza, "/sitemap.xml"),
  };
}
