-- ----------------------------------------------------------------------------
-- Încadrarea coperții (poziție + mărime) devine a LOCULUI, nu a pozei.
--
-- DE CE. Până acum poziția și mărimea stăteau pe poză (`uploads.focal_*`), deci
-- aceeași poză pusă în două locuri împărțea o singură încadrare — iar locuri
-- diferite au rame diferite (hero lat, cartonaș pătrat…) și cer încadrări
-- diferite. Proprietarul a cerut, pe bună dreptate, ca o reglare într-un loc să
-- nu se mai reflecte în altul (3 oct. 2026).
--
-- Așa că fiecare copertă (de serviciu, de articol) își ține acum propria
-- încadrare, pe rândul ei. Pe `uploads` rămâne doar o încadrare „de pornire",
-- moștenită când pui poza într-un loc nou, apoi reglabilă separat acolo.
--
-- `smallint` pentru procente (0–100), `real` pentru mărime (1–3), NULL = centru/
-- nemărit, exact ca pe `uploads`.
-- ----------------------------------------------------------------------------
alter table public.services
  add column cover_focal_x smallint,
  add column cover_focal_y smallint,
  add column cover_focal_zoom real,
  add constraint services_cover_focal_pereche
    check (
      (cover_focal_x is null and cover_focal_y is null)
      or (cover_focal_x between 0 and 100 and cover_focal_y between 0 and 100)
    ),
  add constraint services_cover_focal_zoom
    check (cover_focal_zoom is null or (cover_focal_zoom >= 1 and cover_focal_zoom <= 3));

alter table public.blog_articles
  add column cover_focal_x smallint,
  add column cover_focal_y smallint,
  add column cover_focal_zoom real,
  add constraint blog_articles_cover_focal_pereche
    check (
      (cover_focal_x is null and cover_focal_y is null)
      or (cover_focal_x between 0 and 100 and cover_focal_y between 0 and 100)
    ),
  add constraint blog_articles_cover_focal_zoom
    check (cover_focal_zoom is null or (cover_focal_zoom >= 1 and cover_focal_zoom <= 3));

-- Coperțile de ACUM moștenesc încadrarea curentă a pozei (de pe `uploads`), ca
-- să arate neschimbat după deploy. De aici încolo, fiecare copertă e pe cont
-- propriu — o reglare pe una n-o mai atinge pe cealaltă.
update public.services s
  set cover_focal_x = u.focal_x,
      cover_focal_y = u.focal_y,
      cover_focal_zoom = u.focal_zoom
  from public.uploads u
  where s.cover_upload_id = u.id
    and u.focal_x is not null;

update public.blog_articles b
  set cover_focal_x = u.focal_x,
      cover_focal_y = u.focal_y,
      cover_focal_zoom = u.focal_zoom
  from public.uploads u
  where b.cover_upload_id = u.id
    and u.focal_x is not null;
