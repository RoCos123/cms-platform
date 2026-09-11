-- ----------------------------------------------------------------------------
-- Poziția pozei: pe ce parte se centrează când site-ul o taie la altă formă
-- (object-fit: cover). Clientul o trage cu mausul, ca la Facebook — la încărcare
-- sau din bibliotecă — și ea rămâne așa PESTE TOT unde e pusă poza.
--
-- Stă pe UPLOAD, nu pe fiecare folosire: e o însușire a pozei, aleasă o dată, nu
-- a locului. Sincronizarea în conținutul secțiunilor o face acțiunea de
-- poziționare (`pozitioneazaImagine`), exact ca la descriere (`alt_text`): baza
-- e aici, iar copia din secțiuni e ce citește site-ul public, ca o pagină de
-- vizitator să nu depindă de un al doilea tabel.
--
-- Procente 0–100 din colțul stânga-sus. NULL (amândouă) = centru, adică
-- purtarea de dinainte: pozele fără poziție aleasă arată exact la fel. Un punct
-- are nevoie de amândouă coordonatele, de-aia constrângerea le cere împreună.
-- `smallint` ajunge cu prisosință pentru 0–100 și ocupă jumătate cât un `int`.
-- ----------------------------------------------------------------------------
alter table public.uploads
  add column focal_x smallint,
  add column focal_y smallint,
  add constraint uploads_focal_pereche_in_interval
    check (
      (focal_x is null and focal_y is null)
      or (focal_x between 0 and 100 and focal_y between 0 and 100)
    );
