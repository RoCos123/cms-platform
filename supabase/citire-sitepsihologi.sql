-- =============================================================================
-- CITIRE, nimic altceva: textele de pe sitepsihologi, ca să scriem pe ele un
-- singur SQL de înlocuiri (brieful din 9 oct. 2026). Nu schimbă nimic în bază.
--
-- Ce NU citește, dinadins:
--   • conținutul secțiunii „Întrebări frecvente” — o schimbă proprietarul din
--     panou; aici apare doar locul ei în pagină, fără texte;
--   • date personale — nici mesaje, nici programări, nici abonați.
--
-- Rulare: Supabase → SQL Editor → New query → lipit tot → Run.
-- Iese un singur rând cu o singură căsuță, „export”. Clic pe ea, copiază tot
-- textul și trimite-l înapoi (lipit în chat sau ca fișier).
--
-- Caută site-ul după „sitepsihologi” în domeniu, nu după o adresă scrisă de mână:
-- dacă între timp s-a mutat pe alt domeniu, tot îl găsește. Dacă găsește mai
-- multe, le întoarce pe toate, fiecare cu domeniul lui.
-- =============================================================================

with site as (
  select * from public.sites where domain ilike '%sitepsihologi%'
)
select jsonb_pretty(jsonb_build_object(
  'citit_la', now(),

  'site_uri', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', s.id,
      'domain', s.domain,
      'name', s.name,
      'template', s.template,
      'published_at', s.published_at,
      'appointments_enabled', s.appointments_enabled
    ) order by s.domain), '[]'::jsonb)
    from site s
  ),

  'setari', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'site_id', st.site_id,
      'brand', st.brand,
      'seo', st.seo,
      'social', st.social,
      'pagini', st.pagini
    )), '[]'::jsonb)
    from public.site_settings st
    join site s on s.id = st.site_id
  ),

  'sectiuni', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', c.id,
      'site_id', c.site_id,
      'key', c.key,
      'variant', c.variant,
      'tone', c.tone,
      'position', c.position,
      'visible', c.visible,
      'is_demo', c.is_demo,
      'data', case when c.key = 'faq' then null else c.data end
    ) order by c.site_id, c.position, c.key), '[]'::jsonb)
    from public.site_content c
    join site s on s.id = c.site_id
  ),

  'servicii', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', v.id,
      'site_id', v.site_id,
      'slug', v.slug,
      'title', v.title,
      'excerpt', v.excerpt,
      'content', v.content,
      'price_label', v.price_label,
      'duration_label', v.duration_label,
      'status', v.status,
      'visible', v.visible,
      'position', v.position
    ) order by v.site_id, v.position), '[]'::jsonb)
    from public.services v
    join site s on s.id = v.site_id
  ),

  'pagini', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', p.id,
      'site_id', p.site_id,
      'slug', p.slug,
      'title', p.title,
      'status', p.status,
      'nav_location', p.nav_location,
      'position', p.position,
      'content', p.content
    ) order by p.site_id, p.position), '[]'::jsonb)
    from public.pages p
    join site s on s.id = p.site_id
  ),

  'imagini', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', u.id,
      'site_id', u.site_id,
      'filename', u.filename,
      'mime_type', u.mime_type,
      'alt_text', u.alt_text
    ) order by u.site_id, u.created_at), '[]'::jsonb)
    from public.uploads u
    join site s on s.id = u.site_id
  )
)) as export;
