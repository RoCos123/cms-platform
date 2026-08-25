-- ============================================================================
-- Faza 1 (corecție de securitate) — închide scurgerea de date între tenanți
-- prin rolul `anon`.
--
-- PROBLEMA: în migrarea inițială, fiecare politică `to anon` era scrisă fără
-- predicat pe `site_id` (`using (true)`, `using (status = 'published')` etc.).
-- Cheia publishable e publică prin construcție — stă în bundle-ul JS al
-- fiecărui site de client. Oricine o extrage putea interoga direct PostgREST
-- și primea datele TUTUROR tenanților: catalogul de `uploads` (inclusiv căile
-- fișierelor nepublicate), lista completă de clienți din `sites`,
-- `site_settings`, plus tot conținutul publicat.
--
-- Testul de izolare din Faza 1 n-a prins asta: verifica doar rolul
-- `authenticated` (unde izolarea chiar funcționa corect), niciodată `anon`.
--
-- SOLUȚIA: RLS nu poate scopa `anon` pe tenant, fiindcă Postgres nu cunoaște
-- domeniul cererii HTTP. Dar nici nu trebuie: aplicația e integral RSC +
-- Server Actions, deci browserul nu interoghează niciodată direct baza de
-- date. Retragem complet accesul la date pentru `anon`; site-urile publice
-- citesc server-side prin `src/lib/supabase/admin.ts`, care impune obligatoriu
-- filtrul pe `site_id` rezolvat de proxy.ts.
--
-- Cheia publishable rămâne folosită DOAR pentru autentificare.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Retrage toate politicile de citire pentru `anon`
-- ----------------------------------------------------------------------------
drop policy if exists "sites: oricine poate rezolva domeniul unui tenant" on public.sites;
drop policy if exists "site_content: public vede doar secțiunile vizibile" on public.site_content;
drop policy if exists "site_settings: public poate citi (brand/SEO afișate pe site)" on public.site_settings;
drop policy if exists "pages: public vede doar paginile publicate" on public.pages;
drop policy if exists "services: public vede doar serviciile publicate" on public.services;
drop policy if exists "blog_categories: public poate citi" on public.blog_categories;
drop policy if exists "blog_articles: public vede doar articolele publicate" on public.blog_articles;
drop policy if exists "uploads: public poate citi metadata (imagini afișate pe site)" on public.uploads;

-- ----------------------------------------------------------------------------
-- 2. Retrage inserările anonime (contact + programări)
--
-- Erau `with check (true)`: oricine putea insera rânduri în contul ORICĂRUI
-- tenant, cu `site_id` ales de el — spam țintit, mesaje fabricate în inboxul
-- unui client anume. Formularele publice sunt Server Actions, deci trec prin
-- server, care setează `site_id` din tenantul rezolvat, nu din input.
-- ----------------------------------------------------------------------------
drop policy if exists "contact_messages: oricine poate trimite un mesaj" on public.contact_messages;
drop policy if exists "appointments: oricine poate cere o programare" on public.appointments;

-- ----------------------------------------------------------------------------
-- 3. `sites` rămâne citibil de userul autentificat, dar doar propriul rând
--    (dashboard-ul afișează numele și domeniul site-ului).
-- ----------------------------------------------------------------------------
create policy "sites: userul își vede propriul site"
  on public.sites for select
  to authenticated
  using (id = public.current_site_id());

-- ----------------------------------------------------------------------------
-- 4. Blochează modificarea domeniului de către proprietar.
--
-- Politica de UPDATE permitea rescrierea oricărei coloane, inclusiv `domain`.
-- Un proprietar putea seta domeniul propriu la varianta `www.` a domeniului
-- altui client: rezolvarea de tenant din proxy.ts ar fi găsit acel rând, iar
-- traficul și formularele victimei ar fi ajuns la atacator.
--
-- RLS nu are granularitate pe coloană, deci folosim GRANT-uri pe coloană:
-- retragem UPDATE la nivel de tabel și îl reacordăm doar pentru `name`.
-- Domeniul se schimbă exclusiv de operator (SQL editor / provisionare).
-- ----------------------------------------------------------------------------
revoke update on public.sites from authenticated;
grant update (name) on public.sites to authenticated;

-- ----------------------------------------------------------------------------
-- 5. `audit_log`: împiedică falsificarea actorului.
--
-- Politica de INSERT verifica doar `site_id`, deci un user putea scrie intrări
-- atribuite altui actor — exact ce face jurnalul inutil ca probă.
-- ----------------------------------------------------------------------------
drop policy if exists "audit_log: proprietarul site-ului scrie în propriul jurnal" on public.audit_log;

create policy "audit_log: proprietarul site-ului scrie în propriul jurnal"
  on public.audit_log for insert
  to authenticated
  with check (
    site_id = public.current_site_id()
    and (actor_id is null or actor_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- 6. Bucket-ul `media` rămâne public la citire.
--
-- Imaginile site-urilor publice trebuie servite direct browserului, prin URL
-- stabil și cacheabil. După retragerea politicii de pe `public.uploads`,
-- catalogul nu mai e enumerabil, deci căile nu se mai pot descoperi în masă.
--
-- RISC REZIDUAL ACCEPTAT: un fișier încă nepublicat rămâne accesibil pentru
-- cine îi cunoaște deja URL-ul exact (partajat, indexat, ghicit). Dacă
-- ajungem să stocăm materiale cu adevărat confidențiale (ex. documentele
-- clienților din „Programe și materiale"), bucket-ul trebuie făcut privat, cu
-- URL-uri semnate — de reevaluat în Faza 2, la politica de fișiere.
-- ----------------------------------------------------------------------------
