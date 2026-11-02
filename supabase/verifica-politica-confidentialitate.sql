-- Doar citire: nu schimbă nimic. Se rulează în Supabase → SQL Editor.
--
-- Pe ce site-uri e PUBLICATĂ politica de confidențialitate. Doar acolo „Politica de
-- confidențialitate” de lângă bifa de acord (formularul de contact, programarea) e un link
-- (2 nov. 2026). Unde scrie „ciornă” sau „lipsește”, textul rămâne fără link până se publică
-- pagina din panoul acelui site: Pagini → Politica de confidențialitate → Publică.
select
  s.domain as site,
  case p.status
    when 'published' then 'publicată'
    when 'draft' then 'ciornă'
    else 'lipsește'
  end as politica,
  p.slug as adresa
from public.sites s
left join public.pages p
  on p.site_id = s.id
 and p.slug like '%confident%'
order by s.domain;
