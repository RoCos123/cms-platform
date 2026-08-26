import Link from "next/link";

/**
 * „Vezi pe site" — de la ecranul de editare la pagina pe care o schimbă.
 *
 * Previzualizarea din dreapta arată o secțiune, nu pagina întreagă. Ca să vadă
 * cum stă totul laolaltă, clientul trebuia să ghicească adresa publică sau să
 * treacă pe la Acasă. Un drum de doi pași pentru ceva ce se face de zeci de ori
 * pe zi.
 *
 * Tab nou, cu `rel="noreferrer"`: panoul rămâne deschis cu tot ce e nesalvat în
 * el. O navigare obișnuită ar fi însemnat pierderea modificărilor la fiecare
 * verificare.
 */
export function LinkVeziPeSite({ href, eticheta }: { href: string; eticheta: string }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-9 shrink-0 items-center gap-2 rounded-base border border-border bg-surface px-4 text-sm font-medium text-foreground hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {eticheta}
      <span aria-hidden>↗</span>
      <span className="sr-only">(se deschide într-o filă nouă)</span>
    </Link>
  );
}
