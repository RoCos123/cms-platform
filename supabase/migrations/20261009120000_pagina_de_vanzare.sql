-- ----------------------------------------------------------------------------
-- Pagina de vânzare: un marcaj pe site și „modelul preferat” din formular.
--
-- DE CE. sitepsihologi.ro rulează pe platformă ca un client oarecare, dar e
-- pagina care VINDE site-uri, nu un cabinet. Brieful din 9 oct. 2026 cere pentru
-- ea lucruri care pe un site de cabinet ar fi greșite: subsol fără coloanele de
-- cabinet, alt text pe cartonașul de distribuire, datele firmei, și un formular
-- de contact cu telefon, mesaj și model preferat. Proprietarul a hotărât (9 oct.)
-- ca toate să depindă de UN marcaj pe site, pus din SQL, iar cabinetele să rămână
-- neatinse.
--
-- `sites.tip`: 'cabinet' (implicit — toate site-urile de azi) sau 'vanzare'.
-- Clientul NU îl poate schimba: pe `sites` are drept de scriere doar pe `name` și
-- `published_at` (drepturi pe coloană, vezi `harden_rls`), deci o coloană nouă e
-- închisă prin construcție. `cloneaza_site` copiază doar domeniu, nume, șablon și
-- modulul de programări, deci o clonă pornește tot ca 'cabinet'.
--
-- `contact_messages.model_preferat`: modelul ales în formularul paginii de
-- vânzare (sau „Încă nu m-am hotărât”). Gol pe orice mesaj de cabinet.
-- Plafonul de lungime e plasa bazei; aplicația verifică oricum că valoarea e una
-- din lista de modele afișată.
--
-- ORDINE: migrarea ÎNAINTE de cod nu e obligatorie — codul citește marcajul
-- separat și, dacă coloana lipsește, tratează site-ul ca 'cabinet'. Dar
-- formularul paginii de vânzare scrie `model_preferat`, deci marcajul 'vanzare'
-- se pune abia după ce migrarea a rulat (`supabase/marcheaza-sitepsihologi.sql`).
--
-- Se poate rula de două ori fără eroare: coloanele au `if not exists`, iar
-- regulile se șterg înainte să fie puse la loc, ca în `ton_relief`.
-- ----------------------------------------------------------------------------

alter table public.sites
  add column if not exists tip text not null default 'cabinet';

alter table public.sites
  drop constraint if exists sites_tip_check;

alter table public.sites
  add constraint sites_tip_check check (tip in ('cabinet', 'vanzare'));

alter table public.contact_messages
  add column if not exists model_preferat text;

alter table public.contact_messages
  drop constraint if exists contact_messages_model_preferat_lungime;

alter table public.contact_messages
  add constraint contact_messages_model_preferat_lungime
  check (model_preferat is null or char_length(model_preferat) <= 80);
