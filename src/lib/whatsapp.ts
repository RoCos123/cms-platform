/**
 * Adresa `wa.me` pentru numărul de WhatsApp al cabinetului.
 *
 * WhatsApp cere numărul în format internațional, doar cifre, fără `+`, spații sau
 * cratime: `0722 333 444` trebuie să ajungă `40722333444`. Clientul îl scrie însă
 * cum îi vine, așa că normalizăm aici — logică pură, probată cu Node fără bază de
 * date (`e2e/whatsapp.proba.mjs`).
 *
 * Implicit ROMÂNIA, fiindcă asta e nișa: un număr scris național (începe cu `0`)
 * primește prefixul `40`. Dacă omul pune el prefixul de țară — cu `+`, cu `00`,
 * sau direct cifrele — îl respectăm și nu-l stricăm.
 *
 * Întoarce `null` când nu e nimic de sunat: butonul de WhatsApp nu se randează
 * atunci, nu apare o bulă care duce nicăieri.
 */
export function linkWhatsApp(numar: string | null | undefined, mesaj?: string): string | null {
  const brut = (numar ?? "").trim();
  if (brut === "") return null;

  // Ținem minte dacă a scris `+` ÎNAINTE să scoatem tot ce nu e cifră: un `+` la
  // început înseamnă „am pus deja prefixul de țară".
  const cuPrefixTara = brut.startsWith("+");
  let cifre = brut.replace(/\D/g, "");
  if (cifre === "") return null;

  if (cifre.startsWith("00")) {
    // `00` e felul de a scrie prefixul internațional fără `+`.
    cifre = cifre.slice(2);
  } else if (!cuPrefixTara && cifre.startsWith("0")) {
    // Număr național românesc (07…, 021…) → prefixul României.
    cifre = `40${cifre.slice(1)}`;
  }
  // Altfel (avea `+`, ori cifrele încep direct cu un prefix de țară): rămâne cum e.

  // E.164: cel mult 15 cifre. Sub 9 nu e un număr întreg cu prefix de țară — mai
  // degrabă ceva scris pe jumătate, pe care n-are rost să-l trimitem la WhatsApp.
  if (cifre.length < 9 || cifre.length > 15) return null;

  const baza = `https://wa.me/${cifre}`;
  return mesaj ? `${baza}?text=${encodeURIComponent(mesaj)}` : baza;
}
