import { EROARE_PREA_MULTE, mesajLimita } from "@/lib/limite-panou";

/**
 * Mesajul „Ai ajuns la limita de …”, pentru ecranele cu listă (blog, servicii,
 * pagini).
 *
 * DE CE EXISTĂ. Când limita era atinsă, „+ Adaugă” trimitea omul înapoi pe listă
 * cu `?eroare=prea-multe` — și nicio pagină nu citea parametrul. Pentru client,
 * butonul părea că nu face nimic (3 oct. 2026).
 *
 * Primește parametrul brut din adresă și nu randează nimic dacă nu e cel așteptat:
 * o valoare necunoscută scrisă de mână în adresă nu trebuie să producă un mesaj
 * inventat.
 */
export function MesajLimita({
  eroare,
  maxim,
  singular,
  plural,
}: {
  eroare: string | undefined;
  maxim: number;
  singular: string;
  plural: string;
}) {
  if (eroare !== EROARE_PREA_MULTE) return null;

  return (
    // `role="alert"`: un cititor de ecran îl anunță la încărcarea paginii, ca să
    // nu rămână tăcerea pe care a produs-o lipsa lui.
    <div
      role="alert"
      className="rounded-base bg-danger-surface px-4 py-3 text-sm text-danger"
    >
      {mesajLimita(maxim, singular, plural)}
    </div>
  );
}
