-- ============================================================================
-- Depozitul de fișiere devine privat.
--
-- CE ERA GREȘIT. Bucket-ul `media` era public, iar politica de citire spunea
-- „oricine poate citi orice din el”, fără nicio despărțire pe cabinete. Nu doar
-- că un străin putea deschide o poză dacă îi știa adresa — putea cere LISTA
-- tuturor fișierelor tuturor clienților. Cerința proprietarului nu lasă loc de
-- nuanțe: un client nu atinge niciodată fișierele altui client.
--
-- CUM SE ÎMPART CELE DOUĂ. Verificat în sursa serviciului de Storage
-- (supabase/storage, src/http/routes/object/):
--   - `/object/public/…` rulează prin `asSuperUser()` și verifică DOAR că
--     bucket-ul e marcat public — nu se uită deloc la politici;
--   - `/object/list/…` rulează sub rolul celui care cere, deci trece prin
--     politici.
-- Prin urmare, cât timp bucket-ul rămâne public, nicio politică din lume nu
-- oprește citirea. Trebuie stins steagul, nu strânsă politica.
--
-- DE UNDE SE MAI VĂD POZELE. Dintr-o rută de-a noastră, `/imagini/<id>/<semnătură>`,
-- care descarcă fișierul cu cheia de serviciu și îl trimite mai departe. Adresa
-- poartă o semnătură pe care numai serverul nostru o poate produce, deci nimeni
-- nu poate fabrica adresa unei poze a altui cabinet. Vezi
-- src/lib/imagini-adrese.ts și src/app/imagini/[id]/[semnatura]/route.ts.
--
-- ORDINEA CONTEAZĂ: întâi se pune codul nou pe Production, abia apoi se rulează
-- migrarea asta. Ruta nouă merge și cu bucket public (descarcă cu cheia de
-- serviciu), deci codul poate sta liniștit înainte. Invers — migrarea înaintea
-- codului — ar stinge toate pozele de pe toate site-urile până la deploy.
-- ============================================================================

update storage.buckets set public = false where id = 'media';

-- Politica veche spunea „oricine, orice”. Dispare cu totul.
drop policy if exists "media: citire publică" on storage.objects;

/*
 * Citirea rămâne doar pentru proprietarul site-ului, mărginită la folderul lui.
 * E nevoie de ea chiar dacă site-ul public nu mai trece pe aici: Storage cere
 * `select` ca să poată face `remove`, iar ștergerea unei imagini din panou merge
 * cu sesiunea clientului, nu cu cheia de serviciu.
 *
 * `anon` nu mai are nimic. Un vizitator nu mai poate nici să citească, nici să
 * listeze — nici măcar propriile fișiere ale cabinetului al cărui site îl vede.
 */
create policy "media: proprietarul site-ului citește din propriul folder"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = public.current_site_id()::text
  );
