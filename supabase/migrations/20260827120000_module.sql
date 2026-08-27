-- ----------------------------------------------------------------------------
-- Module plătite: ce are pornit fiecare client.
--
-- Deosebirea față de comutatoarele din `site_settings.pagini` (blog, servicii)
-- e cine le apasă. Acelea sunt ale clientului: el hotărăște dacă vrea blog.
-- Astea sunt ale noastre — un modul care se plătește nu poate fi pornit de cel
-- care ar trebui să-l plătească.
--
-- De ce o coloană booleană și nu un `jsonb module`:
--
--   1. Se apasă. În editorul de tabele din Supabase, un boolean e o bifă. Un
--      `jsonb` ar cere scris JSON de mână la fiecare client — adică exact ce
--      NU e „dintr-un clic”.
--   2. Se apără singură. `sites` are deja drept de scriere pe coloane, nu pe
--      tabel: `grant update (name) ... to authenticated` din migrarea de
--      întărire. Orice coloană NOUĂ e, prin construcție, necitibilă la scriere
--      pentru client. N-avem de scris nicio politică nouă, deci n-avem nici
--      unde greși.
--
-- Prețul: un modul nou e un `alter table` de un rând. La câte module plătite
-- încap într-un produs ca ăsta, e mai ieftin decât alternativa.
--
-- Implicit OPRIT, spre deosebire de `pagini`, unde lipsa unei valori înseamnă
-- pornit. Acolo, un implicit „oprit” ar fi făcut o pagină scrisă de client să
-- dispară în tăcere. Aici, un implicit „pornit” ar da gratis tuturor un lucru
-- care se vinde.
-- ----------------------------------------------------------------------------

alter table public.sites
  add column if not exists appointments_enabled boolean not null default false;

comment on column public.sites.appointments_enabled is
  'Modulul Programări, pornit de noi (bifă în editorul Supabase). Clientul nu-l poate scrie: dreptul de update pe sites e dat pe coloane, doar pe name.';
