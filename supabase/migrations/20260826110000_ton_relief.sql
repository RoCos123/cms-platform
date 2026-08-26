-- ============================================================================
-- Adaugă al patrulea ton de fundal: „relief".
--
-- Șablonul-sursă folosește patru trepte de fundal, nu trei: pe lângă deschis,
-- nuanțat și închis, mai există o treaptă vizibil mai apăsată (`#DFD8D1` în
-- „Căldură"), folosită la testimoniale și la secțiunea de contact. Fără ea nu se
-- poate reproduce ritmul paginii — două secțiuni ar cădea pe un fundal greșit.
-- ============================================================================

alter table public.site_content
  drop constraint if exists site_content_tone_check;

alter table public.site_content
  add constraint site_content_tone_check
  check (tone in ('deschis', 'nuantat', 'relief', 'inchis'));
