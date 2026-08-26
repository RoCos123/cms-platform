-- ============================================================================
-- Ce pagini opționale are pornite un site.
--
-- Pagina cu serviciile descrise pe larg e utilă multora, dar nu tuturor: un
-- cabinet cu trei servicii simple e mai bine servit de cartonașele de pe prima
-- pagină decât de o pagină în plus, pe care ar umple-o din obligație.
--
-- Coloană proprie, nu o cheie strecurată în `brand`: acolo stau datele
-- cabinetului (nume, telefon, adresă), iar un comutator de pagină n-are ce
-- căuta printre ele. Aici vor sta și celelalte pagini opționale, pe măsură ce
-- apar.
--
-- Implicit `{}` — adică pornit, fiindcă absența unei alegeri înseamnă „lasă cum
-- e", iar cine tocmai a primit site-ul are pagina construită deja.
-- ============================================================================

alter table public.site_settings
  add column if not exists pagini jsonb not null default '{}'::jsonb;
