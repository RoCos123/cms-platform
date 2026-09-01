import Link from "next/link";

/**
 * „Șterge datele acestei persoane”, pe rândul unui mesaj sau al unei programări.
 *
 * DE CE EXISTĂ. Ecranul de ștergere caută după telefon sau email — nu după nume,
 * fiindcă doi oameni pot fi „Ion Popescu” și o ștergere greșită nu se mai poate
 * da înapoi. Numai că cererea vine la telefon, iar psihologul avea de făcut trei
 * ecrane și un copy-paste tocmai când are omul pe fir. Aici, numărul e deja
 * știut: linkul duce direct la ecranul de ștergere, cu căutarea făcută.
 *
 * Link, nu buton cu ștergere pe loc: omul trebuie să vadă TOT ce se șterge
 * înainte să confirme. Aceeași persoană poate avea și mesaje, și programări, și
 * o abonare la newsletter — iar un buton pe un singur rând ar lăsa impresia că
 * s-a șters doar rândul acela.
 */
export function LinkStergereDate({
  telefon,
  email,
}: {
  telefon?: string | null;
  email?: string | null;
}) {
  // Telefonul întâi: e calea principală de contact de când formularele îl cer.
  const termen = (telefon || email || "").trim();

  // Fără niciun fel de contact n-avem după ce căuta. Se întâmplă la cererile
  // vechi, dinainte ca telefonul să fie obligatoriu.
  if (termen === "") return null;

  return (
    <Link
      href={`/dashboard/date-personale?cauta=${encodeURIComponent(termen)}`}
      className="inline-flex h-8 items-center justify-center rounded-base px-3 text-xs font-medium text-muted-foreground hover:bg-surface-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      Șterge datele acestei persoane
    </Link>
  );
}
