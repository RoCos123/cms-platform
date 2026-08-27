/**
 * Modulele care se plătesc.
 *
 * Se deosebesc de comutatoarele din `site_settings.pagini` (blog, servicii)
 * prin cine le apasă: acelea sunt ale clientului, astea sunt ale noastre. Un
 * modul care se vinde nu poate fi pornit de cel care ar trebui să-l plătească.
 *
 * Apărarea NU e o politică RLS, ci dreptul de scriere pe coloane din `sites`:
 * clientul poate scrie doar `name`, deci orice coloană nouă de acolo îi e
 * inaccesibilă prin construcție. `supabase/verificare-izolare.sql` dovedește
 * asta la fiecare rulare — și dovedește, separat, că numele TOT se poate salva,
 * fiindcă o apărare care merge prea departe strică ecranul, nu-l apără.
 */

/** Cum arată rândul din `sites`, cât privește modulele. */
export type RandDeModule = { appointments_enabled?: boolean | null };

export type Module = {
  programari: boolean;
};

/**
 * Ce are pornit clientul.
 *
 * `=== true` și nu o conversie mai îngăduitoare: implicit OPRIT. La `pagini`,
 * lipsa unei valori înseamnă pornit — acolo, un implicit „oprit” ar fi făcut o
 * pagină scrisă de client să dispară în tăcere. Aici e pe dos: un implicit
 * „pornit” ar da gratis tuturor un lucru care se vinde.
 */
export function moduleleSiteului(site: RandDeModule | null | undefined): Module {
  return { programari: site?.appointments_enabled === true };
}

/** Coloanele de citit din `sites` ca să știi ce module are clientul. */
export const COLOANE_MODULE = "appointments_enabled";
