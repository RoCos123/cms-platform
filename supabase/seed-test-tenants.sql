-- Seed pentru testul de izolare RLS (e2e/tenant-rls.spec.ts) — NU pentru
-- producție. Rulează după ce ai creat manual, în Dashboard -> Authentication
-- -> Users -> Add user (cu "Auto Confirm User" bifat), exact acești 2 useri:
--   test-tenant-a@example.com / TestFaza1Rls!
--   test-tenant-b@example.com / TestFaza1Rls!
-- (aceleași valori din .env.local — schimbă-le în ambele locuri dacă vrei altele)

-- 1) Cele două site-uri de test
insert into public.sites (domain, name) values
  ('test-tenant-a.example.com', 'Tenant Test A'),
  ('test-tenant-b.example.com', 'Tenant Test B');

-- 2) Mapează userii auth deja creați (după email) la site-ul lor
insert into public.users (id, site_id, email)
select au.id, s.id, au.email
from auth.users au
join public.sites s on s.domain = 'test-tenant-a.example.com'
where au.email = 'test-tenant-a@example.com';

insert into public.users (id, site_id, email)
select au.id, s.id, au.email
from auth.users au
join public.sites s on s.domain = 'test-tenant-b.example.com'
where au.email = 'test-tenant-b@example.com';

-- 3) Câte un rând de test în site_content, diferit per site — exact ce
--    verifică e2e/tenant-rls.spec.ts (un tenant nu trebuie să-l vadă pe-al celuilalt)
insert into public.site_content (site_id, key, data)
select id, 'hero', jsonb_build_object('title', 'Conținut privat al ' || name)
from public.sites
where domain in ('test-tenant-a.example.com', 'test-tenant-b.example.com');

-- Verificare rapidă — ar trebui să dea 2 rânduri, un site_id diferit fiecare.
select s.name, s.domain, u.email as user_mapat, sc.data->>'title' as content
from public.sites s
join public.users u on u.site_id = s.id
join public.site_content sc on sc.site_id = s.id
where s.domain in ('test-tenant-a.example.com', 'test-tenant-b.example.com');
