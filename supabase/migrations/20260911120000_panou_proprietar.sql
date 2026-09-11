-- ----------------------------------------------------------------------------
-- Panoul de proprietar: cine ești TU, cel care le vede pe toate.
--
-- Până acum, „proprietar" în proiect a însemnat MEREU proprietarul unui SITE —
-- clientul, legat de cabinetul lui prin `public.users.site_id`, și scopat pe
-- cabinetul lui în fiecare politică RLS. Un cont aparține unui singur cabinet,
-- și nu vede nimic din alt cabinet. Asta NU se schimbă.
--
-- Ce se adaugă aici e un al doilea fel de proprietar, al PLATFORMEI: tu. Nu e
-- legat de niciun cabinet (fără rând în `public.users`), iar apartenența lui
-- stă aici, în `platform_owners`. Panoul de la `/proprietar` îl folosește ca să
-- listeze toate site-urile și să intre în oricare.
--
-- De ce o tabelă separată și nu un steag pe user: e explicită, se poate audita
-- dintr-o privire, și se seamănă cu un SQL rulat de mână, ca la provizionarea
-- unui client. Un cont de platformă e o hotărâre, nu un câmp bifat din greșeală.
-- ----------------------------------------------------------------------------

create table if not exists public.platform_owners (
  -- Același id ca în auth.users. La ștergerea contului, rândul cade singur.
  user_id uuid primary key references auth.users (id) on delete cascade,
  -- Doar ca să se citească lista fără un join la schema `auth`. Nu e sursa de
  -- adevăr a identității — aceea e `user_id`.
  email text,
  created_at timestamptz not null default now()
);

alter table public.platform_owners enable row level security;

-- RLS pornit și ZERO politici: rolurile `anon` și `authenticated` nu văd și nu
-- scriu niciun rând. Citirea apartenenței se face DOAR server-side, cu cheia
-- secretă (`createServiceClient`), care ocolește RLS.
--
-- În plus, revocăm explicit drepturile de tabel de la cele două roluri. E o
-- plasă în plus peste RLS, din lecția scrisă în CONVENTII (§„Ce se revocă de la
-- PUBLIC nu e revocat de la roluri"): dacă cineva ar opri vreodată RLS pe tabela
-- asta din greșeală, ea tot ar rămâne de necitit din browser. `service_role`
-- păstrează accesul — el ocolește oricum RLS — deci panoul merge mai departe.
revoke all on public.platform_owners from anon, authenticated;

-- ----------------------------------------------------------------------------
-- Cum te adaugi pe tine ca proprietar al platformei. Se rulează O DATĂ, în
-- Supabase → SQL Editor, DUPĂ ce ți-ai creat contul de proprietar în
-- Authentication → Users (cu „Auto Confirm User" bifat).
--
-- ATENȚIE: contul de proprietar NU trebuie legat de niciun cabinet — adică să
-- n-aibă rând în `public.users`. Un cont e ori al unui cabinet, ori al
-- platformei, niciodată amândouă. Folosește o adresă dedicată (ex.:
-- numele+admin@gmail.com), nu una cu care ai făcut deja un site.
--
--   insert into public.platform_owners (user_id, email)
--   select id, email
--   from auth.users
--   where lower(email) = lower('adresa-ta-de-proprietar@exemplu.ro')
--   on conflict (user_id) do nothing;
--
-- Ca să verifici că te-ai trecut corect:
--   select email from public.platform_owners;
-- ----------------------------------------------------------------------------
