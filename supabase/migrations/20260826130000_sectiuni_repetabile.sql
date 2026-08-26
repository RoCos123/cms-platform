-- ============================================================================
-- Permite ca aceeași secțiune să apară de mai multe ori pe pagină.
--
-- PROBLEMA: `site_content` avea `unique (site_id, key)`, adică presupunea că
-- fiecare tip de secțiune apare cel mult o dată. Șabloanele contrazic asta:
-- banda cu citat apare de DOUĂ ori în „Căldură" (o dată pe fundal deschis, o
-- dată pe închis) și tot de două ori în „Liniște". E un tipar deliberat de ritm
-- vizual, nu un accident.
--
-- Ocolirea prin chei inventate (`quote`, `quote2`, `quote3`) ar fi mutat
-- problema în date: fiecare cheie nouă ar fi cerut o intrare nouă în registrul
-- de componente, iar clientul n-ar fi putut adăuga a treia bandă fără cod nou.
--
-- SOLUȚIA: identitatea rândului rămâne `id`, nu perechea (site_id, key).
-- Câte instanțe are voie o secțiune se decide în aplicație, unde registrul
-- știe care secțiuni sunt repetabile — nu în constrângerea de bază de date,
-- care nu are cum să știe.
-- ============================================================================

alter table public.site_content
  drop constraint if exists site_content_site_id_key_key;

-- Ordinea de afișare e acum singura cheie de sortare, deci merită index.
create index if not exists site_content_site_id_position_idx
  on public.site_content (site_id, position);
