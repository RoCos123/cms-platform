import { cuZileInUrma, ziuaLa } from "@/lib/zile";

/**
 * Ce se numără și cum se adună, la cifrele de trafic.
 *
 * Rupt de citirea din bază ca să poată fi probat fără Supabase, ca peste tot
 * în proiect. Aici nu e nimic despre PERSOANE: se numără afișări de pagină, nu
 * vizitatori. Vizitatorii unici ar cere o amprentă din IP și browser, adică
 * exact urmărirea pe care șablonul de politică de confidențialitate o exclude
 * în numele clientului.
 */

/**
 * Bucăți de nume care apar în programele automate, nu în browserele oamenilor.
 *
 * Fără filtrul ăsta, cifrele n-ar însemna nimic: pe un site mic, roboții
 * motoarelor de căutare și previzualizările de linkuri din WhatsApp pot fi mai
 * multe decât oamenii. Un client care vede „40 de afișări" și știe că n-a intrat
 * nimeni ar înceta să se mai uite aici — pe bună dreptate.
 *
 * Lista prinde ce e uzual, nu tot ce există. Un robot scăpat umflă o cifră; un
 * om filtrat greșit dispare dintr-o cifră. Prima greșeală e mai puțin gravă,
 * deci lista rămâne conservatoare.
 */
const SEMNE_DE_ROBOT = [
  "bot", "crawl", "spider", "slurp", "search",
  "facebookexternalhit", "whatsapp", "telegram", "discord", "skype",
  "preview", "scraper", "fetch", "monitor", "uptime", "pingdom",
  "lighthouse", "pagespeed", "gtmetrix", "headless",
  "curl", "wget", "python", "java/", "go-http", "okhttp", "axios", "libwww",
];

/**
 * Cererea vine de la un program, nu de la un om?
 *
 * Un user-agent lipsă e tratat drept robot: orice browser adevărat trimite
 * unul, iar cererile fără el sunt scripturi.
 */
export function esteRobot(userAgent: string | null | undefined): boolean {
  const ua = userAgent?.trim().toLowerCase();
  if (!ua) return true;

  return SEMNE_DE_ROBOT.some((semn) => ua.includes(semn));
}

/** Cât de lungă poate fi o cale înainte să fie tăiată. */
const CALE_MAXIMA = 200;

/**
 * Calea, adusă la forma în care se numără.
 *
 * Fără asta, „/Tarife", „/tarife/" și „/tarife" ar fi trei rânduri diferite în
 * statistici, iar clientul ar vedea aceeași pagină de trei ori cu cifre
 * împărțite între ele.
 *
 * `null` când nu e o cale de numărat.
 */
export function caleaNumarata(pathname: string): string | null {
  if (!pathname.startsWith("/")) return null;

  // Fără interogare și fără ancoră: „/blog?utm_source=fb" e aceeași pagină ca
  // „/blog", iar o campanie cu zece etichete ar sparge-o în zece rânduri.
  let cale = pathname.split("?")[0].split("#")[0].toLowerCase();

  // Bara de la final nu schimbă pagina, dar ar schimba rândul din statistici.
  // Prima pagină rămâne „/" — acolo bara ESTE calea.
  if (cale.length > 1) cale = cale.replace(/\/+$/, "");

  return cale.slice(0, CALE_MAXIMA) || "/";
}

export type RandDeTrafic = { day: string; path: string; views: number };

export type ZiDeTrafic = { zi: string; afisari: number };
export type PaginaDeTrafic = { cale: string; afisari: number };

export type RezumatTrafic = {
  total: number;
  perZi: ZiDeTrafic[];
  topPagini: PaginaDeTrafic[];
};

/** Câte pagini se arată în „cele mai citite". */
const CATE_PAGINI = 8;

/**
 * Cifrele, aduse în forma în care se văd pe ecran.
 *
 * Zilele fără nicio vizită se completează cu zero, nu se sar: un grafic care
 * sare peste zilele goale minte despre formă — două vârfuri la distanță de o
 * săptămână ar arăta lipite.
 */
export function rezumatulTraficului(
  randuri: RandDeTrafic[],
  acum: Date,
  cateZile: number,
): RezumatTrafic {
  const dinZi = ziuaLa(cuZileInUrma(acum, cateZile - 1));
  const inFereastra = randuri.filter((rand) => rand.day >= dinZi);

  const peZi = new Map<string, number>();
  for (let i = cateZile - 1; i >= 0; i--) {
    peZi.set(ziuaLa(cuZileInUrma(acum, i)), 0);
  }

  const pePagina = new Map<string, number>();
  let total = 0;

  for (const rand of inFereastra) {
    total += rand.views;
    if (peZi.has(rand.day)) peZi.set(rand.day, peZi.get(rand.day)! + rand.views);
    pePagina.set(rand.path, (pePagina.get(rand.path) ?? 0) + rand.views);
  }

  const topPagini = [...pePagina.entries()]
    .map(([cale, afisari]) => ({ cale, afisari }))
    // La egalitate, ordinea alfabetică — altfel lista s-ar rearanja singură
    // între două reîncărcări, fără ca ceva să se fi schimbat.
    .sort((a, b) => b.afisari - a.afisari || a.cale.localeCompare(b.cale))
    .slice(0, CATE_PAGINI);

  return {
    total,
    perZi: [...peZi.entries()].map(([zi, afisari]) => ({ zi, afisari })),
    topPagini,
  };
}
