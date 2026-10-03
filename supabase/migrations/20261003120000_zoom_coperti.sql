-- ----------------------------------------------------------------------------
-- Mărimea (zoom) punctului focal: cât e mărită poza față de cât îi trebuie ca
-- să umple rama. Merge la pereche cu poziția (focal_x/focal_y, din
-- 20260911140000) — vezi `punct-focal.ts`, unde zoom-ul „călătorește cu punctul
-- focal, nu separat".
--
-- DE CE ACUM. Mărimea n-avea nicio coloană, așa că la COPERȚI (servicii, blog)
-- cursorul „Mărime" se vedea în panou dar nu se păstra pe site — prins de
-- proprietar (3 oct. 2026). La pozele de SECȚIUNE mărimea trăia deja în conținut
-- (`site_content`); coperțile n-au conținut propriu, doar `cover_upload_id`, deci
-- singurul loc unde poate sta mărimea unei coperți e aici, pe poză.
--
-- NULL = 1 (nemărit), adică exact purtarea de dinainte: coperțile fără mărime
-- aleasă arată neschimbat. Intervalul 1–3 e cel din cod (`ZOOM_MINIM`/
-- `ZOOM_MAXIM`); `real` ajunge pentru un număr cu două zecimale.
-- ----------------------------------------------------------------------------
alter table public.uploads
  add column focal_zoom real,
  add constraint uploads_focal_zoom_in_interval
    check (focal_zoom is null or (focal_zoom >= 1 and focal_zoom <= 3));
