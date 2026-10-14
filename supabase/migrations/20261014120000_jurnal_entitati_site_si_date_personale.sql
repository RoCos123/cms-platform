-- ----------------------------------------------------------------------------
-- Jurnalul de activitate: bază și cod trebuie să accepte aceleași entități.
--
-- DE CE. `src/lib/audit.ts` poate scrie 12 feluri de entități, dar constrângerea
-- `audit_log_entity_type_check` (din `init_schema`) le accepta doar pe primele 10.
-- Lipseau două:
--
--   • 'Site'          — publicarea și retragerea site-ului (Setări);
--   • 'DatePersonale' — „Șterge datele unei persoane".
--
-- Fiecare astfel de intrare pica la bază cu „violates check constraint", iar
-- `scrieInJurnal` înghite eroarea dinadins (jurnalul nu are voie să strice o
-- modificare deja făcută). Rezultat: nicio publicare, nicio retragere și nicio
-- ștergere de date nu a apărut vreodată în ecranul „Activitate" — fără mesaj de
-- eroare nicăieri. Găsit pe 14 oct. 2026, la butonul „Schimbă emailul".
--
-- CE SE SCHIMBĂ. Doar lista de valori acceptate; nimic din date. Intrările care
-- n-au putut fi scrise până acum NU se pot recupera (n-au ajuns niciodată în bază);
-- de aici încolo apar. Ecranul „Activitate" are deja etichetele lor
-- („Site-ul", „Datele unei persoane" — `src/lib/activitate.ts`).
--
-- Rândurile de acum au toate una dintre cele 10 valori vechi, deci noua regulă se
-- validează pe loc. Se poate rula de două ori fără eroare: regula veche se șterge
-- înainte să fie pusă la loc, ca în `ton_relief`.
--
-- Verificare după rulare (întoarce regula nouă, cu 12 valori):
--   select pg_get_constraintdef(oid)
--   from pg_constraint
--   where conname = 'audit_log_entity_type_check';
-- ----------------------------------------------------------------------------

alter table public.audit_log
  drop constraint if exists audit_log_entity_type_check;

alter table public.audit_log
  add constraint audit_log_entity_type_check check (entity_type in (
    'Page', 'Service', 'Appointment', 'BlogArticle', 'BlogCategory',
    'SiteContent', 'SiteSettings', 'Upload', 'ContactSubmission', 'Session',
    'Site', 'DatePersonale'
  ));
