import { redirect } from "next/navigation";
import { getSesiuneOptionala } from "@/lib/dal";

/**
 * Adresa ușor de ținut minte: „site-ul tău plus /admin".
 *
 * Bara de administrare rezolvă vizitele următoare, dar nu și pe prima: ca s-o
 * vezi, trebuie să fii deja conectat. Aici e ușa — un singur lucru de reținut,
 * care merge și când sesiunea a expirat.
 */
export default async function AdminAlias() {
  const sesiune = await getSesiuneOptionala();
  redirect(sesiune ? "/dashboard" : "/login");
}
