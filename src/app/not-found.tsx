import Link from "next/link";

/**
 * Pagina inexistentă.
 *
 * Fără fișierul acesta, Next arată ecranul lui, în engleză. Pe site-ul unui
 * cabinet din România, un vizitator care a greșit adresa sau a venit de pe un
 * link vechi nu trebuie să nimerească într-un mesaj tehnic într-o limbă
 * străină — mai ales unul care caută ajutor.
 *
 * Nu spune „eroare": nu s-a stricat nimic, doar nu există pagina cerută.
 */
export default function PaginaLipsa() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">Pagina nu există</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Poate a fost mutată, poate adresa e scrisă altfel. De la pagina principală
          găsești tot ce e pe site.
        </p>

        <Link
          href="/"
          className="mt-6 inline-flex h-9 items-center justify-center rounded-base bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Înapoi la pagina principală
        </Link>
      </div>
    </div>
  );
}
