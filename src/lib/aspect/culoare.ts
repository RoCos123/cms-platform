/**
 * Matematica culorilor pentru „Aspect": de la `#RRGGBB` la OKLCH și înapoi, plus
 * contrastul WCAG. Fără dependențe, fără „use client", fără `server-only` — o
 * folosesc și paleta calculată (server și browser), și previzualizarea din panou,
 * și probele din Node.
 *
 * DE CE OKLCH. Paleta unui șablon se calculează dintr-o singură culoare aleasă de
 * client: fundalurile, textul, accentul de pe fundal închis. Pentru asta ne trebuie
 * un spațiu de culoare în care „la fel de luminoasă" chiar înseamnă la fel de
 * luminoasă, indiferent de nuanță — altfel un galben și un albastru cu aceeași
 * „luminozitate" HSL ies unul orbitor și celălalt negru. În OKLCH (L = luminozitate,
 * C = cât de colorată, h = nuanța) se poate păstra luminozitatea unui fundal crem și
 * i se schimbă doar nuanța, ca să iasă „același crem, dar verzui".
 *
 * Contrastul rămâne WCAG 2.1 (raportul de luminanțe relative), aceeași formulă ca în
 * `e2e/contrast-sabloane.proba.mjs`: pragul de 4,5:1 e al lor, nu al nostru.
 */

export type Oklch = { l: number; c: number; h: number };

const HEX = /^#[0-9a-f]{6}$/i;

/** `#RRGGBB` valid? Nu acceptă `#abc`, nu acceptă nume („red"), nu acceptă `rgb(…)`. */
export function esteHexValid(valoare: unknown): valoare is string {
  return typeof valoare === "string" && HEX.test(valoare.trim());
}

/** Aduce o culoare la forma în care o ținem: `#RRGGBB`, litere mari. Altfel `null`. */
export function normalizeazaHex(valoare: unknown): string | null {
  return esteHexValid(valoare) ? valoare.trim().toUpperCase() : null;
}

function canalLiniar(v: number): number {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function canalSrgb(liniar: number): number {
  const v = liniar <= 0.0031308 ? 12.92 * liniar : 1.055 * liniar ** (1 / 2.4) - 0.055;
  return v * 255;
}

function rgbDinHex(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function hexDinRgb(r: number, g: number, b: number): string {
  const canal = (v: number) => Math.min(255, Math.max(0, Math.round(v)));
  return `#${[r, g, b].map((v) => canal(v).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

/** Luminanța relativă WCAG a unei culori `#RRGGBB`. */
export function luminanta(hex: string): number {
  const [r, g, b] = rgbDinHex(hex);
  // Aceleași ponderi ca în proba de contrast a șabloanelor.
  const s = (v: number) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * s(r) + 0.7152 * s(g) + 0.0722 * s(b);
}

/** Raportul de contrast WCAG între două culori `#RRGGBB` (1 … 21). */
export function contrast(a: string, b: string): number {
  const [sus, jos] = [luminanta(a), luminanta(b)].sort((x, y) => y - x);
  return (sus + 0.05) / (jos + 0.05);
}

/** Din `#RRGGBB` în OKLCH. */
export function oklchDinHex(hex: string): Oklch {
  const [r8, g8, b8] = rgbDinHex(hex);
  const r = canalLiniar(r8);
  const g = canalLiniar(g8);
  const b = canalLiniar(b8);

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const c = Math.hypot(a, bb);
  // Sub acest prag culoarea e gri: nuanța n-are sens, o ținem la 0.
  const h = c < 1e-4 ? 0 : ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360;

  return { l: L, c, h };
}

/** OKLCH → sRGB liniar, FĂRĂ tăiere: valorile pot ieși din [0, 1] dacă culoarea nu există în sRGB. */
function rgbLiniarDinOklch({ l, c, h }: Oklch): [number, number, number] {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const lc = l_ ** 3;
  const mc = m_ ** 3;
  const sc = s_ ** 3;

  return [
    4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc,
    -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc,
    -0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc,
  ];
}

const MARJA = 1e-6;

function inGamut([r, g, b]: [number, number, number]): boolean {
  return [r, g, b].every((v) => v >= -MARJA && v <= 1 + MARJA);
}

/**
 * Adevărat dacă o culoare OKLCH există în sRGB (cât se vede pe un ecran obișnuit).
 */
export function existaInSrgb(culoare: Oklch): boolean {
  return inGamut(rgbLiniarDinOklch(culoare));
}

/**
 * O culoare care nu încape în sRGB nu se „taie" canal cu canal (ar schimba nuanța):
 * se scade doar cât de colorată e, păstrând luminozitatea și nuanța, până încape.
 */
function incadreazaInSrgb({ l, c, h }: Oklch): Oklch {
  const luminozitate = Math.min(1, Math.max(0, l));
  if (existaInSrgb({ l: luminozitate, c, h })) return { l: luminozitate, c, h };

  let jos = 0;
  let sus = c;
  for (let i = 0; i < 24; i += 1) {
    const mijloc = (jos + sus) / 2;
    if (existaInSrgb({ l: luminozitate, c: mijloc, h })) jos = mijloc;
    else sus = mijloc;
  }

  return { l: luminozitate, c: jos, h };
}

/** Din OKLCH în `#RRGGBB`, cu culoarea adusă în sRGB prin scăderea cromei. */
export function hexDinOklch(culoare: Oklch): string {
  const { l, c, h } = incadreazaInSrgb(culoare);
  const [r, g, b] = rgbLiniarDinOklch({ l, c, h });
  const taie = (v: number) => Math.min(1, Math.max(0, v));
  return hexDinRgb(canalSrgb(taie(r)), canalSrgb(taie(g)), canalSrgb(taie(b)));
}
