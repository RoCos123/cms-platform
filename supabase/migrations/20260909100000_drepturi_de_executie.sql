-- ============================================================================
-- Drepturile de execuție se revocă de la ROLURI, nu doar de la PUBLIC.
--
-- Găsit pe 9 sept. 2026, la PRIMA rulare a verificării de schemă
-- (`supabase/verificare-schema.sql`) pe baza reală. Două funcții care se credeau
-- închise erau deschise în producție de săptămâni:
--
--   creeaza_client        anon=X authenticated=X service_role=X
--   inregistreaza_afisarea  anon=X authenticated=X service_role=X
--
-- DE CE. În Postgres simplu, o funcție nouă se poate executa de PUBLIC, iar
-- `anon` și `authenticated` moștenesc de acolo — deci `revoke ... from public` e
-- de ajuns. Pe Supabase NU: proiectul are `alter default privileges ... grant
-- all on functions to anon, authenticated, service_role`, deci fiecare funcție
-- nouă primește granturi EXPLICITE pe rol, la creare. O revocare de la PUBLIC nu
-- le atinge.
--
-- Migrarea din 27 aug. spune chiar pe dos, cu convingere: „Un `revoke ... from
-- anon` în plus n-ar face nimic — l-am scris, l-am probat, și nu schimba nimic."
-- Adevărat, dar probat pe bancul local, căruia îi lipseau tocmai granturile
-- implicite ale Supabase. Bancul e reparat în același commit; cu el fidel,
-- verificările 6 și 11 din `verificare-izolare.sql` pică fără migrarea asta.
--
-- CE PUTEA FACE CINEVA PÂNĂ ACUM. Funcțiile din schema `public` sunt expuse ca
-- RPC, iar cheia `anon` e publică prin construcție — stă în pachetul trimis
-- browserului. Deci: `inregistreaza_afisarea` putea fi chemată de oricine, cu
-- orice `site_id`, adică cifrele din panoul oricărui client puteau fi umflate.
-- Iar `creeaza_client` — care e `security definer`, deci rulează cu drepturile
-- proprietarului bazei — putea fi chemată de orice client conectat.
--
-- `service_role` rămâne la amândouă: e cheia de server, nu ajunge niciodată în
-- browser, iar numărarea vizitelor chiar prin ea se face
-- (`src/lib/vizite-numarare.ts`). Provizionarea rămâne o linie rulată de mână în
-- SQL Editor, ca rolul `postgres`, deci nu are nevoie de niciun rol de aici.
-- ============================================================================

revoke execute on function public.creeaza_client(text, text, text, text, boolean)
  from anon, authenticated;

revoke execute on function public.inregistreaza_afisarea(uuid, date, text)
  from anon, authenticated;
