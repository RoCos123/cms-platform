# Context — Platformă CMS multi-tenant (site-builder pentru nișă)

Acest document e punctul de plecare pentru orice sesiune nouă (locală sau cloud) pe acest proiect. Citește-l primul.

---

## Ce e proiectul

O rescriere/produs bazat pe `rodi-cotenescu.vercel.app` — un CMS pentru site-uri de prezentare profesională (psiholog, la origine), cu blog. Ținta: **platformă multi-tenant** — un dashboard + un site public per client, la suprafață, dar **o singură bază de date și un singur cod** dedesubt, ca să se poată scala la mii de clienți fără deployment separat per client.

Reperul de efort: originalul (single-tenant, un client, cu bug-uri de configurare) a fost construit în **2 săptămâni** de un dezvoltator. Asta a recalibrat toate estimările din acest document în jos.

---

## Documente în acest folder

- [`audit-dashboard.md`](./audit-dashboard.md) — analiză completă a panoului de administrare original (rute, componente, model de date, fluxuri).
- [`audit-site-public.md`](./audit-site-public.md) — audit SEO/QA al site-ului public original. **Nu e documentație de arhitectură vizuală** — nu descrie pixel-cu-pixel cum arată variantele Hero A/B/C. Acelea se extrag direct de pe site-ul live la momentul construirii.
- [`plan-implementare-cms.md`](./plan-implementare-cms.md) — planul pe faze (Faza 0–8), cu estimări, dependențe și riscuri per fază.
- [`decizii-faza-0.md`](./decizii-faza-0.md) — deciziile confirmate ale Fazei 0 (domeniu, auth, storage, denumiri secțiuni) și implicațiile lor tehnice pentru Faza 1.

---

## Cât mai e până se pot vinde site-uri (9 sept. 2026)

Răspuns la întrebarea proprietarului, verificat în cod, nu din memorie. **Ține
secțiunea asta la zi** — e prima pe care o va deschide, și data trecută listele
incomplete l-au costat timp.

**Platforma e, în esență, terminată.** Panoul are 13 ecrane. Site-ul public are
prima pagină, servicii, blog, pagini proprii, programări. Cinci șabloane.
Izolarea între clienți e dovedită acum pe **baza reală**, nu doar pe banc: pe
10 sept. verificarea de comportament a trecut întreagă pe Supabase — fiecare
client caută datele altuia și e refuzat, niciun anonim nu scrie, nicio funcție a
platformei nu e chemabilă din browser. Depozitul de fișiere e privat. Ștergerea
și exportul datelor există. Provizionarea e o linie de SQL, iar migrările trec
prin CI. Primul site a fost făcut cu ea cap la cap, pe 8 sept.

### Lucrări vizuale, performanță și UX (18–21 sept. 2026)

Nimic din ce blochează vânzarea (tabelul de mai jos) nu s-a schimbat — astea
sunt rafinări cerute de proprietar, uitându-se la site-ul lui viu. Fiecare are
o secțiune proprie mai jos, cu detaliile și motivele; aici doar lista, ca să se
vadă la o privire ce e nou:

- **Șablonul „Liniște" adus la referința „Dragoș Geamănă"** (18–19 sept.) —
  secțiune cu secțiune (hero, citat, despre, cum lucrez, servicii, contact,
  blog), plus cele cinci corecții din al cincilea document și o verificare
  adversarială. Vezi §„De modificat pe șabloane (19 sept.) — al cincilea
  document" și §„Două/Trei lucruri găsite chiar de proprietar".
- **Blog — poza copertei** (19 sept.): se repoziționează acum peste tot
  (era un gol vechi), iar previzualizarea vie din editor arată poziția reală,
  nu centrul. Vezi punctele 1 și 3 din §„Trei lucruri găsite chiar de proprietar".
- **Fontul de titlu serif din cinci secțiuni** (19–21 sept.): corectat, dar
  scos STRICT pe „Liniște" prin steagul `titluSerif` — proprietarul a respins
  prima variantă, care atingea toate cinci șabloanele. Vezi punctul 2 din
  aceeași secțiune.
- **Animație de fade la scroll** (20 sept.): secțiunile intră în cadru cu un
  fade, ca la referință. Pe toate cinci șabloanele (funcție, nu piele). Vezi
  §„Intrarea în cadru a secțiunilor, la scroll".
- **Performanță (raport Lighthouse)** (21 sept.): hCaptcha (~730 KiB) nu se
  mai încarcă pe prima pagină, ci la formular; titlul hero (LCP) se pictează
  instant, nu mai așteaptă JS-ul; fonturile nu se mai preîncarcă (16 → 0);
  țintă de browsere modernă pentru mai puține polyfill-uri. Vezi §„Scor
  Lighthouse" și §„Îmbunătățirile mai mici".
- **Hero cu poză lată pe „Căldură" și „Claritate"** (21 sept.): poză peisaj pe
  toată lățimea (cabinetul, nu un portret), cu textul și butonul centrate
  dedesubt. Așezarea `pozaLata`. Vezi §„Hero cu poză lată".
- **Logoul pulsează la schimbarea paginii** (21 sept.): cât se încarcă pagina
  nouă, logoul din clipa de tranziție respiră. Vezi §„Logoul pulsează".

Toate sunt pe master, CI verde. Șabloanele neatinse de o cerere anume au rămas
neschimbate — regula „funcție/structură la toți, piele doar unde" a ținut peste
tot.

### Unde am rămas (7 oct. 2026)

Scris la sfârșitul unei conversații foarte lungi, ca următoarea să nu pornească
din rezumate. Tot ce e cod e pe master (`cb3cfe2`), CI verde, arborele curat — aceasta
e starea de la 7 oct.; ce s-a făcut după e în paragraful „Lucrări de la 8 oct." de mai jos,
iar ce e pe master și ce nu se vede din `git log`, nu de aici.

**Lucrări de la 8 oct. 2026** (fiecare are secțiunea ei): domeniul îl cumpără clientul,
plus ce înseamnă găzduirea, securitatea și mentenanța (§„Ce vindem: construire +
găzduire, fără domeniu"); tabelul comparativ din „Pachete", doar pe sitepsihologi
(§„Tabelul comparativ din «Pachete»", linia de SQL care îl pornește e rulată);
linkul „Despre" din antet apare doar când secțiunea e pornită (§„Linkul «Despre» din
antet"); „Prețuri" în bara de sus, dintr-un câmp al secțiunii „Pachete" (§„«Prețuri» în
bara de sus"); ochișorul la parolă (7 oct.).

**Brieful din 9 oct. 2026 — pagina de vânzare (PE MASTER, 9 oct.).** Lucrat pe
branch-ul `claude/brief-sitepsihologi`, dus pe master la „fă pe master" al
proprietarului. Raportul final, cu ce are el de făcut: `RAPORT-BRIEF-SITEPSIHOLOGI.md`. Ce e făcut în cod: marcajul `sites.tip` ('cabinet' implicit /
'vanzare'; migrarea `20261009120000_pagina_de_vanzare.sql` **rulată în Supabase pe
9 oct.**, iar sitepsihologi e marcat `vanzare` cu `supabase/marcheaza-sitepsihologi.sql`
— marcajul nu schimbă nimic pe site până nu ajunge codul pe master), formularul cu telefon, model preferat și mesaj doar pe pagina de vânzare
(excepția e scrisă la §„Fără câmpuri de text liber…"), galeria „Modele" (`#modele`,
`#programe` merge în continuare, demo în filă nouă, „Vreau acest model"), „Modele"
primul în bară, subsolul cu o singură listă, alt text propriu la cartonașul de
distribuire, tabelul pe carduri pe ecran îngust, „Datele firmei" în Setări (doar pe
vânzare), bifa de acord legată singură de politica publicată. Textele scrise în cod
ale paginii stau în `src/lib/pagina-vanzare.ts`. Hotărârile proprietarului, de ținut:
- **Regula 1.2 din brief NU se aplică** (9 oct.): nimic nu se ascunde automat din
  cauza textului între [ ], pe niciun site, și nu există script de verificare.
  Secțiunile necompletate (ex. „Păreri" pe sitepsihologi) le ascunde el din panou.
- Întrebările frecvente le schimbă el din panou: nu se ating nici în cod, nici în SQL.
- Tabelul comparativ rămâne în cod (hotărârea din 7 oct.); cifra „5" rămâne scrisă de mână.
- Adresa canonică rămâne `sites.domain`; trece pe `sitepsihologi.ro` abia după ce
  proprietarul confirmă că domeniul e legat și răspunde.
- **Telefonul, WhatsApp-ul și emailul de lângă formular** se iau din Setări → „Datele
  cabinetului" (aceleași numere din antet, subsol și bula verde), ca să nu se scrie de
  două ori; „Datele firmei" are doar denumirea, CUI-ul, Registrul Comerțului, sediul și
  TVA-ul (propus și aprobat, 9 oct.).
- **Textele le schimbă proprietarul, manual, din panou** (9 oct.): nu se scrie niciun
  SQL de texte și nu e nevoie de exportul cerut inițial. Singurul text schimbat de
  noi e cel din tabelul comparativ („MINIM, …" → „Minim: …"), fiindcă tabelul nu se
  editează din panou și proprietarul a cerut schimbarea direct în cod.
- **Titlul pentru Google:** „Site-uri pentru cabinete de psihologie | sitepsihologi.ro"
  (57 de caractere; cel din brief avea 73, iar Setări primește 60). Ales de proprietar
  pe 9 oct.; îl pune el din Setări, fără nicio schimbare de cod.
Rămase, toate la proprietar (secțiunea 7 din raport): textele din panou și „Păreri"
ascunsă, titlul și descrierea din Setări, „Datele firmei", politica de
confidențialitate, legarea domeniului sitepsihologi.ro (apoi mutăm `sites.domain`),
fraza din FAQ despre acces și opțiunile programărilor.

**Lucrări de la 1 la 7 oct.** (fiecare are secțiunea ei mai jos; aici doar lista):
rama de poziționare ia forma locului (1 oct.), mărirea pozei pe ambele axe,
„Păreri" pe verde și cartonașele de servicii refăcute la Liniște (3 oct.),
cartonașe de servicii egale cu „Citește mai mult" și trunchierea văzută în panou
(3 oct.), mesajul de limită (3 oct.), previzualizarea aduce poza în vedere și nu mai
pâlpâie în Edge (4 oct.), bulinele plutesc, fără emoji (4–5 oct.), cel mult trei
repere la „Despre mine" (4 oct.), citatul și întrebările frecvente pe fundalul
„relief" (5 oct.), „X" de ștergere în Bibliotecă (5 oct.), programarea de la
Apropiere pe săptămână Luni–Sâmbătă (5 oct.), **articolele de blog se mută trăgând
„⋯"** (5 oct., migrare rulată) și **mărimea potrivită a pozelor scrisă în panou**
(6 oct.).

**Demo-urile au fost redenumite (7 oct.).** `cosmin-<șablon>.vercel.app` → 
`model-<șablon>.vercel.app` pentru toate cinci (caldura, liniste, lumina, apropiere,
claritate), printr-un `update` pe `sites.domain` rulat de proprietar în Supabase; a
verificat că toate cinci se deschid. `sitepsihologi.vercel.app` și site-urile de
test n-au fost atinse. Adresele din conținut (butoanele „Buton" de la fiecare
program din galeria de pe sitepsihologi) și ștergerea adreselor vechi din Vercel
sunt pași ai proprietarului; el a spus că a terminat cu galeria, dar **n-am
confirmat explicit** că a schimbat butoanele și a șters adresele vechi — de
verificat dacă un cartonaș duce în gol.

**Capturile pentru galerie sunt făcute** (proprietarul a spus „am terminat"). Lecții
pentru cine mai are de făcut capturi, din ce a mers și ce nu:
- Partea de sus a paginii Căldură e **înaltă** (~1500–1800 px: titlu mare, poză lată,
  apoi buton), iar cartonașul „vitrina" e o casetă fixă 16:9, aliniată sus: orice
  captură înaltă se taie la titlu. Soluția care a mers: captura întreagă, pusă
  într-un cadru de 1200 × 675 px cu fundalul crem al paginii în părți (Pillow,
  scalată pe înălțime). Iese mică, dar se vede titlul, poza și butonul.
- Varianta alternativă, **nealeasă de proprietar**: cartonaș mai înalt (3:4). Rămâne
  deschisă dacă vrea vreodată să se vadă mai mult din pagină; ar schimba forma
  galeriei, deci se hotărăște de el.
- Pe Windows/Edge: `F11` (ecran complet) apoi `Windows + PrtScn` salvează în Imagini →
  Capturi de ecran, **sau în OneDrive → Imagini**, dacă acela e folderul Imagini al
  contului. Unelte de dezvoltator + „Capture screenshot" l-au încurcat: nu le mai
  recomanda. Proprietarul e pe Edge și nu e programator; la el merg pașii puțini și
  fiecare cu rezultatul vizibil, nu liste lungi.

**Deschise, fără cerere de la proprietar (nu începe fără el):**
- *(Făcut pe 18 oct., pe branch, nepublicat — vezi „Meniul «Aspect»", sus, în starea curentă.)* Culori
  proprii pe site, fără a atinge șablonul (discutat 5 oct.). Fonturile proprii încă nu.
- Zilele din preaviz la programare scriu „Fără ore" (poate fi „Prea aproape: sunt
  necesare 24 de ore"); săgeți „săptămâna următoare/anterioară" în grila Apropiere;
  banda de citat pe „relief" la Liniște (cere mostră de culoare).
- Neverificate pe aparate/pagini reale: tragerea articolelor cu degetul pe un telefon
  adevărat (emulată prin CDP), derularea automată la marginea ecranului în timpul
  tragerii (scrisă, nerulată), textul cu dimensiunile pozei din editorul de articole
  (același mecanism ca la servicii, nerulat pe pagină), dacă pâlpâitul previzualizării
  din Edge a dispărut de tot (cauza exactă n-a fost confirmată).

**Cum se lucrează cu proprietarul, observat în sesiunea asta:** nu vrea „clar, concret, direct" când nu e; o explicație lungă sau un
șir de pași care nu duc nicăieri îl enervează, cu motiv. Când ceva nu merge la el, nu
adăuga pași — întreabă ce vede sau oferă să faci tu partea (ca la capturi). Orice
merge pe master abia după un „da, fă merge pe master" explicit; SQL-ul i se dă și în
chat, nu doar ca fișier. **Nu schimba nimic nesolicitat**, nici ca să iasă mai corect un
text: propune și așteaptă (7 oct.: textele lui rescrise de mine; 8 oct.: eticheta unui
rând, schimbată din inițiativa mea — amândouă respinse). Verificarea cerută de el se
face ÎNAINTE de înlocuire, iar ce iese neconform se ține pe loc și i se spune.

**Limbile site-ului: bulina cu steag (română · engleză · germană) prin traducerea Google — PE MASTER
(`0d6760c`, CI verde, rularea 230, 21 oct. 2026), DOAR PE CLARITATE, OPRITĂ DIN OFICIU (21 oct. 2026; cerut de proprietar: „hai să facem modificarea limbii din RO în EN dar și
în DE", apoi „o bulină… steagul RO când e în română, steagul Angliei când e în engleză" și „să fie
opțională, din panou").**
Dusă pe master la „fă pe master" (21 oct.). **Următorul pas e al proprietarului:** intră din `/proprietar` în
panoul lui `model-claritate`, bifează Setări → „Traducere site (EN/DE)” și încearcă pe Google adevărat
(lista de mai jos, „De verificat de proprietar"). *Hotărârile din
18 oct. rămân:* cât mai simplu, fără DeepL sau alt serviciu cu cheie, fără traduceri scrise de client,
panoul rămâne în română. **Nu reproune variantele respinse** (traducere pe server, ecrane pe limbi).
Prima variantă, un rând „RO · EN · DE" la capătul meniului (jos în ☰ pe telefon), a fost înlocuită la
cererea proprietarului cu bulina — ocupă mai puțin și se vede pe telefon fără să deschizi meniul.
**Doar pe șablonul Claritate** (cerut de proprietar, 21 oct.: „hai să aplicăm doar pe claritate"):
`SABLOANE_CU_TRADUCERE = ["claritate"]` în `src/lib/traducere.ts`. Pe celelalte șabloane cardul din Setări nu
apare, serverul refuză pornirea, iar o bifă rămasă în bază nu pune bulina pe site (verificat în browser pe
toate cinci). Ca să se deschidă și altora, se adaugă cheile lor în listă. Repararea navigării pe pagina
tradusă NU ține de listă (e invizibilă și ajută orice site citit prin Google).
*Ce e construit:*
- **Bulina** (`src/components/site/comutator-limba.tsx`, steagurile în `steaguri.tsx`): rotundă, steag de
  13px (micșorată la jumătate, din 26px, la cererea proprietarului după proba pe Google adevărat — „funcționează",
  21 oct.; pe master `25d275a`), zona de apăsat 28px (minimul pentru o țintă de deget e 24px), în antet
  după linkuri, pe telefon lângă ☰; arată steagul limbii în care e citită pagina (britanic pentru engleză —
  propunerea mea, acceptată cu „așa"). Apăsată, deschide lista Română · English · Deutsch, fiecare cu steag
  și nume în limba ei, limba curentă bifată; se închide la clic în afară sau cu Esc. Steagurile sunt
  DESENATE (SVG), nu emoji: Windows arată steagurile emoji ca două litere. English/Deutsch sunt LINKURI
  către traducerea Google a aceleiași pagini
  (`https://<domeniu-cu-liniuțe>.translate.goog/<cale>?_x_tr_sl=ro&_x_tr_tl=en&_x_tr_hl=en`), Română duce
  înapoi la pagina noastră. Până la clic nu se încarcă nimic de la Google. `translate="no"`; lista stă mereu
  în pagină și doar se ascunde (`hidden`), ca deschiderea să nu mute noduri pe sub traducere.
- **Bifa** din Setări („Traducere site (EN/DE)” — titlul ales de proprietar, fără alt rând sub el — →
  „Arată alegerea limbii pe site”), salvată pe loc
  în `site_settings.pagini.limbi`. **Oprită din oficiu** (lipsa valorii = oprit, pe dos față de pagini);
  proprietarul a cerut-o explicit opțională, din panou (21 oct.). O pornește clientul; pe site-urile model,
  proprietarul, intrând în panoul lor din `/proprietar`. Fără migrare, fără SQL.
- **Banda albă de pe pagina tradusă** (captura proprietarului, 21 oct.): la derulare, deasupra antetului rămânea
  o bandă albă goală — locul barei Google de traducere, care se ascunde —, iar antetul nostru stătea lipit sub
  ea. Reparat (pe master `41d1fbc`, CI verde, rularea 232): pe `*.translate.goog`, `navigare-tradusa.tsx` pune `data-tradus` pe `<html>`, iar
  `html[data-tradus] .antet` nu mai e lipit (`position: relative`, `top: 0`), deci urcă odată cu pagina.
  **Mecanismul exact al Google nu l-am văzut** (Google e blocat din mediul de lucru; imitația locală nu
  reproduce banda), deci e o reparație probabilă, nu dovedită: dacă banda rămâne, e chiar bara Google și
  nu se scoate din site. Pe domeniul site-ului antetul rămâne lipit, ca înainte.
- **Steagul mare pe site-ul publicat** după `25d275a` (proprietarul, 21 oct., și după Ctrl+F5): în cod și în
  build-ul local steagul are 13px; nu s-a putut vedea de aici ce a publicat Vercel. Acum mărimea e scrisă și
  în atributele steagului (`steaguri.tsx`), nu doar în CSS. Dacă și după următoarea publicare apare mare:
  de verificat în Vercel → Deployments că ultima publicare e a commit-ului cel nou și e „Ready".
- **Navigarea pe pagina tradusă** (`src/components/site/navigare-tradusa.tsx`, pe TOATE site-urile, fiindcă
  la traducerea Google se ajunge și din rezultatele căutării). Proba proprietarului pe `model-apropiere`
  (21 oct.): prima pagină și o pagină interioară deschisă direct cu coada se traduc, dar un clic în meniu
  dădea „Can't translate this page” — linkurile relative duceau la adresa fără coada `_x_tr_*`. Acum, doar pe
  `*.translate.goog`, clicul pe un link al site-ului primește coada paginii curente și încarcă pagina întreagă
  (fără navigarea rapidă din Next). Plus peticul pentru React când Google rescrie textul (react#11538).
  Pe domeniul site-ului nu face nimic.
- **Antetul** se strânge în ☰ mai devreme când bulina e pornită (`greutateMeniu` în `header.tsx`: bulina
  cântărește cât un link, pe Apropiere — lângă „Programează" — cât trei): cu un nume real, rândul se rupea
  pe două. Meniul, bulina și ☰ stau într-un grup (`.antet-grup`) care nu se strânge sub bulină + ☰ (la 360px,
  strâns, ☰ ieșea din ecran). Fără bulină, antetul e exact cum era (nici grupul nu există).
- **Politica de confidențialitate**: paragraf nou `[TRADUCERE]` în `sabloane/` (inclusiv că ce se trimite
  dintr-un formular de pe pagina tradusă trece prin Google). Paginile deja scrise ale clienților nu se schimbă
  singure — vezi tabelul din §„Politica de confidențialitate se schimbă odată cu platforma”.
*Antetul, pe Claritate, după poartă:* 360–1440px, 4–7 linkuri, nume lung: nimic rupt și nimic ieșit din ecran;
singura diferență, la 430px numele lung trece de pe un rând pe două (întreg, netăiat — încape în cele două
rânduri permise).
*Cum s-a verificat:* `e2e/limbi.proba.mjs` (adresele, coada, bifa, legăturile din cod); în browser, pe stiva
locală, cu o **imitație** a traducerii Google (Google e blocat din mediul de lucru): fără coadă → „Can't
translate”, cu coadă → textul rescris în `<font>`. Imitația reproduce eroarea văzută de proprietar fără
reparație; cu reparație, pe toate cinci șabloanele: meniul, logoul, ancorele, English → Deutsch → Română,
bulina și meniul de pe telefon (deschise/închise după rescriere) merg, fără erori. **Nu e Google adevărat.**
*De verificat de proprietar după „fă pe master”* (pornind bifa pe un site model): clic în meniu pe pagina
tradusă; trimiterea unui formular de pe pagina tradusă — **necunoscut** dacă Google lasă să treacă
trimiterea (dacă nu, varianta propusă: un rând „Pentru contact/programare, treci la română”; de hotărât,
ținând cont și că datele trec prin Google); programarea online pe pagina tradusă.
*Rămâne de știut:* paginile traduse nu se indexează ca ale clientului (nu aduc poziționare); calitatea
traducerii e a Google; cererile de preîncărcare ale Next (`?_rsc=`) ajung și ele la Google pe pagina
tradusă și primesc eroare — fără efect vizibil.

**Meniul „Aspect": culori și fonturi alese de client — CULORILE SUNT FĂCUTE ȘI PE MASTER, ÎN PROBĂ
DOAR PE `model-claritate.vercel.app` (Claritate); FONTURILE FĂCUTE PE 20 OCT. 2026, ȘI ELE PE
MASTER (`fc6e863`, CI verde, rularea 221), în aceeași probă. DESCHIDERE TREPTATĂ, CÂTE UN ȘABLON
(proprietarul, 20 oct.: „hai să aplicăm treptat, pe fiecare șablon în parte"): LUMINĂ pe
`model-lumina.vercel.app` („pe model-lumina frate, pe asta să apară"), apoi CĂLDURĂ pe
`model-caldura`, apoi LINIȘTE pe `model-liniste` (21 oct.) — toate trei pe master. APROPIERE pe
`model-apropiere` („merge, hai la Apropiere", 21 oct.): poarta și cele trei hotărâri (mai jos, la
„Apropiere") sunt pe master (`92fd7a3`, CI verde, rularea 229). Cu asta, toate cinci șabloanele au
„Aspect", fiecare doar pe site-ul lui model. Pasul următor, când îl cere proprietarul: deschiderea
pentru clienți (`aspectPermis` → `true`, vezi `acces.ts`).**
*A doua colecție de culori, „Mat & Mineral” (23 oct. 2026, cerută de proprietar; PE MASTER, DOAR PE CLARITATE —
„fă pe master, dar doar pe un model/șablon, hai pe claritate”):* `SABLOANE_CU_MAT = ["claritate"]` în
`src/lib/aspect/acces.ts`. Pe celelalte șabloane comutatorul „Colecția” nu apare (doar culorile mătăsoase, ca
înainte), salvarea unui „mat” se refuză, iar un „mat” rămas în bază e citit ca mătăsos (`faraFinisajNepermis`,
în `culoriPermise` și în pagina „Aspect”). Verificat în browser: Claritate — comutator, culoarea mată plată pe
site; Lumină — fără comutator, aceeași culoare mătăsoasă. Ca să se deschidă și altora: cheile lor în listă.

lângă „Mătăsos & Radiant” (cele 12 de până acum, `PRESETURI_MATASOASE`), 12 culori mate (`PRESETURI_MATE`,
numele și codurile exact ale lui: Rosewood Mat `#54282C` … Espresso Mat `#30231C`). Aceleași culori de statut,
plate: fără mătase (gradient) pe benzi, subsol și butoane, cu o cromă mai calmă.
- **Cum se leagă:** finisajul e un câmp separat, `brand.aspect.culori.finisaj = "mat"`; lipsa lui = mătăsos.
  Fără migrare (JSONB), iar culorile salvate înainte rămân identice (mătăsosul nu se scrie). Am ales câmpul,
  nu „HEX-ul e în lista mătăsoasă” (varianta propusă și de proprietar): o culoare aleasă cu pipeta n-ar fi avut
  finisaj sigur. `paletaDinCuloare(sablon, culoare, finisaj)`: la „mat” lipsesc `fundalInchisMatase` și
  `accentMatase`, iar componentele cad singure pe culoarea plină (`var(--t-fundal-inchis-matase,
  var(--t-fundal-inchis))`) — nicio componentă atinsă. Banda „Ce spun clienții” (Liniște) e și ea plată la mat.
- **Regulile mate** (`REGULI_MATE`, HSL, ca ale proprietarului): banda = nuanța și saturația culorii,
  luminozitatea × 0,57; linkurile = luminozitatea + 7,5; pe bandă șampanie-nisipiu `#D5C2A3`; textele de pe
  bandă și calcarul — comune. Potrivite pe cele 12 ținte date de el (banda și linkurile fiecărei culori): cel
  mult 0,014 / 0,019 distanță OKLab, sub pragul de ~0,02 de la care ochiul deosebește două culori; proba le
  compară pe toate. Apoi aceeași gardă de contrast 4,5:1 (banda se întunecă, la nevoie, ca textele de pe ea să
  treacă; o culoare foarte deschisă, scrisă de mână, tot bandă închisă dă).
- **În „Aspect”:** „Colecția” — două butoane deasupra culorii și a mostrelor; butonul ESTE finisajul (se aplică
  și culorii scrise cu pipeta, și modului manual). Mostrele colecției mate sunt plate, cele mătăsoase cu luciu.
- **Verificat:** probele (12 mate pe toate cinci șabloanele, sute de culori la întâmplare și cu finisaj mat,
  țintele, validarea, modul manual); în browser, pe `ana.test` (poarta deschisă temporar): la mat subsolul,
  banda și butoanele n-au gradient (butonul e exact `#54282C`), pe toate cinci șabloanele; înapoi la mătăsos,
  gradientul revine; în bază se scrie `"finisaj": "mat"`, iar la mătăsos cheia dispare.
*Lumină, verificat local (stiva reală, `ana.test` pe Lumină):* fără culori — neschimbat; cu Safir,
Smarald + „Elegant", Bordeaux + „De revistă" — nimic stricat, nicio eroare. De știut: cu o culoare
aleasă, tenta lavandă a Luminii devine calcarul cald (ca pe Claritate); fără font ales, Lumină are
de la sine titluri amestecate (Cormorant la unele, sans gros la „Despre mine", „Ce spun",
„Întrebări", „Newsletter", „Cum decurge") — așa e șablonul; cu un font de titlu ales se unifică.
Domeniul `model-lumina.vercel.app` e presupus după modelul celui de Claritate — dacă e altul,
meniul nu apare (fără stricăciuni) și se corectează în `acces.ts`.
*Lumină pe master* (`d52057e`); proprietarul: „merge". *CĂLDURĂ pe `model-caldura.vercel.app`*
(„merge, hai la Căldură") — pe master (`27683c2`, apoi `6e219ca` pentru 1,08). Verificat local: fără culori neschimbat; cu Safir, Smarald +
„Elegant", Bordeaux + „De revistă" — nimic stricat, nicio eroare; meniul și pagina apar. Găsit, NU
legat de „Aspect" (șablonul de dinainte, pe toate site-urile Căldură): la titlul mare (Manrope 700 +
partea a doua în Cormorant cursiv, la 0,98), virgula lui „Ș"/„ț" atinge rândul de dedesubt;
măsurat pe pixeli: „…psihoterapie, / în ritmul tău" se desparte de la 1,00, dar „Ședințe pentru
tine / îți ascult povestea" (căciulița înaltă a lui „î" în Cormorant) abia la 1,08 — 1,05 nu
ajunge. Proprietarul: „1, pune 1,08 și fă pe master" → `caldura.ts`, `interlinieMinimaTitlu: 1.08`,
pe TOATE site-urile Căldură; verificat pe pixeli (ambele titluri despărțite: 11px, 4px).
*LINIȘTE pe `model-liniste.vercel.app`* („merge, hai la Liniște"; domeniul e cel din lista
demo-urilor din 7 oct.). Verificat local: fără culori neschimbat; cu culori și fonturi — nimic
stricat. Două lucruri găsite și hotărâte de proprietar („B și 1,05, apoi fă pe master", 21 oct.):
(1) banda „Ce spun clienții" avea verdele-salvie scris direct în componentă, deci rămânea verde
și pe un site cu Safir sau Bordeaux; acum, DOAR cu culori alese, e același ton stins în nuanța
accentului (rolul `fundalPareri`, `REGULI_PREMIUM.pareri`: salvia cu lumina și croma ei, cu 0,02
mai închisă — fără coborâre, aurul-șampanie al etichetei ieșea 4,2:1 pe partea luminoasă; acum
cel mai slab caz e 4,6:1, probat pe toate nuanțele, și în modul manual). Fără culori alese,
verdele exact de până acum. (2) Titlul mare (Cormorant, 0,98) lăsa virgula lui „Ș" să atingă
căciulița lui „î" de dedesubt, și pe Liniște, și pe Lumină (același font); se atinge și la 1,00 →
`interlinieMinimaTitlu: 1.05` în `liniste.ts` ȘI `lumina.ts`, pe TOATE site-urile lor (nu doar
cele cu „Aspect"). Pe pixeli: pe laptop ~4px între rânduri; pe telefon (48px) doar 1–2px — nu se
ating, dar sunt aproape; dacă proprietarul vrea mai mult aer, 1,08 (ca la Căldură). Pe master
(`0b28605`, CI verde, rularea 228).
*APROPIERE pe `model-apropiere.vercel.app`* („merge, hai la Apropiere"; domeniul e cel din lista
demo-urilor din 7 oct.) — poarta e PE BRANCH; cu ea, toate cinci șabloanele au „Aspect", iar poarta
mai ține doar prin domenii. Verificat local: fără culori neschimbat; cu Safir, Smarald +
„Prietenos", Bordeaux + „Elegant", „Personal" fără culori — nimic stricat, nicio eroare, meniul și
pagina apar. Găsite, de hotărât de proprietar (cu imagini):
(1) Cartonașele „salvie" ale Apropierii (al doilea serviciu din patru, cardul din mijloc la
„Păreri", cardul de lângă datele de contact, cel din spatele pozei din „Despre", pata din hero) au
ca fundal `--t-accent-pe-inchis`; cu o culoare aleasă, acela e aurul-șampanie → cartonașele ies
aurii, nu în culoarea aleasă. Variante arătate: A aur-șampanie (cum iese acum), B nuanță pală vie a
culorii alese, C pală stinsă (L ~0,90, C 0,03) — B și C calculate ca textul de pe ele să treacă
4,5:1. (2) Lizibilitatea pe cartonașele colorate NU intra în garanția paletei: textul mic gri și
„Citește mai mult" ies sub 4,5:1 — pe aur 3,7:1 (linkul 3,6:1 la culorile verzi), pe piersică
4,1:1 (cu orice culoare aleasă), iar pe șablonul însuși, fără culori, 3,4:1 pe salvie. Propunerea:
pe cartonașele colorate, textul mic și linkul în culoarea textului principal (≥ 6,3:1). (3) Titlul
mare pe telefon (Nunito 800, 0,98): virgula lui „Ș" atinge „t"-ul de dedesubt („Ședințe pentru /
tine"), și la 1,05; la 1,08 se despart. Pe laptop nu se ating. Propunerea: 1,08, ca la Căldură.
*Hotărât* (proprietarul: „facem cum crezi tu că e mai bine" → recomandările sesiunii; pe master
`92fd7a3`):
(1) varianta C — rolul `fundalSalvie` (`REGULI_PREMIUM.salvie`: nuanța accentului, C 0,03, de la
L 0,80 deschisă doar cât trec 4,6:1 textul, textul secundar, linkurile și accentul → în practică
L ~0,90), doar cu culori alese; cele cinci locuri folosesc `var(--t-fundal-salvie,
var(--t-accent-pe-inchis))`, deci fără culori salvia rămâne. Piersica rămâne a șablonului.
(2) Pe TOATE site-urile Apropiere: pe cartonașele colorate de la servicii (salvie, piersică),
descrierea și „Citește mai mult" sunt în culoarea textului; la „Păreri", pe cardul din mijloc,
rândul mic de sub nume la fel. Măsurat în browser: cel mai slab text pe un cartonaș colorat e
6,6:1 fără culori, 8,0:1 cu culori (înainte: 3,4–4,1:1). Cartonașele albe neschimbate.
(3) `apropiere.ts`, `interlinieMinimaTitlu: 1.08`, pe TOATE site-urile Apropiere; pe pixeli: telefon
2–4px între rânduri, laptop 12–16px. Probe: 2 teste noi + reguli în cele existente, 16 stricări
prinse; tot: 528.
Întâi a fost doar discutat (proprietarul: „momentan nu facem
nimic, doar discutăm"); apoi a cerut „hai sa facem partea cu culorile si fonturile… Mai intai
culorile". Cerere: fiecare client să-și poată schimba culorile și fonturile din panou.
*Hotărâri confirmate:*
- **Culori, mod AUTOMAT (implicit):** clientul alege O culoare principală, iar restul paletei se
  calculează din ea — inclusiv **fundalurile, care se colorează după culoarea aleasă** (tentă
  verzuie la verde etc.), fundalul închis, textul (aproape negru, cu tentă), accentul de pe fundal
  închis. Nu e „doar accentul" (varianta mai îngustă din 5 oct.). În modul automat lizibilitatea e
  GARANTATĂ: pe fiecare pereche text–fundal se verifică WCAG 4,5:1 și se ajustează luminozitatea.
- **Culori, mod MANUAL:** *vizibil, nu ascuns*, cu un text care explică ce e. Pornește de la paleta
  calculată; clientul schimbă fiecare culoare în parte; **lizibilitatea NU mai e garantată, iar el
  își asumă** (proprietarul: „nu contează dacă e lizibil sau nu, își asumă"). Propunerea sesiunii
  (încă neconfirmată): ~opt culori cu nume pe înțelesul lui („Fundal", „Fundal nuanțat", „Fundal
  închis", „Text", „Text mai discret", „Culoarea principală", „Text pe butoane", „Accent pe fundal
  închis"), restul (chenare, eroare) rămân calculate; avertisment galben NEBLOCANT lângă o pereche
  greu de citit + bifă „înțeleg că poate fi greu de citit"; buton „Revino la culorile șablonului".
- **Fonturi:** unul pentru text și unul pentru titluri, dintr-o listă ALEASĂ (de sesiune, de arătat
  proprietarului înainte să se construiască). Limită tehnică, nu de gust: fonturile se servesc de pe
  domeniul clientului (`next/font`, descărcate la build — fără cereri către Google, ca politica să
  rămână adevărată), iar `next/font` cere argumente scrise în cod, deci nu se poate „orice font din
  Google"; fiecare font trebuie verificat că are `latin-ext` (ă, â, î, ș, ț).
- **Pentru TOȚI clienții, FĂRĂ plată** (nu modul plătit ca Programările). *(Proprietarul a scris
  „pachetele și fonturile"; înțeles: culorile și fonturile.)*
*Cum s-ar face (propunere, fără SQL):* ecran nou „Aspect" în panou, cu previzualizare live; valorile
stau în `site_settings.brand` (JSONB); `templateStyle(template)` din `src/lib/templates/index.ts` e
singurul loc prin care culorile și fonturile ajung în CSS, deci acolo se aplică suprascrierea —
componentele de secțiune nu se ating. Paleta calculată trebuie să păstreze CARACTERUL fiecărui din
cele cinci șabloane (crem cald la Căldură, al doilea accent cald la Apropiere etc.) și s-ar proba cu
sute de culori la întâmplare, pe aceleași perechi pe care le verifică `e2e/contrast-sabloane.proba.mjs`.
Site-urile existente nu se schimbă până nu alege clientul. *Estimare, cu rezerve:* culori 2–3
sesiuni, fonturi o jumătate–una. *Riscuri spuse proprietarului:* un client își poate strica site-ul în
modul manual și va scrie proprietarului (de aici butonul de revenire și avertismentul); șabloanele au
caractere diferite, deci paleta calculată cere grijă. *Ordinea, hotărâtă de proprietar:* întâi
culorile (automat înainte de manual), apoi fonturile. *Rămas de hotărât:* **lista de fonturi** (de
arătat proprietarului ÎNAINTE să se construiască).

*Starea culorilor (18 oct. 2026, pe branch `claude/sleepy-tesla-aanhq7`; „fă pe master" nu s-a spus):*
- **Ce vede clientul:** intrare nouă „Aspect" în meniu (înaintea Setărilor), ecran `/dashboard/aspect`.
  Două moduri, ambele vizibile, fiecare cu explicația lui: **Automat** (o culoare: pătrățel + cod
  `#RRGGBB` + 12 culori gata alese; se acceptă și codul fără „#") și **Manual** (nouă culori cu nume
  pe înțelesul lui, fiecare cu „Revino la cea calculată"; pornește de la paleta calculată din
  culoarea principală, sau de la a șablonului dacă n-a ales una). Previzualizare vie (antet, hero,
  servicii, citat, întrebări pe fundal închis, subsol — toate cele patru fundaluri, la orice șablon).
  „Revino la culorile șablonului" + Salvează ⇒ cheia dispare din bază, site-ul e identic cu cel de
  dinainte. Un cod greșit nu strică nimic: eroare lângă câmp, la ieșire revine ultima valoare bună.
- **Automat:** paleta se calculează din culoarea aleasă (`src/lib/aspect/paleta.ts`). *Din 19 oct.
  (paleta premium, mai jos)* cinci roluri urmează regulile HSL ale proprietarului; restul (fundalul
  paginii, relieful, textele, accentul de pe închis, erorile) păstrează luminozitatea și „cât de
  colorat" ale șablonului, cu nuanța aleasă (OKLCH). Apropiere își păstrează piersica.
  Pe fiecare pereche text–fundal contrastul e ≥ 4,5:1 — verificat pe 386 de culori × 5 șabloane,
  inclusiv galben, magenta, alb, negru, gri. **O culoare prea deschisă se întunecă** doar cât să se
  citească pe fundal deschis, iar panoul o spune („Pe site apare puțin mai închisă"); galbenul
  `#FFEB3B` ajunge un măsliniu închis (`#695F00`) — așa cere fizica contrastului, nu un defect.
  Cele 12 culori gata alese (premium, din 19 oct.) apar pe butoane EXACT cum sunt, pe toate șabloanele.
- **Manual:** ce alege omul se aplică EXACT, fără corecții. Pe ecran apare o listă galbenă
  **neblocantă** cu perechile sub 4,5:1, cu nume pe înțelesul lui („Textul pe fundalul paginii:
  contrast 1,0:1 (se recomandă cel puțin 4,5:1)") și „Poți salva oricum — alegerea e a ta". Dacă
  schimbă fundalul paginii, fundalul „mai închis" și chenarul se mută odată cu el.
  **Alegerea mea, de confirmat de proprietar:** în loc de bifa „înțeleg că poate fi greu de citit"
  (propusă, neconfirmată), salvarea cu avertismente scrie singură `asumat: true` în bază — nu
  schimbă nimic pe site, e doar dovada că a salvat știind. Dacă vrea bifa, e o schimbare mică.
- **Previzualizarea = site-ul REAL al clientului (18 oct., cerut de proprietar: „de ce nu am imaginea din
  modelul Claritate, pe care am creat-o?" — primele două versiuni aveau o pagină de exemplu cu texte
  inventate, fără nicio poză).** `src/lib/aspect/previzualizare.ts` (doar pe server) citește pentru
  `session.siteId` ACELEAȘI lucruri ca prima pagină publică și cadrul public, prin aceleași funcții:
  secțiunile VIZIBILE în ordinea lor, pozele rescrise din `uploadId` (adrese semnate, nu cele vechi din
  JSON), serviciile publicate, articolele (doar dacă blogul e pornit), orele de programare, antetul
  (nume, subtitlu, logo, telefon, meniu) și subsolul (datele din Setări, coloanele cu servicii și
  cabinet, paginile legale, rețelele). Fără nicio secțiune vizibilă (site abia provizionat) → `null`, iar
  ecranul păstrează pagina de exemplu, cu o notă care o spune. **Atenție, de ținut minte:** NU e o copie
  automată a cadrului public — dacă antetul sau subsolul public capătă un câmp nou, previzualizarea nu-l
  are decât după ce-l primește și acolo (e scris în comentariul fișierului); pe pagina de vânzare
  (`tip = 'vanzare'`) antetul/subsolul au varianta lor (meniu și rând legal ale firmei), pe care
  previzualizarea NU o reproduce — se primește doar `paginaVanzare` pentru secțiuni; de reluat când
  „Aspect" se deschide și pe sitepsihologi. Probe: două teste noi în `e2e/aspect-culori.proba.mjs` (44
  în total), 11 stricări noi (alt site, secțiuni ascunse, adrese vechi, fără rezervă, blog oprit,
  exemplul rămas în JSX…), toate prinse. Încercat în browser pe stiva reală (Ana pe Claritate, cu
  `ana.test` pus TEMPORAR în poartă): textul, serviciile, telefonul, emailul și descrierea ei apar;
  exemplul inventat a dispărut; poza apare pe EXACT aceeași adresă semnată ca pe site; „Prună" schimbă
  accentul și fundalul, iar textul și poza rămân; o secțiune ascunsă nu apare; fără secțiuni vizibile →
  exemplul; 375 px fără derulare în lateral. *Local, pixelii pozei nu se încarcă* (depozitul de probă
  n-are fișiere) — la fel și pe site-ul local; contează adresa, care e identică.
- **PALETA „PREMIUM" (19 oct. 2026, cerută de proprietar: „Premium / High-Status / Quiet Luxury" —
  culorile de dinainte „par șterse și ieftine"; plan arătat întâi, toate cele 5 recomandări
  acceptate).** Pe branch, NEPUBLICATĂ până la „fă pe master".
  - **Cele 12 culori gata alese**, exact cum le-a dat el: Arămiu `#6E2C1B`, Burgundy `#5E121D`, Ametist
    `#5A2241`, Aubergine `#38142C`, Indigo `#281B52`, Bleumarin `#0F1E36`, Safir `#0D3B66`, Petrol
    `#0B4249`, Smarald `#0E3A2F`, Chiparos `#2C3522`, Espresso `#362218`, Antracit `#222930`
    (`PRESETURI_CULOARE` în `src/lib/aspect/salvare.ts`).
  - **Safir e doar PROPUS în câmp** (`CULOARE_PROPUSA`) cât timp clientul n-a ales nimic: nu se
    salvează și nu schimbă site-ul. `claritate.ts` NU s-a atins (accentul lui rămâne `#1B5C99`), deci
    site-urile fără culori alese rămân identice — hotărârea proprietarului.
  - **Regulile (HSL, procente, `REGULI_PREMIUM` în `paleta.ts`)**, legate de rolurile existente `--t-*`
    (NU `--color-*`: numele alea sunt ale panoului, în `globals.css`): `accent` (butoane, accente
    mari) = culoarea aleasă, iar dacă L > 50 coboară la L 28; `fundalInchis` (benzi, subsol) = H, S ≤ 65,
    L 11–15; `accentInteractiv` (ROL NOU: linkuri, hover pe butoane) = H, S + 12 (≤ 85), L 32–38;
    `fundalNuantat` (carduri, secțiuni alternative) = H, S 10–16, L 95–97, fără transparență; `chenar`
    = H, S 15, L 88. *Excepție a mea:* un gri (S < 5) rămâne gri — HSL îi dă nuanța 0 (roșu), iar
    regulile i-ar fi dat fundaluri roz.
  - **Contrastul câștigă MEREU** (hotărârea proprietarului): după ținta HSL, fiecare rol se verifică
    pe toate perechile text–fundal (≥ 4,5:1) și, dacă nu trece, se întunecă exact cât trebuie, în OKLCH
    (acolo nuanța percepută nu fuge; HSL e folosit doar pentru ținte, fiindcă numerele lui sunt cele pe
    care le poate verifica proprietarul). Butonul se verifică DIRECT cu textul alb de pe el. Exemple:
    Petrol și Smarald au linkurile sub prag pe 32–38% → ies pe ~25% (Petrol: `#00707E`, 5,24:1); un
    galben scris de mână → butonul coboară la L ≤ 28 și se mai întunecă.
  - **Linkurile și hover-ul:** `section.tsx` pune `--s-link` (pe deschis
    `var(--t-accent-interactiv, var(--t-accent))`, pe închis ca înainte) și `--s-buton-hover` (pe
    deschis `var(--t-accent-interactiv)` FĂRĂ rezervă, pe închis `initial`). Linkurile reale care o
    folosesc: „Citește mai mult" (servicii), „Citește →" (cartonașele de articole), „Toate articolele"
    (secțiunea de pe prima pagină și capătul unui articol), linkul politicii de lângă bifă. Hover: regula `.buton-plin` din `globals.css`, pe butonul principal din
    hero, butonul din „Despre mine" și butoanele de trimitere ale formularelor (contact, newsletter,
    programare). Fiindcă niciun șablon nu are `accentInteractiv`, pe un site fără culori alese
    variabila e nevalidă și butonul NU capătă hover — hotărârea proprietarului. *Nu am pus hover* pe
    butoanele din „Pachete" (au variantă proprie la Apropiere) și pe cele de pe benzile închise
    (butonul de acolo e inversat). **Hover-ul se vede și în previzualizarea din „Aspect"** (cerut de
    proprietar, 19 oct.: „aș vrea să se vadă și hover în previzualizare"). Fereastra rămâne `inert`
    (un Tab din formular nu intră în site-ul fals, click-ul nu face nimic), deci `:hover` nu se aprinde;
    `CadruPrevizualizare` ascultă mausul pe documentul ferestrei, găsește butonul de sub el după
    dreptunghi (`elementsFromPoint` NU vede elementele inerte — verificat în Chromium) și îi pune
    `data-hover`, tratat în `globals.css` exact ca `:hover`. Pornit DOAR în „Aspect" (prop
    `hoverPeButoane`); celelalte previzualizări din panou rămân cum erau — se poate porni și acolo cu
    un cuvânt, dacă se cere. Încercat cu mausul adevărat: fără culori nimic; Petrol → `#00707E` sub
    maus, înapoi la plecare; click fără efect; după altă culoare, hover-ul urmează culoarea nouă.
  - **Modul manual are a 9-a culoare, „Linkurile"**, precompletată cu valoarea calculată (și când nu
    e aleasă nicio culoare principală: atunci se calculează din accentul șablonului — `bazaManuala`,
    aceeași funcție pentru ecran și site). Avertismentele includ linkurile și textul butonului la hover.
  - **Mostrele:** fiecare card arată 3 fâșii rotunjite — 65% butoanele, 20% linkurile, 15% fundalul
    cardurilor —, calculate cu aceeași funcție ca site-ul, pe șablonul site-ului.
  - **Ce s-a schimbat față de 18 oct.:** cardurile de la Claritate nu mai rămân alb pur când clientul
    alege o culoare (tentă L 95–97; acceptat de proprietar); banda închisă și chenarul urmează regulile
    lui, nu luminozitatea șablonului; site-ul de probă `model-claritate` (dacă a salvat deja o culoare)
    se recalculează după regulile noi la publicare.
  - **Probe:** `e2e/aspect-culori.proba.mjs` — 56 de teste (al 56-lea: hover-ul din previzualizare, 6
    stricări prinse); regulile proprietarului scrise în probă cu
    numerele lui (nu importate), pe 386 de culori × 5 șabloane; 20 de stricări (limite schimbate, +12
    scos, gardă scoasă, regula L > 50 scoasă, griul colorat, preseturi/culoare propusă greșite, linkuri
    sau hover fără/cu rezervă, `!important` scos, a 9-a culoare scoasă, Claritate modificat…), toate
    prinse în afară de una care nu schimbă nimic (textul alb din garda butonului e redundant cu
    fundalurile deschise; păstrat fiindcă proprietarul a cerut verificarea directă).
    `e2e/culori-sectiuni.proba.mjs` știe de `--s-link` și `--s-buton-hover`. Tot: 496 de probe.
  - **Încercat în browser** (stiva reală, `ana.test` pus TEMPORAR în poartă, Ana pe Claritate): 12
    mostre în ordine, fiecare cu 3 fâșii ~65/20/15% și EXACT culorile calculate; Safir propus fără să
    schimbe nimic; fără culori: fără hover, linkuri pe accentul vechi; Petrol: butoane `#0B4249`,
    linkuri `#00707E`, carduri `#F0F4F4`, bandă `#0D393F`; pe site hover `#0B4249` → `#00707E`; Mihai
    (fără culori) — niciun hover; manual: 9 culori, „Linkurile" precompletată, avertisment la linkuri
    deschise; 375 px fără derulare în lateral; nicio eroare JavaScript.
- **PALETA PREMIUM, A DOUA RUNDĂ (19 oct. 2026).** Proprietarul a încercat Smarald în browser: „nu arată
  premium — pare tablă școlară sau verde de spital". Cauzele, găsite în calcul: banda închisă era EXACT
  culoarea butonului (Smaraldul are deja L 14%, S 61%, deci regula HSL 11–15% îl lăsa neschimbat);
  cardurile și chenarul erau verzui-reci; cifrele de pe bandă mentolate; textul verzui. Valorile au fost
  arătate întâi dintr-un prototip, apoi aplicate cu deciziile lui:
  - **Culoarea stă doar pe suprafețe mici:** `accent` (butoane) și `accentInteractiv` (linkuri, hover)
    rămân bogate, cu regulile HSL din prima rundă. Smarald: `#0E3A2F` și `#007359`.
  - **Suprafețele mari sunt neutru-calde (OKLCH, nuanța 90 — „hârtie / alabastru / piatră caldă"),
    ACELEAȘI pentru orice culoare:** carduri `#F8F7F4` (exact referința lui), chenar `#DFDEDB`; fundalul
    paginii și relieful cu luminozitatea șablonului (pe Claritate `#F3F1EF` și `#E6E5E1`).
  - **Banda închisă: obsidian cu subtonul culorii** — L 0,21, cromă ≤ 0,025 (Smarald `#0B1C17`).
  - **Textele:** gri-cărbune cald pe deschis (cromă 0,006: `#141310`, `#555450`), alb cald `#F3F2EE` și
    argintiu cald `#C5C4C0` pe bandă; **cifrele / accentele / linkurile de pe bandă: șampanie `#CDC3AF`**
    (ales de el dintre șampanie și argint).
  - **De ce OKLCH și nu HSL pentru neutre:** lângă alb, procentele HSL înșală — `#F8F7F4` are în HSL S 22%,
    dar cromă OKLCH abia 0,004; HSL-ul rămâne doar pentru butoane și linkuri.
  - **Mostrele:** 50% banda închisă, 30% butoanele, 20% linkurile (fundalul cardurilor a ieșit din mostră:
    e același la toate culorile).
  - **Consecință de știut:** caracterul cromatic al șabloanelor (cremul de la Căldură, albastrul Liniștei)
    nu se mai păstrează pe un site cu culori alese — suprafețele devin neutru-calde, doar luminozitățile
    rămân ale șablonului. Fără culori alese, șabloanele rămân neatinse.
  - **Probe:** `aspect-culori.proba.mjs` — 56 de teste (57 cu banda), regulile scrise cu numerele lui pe 386 de culori ×
    5 șabloane; 11 stricări noi (banda mai deschisă / mai colorată, carduri colorate, nuanța caldă
    schimbată, pagina sau relieful pe nuanța aleasă, text colorat, cifre mentolate, chenar, argintiu
    colorat, mostra greșită), toate prinse. Tot: 497 de probe. **Browser** (stiva reală, `ana.test` pus
    TEMPORAR în poartă): fundalurile secțiunilor `#F3F1EF #F8F7F4 #E6E5E1 #0B1C17`, niciun verzui;
    „Cum decurge colaborarea" pe `#0B1C17` cu cifrele `#CDC3AF` și paragrafele `#C5C4C0`; subsolul pe
    aceeași bandă, linkuri șampanie; mostrele 50/30/20 exacte; hover, Mihai, manual, 375 px — toate ok.
  - **Banda cu servicii (cerută de proprietar după ce i-am arătat-o, 19 oct.):** la Claritate
    (`bandaServiciiDiscreta`, delimitată) își făcea fundalul singură, `color-mix(… var(--t-accent) 8%,
    var(--t-fundal))`, deci pe Smarald ieșea gri-verzui. Acum: rolul opțional `fundalBanda` (doar în paleta
    calculată, egal cu relieful — piatră caldă, Smarald `#E6E5E1`), variabila `--t-fundal-banda`, iar
    banda folosește `var(--t-fundal-banda, <amestecul vechi>)` — fără culori alese, șabloanele rămân exact
    cum erau (verificat în browser: fără culori, banda Anei pe Claritate păstrează amestecul albăstrui).
    În modul manual, banda se mută odată cu relieful. Probă nouă + 4 stricări prinse.
    *De știut pentru când „Aspect" se deschide și pe alte șabloane:* acolo banda NU e discretă, ci plină,
    pe culoarea butonului (`var(--t-accent)`) — o fâșie subțire pe toată lățimea, în culoarea aleasă.
- **A TREIA RUNDĂ: „SILK & VELVET" (19 oct. 2026).** Proprietarul: banda obsidian cu cromă 0,025 „a
  ucis tot pigmentul, arată plat/șters"; vrea culori „cu pigment pur, saturat și adânc, ca mătasea sau
  catifeaua iluminată", pe calcar cald, cu accente de aur-șampanie — după referințe vizuale proprii.
  Valorile i-au fost arătate în chat; e PE BRANCH până la „fă pe master". Ce s-a schimbat:
  - **12 culori noi**, exact cum le-a dat: Rosewood `#5C1D24`, Bordeaux `#4F0D1A`, Aubergine `#3A0A26`,
    Plum `#42163B`, Indigo `#1F1646`, Bleumarin `#0D1B38`, Safir `#0A3463` (propus în câmp), Teal
    `#0A3D44`, Smarald `#083D27`, Eucalipt `#3A4637`, Oliv `#3B3E19`, Espresso `#2E1D14` (Antracit a ieșit).
  - **Fundalurile deschise: calcar cald, fix, la orice culoare și orice șablon** — pagina `#F2EFE9`,
    cardurile `#FAF8F5`, relieful (și banda cu servicii) `#E8E2D5`, chenarul `#E2DDD3`.
  - **Banda închisă: bogată** — OKLCH L 0,235, 82% din croma culorii; o culoare cromatică (C ≥ 0,05)
    păstrează cel puțin min(0,065, croma ei). *Excepțiile mele, spuse proprietarului:* Eucalipt și
    Espresso sunt culori temperate (C ~0,03) — forțate la 0,065 ar fi ieșit verde-neon și ruginiu, deci
    rămân temperate; verdele și teal-ul foarte închise nu pot avea C 0,065 în sRGB (ecranul nu le are),
    deci croma se oprește la cât se afișează (Teal ~0,040, Smarald ~0,053).
  - **MĂTASEA:** banda și butoanele pline sunt un gradient la 135° — lumina 20% (L + 0,07, C + 0,02),
    baza 50%, umbra 90% (L − 0,05). Roluri NOI în paletă, `fundalInchisMatase` și `accentMatase`
    (gradiente CSS, nu culori), variabilele `--t-fundal-inchis-matase` / `--t-accent-matase` și, în
    secțiune, `--s-buton-matase`. Folosite DOAR ca `background`: benzile `inchis` (`section.tsx`),
    subsolul (`footer.tsx`), butoanele pline din hero, „Despre mine" și formulare. **NU** în
    `--s-buton-fundal` — acela e și culoare de chenar (orele din calendar), unde un gradient e nevalid
    și chenarul ar dispărea (o probă păzește asta). Fără culori alese, totul cade pe culoarea plină.
    La hover, butonul devine plin, pe culoarea linkurilor. **Cartonașele mici închise** (cerut de
    proprietar, 19 oct. 2026: „fă și cartonașele mici închise mătăsoase") au aceeași mătase ca banda,
    cu rezervă pe culoarea plină: butonul de telefon din antet (`header.tsx`; pe Claritate se vede
    doar el, și doar dacă site-ul are telefon și nu are pastila „Programează"), cardul de pe portret
    din „Despre mine" și cardul închis din „Contact" (`about-teaser.tsx`, `contact.tsx` — amândouă
    DOAR pe Liniște, deci pe `model-claritate` nu se văd). Textele de pe ele sunt cele ale benzii,
    deja păzite pe lumina mătăsii. Probă: aceleași patru fișiere (subsol + cele trei) n-au voie să
    aibă un fundal închis plin; 3 stricări, toate prinse. Browser (`ana.test` + `liniste` TEMPORAR
    în poartă): toate trei `#003923 → #002515 → #00180C` cu Smarald, pline fără culori alese.
    Rămân pline (nu sunt „cartonașe mici"): cardurile cu poză din „Servicii" la Liniște, al căror
    gradient de jos se stinge în culoarea plină a benzii.
  - **Pe bandă:** fildeș `#FAF6F0`, mătase crudă `#D6CFC4`, aur-șampanie `#DFC59B` (cifre, accente,
    linkurile din subsol). Garda de contrast verifică totul și pe LUMINA mătăsii (cea mai luminoasă
    parte); la fel textul alb al butonului pe lumina butonului (un verde-măsliniu ca `#4B6E0B` se
    întunecă de aceea cu o treaptă).
  - **Modul manual:** mătasea se reface din culorile finale; avertismentele includ „…pe partea
    luminoasă a benzii / a butonului".
  - **Smarald pe Claritate:** bandă `#003923 → #002515 → #00180C`, buton `#035335 → #083D27 →
    #002F1C`, linkuri `#007245`, text `#151310` / `#565450`. Contrast minim pe bandă (pe lumină): 7,8
    (șampanie); alb pe lumina butonului 9,2.
  - **Probe:** `aspect-culori.proba.mjs` 58 de teste (regulile cu numerele lui, pe 386 de culori × 5
    șabloane, inclusiv perechile pe lumina mătăsii); 15 stricări (banda stinsă / mai deschisă, Eucalipt
    forțat, lumina / umbra / ordinea gradientului, garda butonului pe lumină, calcarul, șampania veche,
    banda / subsolul fără mătase, mătasea în `--s-buton-fundal`, manualul cu mătase veche, Safir vechi),
    toate prinse — una (mătasea în chenare) abia după ce am adăugat paza ei. Tot: 499. **Browser**
    (stiva reală, `ana.test` TEMPORAR în poartă): banda și subsolul au gradientul exact, butonul la fel,
    la hover devine plin `#007245`; fundalurile `#F2EFE9 #FAF8F5 #E8E2D5`; cifre `#DFC59B`; fără culori
    alese — nicio mătase; cele 12 mostre în ordine.
- **Unde stau datele:** `site_settings.brand.aspect.culori` = `{mod, principala, manual, asumat}`;
  fără migrare, fără SQL. Fonturile vor sta lângă ele, în `brand.aspect`.
- **Cum ajung pe site:** `getTemplate(id, culori)` întoarce EXACT obiectul șablonului când nu sunt
  culori valide (site-urile existente: octet cu octet la fel; un JSON stricat din bază e ignorat),
  altfel o copie cu paleta nouă; `templateStyle` o transformă în variabilele `--t-*`, deci
  componentele nu se ating. Citesc culorile: `cadru-site.tsx` (tot site-ul public) și toate
  previzualizările din panou (secțiuni, servicii, pagini, blog, Setări).
- **Capcana evitată:** salvarea din Setări făcea `upsert` cu `brand` nou și ar fi ȘTERS culorile la
  fiecare schimbare de telefon. `salveazaSetari` citește acum `brand.aspect` și-l pune la loc.
  Invers, `salveazaCulori` citește `brand` și scrie înapoi tot, schimbând doar `aspect.culori`
  (`brandCuCulori`); `seo` și `social` nu sunt în cerere. Detaliu: citire-apoi-scriere, deci două
  salvări simultane din două file ar putea să se calce (la fel ca la Setări; neglijabil cu un singur
  utilizator per cabinet).
- **Fișiere:** `src/lib/aspect/{culoare,paleta,culori,citire,salvare}.ts`, `src/app/dashboard/aspect/`
  (`page.tsx`, `formular.tsx`, `actions.ts`), `getTemplate` în `src/lib/templates/index.ts`.
  Acțiunea: `verifySession()` întâi, validare strictă (`valideazaCulori`: orice nu e `#RRGGBB` e
  refuzat cu mesaj, cheile străine se aruncă), jurnal în „Activitate", `revalidatePath("/", "layout")`.
- **Probe:** `e2e/aspect-culori.proba.mjs` (38 de teste; 20 de stricări pe rând, toate prinse — două
  nu erau la început și au fost întărite: ordinea sesiune→validare→scriere și „ce se scrie e ce a ieșit
  din validare"). Încercat în browser pe un Supabase adevărat (GoTrue + PostgREST), ca Ana: culoare
  aleasă → previzualizare → Salvează → site public cu EXACT aceleași culori; Setări păstrează culorile;
  galben întunecat și explicat; cod greșit; manual cu avertisment și salvare; „Revino…" ⇒ site identic
  cu cel de la început; 375 px fără derulare în lateral; capturi pe toate cele 5 șabloane.
- **POARTA „în probă" (cerută de proprietar, 18 oct.: „limitează pe șablonul Claritate și pe site-ul
  meu"; apoi: „disponibile pe site-ul model claritate, NU pe sitepsihologi", „mă refeream la site-ul
  Popescu Robert", „nu m-am răzgândit, doar pe model claritate testam"):** „Aspect" există DOAR când se
  potrivesc AMBELE: șablonul e `claritate` ȘI `sites.domain` e **exact** `model-claritate.vercel.app`
  (site-ul proprietarului, numit în panou „Popescu Robert"). Totul stă în `src/lib/aspect/acces.ts`
  (`SABLOANE_CU_ASPECT`, `DOMENII_CU_ASPECT`, `aspectPermis`, `culoriPermise`). Sitepsihologi NU e în
  listă, iar o probă garantează că nu poate reintra. *Istoric:* întâi am pus `sites.id`-ul lui
  sitepsihologi (greșit — „siteul meu" era altul), apoi am cerut un `select` pentru id-ul lui „model
  claritate"; proprietarul n-a mai avut de rulat nimic: am trecut poarta pe DOMENIU, fiindcă platforma
  își recunoaște oricum site-urile după domeniu. **Atenție:** domeniul `model-claritate` a mai fost
  redenumit o dată (`cosmin-claritate` → `model-claritate`, 7 oct.); dacă se schimbă iar, poarta se
  închide singură (fără stricăciuni) și noul domeniu se pune în `DOMENII_CU_ASPECT`; pentru ceva mai
  stabil se poate trece pe id. Poarta hotărăște: meniul din panou (layout-ul citește și șablonul),
  pagina `/dashboard/aspect` (altfel „Pagina nu există" — ca orice `notFound()` din panou, cod HTTP 200
  fiindcă vine în flux), salvarea (refuzată pe server, cu mesaj, chiar dacă cererea e trimisă de mână;
  domeniul și șablonul se citesc din bază) și APLICAREA culorilor pe site-ul public și în toate
  previzualizările din panou — un site din afara probei le ignoră chiar dacă în bază ar sta culori.
  Culorile deja salvate nu se șterg niciodată de poartă. **Ca să deschizi pentru toți:** fă
  `aspectPermis` să întoarcă `true` (un rând; nimic altceva de schimbat). Probe: 42 de teste în
  `e2e/aspect-culori.proba.mjs`; regula se încearcă cu liste de probă (`aspectPermis(site, liste)`),
  listele reale se verifică separat; potrivire exactă (nu „conține", nu subdomeniu, nu litere mari);
  14 stricări ale porții, toate prinse (AND→OR, fără verificarea șablonului sau a domeniului,
  „conține", litere mari ignorate, sitepsihologi în listă, domeniu schimbat, șablon în plus, meniul
  deschis tuturor, pagina fără 404, acțiunea fără poartă, site-ul public ocolind poarta…), plus un test
  că `culoriDinBrand` nu se cheamă de nicăieri pe lângă poartă. Încercat în browser pe stiva reală, cu
  `ana.test` pus TEMPORAR în listă (n-a intrat în cod): site permis + Claritate → totul merge; același
  site pe Căldură → fără meniu, „Pagina nu există", salvarea refuzată (șablonul schimbat cât ecranul
  era deschis), culorile din bază neaplicate, previzualizarea din Setări le ignoră; alt site pe
  Claritate cu culori puse de mână în bază → la fel. **Neîncercat:** `model-claritate.vercel.app` în
  sine (nu există local) — se vede abia după „fă pe master".
- **Rămas:** (1) „fă pe master" de la proprietar; (2) FONTURILE — lista curată, arătată lui înainte;
  (3) opțional: bifa „înțeleg…", ordonarea culorilor gata alese după gustul lui.
- **FONTURILE — lista (20 oct. 2026, „hai sa facem fonturile acum"; aprobată, apoi FĂCUTE — vezi
  „FONTURILE — construite" mai jos).** Arătată ca mostre (titlu cu cuvânt colorat + cursiv;
  paragraf cu bold și cursiv). *Titluri:* prima listă (Inter, Manrope, Cormorant, Playfair,
  Fraunces, Lora, EB Garamond, DM Serif Display) i s-a părut proprietarului „cam asemănătoare între ele" — avea dreptate: șase din
  opt erau serife de carte. A doua propunere, CÂTE UNUL DIN FIECARE STIL (11): Inter 700 (neutru),
  Josefin Sans 600 (geometric), Quicksand 600 (rotunjit), Bricolage Grotesque 600 (cu
  personalitate), Playfair Display 500 (de revistă), Cormorant Garamond 500 (clasic, fin), Fraunces
  500 (moale), Zilla Slab 600 (solid), Tenor Sans 400 (sculptat), Instrument Serif 400 (îngust),
  Caveat 600 (scris de mână). Fără cursive: Quicksand, Bricolage, Tenor Sans, Caveat. Excluse
  pentru că N-AU ș/ț deși Next le declară cu `latin-ext`: Marcellus, Philosopher (ș, ț), Poiret
  One (ț) — capcana exactă de care trebuie păzit orice font nou. *Text (8):* Inter, DM Sans, Nunito, Source Sans 3,
  Figtree, Lora, Source Serif 4, Literata; rezerve: Manrope (fără cursive — browserul le-ar
  fabrica în articole), Newsreader (pare mai mic). Toate verificate pe fișierele adevărate
  (latin + latin-ext, drept și cursiv): au ă â î ș ț Ă Â Î Ș Ț, iar ș/ț sunt cu VIRGULĂ, glife
  separate de ş/ţ cu sedilă; încercat și mărit în Chromium. De știut: la Cormorant căciulița de pe
  â/î stă sus, departe de literă — e desenul fontului (îl au deja Liniște și Lumină). Toate sunt
  în `next/font/google` (deci auto-găzduite, ca acum); un vizitator descarcă doar cele două folosite.
  *Propuse, de confirmat:* fontul titlurilor = titlurile + cuvintele colorate din ele + cifrele mari
  (`fontSecundar` + `titluriInSecundar`), ca un titlu să nu aibă două fonturi; fiecare font cu
  grosimea lui de titlu (cea din mostră), nu a șablonului; fără alegere = fonturile șablonului, cu
  „Revino la fonturile șablonului"; aceeași poartă ca la culori; un font fără cursive oprește
  singur cursivele accentelor (ca la Caveat pe Apropiere). Întrebat: și câteva perechi gata făcute?
  *20 oct., după imaginile pe site:* proprietarul: „da, pe toate le vreau" — **păstrează toate 11
  fonturile de titlu.** Imaginile (fiecare font pus pe un site Claritate cu Safir, doar în browserul
  de captură) au scos două lucruri de știut la construcție: (1) pe Claritate, titlurile din cinci
  secțiuni („Cum decurge", Despre, Păreri, Întrebări, Newsletter) NU folosesc `--t-font-titlu` — iau
  fontul de TEXT, fiindcă `titluSerif` e oprit; cu un font ales, trebuie legate de fontul titlurilor
  (altfel un font de text ales schimbă jumătate din titluri, iar unul de titlu doar titlul de sus);
  (2) la titlul uriaș din hero, cu interlinia lui strânsă, virgula de sub „Ș" poate atinge căciulița
  lui „î" de pe rândul următor (văzut la Instrument Serif) — de dat puțin aer la fonturile cu accente
  înalte. Lista de text: imagini trimise, așteaptă răspunsul.
- **FONTURILE — construite (20 oct. 2026; „fă pe master" → `fc6e863`, CI verde).** Proprietarul:
  „da, le păstrez pe toate" (cele 10 de text) și „facem 5 combinații sau mai multe, pe lângă
  alegerea liberă".
  - **Ce vede clientul:** în „Aspect", două file, **Culori** și **Fonturi**, o singură bară de
    salvare pentru amândouă. La Fonturi: 8 **perechi gata alese** (Elegant: Cormorant + DM Sans; De
    revistă: Playfair + Source Sans 3; Cald: Fraunces + Figtree; Prietenos: Quicksand + Nunito;
    Modern: Bricolage + Inter; Rafinat: Instrument Serif + Inter; Retro: Josefin Sans + Lora;
    Aerisit: Tenor Sans + Literata — alese de sesiune, se schimbă ușor; a noua, Personal: Caveat +
    Manrope, cerută de proprietar pe 20 oct.), apoi **fontul titlurilor**
    (11) și **fontul textului** (10), fiecare scris cu el însuși pe un text cu diacritice, plus „Ca
    în șablon" și „Revino la fonturile șablonului". Previzualizarea din dreapta se schimbă pe loc.
  - **Unde stau:** `site_settings.brand.aspect.fonturi` = `{ titluri, text }` (nume din liste;
    `null` = al șablonului). Fără migrare, fără SQL. Salvarea (`salveazaAspect`) scrie culorile și
    fonturile deodată, după poartă și după validarea amândurora; numele din afara listelor se spun,
    nu se salvează; la citire, se ignoră în tăcere.
  - **Regula** (`src/lib/aspect/fonturi.ts`, `tipografieEfectiva`): TEXTUL schimbă doar fontul
    principal; TITLUL schimbă titlurile, cuvintele colorate, cifrele mari și citatele (fontul
    secundar), cu grosimea LUI (Inter 700, Josefin/Quicksand/Bricolage/Zilla/Caveat 600,
    Playfair/Cormorant/Fraunces 500, Tenor/Instrument 400; Playfair Display înlocuit apoi cu Playfair). Cu orice alegere, titlurile au un font
    explicit (`fontTitlu`), iar cele cinci secțiuni fără `titluSerif` îl folosesc prin
    `--t-font-titlu-ales` / `--t-greutate-titlu-ales` — fără alegere, variabilele nu există și cad
    exact pe ce aveau (fontul moștenit, 700). Fonturile fără cursive (Inter cum e declarat,
    Quicksand, Bricolage, Tenor, Caveat) opresc cursivele accentelor și, prin `--t-cursiv-secundar`,
    cursivele fixe din banda cu servicii și de sub titlul mare.
  - **Servite de la noi:** toate în `src/lib/templates/fonturi.ts` (20 declarații: 6 ale
    șabloanelor + 14 noi), `latin-ext`, `swap`, fără preîncărcare; build: 162 de fișiere woff2,
    zero cereri către Google; un vizitator descarcă doar cele două folosite. Costul: regulile
    `@font-face` ale tuturor în CSS-ul paginii, ~7 KB comprimat. Lățimea literei măsurată pentru
    fiecare font de titlu (reperele din „Despre mine").
  - **Probe:** `e2e/aspect-fonturi.proba.mjs`, 20 de teste (listele, declarațiile, regula pe
    655 de combinații × șabloane, salvarea, poarta, componentele); 18 stricări, toate prinse. Tot:
    519. **Browser** (stiva reală, `ana.test` TEMPORAR în poartă): panoul → perechea „Cald" →
    previzualizarea Fraunces 500 / Figtree → Salvează → în bază, culorile neatinse → pe site
    titlul mare, „Cum decurge", „Despre mine" și cifrele în Fraunces 500, textul și meniul în
    Figtree; doar Lora la text → toate titlurile rămân Inter 700; Quicksand → banda dreaptă;
    „Revino" → cheia dispare, site-ul identic cu cel de la început; telefon 390px fără depășire.
  - **A doua parte a titlului, cursivă (20 oct., după master):** proprietarul a prins că la
    Playfair, Instrument Serif, Tenor Sans, Cormorant, Fraunces, Caveat „în ritmul tău" arăta
    aproape ca prima parte — pe Claritate singura diferență era grosimea (300 față de titlu), iar
    fonturile astea n-au tăietură subțire (sau sunt fine peste tot). I-am arătat o planșă (acum /
    cursiv / culoare / cursiv + culoare); a ales „doar cursiv acolo unde se poate, fără culoare".
    Făcut: cu un font de titlu ales care ARE cursive, partea evidențiată din titluri e cursivă
    (`accentTitluCursiv` → `--t-stil-accent-titlu`, în cele opt locuri cu `titluAccent`: titlul
    mare, `SectionHeading` și cele șase secțiuni care își scriu singure titlul). Citatele,
    recenziile, fraza din „Despre mine" și datele din „Contact" rămân pe regula șablonului
    (`--t-stil-accent`), deci pe Claritate drepte. Tenor Sans, Caveat, Quicksand, Bricolage și
    Inter n-au cursive: rămân ca înainte — la Tenor Sans și Caveat diferența rămâne mică, spus
    proprietarului. Probă nouă + 6 stricări prinse; tot: 520. Browser: Playfair, Instrument,
    Cormorant, Fraunces → titlul mare și „Ce poți întreba" cursive, citatul drept, aceeași culoare.
  - **Partea a doua tot „bolduită" la De revistă și Aerisit (20 oct.):** chiar și cursivă, la
    Playfair Display „în ritmul tău" părea cât prima parte (Playfair Display nu coboară sub 400:
    titlul 500, partea a doua cerută la 300 → 400), iar Tenor Sans are o singură grosime și n-are
    cursive. Planșă cu variante; proprietarul: „la playfair facem playfair nou, iar la aerisit,
    varianta cu gri". Făcut: **Playfair Display → Playfair** (versiunea nouă, 300–900, cu axa
    `opsz` — la titlul mare ia singur forma contrastată), în catalog, în perechea „De revistă" și
    în `next/font`; ce era salvat ca „Playfair Display" trece singur pe „Playfair" (`NUME_VECHI`
    în `fonturi.ts`), deci nimic nu cade pe fontul șablonului. **Tenor Sans:** partea a doua a
    titlurilor la 60% din culoarea titlului (`accentGri` → `--t-estompare-accent-titlu`,
    `color-mix(in srgb, currentColor 60%, transparent)`): gri pe deschis, fildeș stins pe banda
    închisă; contrast minim 3,2:1 pe orice fundal și culoare aleasă (probat, prag 3:1 pentru titlu
    mare). La Tenor Sans și (cerut apoi, „da, fă gri și la Caveat") la Caveat. Probe: 3 teste noi, 6 stricări prinse; tot: 524. Browser: Playfair 500 / 300
    cursiv; „Playfair Display" salvat → Playfair; Tenor: partea a doua la 60% pe titlul mare,
    pe bandă și la întrebări; fără fonturi alese, nimic gri; testul pe pixeli trece la toate 11.
  - **Căciulița lui „î" (20 oct., „da, rezolvă asta cu căciulița"):** la titlul mare, virgula de
    sub „Ș"/„ț" sau coada lui „p" atingea căciulița lui „î" de pe rândul de dedesubt (Playfair,
    Cormorant, Instrument Serif). Măsurat în Chromium, pe fișierele adevărate, pentru fiecare font
    de titlu: cât coboară virgula/coada și cât urcă căciulița (î, â mici), la grosimea titlului și a
    părții evidențiate, + 0,04 aer → `interlinie` în catalog (Inter 1,08; Josefin 0,97; Quicksand și
    Bricolage 1,06; Playfair 1,11; Cormorant 1,08; Fraunces 1,03; Zilla 0,97; Tenor 1,01;
    Instrument 1,11; Caveat 0,87). Doar o limită de jos (`--t-interlinie-minima-titlu`), pusă cu
    `max(<distanța de acum>, …)` pe cele opt titluri; fără font ales, distanța rămâne exact cea
    de acum. Verificat pe pixeli (un rând complet gol între fiecare două rânduri ale titlului):
    pe starea veche picau exact Playfair, Cormorant, Instrument; după, trec toate 11. Rămas:
    un „Î"/„Â" MARE la început de rând, sub o virgulă, ar cere ~1,1–1,27 — nu acoperit, ar
    face titlurile prea aerisite. **Și pe Claritate fără font ales** (cerut: „vreau protecția…
    dacă distanța ar crește până la 1,05"): la Inter, 0,98 lăsa un „î" pus sub un „Ș"/„p" să le
    atingă (pe pixeli, cel mai rău caz); 1,05 lasă ~6px la mărimea de laptop (1,03 ar fi fost
    minimul). Pus în șablon (`claritate.ts`, `interlinieMinimaTitlu: 1.05`), deci pe TOATE
    site-urile Claritate, nu doar în poarta „Aspect"; titlurile secțiunilor rămân 1,08; „Inter"
    ales din listă trece și el pe 1,05; celelalte șabloane neatinse (Căldură verificat: 0,98). Dacă „Aspect" se deschide pe alte șabloane: pe Apropiere, un font de
    titlu ales înlocuiește și scrisul de mână (Caveat) al accentelor — e regula hotărâtă, dar se
    vede.

**„Motivul programării" a fost SCOS (15 oct. 2026, „da, scoate-l" al proprietarului; pe branch,
NEPUBLICAT — așteaptă „fă pe master").** Era o listă cu două intrări, „Evaluări psihologice" și
„Altceva", opțională, pusă la 27 aug. 2026 (vezi mai jos, la „Motivul programării"); proprietarul a
întrebat dacă nu spusese că n-o vrea pe pagina de programări — în notițe nu exista nicio hotărâre de
scoatere (poate spusă în altă conversație, nescrisă), așa că s-a întrebat și a confirmat. Acum
formularul de pe `/programare` n-are câmpul (formularul scurt de pe prima pagină nu l-a avut
niciodată), iar `cereProgramare` nu mai citește `motiv`: o cerere scrisă de mână cu un astfel de
câmp e ignorată, iar `appointments.service` intră `null`. Cererile VECHI își păstrează motivul în
panou (coloana rămâne, `lista.tsx` îl arată dacă există). Dispar din cod `MOTIVE` și `motivValid`.
Textul de ajutor din panoul „Programări" spune acum „cu nume, email și telefon (dacă l-a lăsat)".
**Politica:** propoziția despre programări din șablon nu mai pomenește motivul; pe pagina lui
Robert (încărcată de proprietar) trebuie scoasă mâna: „…și, doar dacă vrei, numărul de telefon și
motivul programării, ales dintr-o listă." → „…și, doar dacă vrei, numărul de telefon." Probe în
`e2e/programari.proba.mjs` (cinci încercări de stricare, toate pică). Încercat în browser, pe
aplicația construită: pe `/programare` nu mai e niciun `select`; cerere cu câmp `motiv` băgat de mână
→ `service` `null`; o cerere veche cu motiv e încă afișată în panou; la 390 px fără depășire.

**Emailul prin Resend și resetarea parolei sunt AMÂNATE până există firma (15 oct. 2026,
hotărârea proprietarului).** Motivul spus de el: abonamentele și restul facturării vor fi pe
firmă, deci și contul Resend, și domeniul de trimitere se fac pe firmă, nu acum pe persoană
fizică. **Nu propune Resend, resetarea parolei sau „Schimbă emailul" pentru clienți (punctul 4a)
ca următorul pas** cât timp firma nu există; reiau doar când proprietarul spune că a apărut
(ordinea de atunci: firma → domeniul → contul Resend pe firmă → cele 3 setări Supabase +
șablonul → resetarea parolei → 4a). *Ce rămâne valabil între timp:* mesajele și cererile de
programare se văd DOAR în panou (de spus clientului la predare: dacă nu intră, nu află că i-a
scris cineva); un client care și-a uitat parola o primește de la proprietar — din `/proprietar`
(„Intră în panou") sau parolă nouă din Supabase → Authentication → Users; adresa de intrare a
unui client o schimbă tot proprietarul, cu butonul din `/proprietar`. Nu se blochează cu asta
nimic ce nu era blocat de firmă oricum (primul client plătitor, contractul, facturarea).

**Rândul de copyright din subsol, scris de client (15 oct. 2026, cerut de proprietar; PE MASTER
din 15 oct., `76c9450`; „© automat" pe branch, NEPUBLICAT — așteaptă „fă pe master").** Bara de
jos a subsolului avea în stânga „© 2026 Popescu Robert", compus singur (anul de azi + numele
cabinetului, același din antet), deci nu se putea scrie altfel. Acum Setări are un câmp „Textul
de copyright din subsol" (`brand.copyright`, text, cel mult 200 de caractere, opțional). **Gol:**
rândul rămâne © + anul + numele, ca înainte — niciun site existent nu se schimbă, **fără SQL**.
**Cu text: omul scrie DOAR textul, iar „© " și anul curent se pun singure în față** („Cabinet
Individual de Psihologie Popescu Cosmin Robert · CIF 54440949" → „© 2026 Cabinet Individual…"),
iar anul se schimbă singur în ianuarie. *Istoric: prima variantă (pe master la `76c9450`) arăta
„exact ce ai scris", cu `{an}` pentru an; proprietarul a răspuns, după ce a întrebat cum scrie
semnul ©, că „asta trebuie să apară automat când încep să scriu" — a doua variantă o înlocuiește.*
Excepții, ca să nu apară un al doilea ©: dacă textul scris începe deja cu „©", „(c)" sau
„Copyright" (cuvânt întreg), rândul rămâne exact cum e scris — deci ce s-ar fi scris în prima
variantă merge la fel —, iar `{an}` din text tot devine anul curent. Rândul din dreapta („Membru
al Colegiului…") era deja editabil, în Setări → „Acreditare". Cod: `src/lib/copyright-subsol.ts`
(regula, neutră — o folosesc și site-ul, și previzualizarea din Setări), câmpul în
`CAMPURI_CABINET` (`src/lib/setari.ts`), `SiteFooter` + `cadru-site.tsx` + previzualizarea din
`dashboard/setari/formular.tsx`. Probe: `e2e/copyright-subsol.proba.mjs` (strică-le pe rând: pică).
Încercat în browser, ca client, pe aplicația construită: fără câmp → „© 2026 Cabinet Ana"; scris
fără © → previzualizarea din Setări arată „© 2026 …" pe loc, iar pe site apare abia după „Salvează";
în bază rămâne doar textul; golit la loc → cheia dispare și subsolul revine; rând scris întreg, cu
© și `{an}` → fără al doilea ©; la 375 px rândul se rupe pe două linii, fără depășire. Pe
sitepsihologi.ro (pagina de vânzare) nu s-a încercat: e același subsol și același câmp, iar rândul
legal al firmei e separat, lângă el.

**Politica de confidențialitate, rescrisă (15 oct. 2026, cerut de proprietar ca s-o încarce
pe un site; pe branch, NEPUBLICATĂ — fișierul e doar un șablon, nu atinge nicio pagină).**
`sabloane/politica-de-confidentialitate.md` descrie acum ce face chiar platforma:
formularul de contact cu email obligatoriu + telefon opțional; programările (nume, email,
ora, telefon opțional — *și, până pe 15 oct., motivul dintr-o listă, scos ulterior* —, fără text liber; temei scris în text: cererea
omului — formularul de programare NU are bifă de acord, ci doar o frază cu linkul politicii,
deci de arătat avocatului); hCaptcha (IP-ul ajunge la ei, trecut
prin serverul de găzduire; cabinetul nu-l vede și nu-l păstrează); **contorul de afișări**
(o cifră pe pagină și pe zi, fără IP/cookie/amprentă — varianta veche zicea „nu știu ce pagini
citește", prea tare); cookie-uri ale site-ului: niciunul, cu hCaptcha pomenit prudent (nu
s-a verificat ce memorează în browser); **firma platformei numită ca împuternicit**, cu
acces tehnic (`[DENUMIREA FIRMEI PLATFORMEI]`, deocamdată fără firmă — blochează publicarea
pentru clienți plătitori, punctul 0); regiunea bazei de date și faptul că Vercel/Supabase
sunt americane (`[REGIUNEA BAZEI DE DATE]`, de aflat din Supabase). Paragrafe cu etichete
(`[PROGRAMĂRI]` ×3, `[YOUTUBE]`, `[WHATSAPP]`) se păstrează sau se șterg întregi, după
cabinet. Adevăruri verificate în cod, nu din memorie: `antispam.ts` trimite `remoteip` la
hCaptcha; `page_views_daily` ține doar (site, zi, cale, afișări); coperta YouTube fără poză
proprie vine de la `i.ytimg.com` la deschiderea paginii, iar filmul abia la clic
(`youtube-nocookie`); WhatsApp e un link `wa.me`. **Nimic din bază nu se șterge singur** după
N luni — clientul o face din panou; lista de verificări o spune. **Newsletter-ul NU e acoperit**
(site-ul doar strânge adrese; trimiterea și dezabonarea n-au instrument încă). Nu e text
juridic verificat; cere un avocat, mai ales pentru acordul cu firma platformei.

**Telefon OPȚIONAL și la programări (15 oct. 2026, cerut de proprietar; pe branch,
NEPUBLICAT — așteaptă „fă pe master").** „La modulul de programări cere doar emailul — hai
să includem și telefonul." Ambele formulare (pagina întreagă `/programare` și cel de pe
prima pagină, `programare-rapida.tsx`) au acum „Număr de telefon (opțional)", sub email;
emailul rămâne obligatoriu. **Alegerea „opțional" e a sesiunii** (proprietarul n-a spus,
dar la contact a cerut exact asta; dacă vrea telefon obligatoriu, e o schimbare de două
rânduri + probă). Acțiunea `cereProgramare` (una singură pentru ambele formulare) citește
telefonul, îl verifică (`esteTelefonValid`, aceeași regulă și același mesaj ca la contact,
`EROARE_TELEFON` mutat în `src/lib/formulare.ts`) și scrie `phone: telefon || null`.
`eroriDeContact` (regula comună a celor două formulare) a primit telefonul ca parametru.
**Plafonul „o oră deodată pe persoană" rămâne pe email**, nu pe telefon: telefonul fiind
opțional, ar fi fost tocmai cheia care lipsește. Fără migrare (`appointments.phone`
exista); panoul „Programări" și „Șterge datele unei persoane" știau deja de telefon. Probe
în `e2e/programari.proba.mjs` (strică-le pe rând: pică, șase încercări). Încercat în
browser pe aplicația construită, cu modulul pornit pe un site de probă: fără telefon →
cerere cu `phone` gol; telefon prost → eroare lângă câmp, ce a scris omul rămâne, nimic
scris; doar telefon, fără email → refuzat; aceeași adresă cu alt telefon și altă oră →
oprită de plafon; formularul de pe prima pagină la fel; câmpul are lățimea emailului la
1280 și 390 px, fără depășire; în panou cererea arată emailul și telefonul.
**Șablonul politicii de confidențialitate a fost rescris** (15 oct., la cererea
proprietarului, ca s-o încarce): vezi „Politica de confidențialitate, rescrisă", mai jos.

**Mesajul „Poza umple tot cadrul" la repoziționarea pozelor (15 oct. 2026, cerut de
proprietar; pe branch, NEPUBLICAT — așteaptă „fă pe master"; mesajul e în `926388a`, pragul
la tragere în comitul următor).** Proprietarul nu putea
muta coperta unui articol de blog. Cauza: rama din editor are forma locului de pe site
(16/9 la coperta articolului), iar poza lui era tot ~16/9 — umplea rama exact, deci nu
ieșea nimic din ea și tragerea n-avea ce muta (0–3 px), în timp ce pe poză scria mereu
„Trage de poză ca s-o poziționezi". Aceeași cauză ca în notița din 1 oct. (`rame-poze.ts`).
Acum, când poza nu se poate muta (surplus sub 4 px pe ambele axe, la mărirea de acum),
pe ea scrie, cu textul proprietarului: „Poza umple tot cadrul. Mărește-o din «Mărime» ca
s-o poți muta." — iar în Bibliotecă, unde nu există glisor, doar „Poza umple tot cadrul."
Se re-măsoară la schimbarea pozei, a măririi, a mărimii ramei și la încărcarea pozei;
până nu se măsoară nu scrie nimic. Cod: `poateFiMutata`/`SURPLUS_MINIM_MUTARE` în
`src/lib/punct-focal.ts`, mesajul în `repozitionare-imagine.tsx`; probe în
`e2e/punct-focal.proba.mjs` (strică-le pe rând: pică). Încercat în editorul de blog, pe
aplicația construită, cu poze de 16/9, ~1,79, 4/3 și portret, la 1,0× și 1,5×, și la 390 px.
**Pragul și la tragere (15 oct. 2026, „da" al proprietarului — făcut):** pe o axă cu surplus
sub 4 px, tragerea (mausul ȘI săgețile) nu mai schimbă poziția salvată. Înainte, pe o poză
cu 1–3 px de joc, orice tragere împărțea la un număr aproape de zero și arunca poziția la
0% sau 100%, deși pe ecran nu se mișca nimic; poziția se folosește și pe cartonașul din
listă, care are altă formă. Regula e una singură, `axaSePoateMuta` (per axă) în
`punct-focal.ts`, folosită și de mesaj. Încercat în editorul de blog: 16/9 exact și 7/4,
la 1,0×, rămân pe 50% 50% oricât tragi (înainte săreau la 0%/100%); la 2,0× se mută în
toate direcțiile; 4/3 și portretul se mișcă la fel ca înainte. Probe noi, stricate pe
rând (5 încercări) ca să pice. Poziții deja salvate la extrem înainte de corectură nu se
repară singure — se mută din nou trăgând după ce poza e mărită.

**Banda cu servicii, cu cuvinte proprii (14 oct. 2026, cerut de proprietar; PE MASTER din
14 oct., `429e244`, CI verde).** Până acum banda nu avea câmpuri: derula
titlurile serviciilor publicate. Un client care vrea la Servicii „Consiliere psihologică,
Testare", dar în bandă „Traumă, Anxietate, Dezvoltare personală", nu avea cum. Acum
secțiunea are un câmp opțional, „Cuvinte din bandă" (listă de rânduri, câte unul pe
rând). **Regula:** dacă lista are măcar un cuvânt, banda arată DOAR cuvintele ei; dacă e
goală, banda arată titlurile serviciilor, exact ca înainte — deci toate site-urile de
acum, care au `{}` în bandă, nu se schimbă și **nu e nevoie de migrare** (varianta
„doar cuvinte proprii, fără rezervă" ar fi cerut SQL pentru site-urile cu banda pornită
și pentru clienții noi; proprietarul a ales varianta cu rezervă). Limite: cel mult 12
cuvinte, fiecare de cel mult 40 de caractere, verificate și pe server (un rând prea lung
nu se taie în tăcere: eroarea îl arată, „… are 41"). Cod: `src/lib/banda-servicii.ts`
(`numeleDinBanda`, limitele), câmpul în `src/lib/sectiuni.ts` (tipul `listaText` a primit
`maxLungimeElement`, opțional, verificat în `valideaza`), `BandaServicii` primește
`cuvinte` din registru. Probe: `e2e/banda-servicii.proba.mjs` (strică-le pe rând: pică).
Încercat în browser, ca client, pe aplicația construită: lista goală → numele
serviciilor; cuvinte scrise → previzualizarea din panou se schimbă pe loc, iar pe site
apar abia după „Salvează"; 13 cuvinte sau unul de 41 de caractere → eroare lângă câmp,
nimic salvat; lista golită la loc → `{}` în date și banda revine la servicii; la 375 px
fără depășire orizontală. Textul „Nu scrii nimic aici" din ecranul benzii și descrierea ei
din lista de secțiuni au fost puse la zi (altfel ar fi minții).

**Telefon OPȚIONAL în formularul de contact, pe toate șabloanele (14 oct. 2026, cerut de
proprietar; PE MASTER din 14 oct., `6044e7b`, CI verde).** Contactul cere acum
nume + email (obligatorii) + telefon (opțional, „Număr de telefon (opțional)", câmp de
tip `tel`). Schimbă hotărârea din 16 sept. („fără telefon"); proprietarul a cerut-o
explicit. E o singură componentă (`ContactForm`), deci toate cele cinci șabloane o au
deodată. Ce rămâne neschimbat: emailul obligatoriu (singura cale de răspuns pentru cine
nu lasă numărul), fără mesaj liber și fără „model preferat" pe cabinete (GDPR, 28 aug.;
doar pagina de vânzare le are), anti-dublarea tot pe email. Serverul citește telefonul pe
orice site, îl verifică dacă e scris (`esteTelefonValid`: 6–15 cifre) și scrie în bază
`phone: telefon || null` — gol rămâne `null`, nu șir gol. **Fără migrare:** coloana
`contact_messages.phone` exista. Panoul „Mesaje" și „Șterge datele unei persoane" știau
deja de telefon. Probe: `e2e/formular-contact.proba.mjs` (strică-le pe rând: pică;
`pagina-vanzare.proba.mjs` ajustat la regula nouă). Încercat într-un browser pe aplicația
construită, cu PostgREST și Postgres adevărate: fără număr → pleacă și în bază e `null`;
număr prost → eroare pe câmp, ce a scris omul rămâne, nimic scris; doar număr, fără
email → refuzat; mesaj/model băgate de mână pe un cabinet → ignorate; câmpul arată la fel
de lat ca emailul pe toate cele cinci șabloane, la 1280 și 375 px, fără depășire
orizontală.
**De făcut:** (1) ~~șablonul `sabloane/politica-de-confidentialitate.md`~~ — rescris pe
15 oct. (vezi mai jos). Politicile clienților deja publicate trebuie corectate de mână
(vezi tabelul din „Ce s-a schimbat până acum…"). (2) Textul-demo al secțiunii Contact din `creeaza_client` („Lasă-mi numele și numărul, te sun
eu.") nu mai e nici el adevărat: numărul nu mai e ce se cere. E text demo, îl schimbă
clientul din panou.

**Butonul „Schimbă emailul" din `/proprietar` (14 oct. 2026, pe master din 14 oct.,
`b3cd506`).** Propus de sesiune, cerut de proprietar („da, fă-l"): schimbă adresa cu care un client intră în
panou, pentru ORICARE client, doar din ecranul proprietarului platformei. Un client NU
îl are (hotărât: varianta pentru clienți — pe lista de făcut, punctul 4a — abia după ce merge emailul prin Resend, cu
parola curentă + link de confirmare pe adresa nouă — o schimbare de adresă de login +
„Ți-ai uitat parola?" înseamnă preluarea contului).
- **Cod:** `src/lib/schimba-email-cont.ts` (regulile și pașii, probabile în Node),
  acțiunea `schimbaEmailul` în `src/app/proprietar/actions.ts` (paznicul „ești
  proprietarul?" ÎNAINTEA oricărui alt lucru; contul se găsește pe server după site,
  niciodată un id din browser), fereastra `src/app/proprietar/schimba-email.tsx`,
  nota în jurnal `scrieInJurnalDePlatforma` în `src/lib/audit.ts`. Probe:
  `e2e/schimba-email-cont.proba.mjs` (toate stricate pe rând: pică).
- **Ce schimbă:** adresa stă în DOUĂ locuri — conturile Supabase (`auth.users`, de
  unde se loghează) și copia `public.users.email` (o citesc „Intră în panou", lista
  din `/proprietar` și „Activitate"). Ordine: conturile întâi, apoi copia; dacă a doua
  scriere pică, prima se dă înapoi; dacă nici înapoi nu merge, mesajul spune ambele
  adrese. După un eșec „nesigur" (răspuns pierdut) se întreabă ce adresă are contul
  acum, ca să nu rămână jumătate de schimbare. Parola rămâne; nu se trimite niciun email.
- **Nota din jurnalul clientului** apare în „Activitate", fără autor: „Adresa de intrare
  în panou a fost schimbată de administratorul platformei: vechi → nou."
- **Încercat pe un Supabase adevărat** (GoTrue v2.197.0 + PostgREST, cu toate migrările
  noastre peste), cap la cap în browser: proprietarul schimbă adresa Anei; Ana intră cu
  adresa nouă și aceeași parolă, nu mai intră cu cea veche; nota apare la ea în
  „Activitate"; un client conectat nu vede `/proprietar`; 375 px fără derulare în lateral.
  **Lecții de acolo (nu se văd fără un GoTrue adevărat):**
  1. O adresă deja folosită, la schimbarea de administrator, NU dă `email_exists` (422):
     dă 500 „Error updating user", fără cod. De-aia adresa se verifică ÎNAINTE în
     `public.users`; o adresă a unui cont din afara cabinetelor (ex. cel de proprietar)
     dă doar „nu-merge", cu un mesaj care nu pretinde că știe cauza.
  2. `generateLink` de tip `magiclink` pe o adresă FĂRĂ cont **creează un cont gol**
     pentru ea (nu dă eroare). Deci o copie `public.users.email` nepotrivită cu conturile
     face ca „Intră în panou" să creeze tăcut conturi goale în loc să pice — motivul
     pentru care cele două se țin mereu la fel. (De întărit, la cerere: `intraInPanou` ar
     putea lua adresa din conturi, nu din copie.)
  3. `email_confirm: true` contează doar la un cont cu adresa neconfirmată (fără el,
     după schimbare ar primi „Email not confirmed"); o schimbare de administrator se
     aplică pe loc și nu trimite email.
- **Găsit în trecere și reparat (14 oct.):** `scrieInJurnal` cu entitățile `"Site"`
  (publicarea/retragerea site-ului) și `"DatePersonale"` (ștergerea datelor unei
  persoane) picau la constrângerea `audit_log_entity_type_check` (accepta doar zece
  valori, fără acestea), iar eroarea e înghițită — deci acele intrări nu au apărut
  niciodată în „Activitate"; cele de până acum NU se pot recupera. Reparația: migrarea
  `20261014120000_jurnal_entitati_site_si_date_personale.sql` (lărgește constrângerea
  la 12 valori; se poate rula de două ori). Încercată pe bancul complet, pe o bază cu
  regula veche și, în aplicația reală de probă: înainte, retragerea site-ului nu apărea
  în Activitate; după, „Site-ul a fost publicat." apare. **Rulată de proprietar în
  Supabase pe 14 oct.**; verificarea (`pg_get_constraintdef`) a întors regula cu cele 12
  valori, inclusiv `Site` și `DatePersonale`. Fișierul migrării e pe master. Proba
  `e2e/jurnal-entitati.proba.mjs` ține tipurile din `audit.ts` și constrângerile din
  amprenta schemei la fel — a pierdut două valori fără ca nimic să spună.
- **Cum se ridică local un Supabase adevărat (n-a intrat în depozit):** Docker (în
  containerul cloud: `dockerd --iptables=false --ip6tables=false --bridge=none`), imaginile
  `supabase/gotrue:v2.197.0` și `postgrest/postgrest:v12.2.3`, `--network host`, Postgres-ul
  băncii cu un DB nou: rolul `supabase_auth_admin` + schema `auth` pentru GoTrue (își face
  singur migrările), apoi `auth.uid()`, tabelele `storage` de probă și migrările noastre
  în ordine; GoTrue cu `GOTRUE_JWT_DEFAULT_GROUP_NAME=authenticated` (altfel tokenul are
  rolul gol, iar RLS refuză totul); un proxy mic care duce `/auth/v1` la GoTrue și
  `/rest/v1` la PostgREST; aplicația construită cu `NEXT_PUBLIC_SUPABASE_URL` pe proxy.
  Dacă se cere, se pun ca script în depozit.

### Lista de sarcini înainte de lansare, reluată (7 oct. 2026)

Reluată la cererea proprietarului, din tabelele și secțiunile de mai jos, cu ce s-a
schimbat de la ele încoace. Unde starea nu se vede din cod (setări Supabase/Vercel,
acte), scrie „nu știu" — nu se presupune că e făcut sau nefăcut. **Ține-o la zi.**

**A. Înainte de primul client plătitor**
0. **Firma NU există încă** (spus de proprietar, 10 oct.; vrea site-ul și domeniul pe
   ea). Atârnă de ea: „Datele firmei" din Setări, operatorul din politica de
   confidențialitate, contractele, facturarea. Domeniul se poate lua acum pe persoană
   fizică și trece pe firmă mai târziu (transferul dreptului de folosință, la RoTLD,
   prin registrar).
1. **Contract + acord de prelucrare (GDPR)**, cu avocat — săptămâni, cel mai lent
   punct; se începe primul și curge în paralel cu restul. Din clipa în care
   platforma ține numele și telefoanele pacienților altcuiva, actele nu sunt opționale.
2. **Planurile plătite la Vercel și Supabase, cu backup** — minute, proprietar.
   Nu se știe pe ce planuri e proiectul. Din documentația lor (citită 7 oct.):
   **Vercel Hobby (gratuit) e doar pentru uz necomercial** — a fi plătit ca să faci
   sau să găzduiești un site e uz comercial și cere Pro; Hobby are și plafon de
   50 de domenii pe proiect, Pro practic nu. **Supabase gratuit n-are niciun
   backup automat** și oprește proiectul după o săptămână fără activitate; Pro
   (25 $/lună) are backup zilnic, păstrat 7 zile, și nu se oprește. De când
   găzduirea e chiar ce vindem (§„Ce vindem"), punctul ăsta nu e opțional.
3. **Resetarea parolei:** codul e gata (10 sept.); rămân **3 setări în Supabase**
   (minute, proprietar). **Confirmat de proprietar pe 7 oct. 2026: NU le-a făcut
   încă.** **15 oct.: amânat până există firma (vezi „Emailul prin Resend… AMÂNATE", sus).**
   Până atunci „Ți-ai uitat parola?" poate să nu trimită emailul. Ocolire
   când un cont e blocat: intri din `/proprietar` („Intră în panou") sau pui o
   parolă nouă din Supabase → Authentication → Users.
4. **Email tranzacțional** (mesaj nou, confirmare de programare) — era „ultimul,
   prin decizia lui explicită" (26 aug.). **Schimbat pe 9 oct.: proprietarul a cerut
   să urmeze, în sesiunea următoare — emailul prin Resend, împreună cu resetarea
   parolei (punctul 3). Schimbat din nou pe 15 oct.: AMÂNAT până există firma** (contul Resend
   și abonamentele se fac pe firmă). Până atunci clientul vede mesajele doar intrând în panou.
4a. **„Schimbă emailul" și pentru clienți** (cerut de proprietar, 14 oct.; vine DUPĂ
   punctul 4 — are nevoie de emailuri care ajung — deci, din 15 oct., după ce apare firma). Acum butonul există doar în
   `/proprietar`; un client care pierde adresa de intrare scrie proprietarului, iar el o
   schimbă. Pentru client, în panoul lui (de pus în Setări, ca grup nou): ce trebuie
   - **parola curentă + link de confirmare trimis la adresa NOUĂ** — schimbarea se aplică
     abia după apăsarea lui (o greșeală de scriere nu-l scoate din cont, iar cine apucă un
     laptop deschis nu poate prelua contul prin „Ți-ai uitat parola?");
   - **de hotărât, cu proprietarul:** Supabase trimite implicit linkuri de confirmare și
     la adresa VECHE, și la cea nouă, dar clientul își schimbă adresa tocmai fiindcă n-o
     mai are pe cea veche. Se poate cere confirmare doar pe cea nouă — securitate mai slabă;
   - **copia `public.users.email` ținută la zi** după confirmare (sincronizare automată,
     nu de mână) — o copie nepotrivită face ca „Intră în panou" să creeze conturi goale
     (vezi lecțiile din §„Butonul «Schimbă emailul» din `/proprietar`");
   - schimbă DOAR contul celui conectat; nu spune dacă o adresă e deja folosită de alt
     cabinet (aceeași regulă ca la resetarea parolei: formularul nu devine o unealtă de aflat
     ce adrese sunt înregistrate); emailul de confirmare în română;
   - probat pe un GoTrue adevărat (rețeta din aceeași secțiune), nu doar cu înlocuitori —
     forma erorilor pe calea clientului (`auth.updateUser`) poate diferi de cea de administrator;
   - efort: de câteva ori cât butonul pentru proprietar (ecran nou, cerere de parolă, pagină
     de confirmare, sincronizarea copiei, probe, mesaje).
5. **Videoclipul de instructaj** — ultimul de tot, fiindcă se învechește la fiecare
   schimbare de ecran.
6. ✓ Făcut: cheile hCaptcha (17 sept.), izolarea dovedită pe baza reală (10 sept.),
   provizionarea ca o linie de SQL, CI cu probe.

**B. Înainte de a arăta produsul (site-ul de vânzări `sitepsihologi`)**
*Adus la zi pe 9 oct., după citirea din bază și brieful din aceeași zi.*
1. **Domeniul `sitepsihologi.ro`** — **NECUMPĂRAT încă** (spus de proprietar, 10 oct.),
   și nu există nicio adresă de email pe el. E primul pas pentru tot ce urmează:
   adresa site-ului, emailul prin Resend (are nevoie de DNS-ul domeniului) și o
   adresă profesională. Site-ul stă pe `sitepsihologi.vercel.app`,
   PUBLICAT din 8 sept. (comutatorul e pornit), dar neindexat: `robots.txt` refuză
   dinadins adresele `*.vercel.app`. Indexarea se deschide la mutarea pe domeniu
   (legat în Vercel, apoi `sites.domain` schimbat din SQL).
2. **Textul proprietarului:** „Cine ești?". (Livrarea e lămurită: și „Cum decurge",
   și tabelul spun acum „maxim 5 zile lucrătoare" — citirea din 9 oct.)
3. **Secțiunea de păreri:** trei locuri goale, dinadins — **nu se inventează
   recenzii**; proprietarul o ascunde din panou până vin păreri adevărate (9 oct.).
4. **Galeria de modele:** fiecare cartonaș duce la `model-….vercel.app` (citirea din
   9 oct.). Nu știu dacă adresele vechi `cosmin-…` au fost scoase din Vercel.
5. **Comutatorul de publicare** — deja pornit (8 sept.).
6. **Ordinea hotărâtă pe 27 aug.:** site-ul proprietarului, făcut primul cap la
   cap; apoi site-ul firmei de web design; abia apoi clienții.
7. **Textele despre domeniu și mentenanță** (7 oct.): după hotărârea că clientul
   își cumpără singur domeniul (§„Ce vindem"), site-ul de vânzări o contrazicea în
   patru locuri. „Pachete" a fost rescrisă de proprietar pe site (captura din 7
   oct.: un singur pachet, nota fără domeniu). Rămâne de văzut pasul „Îmi scrii"
   din „Cum decurge", iar `src/app/proba-vanzari/continut.ts` are încă textele
   vechi. De lămurit: pe site, programările apar ca INCLUSE în cei 300 € în trei
   locuri (pachetul, cartonașul „Programări direct de pe site", tabelul — citirea din
   9 oct.), deși pe 27 aug. erau modul contra cost.
8. ~~**Tabelul comparativ din „Pachete"**~~ — făcut: SQL-ul rulat pe 8 oct., codul pe master.
9. **Brieful din 9 oct.:** codul e pe master; rămân la proprietar textele din panou,
   titlul și descrierea din Setări, „Datele firmei", politica de confidențialitate a
   paginii de vânzare și FAQ-ul (fraza „Noi nu avem acces…", opțiunile programărilor).
   Lista exactă: `RAPORT-BRIEF-SITEPSIHOLOGI.md`, secțiunea 7.

**C. Verificări înainte de lansare**
- `DEV_TENANT_DOMAIN` să NU fie setat pe Production (pinuiește orice `*.vercel.app`
  la un singur site). Cele cinci `model-…` arată fiecare alt șablon, ceea ce
  sugerează că nu e setat — **deducție, neverificată** direct în Vercel.
- Testul de izolare pe domenii distincte și rutate (vezi §„Izolarea între
  clienți: cum o testezi înainte de lansare").
- Tragerea articolelor pe un telefon real (vezi „Unde am rămas").

**D. Amânate în cunoștință de cauză:** plățile cu cardul (Netopia), categoriile de
blog, semnul din panou pentru secțiunile aprinse dar goale.

**E. Strategie de marketing — ultimele pe listă** (adăugate la cererea
proprietarului, 7 oct. 2026). Nu există încă un canal de vânzare; asta e munca lui, nu
cod, și poate curge în paralel cu actele (se strâng clienți interesați cât se coace
hârtia GDPR):
1. **Contactează-o pe Rodica** pentru un site.
2. **Contactează-o pe Ema** pentru un site.
3. **Contactează-l pe Alex** pentru un site.
4. **Alți psihologi** pe aceeași linie, după aceștia.

Despre ele/el nu e scris nimic în note (cine sunt, ce șablon li s-ar potrivi, ce
ofertă li se face) — de completat de proprietar. Fiecare site făcut pentru ei e și
proba pentru lanțul „site-model completat → capturi → site de vânzări convingător"
(vezi §„Munca proprietarului, care nu e nici cod, nici acte").

### Ce blochează primul client PLĂTITOR

| # | Ce | Al cui | Cât ține |
|---|---|---|---|
| 1 | **Contract + acord de prelucrare (GDPR)** | proprietar + avocat | **săptămâni** |
| 2 | **Email tranzacțional** | proprietar (hotărârea), apoi cod | zile |
| 3 | ~~Resetarea parolei~~ — **făcută** (cod, 10 sept.), pe punte | proprietar: 3 setări Supabase | minute |
| 4 | **Backup / PITR verificat în Supabase** | proprietar | minute |
| 5 | ~~Cele două chei hCaptcha~~ — **făcut** (17 sept.) | proprietar | ✓ |
| 6 | **Videoclipul de instructaj** | proprietar, ULTIMUL | ore |

**1 are cel mai lung timp de așteptare din toată lista.** Se începe primul,
curge în paralel cu restul. Din clipa în care platforma ține numele și telefonul
pacienților altcuiva, actele nu sunt opționale.

**2 e nodul**, deși a fost amânat dinadins („nu am ce email să fac acum",
26 aug.). De el atârnă trei lucruri: resetarea parolei, anunțul că a venit un
mesaj, confirmarea unei programări. Deocamdată clientul află că i-a scris cineva
**doar dacă intră în panou și se uită** — pentru un cabinet cu două mesaje pe
săptămână, asta e o problemă reală, nu o comoditate.

**3 e făcută (10 sept.)**, pe puntea cu expeditorul încorporat al Supabase — vezi
§„Resetarea parolei". Era trecută drept obligatorie chiar în documentul ăsta
(§„Ce se predă clientului"): un om care își scrie singur site-ul intră în panou
de zeci de ori în prima lună, iar înainte, când își uita parola, singura cale era
un telefon la proprietar și o intrare manuală în Supabase. Codul e gata; rămân
trei setări în tabloul Supabase, minute, făcute de proprietar.

**5 e făcută (17 sept.).** Cheile hCaptcha sunt în Vercel (sitekey public + secret
marcat „Sensitive"), iar caseta apare pe toate formularele publice, în engleză
(la cererea proprietarului). Codul era gata dinainte — `src/lib/captcha.ts` +
`src/components/site/captcha.tsx`; lipseau doar cheile, puse acum de proprietar.

**6 se filmează ultimul**, dinadins: se învechește la fiecare schimbare de ecran.

**Rulat pe 9 sept.:** `20260909100000_drepturi_de_executie.sql`, care închide două
funcții ce puteau fi chemate de oricine deschidea site-ul. Verificat într-o
sesiune separată, după: amândouă au doar `postgres` și `service_role`. Povestea
întreagă în §„Verificarea că baza reală are ce scriu migrările".

### Izolarea între clienți: cum o testezi înainte de lansare (și capcana care sperie degeaba)

15 sept. 2026, prins de proprietar. Un document încărcat „într-un site" apărea în
bibliotecile „tuturor" — a părut scurgere de date, dar NU era. Izolarea reală e
dublă și verificată: aplicația filtrează fiecare citire pe `site_id`, iar RLS-ul
din Postgres o impune (`uploads` etc.: `site_id = current_site_id()`). Un fișier
al unui client nu poate ajunge la altul.

Ce s-a întâmplat de fapt: mai multe „site-uri" se rezolvau, la RUNTIME, la
ACELAȘI site. Se întâmplă când:
- e setat `DEV_TENANT_DOMAIN` (pinuiește orice `*.vercel.app` la un singur site —
  vezi avertismentul din `proxy.ts`; **a NU se seta pe Production cu clienți
  reali**, și schimbarea cere redeploy + e per-mediu); SAU
- domeniile clonelor (ex. `lumina.vercel.app`) nu sunt de fapt rutate în Vercel
  către proiect, așa că accesezi mereu prin singura adresă care merge, iar aia se
  rezolvă la un singur site.

**Cum îți dai seama pe loc:** în panou, sus-stânga, scrie numele + adresa
site-ului pe care ești CU ADEVĂRAT. Dacă „două site-uri" arată același nume/adresă
acolo, e un singur site — nu o scurgere.

**Testul corect de izolare, înainte de lansare:**
1. Două site-uri pe două host-uri DISTINCTE și RUTATE (domenii reale, ori
   configurate corect în Vercel — nu doar scrise în `sites.domain`).
2. `DEV_TENANT_DOMAIN` scos din toate mediile (redeploy după).
3. Încarci un document/o poză pe site-ul A. Pe site-ul B, în bibliotecă, NU
   trebuie să apară — și invers.
4. `supabase/verificare-izolare.sql` probează deja izolarea pe bază; ține-o ca
   regression test.

**Bug REAL, separat — REPARAT pe 15 sept. 2026** (migrarea
`20260915120000_curata_incarcarile_la_clonare.sql`): `cloneaza_site` copia
secțiunile (`site_content`) verbatim, cu tot cu referințele la poze (`uploadId`)
și documente (`fisierId`) din interior — deci un site CLONAT afișa fișierele
site-ului-sursă (adresa se semnează după id, nu după site). Fișierele nu se
dublau, dar referințele se împărțeau. Nu era o scurgere per vizitator (RLS
intact), dar la clonarea unui client real i-ar fi arătat pozele altuia. Acum, la
clonare, `data` trece prin `_curata_incarcarile`, care scoate obiectele de fișier
din conținut (ca la coperți, deja puse pe NULL) și lasă restul neatins. Bancul
(`proba-locala.sh`) clonează un site cu poze și materiale și verifică: pe clonă
nu rămâne niciun `uploadId`/`fisierId`, textul butoanelor rămâne, iar sursa nu se
atinge.

### Ce blochează ARĂTAREA produsului

Site-ul de vânzări e gata, dar nepublicat, pe o adresă temporară care nu se
indexează (vezi §„Site-ul de vânzări"). Mai trebuie: domeniul `sitepsihologi.ro`,
capturi adevărate de șabloane (cer un site completat, cu texte și poze reale),
textul „Cine ești?" și în câte zile se livrează. Apoi comutatorul de publicare.

### Munca proprietarului, care nu e nici cod, nici acte

Adăugată pe 10 sept. 2026, fiindcă lista de mai sus era iar incompletă — avea
codul și actele, dar nu munca de conținut și de vânzare, care e la fel de reală
și pe care nimeni n-o poate face în locul proprietarului. Fără ea, tehnica gata
și actele semnate tot nu fac o vânzare.

- **Scrierea conținutului lui `sitepsihologi`.** Site-ul de vânzări e provizionat
  și are un schelet turnat din SQL, dar textul adevărat — ce e produsul, „Cine
  ești?", în câte zile se livrează — îl scrie proprietarul. Secțiunea de păreri
  are trei locuri goale, dinadins: **nu se inventează recenzii.** Ori vin păreri
  adevărate, ori secțiunea rămâne stinsă la publicare.
- **Site-uri-model, completate cu texte și poze reale.** Galeria de șabloane de
  pe `sitepsihologi` arată acum DESENE (SVG-uri din paletă), nu capturi, fiindcă
  o captură adevărată cere un site plin. Aici se leagă două lucruri într-unul:
  proprietarul își face întâi **propriul** site cap la cap (primul drum complet,
  scoate la iveală ce e incomod), apoi **altora** — iar site-urile astea sunt
  ȘI proba, ȘI materialul din care ies capturile reale pentru fiecare șablon.
  Ordinea e cea din §„Ordinea de lansare". Fără ele, site-ul de vânzări rămâne cu
  desene în loc de fotografii.
- **Contactarea potențialilor clienți.** Nu există încă niciun canal de vânzare.
  Oricât de bună ar fi platforma, cineva trebuie să ajungă la psihologi. E munca
  proprietarului și poate — ar trebui — să curgă în PARALEL cu actele: se strâng
  clienți interesați cât se coace hârtia GDPR, nu după.

Lanțul, ca să nu se piardă: **site-model completat → capturi reale → intră în
`sitepsihologi` → site de vânzări convingător → publicat → arătat prospecților.**
Legalul (rândul 1) și lanțul ăsta curg în paralel; vânzarea așteaptă cel mai
lent dintre ele, nu suma lor.

### Unde se editează textele pe sitepsihologi.ro (21 sept. 2026)

Proprietarul a căutat unde se scrie textul celor 6 cartonașe din secțiunea
„Ce primești" (pe site) și a fost derutat — arăta diferit de restul secțiunilor.
Explicat, ca să nu se caute de la zero altă dată:

„Ce primești" e secțiunea tip **„Serviciile mele"** (cheia `features`), cu alt
titlu scris peste cel implicit. Ea NU își ține propriul text pentru cartonașe —
citește Serviciile, la fel ca pe orice alt site (vezi docstring-ul din
`features.tsx`: „Nu-și ține conținutul: îl citește din Servicii… altfel fiecare
serviciu ar fi scris de două ori”). Catalogul secțiunilor (`src/lib/sectiuni.ts`,
cheia `features`) chiar avertizează despre asta în descrierea ei, vizibilă în
panou: *„Ce oferi. Textele vin din Servicii, nu de aici.”* — doar că titlul
AFIȘAT pe site („Ce primești”) nu se leagă vizual de eticheta din listă
(„Serviciile mele”), de-aici confuzia.

Deci, concret:
- **Titlul mare + textul de sub el** (dacă are) → Panou → **Secțiuni** →
  „Serviciile mele”.
- **Fiecare din cele 6 cartonașe** (titlu + descriere) → Panou → **Servicii** —
  un rând per cartonaș, exact ca la lista de servicii a unui cabinet obișnuit.
- **Banda de puncte cu linie orizontală** (în loc de cartonașe cu chenar) e o
  AȘEZARE fixată în bază (`variant: "linie"` pe rândul din `site_content`,
  pusă din SQL la provizionare — vezi comentariul de pe `SectionRow.variant`
  din `render-sections.tsx`), nu un comutator din panou. Nu trebuie schimbată:
  e voită pentru sitepsihologi.

### Amânate în cunoștință de cauză

Plățile cu cardul (Netopia — vezi capitolul lui), categoriile de blog, și semnul
din panou pentru secțiunile aprinse dar goale (proprietarul a amânat reparația
pe 8 sept., după ce i-am arătat costul).

## Panoul de proprietar + clonarea (11 sept. 2026)

Construite și livrate (PR #3, #4). La `/proprietar`, un cont de proprietar
(tabela `platform_owners`, semănată cu SQL) vede toate site-urile și intră în
oricare (impersonare prin `generateLink` → `verifyOtp`, consumat pe host-ul
site-ului, fiindcă acolo se scrie cookie-ul). „Client nou" din panou face contul
(`admin.createUser`) + provizionează (`creeaza_client`) SAU clonează un site
existent pe alt șablon (`cloneaza_site` — copie exactă a rândurilor cu coloane
citite din catalog; pozele pe NULL, datele vizitatorilor necopiate, blogul
remapat; probată rând cu rând pe banc). Adresa: `<host>/proprietar`, pe orice
host de platformă. Ambele funcții revocate de la `public` + `anon` +
`authenticated`.

Notă găsită clonând: pozele „se copiază" fiindcă adresa lor se semnează la
randare din id-ul din conținut (`rescrieAdresele`), fără verificare de
apartenență — iar clona copiază id-urile. Verificat că NU e o scurgere între
clienți reali: un client nu poate ENUMERA id-urile altuia (anon nu citește
nimic, `authenticated` e scopat pe site), deci nu poate obține id-ul unei poze
private. Singurul rezidual e re-afișarea unei poze DEJA publice (hotlink), nu o
scurgere. De întărit opțional (nu urgent): respinge id-uri de poză străine chiar
la salvarea secțiunii — dar e fix mecanismul pe care se sprijină clonele.

---

## De modificat pe șabloane (11 sept. 2026) — din documentul proprietarului

Proprietarul a trimis o listă cu șapte lucruri. Fiindcă șabloanele împart
aceleași componente, fiecare se face O DATĂ și apare pe toate cinci.

1. **Repoziționarea pozelor** — GATA, refăcut. Prima variantă (un PUNCT focal
   de pus, per secțiune) a fost respinsă de proprietar de trei ori: „fara punct
   ca nu stie utilizatorul ce sa faca, fa ca la facebook unde poti sa deplasezi
   imaginea". LECȚIA: cererea era clară de la început („trasă în ramă, ca la
   Facebook") — am impus o soluție de-a mea (punctul) fiindcă mi s-a părut mai
   robustă, și am consumat trei runde până m-am întors la ce ceruse. Acum:
   clientul TRAGE poza în ramă cu mausul, ca la Facebook, și poziția e o însușire
   a POZEI — aleasă o dată (la încărcare sau din bibliotecă), valabilă peste tot
   unde e pusă. Stă pe `uploads.focal_x/focal_y` (migrarea
   `20260911140000_pozitie_imagini.sql`); `pozitioneazaImagine` o scrie și-o
   propagă în toate secțiunile care folosesc poza, exact ca `alt_text`
   (`salveazaDescriereaImaginii`) — deci site-ul public o citește tot din
   conținutul secțiunii, fără un al doilea tabel. Componenta de tragere:
   `src/components/ui/repozitionare-imagine.tsx` (matematica surplusului în
   `dupaTragere` din `punct-focal.ts`, probată). Reglabilă din câmpul de imagine
   al secțiunii (`image-field.tsx`, `cuRepozitionare`) ȘI din panoul Imagini
   (`panou-imagine.tsx`). Fără poziție aleasă → centru, exact ca înainte.
   CAPCANĂ prinsă la probă: o poză deja în cache e `complete` înainte ca React
   să-i lege `onLoad`, deci evenimentul nu vine — dimensiunile se citesc direct
   din `<img>` la momentul tragerii, nu dintr-un `onLoad`. RĂMÂNE pentru mai
   târziu: coperta articolelor de blog (alt mecanism, `cover_upload_id`).
2. **Link în butonul de la Pachete** (+ punctul 6, același buton) — GATA. Câmpul
   „unde duce" al oricărui buton era o casetă liberă cu exemplul „/contact" — dar
   `/contact` NU e o pagină (secțiunea de contact e `#contact`), deci cine urma
   exemplul ajungea la 404. Acum e o LISTĂ (`SelectField`) cu destinațiile care
   chiar există pe site-ul lui: secțiunile vizibile (ca `#ancoră` — toate stau pe
   prima pagină, deci ancora duce mereu unde trebuie) și paginile publicate (ca
   `/adresă`), plus „O altă adresă" pentru un link în afară. Butonul de la Pachete
   se leagă acum de „Programe și experiențe" (`#programe`) sau de un curs extern
   dintr-un clic. Logica listei: `src/lib/destinatii.ts` (probată în
   `e2e/destinatii.proba.mjs`); adusă în editor prin `page.tsx` → `editor.tsx` →
   `CampuriSectiune` (`CampLink`). O adresă veche stricată apare ca „altă adresă",
   ca s-o poți repara alegând din listă.
3. **Video în secțiunea Apariții (`logos`)** — GATA, refăcut de câteva ori până
   la forma cerută. FORMA FINALĂ: o SINGURĂ listă „Apariții", cu recunoaștere
   AUTOMATĂ. Fiecare apariție are un câmp de link (`href`); dacă e link de
   YouTube, apariția se REDĂ pe loc (card cu buton de play), altfel rămâne card
   cu „Vezi materialul →" (articol, podcast), iar fără link e doar card cu text.
   Clientul nu alege între liste și nu bifează nimic — pune un link, secțiunea
   își dă seama singură. Grilă `auto-fit` (2-3 pe rând pe lat, 1 pe telefon); la
   clic se încarcă player-ul, nu înainte (facadă: fără iframe-uri YouTube la
   fiecare încărcare). Link-ul → id cu `src/lib/video.ts` (orice formă:
   `watch?v=`, `youtu.be/`, `/embed/`, `/shorts/`; probat în
   `e2e/video.proba.mjs`); încorporare pe `youtube-nocookie` (fără cookie-uri
   până la play). Componenta de client: `src/components/site/redare-video.tsx`
   (prop `rotunjit`, ca să nu-și dubleze colțurile în card). Afiș: poza
   apariției sau, în lipsă, cel automat de pe YouTube (`hqdefault`, tăiat
   „cover"). Fără câmpuri noi în editor — se folosește `href`-ul apariției.
   DRUMUL până aici (lecție despre cât rău fac două cutii): întâi un video
   „vedetă" (ca la Renata), apoi o listă `videouri` SEPARATĂ de „Apariții", apoi
   un `doarYouTube` care dădea eroare la salvare pe linkuri non-YouTube (un Bing
   lipit dispărea mut). Proprietarul s-a încurcat de fiecare dată cu două liste
   („în care o pun?"); ce ceruse, de fapt, era o singură listă care recunoaște
   singură. Ambele scoase (lista `videouri` și steagul `doarYouTube`): un link
   non-YouTube nu mai e eroare, e pur și simplu un articol.
4. **Fișiere de descărcat** — GATA. Documentele (PDF/Word) stau în bibliotecă,
   lângă poze; la fiecare program din „Programe și materiale" pui o listă de butoane
   „Descarcă", fiecare legat de un document. SURPRIZĂ: n-a trebuit nici migrare,
   nici setare Supabase — bucketul `media` n-a avut niciodată restricție de tip,
   iar `uploads.mime_type` acceptă orice text; „doar poze" era doar în cod. Deci
   totul e cod.
   - Instalația: validare în `lib/uploads.ts`; adresă de descărcare semnată
     `adresaFisierului` (aceeași cheie ca la poze) pe ruta
     `/fisiere/[id]/[semnatura]`, servită cu „attachment" + numele original;
     `uploadDocument` în `actions/upload.ts`.
   - Bibliotecă: `imaginileBibliotecii` filtrează acum DOAR pozele (după mime),
     nou `documenteleBibliotecii`; `documente.tsx` (încărcare + listă + ștergere)
     pe ecranul „Bibliotecă" (fost „Imagini", redenumit fiindcă ține și fișiere).
   - Materiale: câmp `materiale` (listă) pe program, fiecare = text + câmp nou
     `tip: "document"` (dropdown din documentele bibliotecii — `CampDocument`,
     threadat ca `destinatii`); randate în `portfolio.tsx` ca butoane de descărcare;
     text gol → „Descarcă materialul".
     - A stat întâi pe „Pachete" (m-am luat după cum numise proprietarul
       secțiunea); mutat la „Programe și materiale" la cererea lui — acolo, unde
       numele conține chiar „materiale", e locul firesc. Funcțiile de
       curățare/re-semnare recunosc materialul după `fisierId`, nu după secțiune,
       deci mutarea a fost doar câmp (`sectiuni.ts`) + randare (`pricing.tsx` →
       `portfolio.tsx`), nimic de atins la ștergere.
   - Adresa se re-semnează la randare din `fisierId` cu `rescrieAdreseleFisiere`
     (perechea lui `rescrieAdresele`, recunoaște `fisierId`, nu `uploadId`, ca
     ruta de fișier și cea de poză să nu se calce), chemată pe site și în editor.
   - Probat vizual: biblioteca (listă + gol) și programul cu butoane de descărcare.
   - Ștergerea curăță și butoanele: `stergeImaginea` scoate încărcarea din
     secțiuni fie ca poză (`uploadId`), fie ca material (`fisierId`), prin
     `scoateIncarcarea` (`imagini.ts`, cu `rescrieFisierul` — perechea lui
     `rescrieImaginea`). Fișierul dispare de pe buton, textul butonului rămâne
     (poți realege). Probat în `e2e/materiale.proba.mjs`. Deci un buton nu mai
     rămâne legat de un fișier șters (prins de proprietar).
5. **Contact pe WhatsApp** — GATA. Bulă verde fixă în dreapta-jos, iconița ȘI
   culoarea ORIGINALE (`#25D366`, glifa albă WhatsApp), aceeași pe toate
   șabloanele — singurul loc din site-ul public care NU ia culorile șablonului,
   fiindcă asta a cerut proprietarul. Câmp `whatsapp` în Setări →
   `site_settings.brand`; numărul, scris cum vrea clientul, e normalizat la
   `wa.me` (`src/lib/whatsapp.ts`, probat în `e2e/whatsapp.proba.mjs`);
   componenta `src/components/site/bula-whatsapp.tsx`, montată în
   `cadru-site.tsx` (urcată deasupra barei de administrare pentru proprietarul
   logat). Gol → butonul nu apare. Verificat vizual la 1200px și 390px.
6. **Bug: butonul de la Pachete** — GATA, rezolvat odată cu punctul 2. Cauza era
   exemplul „/contact" din câmpul de link, care e o pagină inexistentă (contactul
   e secțiunea `#contact`). Lista de destinații nu mai lasă butonul să nimerească
   un loc care nu există.
7. **Aliniere text/poză la „Despre mine" (`aboutTeaser`)** — GATA. Înainte,
   titlul locuia în coloana din stânga, peste poză, iar textul din dreapta
   pornea din capul de sus — adică în dreptul TITLULUI, nu al pozei, care
   rămânea jos, singură. Acum antetul (eyebrow + titlu) e pe TOATĂ lățimea,
   deasupra, iar sub el poza și textul sunt două coloane ancorate de sus
   (`alignItems: start`): textul pornește în dreptul pozei. Aceeași grilă
   responsivă ca înainte (`auto-fit`, fără media queries); pe telefon se
   stivuiește titlu → poză → text, exact ca până acum. Schimbare într-o
   componentă comună (`about-teaser.tsx`, randată de `render-sections.tsx`),
   deci apare pe toate cinci șabloanele. Probat vizual la 1200px și 390px.

Notă de arhitectură (întrebarea proprietarului): o cerere de client schimbă
TOATE șabloanele doar dacă atinge o componentă comună la nivel de STRUCTURĂ.
Conținut → doar site-ul lui. Piele (culori/font) → doar șablonul lui. Funcție
nouă → disponibilă la toți, dar apare doar unde e folosită. O aranjare cerută de
UNUL se face ca `variant` (mecanism deja construit, nefolosit), nu ca rescriere.
Regula de business: se vând funcții și opțiuni, nu personalizări per client.

## De modificat pe șabloane (16 sept. 2026) — al doilea document al proprietarului

Cinci cereri, din capturi de pe `renataiancu.ro` (șablonul-model, mov pe lavandă).
Toate livrate:

1. **Contact fără telefon.** Formularul cere acum Nume + Email (emailul devenit
   OBLIGATORIU, fiindcă rămâne singurul canal de răspuns; dedup-ul s-a mutat pe
   email). Câmpul de mesaj **NU** s-a pus la loc — rămâne scos din motivul GDPR
   de pe 28 aug. (adună date de sănătate), confirmat de proprietar. Plus un rând
   editabil deasupra formularului („Răspund personal în maxim 24 de ore").
   *Excepție din 9 oct. 2026: pagina de vânzare (sitepsihologi.ro) are telefon,
   model preferat și mesaj — acolo scriu psihologi despre un site, nu pacienți
   despre sănătate. Vezi „Fără câmpuri de text liber…", mai jos.*
   *Schimbat pe 14 oct. 2026, la cererea proprietarului: telefonul revine pe TOATE
   formularele de contact, ca OPȚIONAL (emailul rămâne obligatoriu). Vezi „Telefon
   OPȚIONAL…", sus.*
2. **Poză rotunjită în hero** — arcadă în cap pe așezarea cu poza lângă titlu
   (Lumină & co.), rotunjire blândă pe Căldură.
3. **Bandă cu servicii** — secțiune nouă, pornit/oprit din lista de secțiuni;
   derulează numele serviciilor. La clienți noi vine vizibilă, la cei existenți
   ascunsă (backfill). Vezi migrarea `20260916120000_banda_servicii.sql`.
   *Din 14 oct. 2026 poate derula și cuvinte proprii („Cuvinte din bandă"), cu numele
   serviciilor ca rezervă — vezi „Banda cu servicii, cu cuvinte proprii", sus.*
4. **Etichete** sub „Despre mine" (text mare + mărunt), pe toate șabloanele.
5. **Poze la servicii** — copertă opțională per serviciu, ca la blog
   (`cover_upload_id`), pe cartonaș și pe pagina serviciului.

**Follow-on, aceeași zi — subsolul, tot după Renata.** Subsolul era o singură
bandă (nume + contact + linkuri sociale ca text). Acum are patru coloane:
identitatea (logo opțional + nume + subtitlu + descriere + rețele ca iconițe
rotunde), „Servicii", „Cabinet" și contactul, cu o bară de jos (© + nume +
pagini legale + acreditare). Coloanele Servicii și Cabinet **nu se scriu de
mână** — se umplu singure din serviciile publicate și din secțiunile vizibile
(`src/lib/subsol.ts`). Logoul e câmp nou în **Setări** (`brand.logo`), nu o
secțiune de panou (decizie: subsolul e cadru, nu conținut de pagină — stă lângă
celelalte date ale cabinetului); TikTok s-a adăugat la rețele. Ambele sunt chei
noi în JSONB — **cod, fără migrare**; un site fără logo arată doar numele.

**Culorile: nu era nimic de reparat.** Proprietarul a măsurat un mov „spălăcit"
(`#957cb4`/`#b7b7db`) și a crezut că e al nostru. Erau POZELE-placeholder mov din
capturile mele de probă, nu tema. Movul real al șablonului Lumină e `#5E2976` —
fix movul Renatei de pe bandă (dovedit citind culoarea randată a butonului și a
etichetelor). Lecția pentru mine: la probe vizuale, placeholder GRI, nu colorat.

### ⚠️ Două migrări de rulat pe baza reală înainte să conteze

Se rulează de mână (SQL Editor), ca orice migrare aici. Până atunci, producția
n-are aceste schimbări de bază:

- `20260915120000_curata_incarcarile_la_clonare.sql` — fixul de clonare (nu mai
  duce pozele sursei pe clonă).
- `20260916120000_banda_servicii.sql` — banda ca secțiune + backfill la site-urile
  existente (ca să apară în lista de secțiuni și s-o poată porni).

Restul schimbărilor (contact, hero, etichete, poze la servicii) sunt doar cod —
se văd la următorul deploy, fără migrare.

## De modificat pe șabloane (17–18 sept. 2026) — al treilea document: „Apropiere" adus la referința Friendly

Al treilea document al proprietarului (`Modificari_Apropiere.docx`), și primul
care atinge UN SINGUR șablon. Referința e un HTML de probă („Friendly" — crem
cald, verde salvie, un accent scris de mână); cererea a fost ca șablonul
`apropiere` să arate ca el, cap la cap. Spre deosebire de documentele din 11 și
16 sept. (care schimbau STRUCTURA unor componente comune, deci toate cinci
șabloanele), astea sunt PIELE pe un singur șablon — vezi nota de arhitectură de
la 11 sept. Toate livrate, fiecare bucată în PR-ul ei mic, ultimul #44.

**Trei directive care rămân valabile pentru tot ce ține de Apropiere (și nu
doar):**
- **Fără iconițe, nicăieri.** Referința are pictograme lângă multe rânduri;
  proprietarul le vrea scoase peste tot. Se implementează FĂRĂ ele — rămâne
  textul (eticheta), nu se caută un înlocuitor grafic.
- **~~Nu se cere telefon vizitatorului, niciunde.~~ Depășit pe 14 oct. 2026 la contact:
  telefonul vizitatorului se cere iar, opțional, în formularul de contact (vezi „Telefon
  OPȚIONAL…", sus); restul directivei rămâne.** Numărul PROPRIU al cabinetului,
  afișat ca dat de contact, rămâne (e al lui, apăsabil). Ce nu se face e un CÂMP
  care cere vizitatorului telefonul — la fel ca decizia din 16 sept. de la
  contact, dusă peste tot.
- **Câmpul de mesaj liber rămâne SCOS.** Referința îl are; noi nu-l punem la loc,
  din motivul GDPR de pe 28 aug. (adună date de sănătate).
- *Excepție din 9 oct. 2026, doar pentru pagina de vânzare (sitepsihologi.ro,
  `sites.tip = 'vanzare'`): telefon, model preferat și mesaj în formularul de
  contact. Acolo scriu psihologi despre un site, nu pacienți despre sănătate.
  Cabinetele rămân fără telefon cerut și fără text liber.*

**Ce s-a făcut, pe secțiuni** (fiecare doar pe `apropiere`, prin câte un steag în
`asezari`):
- **Hero** — pete blurate salvie+piersică în fundal (`heroBlob`), titlul cu
  ultimul cuvânt subliniat piersică și coada scrisă de mână verde
  (`heroTitluFriendly`), poza fără arcadă (`heroFaraArcada`).
- **Antetul** — o pastilă care plutește, cu „Programare" ca buton în dreapta
  (`antetPastila`).
- **Programări rapide** — săptămâna pe coloane (o zi = o coloană, cu orele ei),
  plus un card „Rezumat" fără emoji, în loc de calendarul lunar; pe email, nu
  telefon (`programareSaptamana`).
- **Despre mine** — domeniile ca etichete-pastilă și reperele în cartonașe albe;
  poza peste un card verde decalat (`despreFriendly`, `desprePozaStivuita`).
- **Testimoniale** — stele, avatar cu inițiale, cardul din mijloc verde
  (`testimonialeFriendly`).
- **Servicii** — preț mare sub o linie punctată, unele carduri colorate, fără
  poză și fără iconiță (`serviciiFriendly`).
- **Blog** — carduri cu titlu apăsat, dată scrisă normal, umbră blândă și
  „Citește mai departe →", și pe prima pagină, și pe `/blog` (`blogFriendly`).
  DINADINS lăsate afară: pastila de categorie și „min citire" — articolele n-au
  câmp de categorie, iar timpul de citit ar fi cerut cărat tot textul la listare.
- **Pachete** — carduri albe cu culorile șablonului, cel evidențiat cu chenar și
  buton verde (`pricingFriendly`).
- **Programe și materiale** — caseta de text de sub poză, albă, ca la blog (FĂRĂ
  steag nou: conținutul folosea deja `--t-…`, deci s-a albit singur prin fallback).
- **Contact** — antetul sus, apoi formularul într-un card alb lângă un card verde
  cu datele cabinetului, fiecare rând o casetă albă, fără iconițe
  (`contactFriendly`). Formularul e neschimbat ca fond (Nume + Email). „Program"
  n-a cerut câmp nou: datele cabinetului erau deja o listă de perechi
  etichetă/valoare, iar sugestia din panou chiar zice „Ex.: Telefon, Email,
  Cabinet, Program".

**Cum ține pe un singur șablon, fără să atingă restul.** Fiecare tratament e un
boolean în `TemplateAsezari` (`src/lib/templates/types.ts`), pus pe `true` doar
în `apropiere.ts`, și dus la componentă prin contextul din `render-sections.tsx`
(`ctx.asezari.…`). Componenta desenează forma prietenoasă când steagul e pornit,
altfel rămâne cum era — celelalte patru șabloane nu se ating. Culorile cardurilor
vin din nivelul ȘABLONULUI (`--t-…`, ton-independent), nu din tonul secțiunii
(`--s-…`): un card care trebuie să rămână deschis pe orice bandă își ia
CONȚINUTUL din `--t-…` și își fixează singur `color: var(--t-text)`. „Alb pe
Apropiere" înseamnă un `--t-suprafata: #ffffff` pus DOAR acolo (`templateStyle`);
restul șabloanelor n-au variabila, deci cad pe crem prin
`var(--t-suprafata, var(--t-fundal-nuantat))`. Verdele cardurilor (info-cardul de
la contact, cardul din spatele pozei din Despre, petele din hero) e aceeași
salvie `--t-accent-pe-inchis`, ca site-ul să pară dintr-o bucată. **Zero
migrări** — tot ce s-a atins e cod și fișiere de valori.

**Lecțiile (mai ales una).** Proprietarul a prins, la jumătatea drumului, că
omisesem multe („de ce ai omis atât de multe chestii"). Avea dreptate: lucrasem
REACTIV, bucată cu bucată, fără să citesc întâi referința întreagă și să fac
inventarul — și confundasem „culori potrivite" cu „așezare ca la referință".
Reparat citind HTML-ul de probă cap la cap și ținând o listă. Alte trei, mărunte:
sublinierea piersică nimerise întâi cuvântul greșit (referința subliniază un
cuvânt din titlul sans, nu accentul scris de mână); cardurile crem pe pagină crem
abia se vedeau (de-aici `--t-suprafata` alb); iar la probele vizuale se arată
DOAR Apropiere, nu și alt șablon „de control" nesolicitat — o captură cu
Claritate a derutat degeaba.

**Stare:** Apropiere e adus vizual la referință, cap la cap. Celelalte patru
(Căldură, Liniște, Lumină, Claritate) rămân neatinse. Nimic nu mai e deschis din
acest document.

## De modificat pe șabloane (18 sept. 2026) — al patrulea: „Liniște" adus la referința „Dragoș Geamănă"

Al patrulea document al proprietarului: un singur șablon, `liniste`, adus vizual
la un HTML de referință (site-ul „Dragoș Geamănă — Psihoterapie București").
Același tipar ca la Apropiere (11–18 sept.): PIELE pe un singur șablon, prin
steaguri în `TemplateAsezari` pornite DOAR în `liniste.ts`, duse la componentă
prin `ctx.asezari.…`. Restul șabloanelor nu se ating. **Zero migrări** — tot ce
s-a atins e cod și fișiere de valori.

**Descoperirea care a scurtat munca:** „Dragoș Geamănă" e chiar site-ul-sursă din
care a fost măsurat Liniște. Deci paleta („Sage & Cream": crem `#F3EDE2`, salvie,
verde-închis `#1F2A24`, salvie-deschis `#C3CFB7`) și fonturile (titluri integral
în Cormorant Garamond, corp DM Sans) erau DEJA ale referinței. Golul a fost
exclusiv de AȘEZARE, nu de culoare — exact lecția din al treilea document („nu
confunda «culori potrivite» cu «așezare ca la referință»"). Accentul rămâne
`#4C6A52`, nu `#5b7560` al referinței: al doilea pică sub pragul WCAG pe crem,
corecție dinadins, apărată de `e2e/contrast-sabloane.proba.mjs`. Paleta n-a fost
atinsă.

**Ce s-a făcut, pe secțiuni** (fiecare un steag în `asezari`, doar pe `liniste`):
- **Hero** — un cerc de accent (salvie) în spatele portretului, care iese pe sub
  arcadă (`heroCercDecor`). Arcada, bulinele plutitoare (`bulinePoza`) și titlul
  cu accent serif italic existau deja.
- **Citat** — bandă centrată, mare, serif italic, fără ghilimeaua-ornament din
  față (`citatCentrat`).
- **Despre mine** — primul reper („12+ ani") scos într-un card ÎNCHIS suprapus pe
  colțul jos-dreapta al portretului (`despreReperCard`); restul reperelor, dacă
  mai sunt, rămân în rândul de sub text.
- **Cum lucrez** — antet centrat și pașii în carduri albe (cifră serif + text),
  fără iconițe (`cumLucrezCarduri`). Albul se pune DOAR aici și la sub-cardul de
  formular din Contact (fallback pe `#ffffff` în componentă), NU la nivel de
  șablon (`--t-suprafata`): altfel ar fi albit din greșeală și cardurile din
  secțiunile nereferențiate (testimoniale, pachete, programare), care rămân pe
  crem.
- **Serviciile mele** — carduri-imagine cu voal întunecat peste poză, titlul și
  descrierea pe imagine, o săgeată rotundă în colț (`serviciiImagine`); săgeata
  doar când pagina de servicii e pornită (altfel cardul n-ar duce nicăieri). Fără
  copertă, cardul rămâne un dreptunghi închis cu titlul.
- **Contact** — totul într-un card ÎNCHIS rotunjit: la stânga antetul (serif,
  crem) și formularul într-un sub-card ALB (lizibil, fiindcă își ia culorile din
  tonul deschis „relief" pe care stă contactul), la dreapta datele cabinetului ca
  rânduri etichetă/valoare în serif (`contactCard`). Formularul rămâne Nume +
  Email; numărul cabinetului rămâne apăsabil.
- **Articole** — carduri fără fundal și fără chenar, doar imaginea rotunjită (4/3)
  și textul dedesubt, fără „Citește →" (`blogCurat`), și pe prima pagină, și pe
  `/blog`. DINADINS lăsate afară (ca la Apropiere): pastila de categorie și „min
  citire" — articolele n-au câmp de categorie, iar timpul de citit ar cere cărat
  tot textul la listare. Data rămâne.
- **Antetul** — NU s-a atins: avea deja medalionul rotund cu inițiala
  (`--t-accent`, serif), numele + subtitlul, iar pe ne-friendly bara „lipită" cu
  fundal translucid + blur + linie jos, adică fix `.nav.is-stuck` al referinței.
  Singura diferență e pastila din dreapta: la referință „Programează-te", la noi
  numărul de telefon — alegere de produs veche (telefonul e cea mai vizibilă
  acțiune din antet).
- **Subsolul** — lăsat pe cele patru coloane (decizia din 16 sept., structură
  comună tuturor șabloanelor). Referința are un subsol minimal; a-l reduce doar
  pe Liniște ar strica o hotărâre la nivel de platformă.

**Ritmul închis/deschis: păstrat cel de provizionare, nu cel al referinței**
(decis de proprietar). Referința are Servicii pe fond ÎNCHIS și „Cum lucrez" pe
DESCHIS; seed-ul nostru (comun tuturor șabloanelor) le are INVERS. Puteam face
tratamentele Liniște să-și impună tonul, dar proprietarul a ales să lase ritmul
de benzi neschimbat. Deci pe Liniște: „Cum lucrez" = carduri albe pe verde-închis,
Servicii = carduri-imagine închise pe crem. Amândouă arată bine; plasarea
închis/deschis nu e ca la referință, dinadins.

**Verificat vizual** la 1200px, cu o probă de secțiuni pe date inventate și
placeholder-e GRI (nu colorate — lecția din 16 sept.). Tipuri, lint și cele 218
probe de logică trec (contrastul inclus, fiindcă paleta n-a fost atinsă).

**Stare la 18 sept.:** Liniște e adus vizual la referință, cap la cap. Rămân
neatinse Căldură, Lumină și Claritate. Nimic nu mai e deschis din acest
document.

## De modificat pe șabloane (19 sept. 2026) — al cincilea document, corecții pe Liniște

Proprietarul a arătat, într-un document nou (`Modificari_noi_liniste.docx`),
capturi ALE SITE-ULUI ADEVĂRAT „Dragoș Geamănă" — nu ale mockup-ului offline
din care citisem codul la documentul precedent. Diferența contează: mockup-ul
(un instrument de prototipare cu paletă/font-uri reglabile) nu e neapărat
identic cu ce rulează cu adevărat live, iar la Servicii chiar nu era — vezi mai
jos. **Lecția: o captură a site-ului viu bate citirea din codul unui mockup,
de fiecare dată când vin amândouă.**

Cinci corecții, fiecare cu poza proprietarului alături:

1. **Cercul din hero** — trebuia să fie PESTE poză (nu în spate) și mult mai
   transparent. Mutat în același înveliș tăiat de arcadă, după `SectionImage`
   (se randează deasupra prin ordinea de desenare, fără niciun z-index de ținut
   minte), opacitate coborâtă de la 0,5 la 0,22.
2. **Banda cu servicii** — stătea pe accentul plin (verde), decizie corectă
   pentru șablonul ei de origine (16 sept.), dar greșită pe Liniște: la
   referință banda decorativă stă pe crem, cu cuvinte italice estompate. Steag
   nou `bandaServiciiDiscreta`.
3. **Servicii** — prima variantă (18 sept.) pusese poza pe tot cardul, citind
   din CSS-ul mockup-ului. Pe site-ul ADEVĂRAT, fiecare card e un dreptunghi
   închis cu poza doar ca un MEDALION rotund sus — cerut chiar așa: „același
   ton al culorii și spațiu pentru poze în cerc". Rescris `ServiciiImagine`.
4. **„Cum decurge colaborarea"** — trebuia să arate ca „Cum lucrez" de la
   referință: ton bej, cutii albe, „atât" (fără iconițe, deși referința le
   are). `cumLucrezCarduri` forțează acum tonul la „deschis" necondiționat,
   ignorând tonul secțiunii din bază (venea „închis" de la provizionare).
5. **Blog** — să fie ca la referință; cardurile erau deja aproape acolo (18
   sept.).

**Verificare adversarială, nu doar ochiul meu.** Fiindcă proprietarul spusese
că omisesem părți importante data trecută, după implementare am rulat un
workflow cu 6 agenți independenți: unul a recitit documentul de la zero (text
+ toate cele 6 imagini) și a scos o listă proprie de cerințe, iar câte unul,
separat, a verificat fiecare din cele 5 corecții — comparând pe PIXELI
referința cu rezultatul, nu doar „arată bine". A ieșit exact ce trebuia să
iasă: 2 din 5 confirmate complet (cercul din hero, „Cum lucrez"), 3 cu
diferențe reale, măsurate, rămase după prima trecere:

- steaua din bandă era la ~60% din înălțimea literelor (firavă, fără fontul
  serif) — corectat: aceleași proprietăți de font ca și cuvântul, la `discreta`;
- medalionul de la Servicii era de două ori mai mic proporțional decât la
  referință (39% din card, față de 82%) — corectat: lățime procentuală, nu
  plafon fix în px; inelul avea doar 25% opacitate (aproape invizibil pe
  fundal) — corectat: culoarea „text pe închis" direct, fără amestec; fundalul
  cardului ieșea puțin prea deschis (12% alb amestecat, față de ~5% măsurat) —
  corectat;
- titlul cardului de blog n-avea `fontFamily`, deci cădea pe sans-serif — la
  referință e serif, ca titlul secțiunii de deasupra — corectat; butonul-pastilă
  comun („Toate serviciile"/„Toate articolele") avea săgeata greșită (→ în loc
  de ↗, verificat direct din CSS-ul reținut al referinței) și cercul
  supradimensionat (66% din înălțimea pastilei, față de ~33% la sursă) —
  corectat pe amândouă.

A doua trecere de verificare vizuală (aceleași capturi, după corecții) a
confirmat toate cele trei. Un lucru semnalat de verificare, dar NEadăugat
dinadins: stările de hover din CSS-ul referinței (card care se ridică, poză
care se mărește la trecerea mausului, buton care se inversează) — nu erau
cerute în documentul proprietarului, iar verificarea însăși le-a marcat drept
neconfirmate ca defect, doar semnalate. Rămân de discutat separat, dacă se
dorește.

Tipuri, lint, cele 218 probe de logică și build-ul trec după toate corecțiile.

**Stare la 19 sept.:** toate cele cinci corecții din al cincilea document sunt
făcute și verificate adversarial. Nimic nu mai e deschis din acest document.

### Trei lucruri găsite chiar de proprietar, după merge (19 sept. 2026)

Proprietarul s-a uitat la site-ul lui adevărat (nu la o probă) și a prins mai
multe lucruri pe care verificarea adversarială nu le-a acoperit, fiindcă nu
erau în documentul al cincilea.

**1. Coperta articolului de blog nu se repoziționa niciodată.** Panoul zicea
„Trage de poză ca s-o poziționezi", dar nu se întâmpla nimic — nici în
previzualizarea vie, nici pe site. Cauza: coperta unui articol stă în bază ca
`cover_upload_id`, o referință simplă către `uploads`, nu ca JSONB de secțiune.
Propagarea poziției (`pozitioneazaImagine`, din 11 sept.) rescrie poziția DOAR
în `site_content` — deci coperta unui articol n-a fost niciodată atinsă de ea.
Poziția tot se salva corect pe poză (`uploads.focal_x/focal_y`), doar că nimeni
n-o citea de-acolo pentru un articol. Exact golul notat la 11 sept.: „RĂMÂNE
pentru mai târziu: coperta articolelor de blog". Reparat pe tot firul: tipul
`ArticolListat.coperta` primește `pozitie`; `blog-public.ts` citește
`focal_x/focal_y` la interogarea coperților; `card-articol.tsx` și
`articol-complet.tsx` trec poziția mai departe la `SectionImage`; formularul de
editare (`dashboard/blog/[id]/page.tsx`) citește poziția reală la încărcare, nu
mai pornește mereu din centru. Verificat cu aceeași poză randată la două
puncte focale diferite — cadrul se mută vizibil.

**2. „Păreri" arăta altfel decât „Apariții" — fonturi diferite pe titluri
diferite.** `SectionHeading` (fontul de titlu al șablonului) a fost extras „după
ce tiparul s-a repetat identic în șapte secțiuni" (vezi docstring-ul lui), dar
CINCI secțiuni scrise înainte de extragere, cu antet propriu, n-au fost aduse
niciodată la el: `about-teaser`, `faq`, `how-it-works`, `newsletter`,
`testimonials`. Toate cinci aveau `fontWeight: 700` fără `fontFamily` pe titlu
— cădea pe fontul implicit (sans-serif bold) — în timp ce ACCENTUL din titlu
(span separat) folosea deja corect fontul secundar, deci titlul ieșea cu DOUĂ
fonturi diferite în aceeași propoziție.

Primul reflex a fost s-o corectez pe toate cinci componente necondiționat —
deci pe toate cele cinci șabloane deodată, motivat de faptul că bug-ul exista
la fel peste tot. Proprietarul a respins asta explicit: nu voia ca celelalte
patru șabloane (Căldură, Lumină, Apropiere, Claritate) să se schimbe odată cu
o cerere despre Liniește. Corectat a doua oară, redus strict la Liniește, cu
același tipar de steag folosit peste tot în acest document
(`cumLucrezCarduri`, `blogCurat` etc.): steag nou `titluSerif` în
`TemplateAsezari`, pornit DOAR în `liniste.ts`, trecut prin `render-sections.tsx`
la cele cinci componente. Fiecare titlu ia fontul de titlu al șablonului DOAR
când `titluSerif` e pornit; altfel rămâne exact `fontWeight: 700` fără
`fontFamily`, ca înainte de orice corecție. Verificat vizual: Liniește
(`titluSerif` pornit) are titlurile în serif ca înainte; Căldură (`titluSerif`
absent) a rămas neschimbat — bold sans-serif, exact ca la început. O schimbare
de platformă pe toate cinci șabloane, dacă se dorește vreodată, e o decizie
separată a proprietarului, nu un efect secundar al lucrului pe un șablon.

**3. Previzualizarea din formularul de blog nu arăta repoziționarea.**
Trasul de poză (corecția de la punctul 1) FUNCȚIONA — se salva, se vedea pe
site — dar previzualizarea vie din dreapta formularului (`Cum arată pagina
articolului`) rămânea neschimbată cât timp trăgeai, ca și cum poziția n-ar fi
ajuns niciodată acolo. Cauza era în `editor.tsx`, nu în fluxul reparat la
punctul 1: valoarea live a formularului (`date.coperta`) chiar avea
`pozitie` la fiecare tragere, dar linia care construia obiectul trimis la
`ArticolComplet` pentru previzualizare tăia câmpul (`{ url, altText }`, fără
`pozitie`), deci previzualizarea primea mereu poziția implicită (centru).
Reparat: `coperta` din `editor.tsx` păstrează și `pozitie`, trecută mai
departe la `ArticolComplet`. Verificat cu o pagină de probă temporară care
randează `EditorArticol` cu o poză de test (un cerc marcat STÂNGA și unul
DREAPTA) și punct focal spre dreapta — panoul din stânga (editorul) și
previzualizarea din dreapta arată acum ACELAȘI decupaj, „DREAPTA" vizibil în
amândouă; înainte de reparație previzualizarea arăta centrul.

Toate trei, tipuri/lint/218 probe/build trec.

## Panoul pe telefon (11 sept. 2026)

Cerut de proprietar. Meniul din stânga era fix, 256px, mereu la vedere — pe un
telefon de 390px mânca tot ecranul. Acum, pe ecran lat rămâne cum era, iar pe
telefon se ascunde și se deschide ca un SERTAR dintr-un buton hamburger (se
închide din link, fundal, X sau Escape). Scheletul a fost scos din
`layout.tsx` (rămas server) într-o componentă de client,
`src/components/dashboard/cadru-panou.tsx`, care primește antetul, meniul și
uneltele ca slot-uri. Emailul din antet dispare primul pe telefon. Restul
ecranelor se așezau deja pe o coloană sub `lg:` — blocajul era doar bara din
stânga. Probat vizual la 390px și 1280px.

---

## Decizii confirmate

- **Stack:** Next.js App Router (RSC + Server Actions, **nu REST**), Supabase (Postgres + Auth + Storage + RLS), Tailwind, TypeScript, Vercel. Confirmat din trafic: originalul nu face niciun apel `/api/` — totul server-rendered + Server Actions.
- **Multi-tenant din prima migrare:** `site_id` pe fiecare tabel + RLS de la început, nu retrofit ulterior (retrofitarea e dureroasă și riscantă pe date reale).
- **Rezolvare tenant:** domeniul cererii → `site_id`, printr-un tabel `sites` + middleware.
- **API-uri externe obligatorii pentru MVP:** Supabase; email tranzacțional (Resend recomandat) pentru notificări contact + confirmări programări; anti-spam (hCaptcha — GDPR-friendly ca și Turnstile, dar fără plafon de domenii; vezi §„Anti-spam”) pe formularele publice.
- **Emailul tranzacțional se face ULTIMUL** (confirmat 26 aug. 2026, la cererea proprietarului: „nu am ce email să fac acum”). Contul de trimitere nu există încă. Până atunci, mesajele din formular se văd doar în panou, cu numărul de necitite lângă „Mesaje” — vezi `TODO` din `src/app/actions/formulare.ts`. **Nu propune Resend ca următorul pas**; e ultimul de pe listă, indiferent cât de mult ar ajuta.
- **Pentru scalare (fazele ulterioare):** Vercel Domains API (conectare automată domeniu propriu per client), Stripe (billing).
- **Opționale:** Google Analytics — DOUĂ integrări distincte (tag `gtag` care colectează pe site-ul public vs. GA4 Data API cu service account care citește datele înapoi în dashboard — originalul confundă asta, de evitat); Google Calendar API / Cal.com pentru sincronizare programări; Search Console API.

## Decizii luate în timpul construirii (fazele 2–5)

Ce s-a hotărât pe parcurs, ca să nu fie redeschis din senin:

- **Serviciile au O SINGURĂ pagină detaliată** (`/servicii`), nu câte o pagină
  fiecare. Șase servicii ar fi însemnat șase pagini de scris, multe rămase cu
  trei rânduri — șase pagini slabe arată mai rău decât una bună. Fiecare serviciu
  are totuși ancoră proprie (`/servicii#consiliere`).
- **Un serviciu = un NUME + o DESCRIERE** (10 sept. 2026). Avea două casete de
  descriere, „scurtă" (cartonașul de pe prima pagină) și „completă" (pagina de
  servicii); proprietarul s-a împiedicat de ele la primul lui site — le-a citit
  ca redundante și a turnat conținut de pagină în cartonaș. Acum scrie o singură
  descriere, iar cartonașul își scoate SINGUR rezumatul din primul ei rând
  (`rezumatServiciu`). Coloana `excerpt` rămâne — cartonașul citea din ea — dar o
  umple salvarea, nu clientul. **Serviciile NU au subtitluri:** `##` e oprit de
  tot acolo (`blocuriText(..., { subtitluri: false })` + `CorpText subtitluri={false}`),
  fiindcă proprietarul nu vrea ca clientul să scrie cu `##`; un `##` rămas din
  greșeală se randează ca text simplu, cu diezii scoși. Blog și pagini îl
  PĂSTREAZĂ (texte lungi, unde un zid fără subtitluri obosește). Probă:
  `e2e/servicii-rezumat.proba.mjs`. Lecție de fundal: doi oameni deștepți nu se
  împiedică degeaba de același lucru — a doua confuzie de „care câmp ce face" a
  fost semnalul că o casetă era de prisos, nu că omul n-a citit.
- **Comutatorul blogului stinge TOT blogul** — pagina, articolele și secțiunea de
  pe prima pagină. Spre deosebire de servicii, unde cartonașul se citește întreg
  și fără pagina lui, un cartonaș de articol fără pagina articolului n-ar avea
  unde duce.
- **Paginile au trei locuri**: meniul de sus, subsolul, nicăieri. Implicit
  subsolul — o pagină nouă apare undeva, chiar dacă discret. Adresele rutelor din
  cod (`blog`, `servicii`, `admin`…) sunt refuzate din formular.
- **Fără buton de „înapoi” pe site.** Browserul are deja unul, iar al nostru n-ar
  ști unde duce pe cineva venit din Google direct pe o pagină interioară. Ce
  lipsea de fapt era un meniu care funcționează de pe orice pagină — reparat.
- **Limite în cuvinte, nu în caractere**, la textele lungi: 3.000 la articol, 600
  la descrierea completă a serviciului, 5.000 la o pagină. Opresc scrisul, ca
  cele în caractere. Caracterele rămân doar ca plasă, mult deasupra.
- **Categoriile de blog: amânate.** Un cabinet cu opt articole n-are ce sorta.
- **Numele cabinetului și numele omului sunt două câmpuri, nu unul.** Cabinetul
  se cheamă prin lege „Cabinet Individual de Psihologie <nume>”. Câmpul se
  chema „Numele tău SAU al cabinetului”, iar acel „sau” făcea imposibil de
  spus motoarelor de căutare cine e cine: un `Person` numit „Cabinet Individual
  de Psihologie Maria Ionescu” e o afirmație falsă, iar Google aruncă atunci
  tot blocul, nu doar rândul. Numele omului NU se deduce tăind prefixul —
  merge la cine scrie exact forma aia și iese aiurea la „C.I.P. Maria Ionescu”.
  Acum sunt „Numele cabinetului” și „Numele tău”, iar al doilea e singurul câmp
  din formular care nu se vede pe site (hint-ul o spune din prima).
- **Paginile puse pe „Nicăieri” nu se indexează.** Eticheta din panou îi promite
  clientului „Se ajunge doar cu adresa dată de tine”. Lăsate indexabile,
  promisiunea era falsă: cineva le-ar fi găsit din Google fără ca adresa să-i fi
  fost dată. Lipsesc din sitemap ȘI primesc `noindex` — cele două locuri se
  schimbă împreună.
- **Politica de confidențialitate**: șablon în `sabloane/`, potrivit pe ce face
  chiar site-ul ăsta (formular, hCaptcha, fonturi servite de la noi, zero cookie-uri la
  vizitatori, zero urmărire). Nu e text juridic verificat.

## Ce lipsește și nu era în niciun plan

Găsite căutând în cod, la întrebarea „cât mai e până terminăm”:

- ~~**Nimic nu rulează probele automat**~~ — făcut (28 aug. 2026):
  `.github/workflows/verificari.yml` rulează lint, tipuri, cele 117 probe de
  logică și build-ul, la fiecare push pe `master` și la fiecare pull request.
  Pași separați, ca X-ul roșu să spună CE a picat. Build-ul nu cere niciun
  secret — verificat rulându-l cu `.env.local` mutat deoparte.

  **Prima rulare a picat, și a picat pe bună dreptate**: `tsc` singur nu găsea
  `LayoutProps`, un tip GENERAT de Next în `.next/types/`. Pe mașina de lucru
  exista din build-urile anterioare; pe o clonă curată, nu. Verificarea trecea
  local de săptămâni și ar fi picat la primul om care clona depozitul.
  `typecheck` cheamă acum `next typegen` întâi. Prima zi de CI, primul lucru
  prins — exact ce nu se putea vedea de aici.

  **Nu acoperă**: cum arată site-ul (rămâne verificarea vizuală cu capturi) și
  migrările SQL. `supabase/proba-locala.sh` își pornește singur un Postgres;
  merită adăugat ca al doilea job, dar abia după ce e probat pe runner — un
  workflow stricat care dă roșu pe cod bun strică încrederea în CI din prima zi.
- ~~**Resetarea parolei nu există.**~~ — făcută (10 sept. 2026), pe punte. Vezi
  §„Resetarea parolei". `/login` are acum „Ți-ai uitat parola?"; înainte, un
  client care își uita parola trebuia deblocat manual din Supabase.
- ~~**Provizionarea unui client e SQL scris de mână**~~ — făcut (28 aug. 2026):
  `public.creeaza_client(domeniu, nume, email, sablon, cu_programari)`, o linie
  în SQL Editor. Face rândul din `sites`, leagă contul de login (îl caută după
  email și refuză dacă nu-l găsește), pune cele 13 secțiuni ale paginii
  principale, setările goale și politica de confidențialitate ca ciornă. Ori
  toate, ori niciuna.

  **Doar `hero` și `contact` pornesc vizibile**, restul ascunse. Dinadins:
  site-ul e public din clipa în care domeniul rezolvă, iar un cabinet cu
  paisprezece secțiuni goale arată a defect. Clientul aprinde fiecare secțiune
  pe măsură ce o scrie. Asta acoperă jumătate din golul „site public prea
  devreme” de mai jos, fără ecranul de lansare.

  Refuză: domeniu care există deja, cont inexistent sau deja legat de alt site,
  șablon scris greșit, adresă cu `https://`. `/admin` rămâne o redirectare, iar
  un ecran de administrare tot nu există — vezi mai jos de ce.
- **Domeniul clientului se conectează manual în Vercel.**
- **Un ecran de administrare al platformei nu există.** Modulele plătite se
  pornesc bifând o coloană în editorul Supabase. Ca să fie un buton în aplicație
  trebuie întâi hotărât cum se autentifică proprietarul platformei: azi orice
  cont aparține unui singur site, deci nu există noțiunea de „administrator peste
  toți clienții".
- ~~**Din Faza 4 lipsesc garanțiile SEO**~~ — făcute (27 aug. 2026):
  `sitemap.xml` și `robots.txt` generate din bază per client, `metadataBase` pe
  domeniul clientului, date structurate `LocalBusiness` + `Person` + `FAQPage` +
  `BlogPosting`, cartonaș social desenat din Setări.
- ~~**Din Faza 5, Setările au 2 grupuri din 4**~~ — Social e făcut (27 aug.
  2026): Facebook, Instagram, LinkedIn, YouTube, cu linkuri în subsol și
  `sameAs` în datele structurate. Analytics NU e un grup de setări, ci ecranul
  Vizite — vezi mai jos de ce.

## Ordinea de lansare, hotărâtă de proprietar (27 aug. 2026)

1. **Site-ul proprietarului** — primul, făcut de mână. E primul drum complet
   cap la cap, deci scoate la iveală ce e incomod, pe un site care nu e al unui
   client care plătește.
2. **Site-ul firmei de web design** pe care o deschide — al doilea, pe același
   calapod. După ăsta se știe ce se repetă, deci ce merită automatizat.
3. **Clienții** — abia atunci.

**Există cinci șabloane** (`caldura`, `liniste`, `lumina`, `apropiere`,
`claritate`), iar
clientul ALEGE dintre ele. Nu e nevoie de niciun ecran de ales: omul se uită la
demo-uri, spune care îi place, iar proprietarul scrie cheia în linia de
provizionare. Fiecare șablon nou e un fișier de valori — culori, fonturi,
forme — nu cod de secțiuni.

Toate site-urile rulează din **același repo, același proiect Vercel, aceeași
bază**. Fără clonare per client: asta e chiar diferența față de „template
clonat", iar `site_id` + RLS de la prima migrare există exact ca să nu fie
nevoie.

### Cum dai o adresă unui șablon-demo, ca să fie clicabil (21 sept. 2026)

Ca vizitatorul să apese un cartonaș din galeria de pe `sitepsihologi` și să vadă
șablonul VIU, fiecare demo trebuie să fie un site propriu, la adresa lui. Deja
funcționează pentru două (`cosmin-liniste.vercel.app` → Liniște,
`cosmin-claritate.vercel.app` → Claritate); restul se fac la fel. Doi pași care
trebuie să se potrivească LITERĂ CU LITERĂ:

1. **În platformă (baza):** în `/proprietar` → „Client nou", faci un site cu
   `domeniu` = adresa (ex. `cosmin-caldura.vercel.app`) și `sablon` = șablonul
   dorit. Asta e ce leagă `sites.domain` → `site_id` → șablon (rezolvarea din
   `src/lib/tenant.ts`, prin `normalizeHost` + `sites.domain`; funcția din spate
   e `creeaza_client(p_domeniu, p_nume, p_email, p_sablon, p_cu_programari)`).
2. **În Vercel:** proiect → Settings → Domains → Add → aceeași adresă. Fără pasul
   ăsta, cererea nu ajunge la aplicație. O adresă `.vercel.app` liberă se dă pe
   loc; un subdomeniu al domeniului real (ex. `caldura.sitepsihologi.ro`) cere un
   CNAME la registrar, arătat de Vercel.

**Actualizare 7 oct. 2026:** adresele demo-urilor sunt acum `model-caldura`,
`model-liniste`, `model-lumina`, `model-apropiere`, `model-claritate` (`.vercel.app`),
nu `cosmin-…`. Redenumirea a fost un singur `update` pe `sites.domain` + adresele noi
adăugate întâi în Vercel; vezi §„Unde am rămas". Exemplele de mai sus cu `cosmin-…`
sunt istorice.

**Regula de aur:** adresa din pasul 1 și cea din pasul 2 trebuie să fie identice.
Dacă diferă, Vercel primește cererea dar platforma nu știe ce site să arate.

**Capcana notată la §izolare:** dacă „două șabloane" arată la fel, aproape sigur
`DEV_TENANT_DOMAIN` a rămas pornit pe Production — pinuiește orice `*.vercel.app`
la un singur site. Se scoate (redeploy după), și fiecare adresă revine la site-ul
ei. Verificarea „fiecare adresă deschide șablonul corect" se face înainte de a
lega butoanele din galerie.

Odată ce adresele merg, se leagă galeria: fiecare cartonaș din secțiunea de
șabloane (secțiunea `portfolio`, care are deja `buton { text, href }` și
`imagine` per element) primește `href` = adresa demo-ului și captura reală în
locul desenului SVG. Nu cere cod nou — e conținut, editat din panou.

## Ce se predă clientului (28 aug. 2026)

Hotărât de proprietar: **se predă un site GOL, iar clientul își pune singur
textele și pozele.** Proprietarul face doar instructajul. Nu scrie conținut în
locul lui, nici la primul client.

Consecința, care schimbă ce merită construit: **panoul E produsul.** Nu e o
unealtă secundară lângă un site făcut manual — e singurul lucru prin care
clientul își face site-ul. Orice loc în care se împotmolește devine un telefon
la proprietar, iar la 40 de clienți asta e diferența dintre o afacere și o
slujbă de suport.

De aici, trei lucruri urcă în prioritate față de cum erau socotite:

1. **Ecranul „Pregătit de lansare”** nu mai e doar argument de vânzare. E
   lucrul care îi spune clientului *„gata, ai terminat”* fără să te întrebe pe
   tine. Fără el, fiecare client te sună să te întrebe dacă mai are ceva de
   făcut.
2. **Textele din panou** trebuie să fie de sine stătătoare. Regula „descriu ce
   SE VEDE, nu cum se cheamă” din CONVENTII.md devine obligatorie, nu
   preferabilă: nu mai există cineva lângă client care să traducă.
3. **Resetarea parolei** e obligatorie înainte de primul client. Un om care își
   scrie singur site-ul intră în panou de zeci de ori în prima lună.

**Site-ul pornește cu TOATE secțiunile aprinse**, iar clientul le scoate pe cele
care nu i se potrivesc. Hotărât de proprietar, corectând o alegere de-a mea.
**Făcut pe 1 sept. 2026**, împreună cu comutatorul de lansare — vezi secțiunea
lui mai jos.

Motivul lui e bun: un client care vede o listă de secțiuni stinse nu știe ce-i
oferă produsul, mai ales fără cineva lângă el. Văzându-le pe toate, înțelege ce
poate avea și taie ce nu-i trebuie.

**Dar asta face comutatorul „încă nu e lansat” obligatoriu, nu opțional.**
Site-ul e public din clipa în care domeniul rezolvă. Cu toate secțiunile
aprinse și goale, un vizitator — sau Google — poate nimeri peste un cabinet
care arată neterminat. Cât timp secțiunile porneau stinse, lipsa comutatorului
era doar neplăcută; acum e o gaură. Ordinea corectă e: întâi comutatorul, apoi
aprinderea tuturor secțiunilor. **Amândouă făcute pe 1 sept. 2026**, în același
commit, tocmai fiindcă nu se puteau despărți.

**Instructajul e un videoclip**, trimis clientului, nu o ședință. Sună doar
dacă nu se descurcă cu el. Două lucruri decurg de aici:

1. **Textele din panou sunt singurul ajutor din momentul acela.** Nu mai există
   cineva de întrebat la mijloc.
2. **Videoclipul se învechește la fiecare schimbare de panou.** Deci nu se
   înregistrează până nu ne oprim din schimbat ecranele — altfel se refilmează
   sau, mai rău, arată altceva decât vede clientul.

Ordinea de lucru convenită: resetarea parolei, apoi adresa temporară de
platformă (ca să nu stea blocat pe dinafară cât se răspândește DNS-ul). Cu
observația de mai sus, comutatorul de lansare le devine tovarăș.

## Fără câmpuri de text liber pe formularele publice (28 aug. 2026)

Hotărât de proprietar, după ce a văzut că trei dintre riscurile mari sunt
legale și țin toate de același lucru: **produsul ÎNTREABĂ oamenii ce-i doare.**

Se scot amândouă câmpurile de text liber:

- `mesaj` din formularul de contact — care devine „lasă-mi numele și numărul,
  te sun”;
- `note` din formularul de programare („Vrei să adaugi ceva?”).

Formularul scurt de pe prima pagină e deja așa: doar nume și telefon.

**Ce se câștigă, exact.** Contractul de prelucrare rămâne obligatoriu —
numele și telefonul sunt tot date personale. Ce se schimbă e CATEGORIA: datele
despre sănătate devin întâmplare, nu proiectare. Cineva tot poate scrie „am
depresie" în câmpul de nume, dar asta e altceva decât un produs care întreabă.
Scade mult paguba la o eventuală scurgere, iar păstrarea și ștergerea devin
simple.

**Ce se pierde, și proprietarul a acceptat conștient.** Publicul final sunt
exact oamenii pentru care e mai ușor să scrie decât să sune. Cineva cu
anxietate socială poate să nu dea niciun telefon, dar ar fi scris trei rânduri.
E o alegere de produs, nu una juridică, iar el a ales curățenia.

**De ținut minte la implementare:** coloanele rămân în bază (`contact_messages.
message`, `appointments.notes`), pentru mesajele deja primite. Se scot doar din
formulare și din acțiuni. Ștergerea coloanelor e altă discuție, cu backup
înainte.

**EXCEPȚIE: pagina de vânzare (9 oct. 2026, hotărârea proprietarului).** Pe
sitepsihologi.ro — și NUMAI acolo — formularul de contact are telefon (opțional),
„Modelul preferat" (listă) și mesaj (opțional, text liber). Motivul: acolo nu
scriu pacienți despre sănătatea lor, ci psihologi despre un site; datele de
sănătate, pentru care s-a scos textul liber, nu sunt subiectul conversației.
Excepția atârnă de marcajul `sites.tip = 'vanzare'` (migrarea
`pagina_de_vanzare`), pus doar din SQL; clientul nu-l poate schimba, iar o clonă
pornește ca `cabinet`. Hotărârea o ia SERVERUL din marcaj, nu formularul — un
cabinet care primește totuși `telefon`/`mesaj` (de la un bot) le ignoră.
Pe site-urile de cabinet regula de mai sus rămâne neschimbată: fără text liber.
*(„Fără telefon" a căzut pe 14 oct. 2026: telefonul e iar în formularul de contact, ca
opțional, pe toate site-urile. Textul liber și modelul preferat rămân doar pe pagina de vânzare.)*

## Estimare de efort (corectată)

Lucrând activ cu Claude generând codul (nu un dev scriind manual):

| Bloc | Estimare |
|---|---|
| Nucleu CMS + site public (ca originalul, single-tenant) | ~1–1,5 săpt. |
| + Multi-tenant / RLS | +2–4 zile |
| + Guardrail-uri SEO + Launch Readiness | +3–5 zile |
| + Programări | +3–5 zile |
| + Onboarding self-serve | ~1 săpt. |
| **Total MVP multi-tenant** | **~3–4 săpt.** |
| **Total cu onboarding self-serve** | **~5–6 săpt.** |

Important: e timp de lucru concentrat, nu calendaristic. Bottleneck-ul real nu e viteza de scris cod — e disponibilitatea pentru decizii, review, testare, și furnizarea de conținut/designuri.

## Propunerea de produs — ce facem diferit față de original

**Diferențiator central:** editare cu **previzualizare live** (split-screen: formular stânga, site real dreapta, actualizat live) — nu „completezi câmpuri → Save → View live” ca în original.

**7 fixuri de usabilitate:** limbaj de client nu jargon de dev (Hero → „Prima secțiune”); selector de variantă cu **miniaturi vizuale**, nu descrieri text; gardă de modificări nesalvate; ConfirmDialog + avertisment „imagine folosită în N locuri”; cod mort scos (Tiers legacy, Portfolio nefolosit); model de publicare unificat (inclusiv About); reordonare + vizibilitate secțiuni dintr-un ecran vizual.

**3 module noi:** Programări (calendar + booking public + email — numit în ambele audituri „singurul lucru care schimbă produsul”); wizard de onboarding cu template-uri per profesie; branding ca date (culori/fonturi/logo per client, fără fork de cod).

**Moat față de „template clonat per client”:** guardrail-urile din audit devin **imposibil de greșit prin design**, nu un checklist manual:
- `metadataBase`/canonical/sitemap/robots derivă automat din domeniul tenantului (originalul avea totul pe `localhost` → carduri sociale rupte + zero indexare Google).
- Sitemap + slug-uri generate din DB, sursă unică (originalul avea 3 surse de adevăr desincronizate → 404-uri interne).
- Conținut demo (`is_demo`) **blochează publicarea**, nu doar afișează un avertisment.
- Date de contact placeholder detectate automat, blochează publicarea.
- Testimoniale cer bifă „acord scris obținut” înainte de a fi vizibile (problemă deontologică reală în original: mărturii fabricate sub numele unui psiholog acreditat).
- Toate imaginile prin `next/image` (originalul servea Unsplash la 1600px pe mobil).
- Date structurate `LocalBusiness`+`Person`+`FAQPage` auto-generate.

**Ecran nou: „Pregătit de lansare”** — semafor per site; butonul „Publică” e blocat până toate condițiile de mai sus sunt verzi. Ăsta e argumentul central de vânzare.

## Următorul pas planificat

**Stare la 26 aug. 2026.** Panoul e complet pe partea de conținut: Pagina
principală (secțiuni cu previzualizare vie), Servicii, Blog, Pagini, Mesaje,
Imagini, Setări. Site-ul public are prima pagină, `/servicii`, `/blog`,
`/blog/<articol>` și paginile proprii ale clientului la `/<adresă>`.

Ordinea de mai jos e cea confirmată de proprietar, nu o preferință tehnică.

**1. Două verificări înainte de primul client real.** Amândouă cer acces la
Vercel și Supabase, deci le face proprietarul, nu sesiunea de dezvoltare:

- ~~`DEV_TENANT_DOMAIN` NU trebuie să existe în variabilele de Production~~ —
  **scoasă de proprietar pe 8 sept. 2026**, cu redeploy, și dovedit: adresa
  `.vercel.app` a proiectului arată acum pagina „Platformă sitepsihologi.ro",
  varianta care apare DOAR când platforma s-a uitat la adresa venită așa cum a
  venit. Rămâne pusă pe Preview și Development, unde își face treaba.

  Era o scurtătură de dezvoltare: setată pe Production, orice cerere către gazda
  platformei (`*.vercel.app`) se rezolva la un singur client — vezi
  `src/proxy.ts`. Se bătea cap în cap și cu planul de a ține site-ul de vânzări
  pe o adresă `.vercel.app`.
- Izolarea între clienți trebuie dovedită, nu presupusă. `e2e/tenant-rls.spec.ts`
  n-a rulat niciodată (mediul de dezvoltare nu ajunge la Supabase). Aceeași
  verificare există acum și ca SQL de lipit în SQL Editor:
  `supabase/verificare-izolare.sql`. Rulat pe baza reală la 26 aug. 2026 — trecut.
  Verifică toate cele 12 tabele per client, nu doar `site_content`.

**Bancul de probă local.** `supabase/proba-locala.sh` pornește un Postgres gol,
rulează migrările în ordine, seedează doi clienți și rulează verificarea. Există
fiindcă mediul de dezvoltare nu ajunge la Supabase, iar fără el au plecat de
două ori scripturi SQL netestate. Orice migrare nouă trece pe aici întâi.

**2. ~~Programări~~** — făcut (27 aug. 2026), ca **modul opțional, contra
cost**. Rezerva din audit rămâne valabilă și e chiar motivul pentru care e
opțional: multe cabinete mici preferă telefonul, fiindcă vor să audă omul
înainte de prima ședință. Cine nu-l cumpără vede în panou doar ce face și cum
se pornește.

Ce s-a construit: programul de lucru per zi (`/dashboard/programari`), lista de
cereri cu confirmă/refuză, pagina publică `/programare` unde vizitatorul își
alege o oră liberă dintr-un **calendar pe luni** (prima variantă înșira zilele
ca butoane cu data scrisă în fiecare — la treizeci de zile ieșea un zid de text
din care nu se vedea nici ziua săptămânii, nici de ce lipsesc unele; zilele fără
ore rămân acum scrise, doar stinse), și **secțiunea „Programare online”** de pus
pe prima pagină, lângă Contact.

Secțiunea nu mai e o vitrină cu link: **ora se cere de acolo, din același
calendar.** Se deschide în trepte — calendar, orele zilei alese, iar formularul
scurt (numele și telefonul) abia după ce s-a ales o oră. Asta e și ordinea în
care se hotărăște omul; cerut de la început, numele ar fi făcut secțiunea să
arate a formular de completat, nu a oră de ales. Pagina întreagă rămâne pentru
cine intră direct pe ea din meniu sau vrea să scrie mai mult.

Pe prima pagină se cer **numele și telefonul**, amândouă. Prima variantă cerea
doar numele; telefonul a devenit obligatoriu la a doua trecere, când s-a văzut
ce înseamnă altfel — o cerere care blochează o oră fără să lase pe nimeni de
sunat.

Regula care leagă cele două formulare e una singură: **fiecare cerere pleacă cu
măcar o cale prin care psihologul poate răspunde.** CARE anume depinde de
formular — pe `/programare` emailul (telefonul e în plus), pe prima pagină
telefonul (email nu există acolo). Stă în `eroriDeContact`, rupt de acțiune ca
să poată fi probat, fiindcă e exact ce se uită prima când se mai adaugă un
formular. Ce cere serverul se și scrie lângă câmp: o etichetă „obligatoriu” pe
care serverul n-o susține e o minciună care se descoperă abia la trimitere.

Se uită la PREZENȚA câmpului (`formData.has("email")`), nu la valoarea lui:
câmpul gol și câmpul lipsă sunt lucruri diferite. Coloana `appointments.email` a
rămas fără `not null` din același motiv — un șir gol ar fi devenit în panou un
`mailto:` care nu duce nicăieri.

Linkul intră în meniul site-ului doar dacă modulul e pornit
ȘI clientul a bifat măcar o zi — un cabinet care tocmai a cumpărat modulul n-are
ce oferi până nu-și scrie programul.

**Fără email, prin decizia despre Resend.** Cererea apare în panou, cu emailul și
telefonul omului ca linkuri pe care se apasă; clientul răspunde el. Când vine
Resend, aici se leagă confirmarea automată.

Până atunci, singurul lucru care spune că a venit ceva e **numărul de lângă
„Programări” în meniu** — aceeași mecanică folosită de „Mesaje”, cu aceleași
două condiții ca pe ecran: cerere fără răspuns ȘI ora încă n-a trecut. Un număr
care n-are cum să ajungă la zero ar fi învățat clientul să-l ignore. Rămâne
totuși ceva ce se vede doar dacă psihologul deschide panoul; emailul e singurul
care ajunge la el fără să caute.

**Motivul programării** — *SCOS pe 15 oct. 2026 (vezi „Motivul programării a fost SCOS", sus);
ce urmează e istoria lui.* Era o listă închisă cu două intrări — „Evaluări
psihologice" și „Altceva” — și opțională (hotărât de proprietar, 27 aug. 2026).
Înainte se umplea din serviciile publicate ale cabinetului, dar cine cere o
primă ședință n-are de unde ști ce fel de ședință îi trebuie. Lista e verificată
și pe server: un `select` cu două intrări e altfel un câmp liber deghizat, iar
ce s-ar scrie acolo ar ajunge neatins în panou. De ținut minte că e aceeași
listă pentru toți clienții platformei: al doilea cabinet care nu face evaluări
va cere s-o poată schimba, iar atunci locul ei e în Setări.

Orele libere se calculează în `src/lib/programari.ts`, rupt de bază ca să poată
fi probat: durata plus pauza dau pasul, ultima ședință trebuie să se TERMINE
până la ora de închidere, preavizul taie ce e prea aproape, iar o oră ocupată
scoate tot ce se SUPRAPUNE cu ea, nu doar ora identică. Peste schimbarea orei de
vară, „luni la 10” rămâne 10 pe ceas — are teste pe ambele treceri din 2026.

**Două plafoane** (28 aug. 2026), fiindcă opresc lucruri diferite: cel pe oră
(10 per cabinet) mărginește volumul, cel pe persoană (2 cereri nerezolvate de la
același număr) mărginește ce poate ține blocat cineva anume. Fără ele, oricine
putea cere una după alta toate orele libere pe o lună — nu furt de date,
sabotaj, și ieftin. Dinadins NU există plafon pe totalul cererilor nerezolvate
ale unui cabinet: ar fi pedepsit pacienți adevărați pentru neatenția
psihologului, care fără emailuri poate strânge zece cereri necitite fără să fie
nimeni de vină.

Două cereri venite în aceeași secundă pentru aceeași oră: verificarea din
aplicație le lasă pe amândouă să treacă, fiindcă niciuna nu e încă scrisă.
Indexul unic `(site_id, starts_at)` pe cererile vii e singurul loc unde „ocupat”
chiar înseamnă ocupat.

**3. ~~Activitate~~** — făcut (27 aug. 2026), `/dashboard/activitate`. Rândurile
sunt grupate pe zile („Azi”, „Ieri”, apoi data), cu ora în fusul României — nu
timp relativ, fiindcă un „acum două ore” calculat pe server minte după ce pagina
stă deschisă o oră. Numele celui care a făcut modificarea apare doar când NU e
cel care se uită: pe un cabinet cu un singur cont, altfel fiecare rând ar repeta
același email. Aproape toate acțiunile își scriu singure rezumatul; pentru cele
care nu, propoziția se compune din acțiune și entitate, cu acordul corect
(`descrieIntrarea` din `src/lib/activitate.ts`).

**4. Fonturile, mutate de la Google pe serverul nostru** — de discutat cu
proprietarul (cerut 27 aug. 2026). **REZOLVAT pe 1 sept. 2026.**

Era: fiecare site public cerea o foaie de stil de la `fonts.googleapis.com`, iar
aceea cerea fișierele de la `fonts.gstatic.com` — deci Google trebuia scris în
politica de confidențialitate a fiecărui client, iar prima afișare aștepta o
cerere externă. Fonturile PANOULUI erau deja curate (`next/font/google` din
`src/app/layout.tsx` descarcă la build); problema era doar la șabloane.

Acum toate șase fonturile șabloanelor (Manrope, DM Sans, Inter, Nunito,
Cormorant Garamond, Caveat) trec prin `next/font/google`, în
`src/lib/templates/fonturi.ts`. Verificat pe build: 45 de fișiere `.woff2`
servite de la noi, zero pomeniri de Google în ce ajunge la browser.

Trei lucruri care se puteau rata:

- **`latin-ext`.** Fără el, ă, â, î, ș și ț nu sunt în font și cad pe fontul de
  sistem — pe un site românesc, jumătate din cuvinte scrise cu alte litere decât
  cealaltă jumătate. În engleză totul ar fi arătat perfect. Verificat în CSS-ul
  construit că intervalul `U+100-2BA` (care conține Ă, Ș, Ț) chiar e acolo.
- **Opțiunile se repetă la fiecare font**, deși sunt aceleași. `next/font` le
  citește din cod la compilare: un obiect comun împrăștiat cu `...` oprește
  build-ul cu „Font loader values must be explicitly written literals”.
- **Cursivele pentru Cormorant Garamond** se cer explicit. Fără ele, browserul ar
  fi înclinat singur literele drepte — „faux italic”, care la o serifă se vede.

Previzualizarea din panou nu mai primește o adresă de fonturi: iframe-ul copiază
oricum toate foile de stil ale paginii, iar `next/font` pune `@font-face` chiar
în ele.

**5. Alte restanțe mici**: imagine per serviciu; categorii de blog (de făcut
abia când un cabinet chiar are atâtea articole încât să nu le mai găsească).

**6. Emailul cu Resend** — ultimul, prin decizie explicită. Vezi „Decizii
confirmate".

## Plăți cu cardul (Netopia) — de luat în calcul din timp

Ridicat de proprietar pe 27 aug. 2026, ca lucru sigur, nu ca ipoteză. Nu se
construiește nimic acum; se scrie aici ca să nu luăm între timp decizii care
îl blochează.

**Sunt DOUĂ cazuri, complet diferite, iar confundarea lor e capcana:**

**A. Psihologul încasează de la pacienții lui** — plata ședinței în avans, pe
site-ul lui. Aici **fiecare client are nevoie de contractul LUI cu Netopia**:
firmă, cont bancar, aprobare de la ei. Nu e o bifă, e o procedură comercială de
zile, nu de minute. Adică exact opusul promisiunii „dintr-un clic” de la
modulul Programări — de spus asta la vânzare, nu de descoperit după.

Tehnic, cazul ăsta cere ceva ce azi nu avem deloc: **secrete per client în
bază** (cheile de comerciant ale fiecărui cabinet). Ele nu pot fi citite de
sesiunea clientului, nu pot ajunge în pachetul de browser, și trebuie
criptate. Azi singurele secrete sunt ale platformei și stau în variabile de
mediu. E o clasă nouă de risc, nu o coloană în plus.

**B. Noi încasăm de la clienți** — abonamentul pentru site și pentru modulele
plătite. Aici e **un singur cont Netopia, al nostru**, cu cheile în variabile de
mediu. Zero configurare per client. Ăsta e cazul care face afacerea să meargă
și e mult mai simplu decât A.

**Ce e comun amândurora**, și unde se greșește de obicei: plata se face prin
redirectare către pagina lor, iar confirmarea vine înapoi ca un apel de la
Netopia către un URL public al nostru. **Acel apel trebuie verificat prin
semnătură.** Fără verificare, oricine îi știe adresa poate spune „s-a plătit”.
URL-ul e unul singur, al platformei, și află din datele plății la ce site și la
ce comandă se referă — asta se potrivește cu modelul nostru.

De pregătit oricum, indiferent de caz: un tabel de plăți cu `site_id`, cu
stările prin care trece o comandă (inițiată → plătită → eșuată → rambursată).
Cererile de programare au deja o coloană de stare, deci „plătită” se adaugă
acolo fără să se rescrie nimic.

**Stare: AMÂNAT (27 aug. 2026).** Proprietarul s-a gândit la cazul A — plata
pe site-ul clienților care o cer — apoi a lăsat-o pentru altă dată: „mi se pare
că ne-am complica mult dacă am oferi și asta". Judecată bună, iar complicația e
aproape toată în afara codului. **Nu propune plățile ca următorul pas.** Analiza
de mai jos rămâne scrisă pentru când se reia discuția.

Ce ar însemna cazul A, dacă se reia:

- **Banii merg direct la client, nu prin noi.** Bine așa: dacă ar trece prin
  conturile noastre, am fi intermediar de plată, adică altă categorie legală cu
  totul.
- **Nu e „dintr-un clic”.** Clientul își face singur contractul cu Netopia
  (firmă, cont bancar, aprobarea lor). Noi primim cheile lui și le punem.
  Promisiunea corectă e „îmi trimiți cheile, ți-l pornesc”, nu „îl bifez”.
- **Cheile lui sunt secrete care ating bani.** Azi n-avem niciun secret în bază.
  Astea cer criptare, imposibilitate de citire din sesiunea clientului, și zero
  prezență în pachetul de browser. Se face o dată, dar cu grijă.

**Întrebările de răspuns înainte de cod, care nu sunt tehnice:** plata e
obligatorie ca să se poată programa, sau opțională? Ce se întâmplă la anulare —
se returnează, integral sau parțial? Cine emite documentul fiscal (clientul, dar
trebuie să știe că trebuie)? Iar pentru un cabinet de psihologie: plata în avans
schimbă relația cu cineva la prima ședință, deci unii o vor și alții nu — de-aia
e modul, nu regulă.

Detaliile de protocol se citesc din documentația lor la momentul construirii,
nu din memorie.

## Module plătite: cum se pornesc, și de ce așa

Un modul care se vinde nu poate fi pornit de cel care ar trebui să-l plătească.
Comutatoarele din `site_settings.pagini` (blog, servicii) sunt ale clientului;
astea sunt ale noastre.

Stau ca **o coloană booleană pe `sites`** (`appointments_enabled`), nu ca un
`jsonb`, din două motive practice:

1. **Se apasă.** În editorul de tabele din Supabase, un boolean e o bifă. Un
   `jsonb` ar cere scris JSON de mână la fiecare client, adică exact ce NU e
   „dintr-un clic”.
2. **Se apără singură.** `sites` are deja drept de scriere pe coloane, nu pe
   tabel — `grant update (name)` din migrarea de întărire. Orice coloană nouă
   de acolo e, prin construcție, inaccesibilă clientului. N-avem de scris nicio
   politică nouă, deci n-avem nici unde greși.

Prețul: un modul nou e un `alter table` de un rând.

Implicit OPRIT — pe dos față de `pagini`, unde lipsa valorii înseamnă pornit.

**Cum pornești un modul:** Supabase → Table editor → `sites` → bifezi
`appointments_enabled` pe rândul clientului. Un ecran de administrare al
platformei nu există încă (`/admin` e doar un alias pentru client), fiindcă
n-am hotărât cum se autentifică proprietarul platformei — vezi „ce lipsește”.

**Cele patru șabloane sunt construite** (28 aug. 2026): `caldura`, `liniste`,
`lumina`, `apropiere`. Clientul alege în discuție, iar cheia se scrie în coloana
`sites.template` — nu există (și nu trebuie) niciun ecran de ales șabloane.
Contrastul fiecăruia e verificat automat; detaliile în
`design/sabloane/README.md`.

Bifa aceea face singură și restul: un trigger pe `sites` adaugă rândul secțiunii
„Programare online” în `site_content`, la coada paginii principale. A trebuit,
fiindcă panoul n-are flux de „adaugă secțiune” — rândurile vin seedate la
provizionare, așa că un tip nou de secțiune n-avea cum să ajungă pe un site care
există deja. Clientul o găsește apoi în „Secțiuni”, de mutat unde vrea. Cât timp
n-are nicio zi bifată în program, secțiunea nu se randează pe site: o invitație
la programare fără nicio oră liberă e mai rea decât nimic.

## Migrările intră în CI (8 sept. 2026)

Până azi, CI verifica lintul, tipurile, probele de logică și build-ul. **Nu
verifica migrările** — singura probă că o migrare se aplică era că-mi aminteam
eu s-o rulez pe bancul local. Scris ca lipsă chiar în fișa de riscuri: „proba aia
nu rulează automat, ci doar dacă mi-o cer eu."

Contează mai mult decât pare: migrările se rulează de MÂNĂ, pe baza reală a
tuturor clienților. E singura operație din tot sistemul care lovește pe toată
lumea deodată și nu se poate da înapoi. Chiar azi o migrare a plecat cu două
lucruri rupte — o constrângere de tabel scrisă în altă migrare și un mesaj de
eroare care mințea — găsite abia fiindcă am rulat-o.

Job separat, `migrari`, fără Node și fără build: rulează în paralel, iar X-ul
roșu spune limpede că problema e în SQL. Instalează Postgres doar dacă lipsește
din imaginea GitHub — de obicei pasul nu face nimic, dar în ziua în care imaginea
se schimbă salvează verificarea în loc s-o rupă.

**Schimbarea care contează cel mai mult e în banc, nu în CI.** `proba-locala.sh`
doar TIPĂREA tabelul de verificări și ieșea cu 0, chiar dacă una dădea PICAT.
Adică se sprijinea pe cineva care se uită atent la treisprezece rânduri — merge
când rulezi o dată, nu merge deloc într-un CI unde nimeni nu se uită dacă scrie
„verde". Acum iese cu 1 și numește verificarea căzută.

`NECONCLUDENT` cade la fel ca `PICAT`, dinadins: o verificare care n-a putut
decide nu e o verificare trecută. S-a întâmplat deja o dată — a zecea verificare
trecea fiindcă rula cu rolul greșit, nu fiindcă apărarea ținea.

Probat în ambele sensuri: cu totul în regulă iese cu 0; cu o migrare care
redeschide bucket-ul, iese cu 1 și scrie care verificare a picat.

## Al cincilea șablon: „Claritate" (8 sept. 2026)

Cerut de proprietar pentru site-ul de vânzări: fond alb, profesionist. Niciunul
dintre cele patru nu era — toate sunt portări fidele ale unor site-uri de
psihologi reali, și toate calde: crem `#F8F1EA`, nisip `#F3EDE2`, lavandă
`#F1F5FD`, crem `#F4EDE2`.

„Claritate" e primul care NU vine dintr-o sursă măsurată. Alb adevărat
(`#FFFFFF`), fiecare gri cu o urmă de albastru (un gri neutru lângă alb pur
arată murdar), colțuri de 6px în loc de 24, butoane drepte în loc de pastile.
Inter și pentru text, și pentru accente — două fonturi diferite ar fi adus
căldură pe ușa din dos; accentul se deosebește prin GREUTATE (titlu 700, cuvânt
accentuat 300), nu prin cursive, care într-un sans dau aer de scrisoare.

Folosește și clienților, nu doar nouă: cine face evaluare psihologică, expertize
sau psihologia muncii n-avea ce alege dintre patru fundaluri calde.

### Lecția: aceeași listă în TREI locuri, iar al treilea nu se vede

Un șablon nou trebuie trecut în:

1. `TemplateId` și `TEMPLATES`, în cod;
2. verificarea `p_sablon not in (…)` din `creeaza_client`;
3. **constrângerea `sites_template_check` din tabel** — scrisă în migrarea din
   26 aug. 2026 și invizibilă din primele două.

Plus mesajul de eroare al funcției, scris separat de lista pe care o verifică,
deci liber să mintă.

Le-am găsit pe ultimele două **rulând**, nu citind: funcția accepta deja
`claritate`, iar `insert`-ul pica pe constrângere. `e2e/sabloane-sql.proba.mjs`
verifică acum toate trei listele plus mesajul, față de cod.

## Site-ul de vânzări al platformei (1 sept. 2026)

Hotărât de proprietar: **`sitepsihologi.ro` se face CU panoul nostru**, ca orice
alt client. E și cea mai bună probă posibilă — dacă nu putem face site-ul nostru
cu el, nu-l putem vinde.

Prețurile se scriu pe față: **300 € o dată (configurarea și primul an de găzduire),
apoi 50 €/an din anul 2** — așa scrie proprietarul pe site-ul viu (captura lui
din 7 oct.; până atunci, 60 €/an).
**Domeniul NU e inclus** — schimbat pe 7 oct. 2026, vezi mai jos.

Corectat pe 8 sept. 2026, de proprietar. Nota de aici a rămas o săptămână la
varianta abandonată („apoi 200 lei/an"), în timp ce site-ul spunea deja 60 €.
Documentul ăsta e primul citit la fiecare sesiune nouă, deci o cifră greșită
aici nu stă degeaba: se repetă.

### Ce vindem: construire + găzduire, fără domeniu (7 oct. 2026)

Hotărât de proprietar: **clientul își cumpără și își plătește singur domeniul.**
Noi construim site-ul, îl găzduim pe Vercel, cu securitatea Vercel, și facem
mentenanța. Până azi nota de mai sus spunea „primul an și domeniul incluse… cu
domeniul inclus în fiecare an", iar site-ul de vânzări promite încă, în patru
locuri, că domeniul e „cumpărat și reînnoit de mine, pe numele tău" (vezi lista
de sarcini, B.7). Proprietarul credea că hotărârea e deja scrisă aici; nu era —
scria invers. **Prețul anual a coborât apoi la 50 €** (scris de proprietar pe
site, în aceeași zi).

**„Securitatea Vercel", ce înseamnă de fapt** (verificat în documentația lor, 7
oct.): lacătul `https`, pus și reînnoit automat la legarea domeniului, și
protecție automată împotriva atacurilor care încearcă să doboare site-ul cu
trafic (DDoS), pe toate planurile. Restul securității e a NOASTRĂ, nu a lor:
clienții despărțiți între ei (RLS), fișierele private, anti-spamul, zero
cookie-uri.

**Urmări ale domeniului cumpărat de client:**
- trebuie îndreptat spre Vercel din contul LUI de la firma de domenii (două
  înregistrări DNS); un psiholog rar face asta singur — ori dă acces, ori se face
  împreună, la telefon;
- dacă uită să-l reînnoiască, site-ul dispare de pe adresa lui. De scris în
  contract că reînnoirea e a lui;
- emailul pe domeniu (`contact@cabinet.ro`) nu e al nostru: îl face el, la firma
  de domenii sau la un furnizor de email.

**Dacă clientul nu mai plătește anul (8 oct. 2026):** proprietarul scoate site-ul
din Vercel, din tot. Rămân deschise, de hotărât și de scris în contract: (1) ce
primește clientul ÎNAINTE (avertisment, termen) și dacă i se lasă un acces doar de
export câteva zile după — fără panou, „textele le descarci oricând" nu mai e
adevărat după oprire; (2) cât păstrăm datele lui în bază și când se șterg
(GDPR). Până atunci, pe site nu se promite că „textele rămân ale tale" fără
„cât ești client".

**Mentenanța — propunere, NECONFIRMATĂ de proprietar.** Cuvântul îl înțelege
fiecare altfel; un psiholog poate citi în el „îmi schimbă el textele când îi cer".
De-aia pe site s-ar scrie lucrurile, nu cuvântul:
- actualizări și reparații — un singur cod pentru toate site-urile, deci ce se
  repară ajunge la toți deodată, fără ca vreun client să instaleze ceva;
- copii de siguranță zilnice — DOAR după trecerea pe Supabase Pro (vezi A.2);
- ajutor când se împotmolește în panou — de hotărât de proprietar. Fraza
  „Dacă te împotmolești, mă suni" e în textul turnat la început pe sitepsihologi
  (`continut.ts`, „Cum decurge" → „Scrii textele și pui pozele"); dacă mai e pe
  site-ul viu nu se știe, iar proprietarul n-o recunoaște ca promisiune a lui;
- politica de confidențialitate ținută la zi când se schimbă platforma (oricum
  datorată — §„Politica de confidențialitate se schimbă odată cu platforma").

NU intră: schimbatul textelor și pozelor la cerere (modelul e că le scrie
clientul — §„Ce se predă clientului"), domeniul, emailul pe domeniu, o garanție
că site-ul nu cade niciodată.

### Tabelul comparativ din „Pachete" — doar sitepsihologi (7 oct. 2026)

Cerut de proprietar, cu codul și textele LUI: în dreapta pachetului, un tabel
„sitepsihologi.ro / Platforme DIY / Agenții Web" cu șase rânduri. **Textele sunt
ale lui, cuvânt cu cuvânt, și stau în cod** (`tabel-comparativ.tsx`), nu în panou —
așa a cerut. O primă propunere a mea le rescria; a respins-o pe bună dreptate: mi
se ceruse o părere, nu alte texte.

**Doar pe sitepsihologi**, prin `variant = 'comparatie'` pe rândul „Pachete" (ca
„vitrina" și „linie"); panoul nu scrie `variant`, deci niciun client nu-l vede.
Se pornește o dată, din Supabase → SQL Editor. Cu `returning`, editorul arată
rândul schimbat (`pricing | comparatie`); dacă nu arată niciun rând, domeniul nu
s-a potrivit:

```sql
update public.site_content
set variant = 'comparatie'
where site_id = (select id from public.sites where domain = 'sitepsihologi.vercel.app')
  and key = 'pricing'
returning key, variant;
```

**Capcană, prinsă la prima rulare (7 oct.):** SQL Editor-ul din Supabase nu scrie
`UPDATE 1`, cum scria aici înainte, ci „Success. No rows returned” la ORICE
`update` fără `returning` — și când a schimbat un rând, și când n-a schimbat
niciunul. Mesajul acela nu dovedește nimic; de-aia `returning`.

Ordinea față de deploy nu contează: codul vechi ignoră o variantă pe care n-o
știe. După mutarea pe `sitepsihologi.ro`, domeniul din linie se schimbă.

**Alături de căsuță, nu dedesubt** (cerut tot pe 7 oct.): `LangaTabel` din
`pricing.tsx`, un flex cu `wrap`. Stau alături doar cât încap întregi — căsuța
de cel puțin 340px, tabelul de cel puțin 600px, sub care s-ar derula pe
orizontală chiar pe laptop; altfel tabelul coboară sub căsuță. Măsurat cu
textele din captura proprietarului: alături la 1280 și 1366px (căsuța 374px,
tabelul 654px, aliniate sus), dedesubt la 1024px și pe telefon.

Apoi, tot la cererea lui: **tabelul cât căsuța** (coloanele se întind la aceeași
înălțime, căsuța și tabelul le umplu — măsurat: încep și se termină pe aceeași
linie) și **titlul secțiunii pe toată lățimea**, și peste tabel (`maxWidthTitlu`
„none", doar cu `comparatie`; la 1280px, două rânduri în loc de trei). Urmare
de știut: cu două pachete în stânga, tabelul se întinde cât amândouă, iar
rândurile lui se răresc mult.

Schimbate la cererea lui, tot pe 7 oct.: „Mentenanță & Suport" → „Mentenanță &
Securitate", „Platforme DIY" → „Platforme DIY (Wix, Squarespace)", „ZERO. Ne ocupăm
noi." → „MINIM, doar încarci pozele și textele.", „Comision programări" →
„Sistem de programări", rând nou „Timp de lansare", „Proprietate design: Licență
pe viață" → „Proprietate: Site-ul îți aparține 100%." Primul cod trimis avea
cinci rânduri; ultimele trei au venit după, dintr-o versiune mai nouă a lui. Apoi:
„Mii de euro (Cost mare)" → „Prețuri mari, peste 1000 €", „Modul plătit separat /
Comision per ședință" → „Modul plătit separat / Abonament extra".

**8 oct. 2026, tot de proprietar:** „Prețuri mari, peste 1000 €" → „Prețuri mari,
uneori peste 1000 €"; „Ședințe lungi și feedback" → „Ședințe lungi, du-te-vino
obositor"; „Facturată separat la oră" → „Factură separat la oră" (scris așa de
el; poate fi o scăpare de tastare, nelămurit); „Câteva zile. Alegi designul și e
gata." → „Maxim 5 zile lucrătoare." (întâi „Câteva zile - maxim 5 zile
lucrătoare.", apoi, în aceeași zi, fără „Câteva zile"). **Termenul e acum o promisiune
scrisă pe site: maxim 5 zile lucrătoare.** Din ce moment se numără și ce se
întâmplă când clientul întârzie cu domeniul (îl cumpără și îl îndreaptă singur
spre Vercel, §„Ce vindem") nu e hotărât.

**8 oct. 2026, rândul „Proprietate":** la noi „Domeniul îți aparține exclusiv", la
DIY „Anulezi abonamentul = pierzi site-ul", la agenții „Domeniul e adesea pe firma
agenției" — textele proprietarului, după ce i-am arătat că „Site-ul îți aparține
100%" avea aceeași limită ca la Wix (designul nu se poate lua). Verificat în surse
neoficiale: la Squarespace site-ul cade, iar conținutul se șterge după o perioadă
de grație (14–30 de zile, sursele diferă); la Wix site-ul NU dispare, ci rămâne pe
o adresă gratuită Wix, cu reclame, iar domeniul propriu se deconectează. Deci
„pierzi site-ul" e exact la Squarespace și exagerat la Wix. **Valabil și la noi:**
fără cei 50 €/an, proprietarul scoate site-ul din Vercel, din tot (confirmat de el,
8 oct.) — deci celula „Anulezi abonamentul = pierzi site-ul" descrie și produsul
nostru, nu o slăbiciune a lor.

**Rândul rescris, tot 8 oct.** Eticheta rămâne „Proprietate" (o schimbasem eu în „Dacă nu
mai plătești", ca „Pierzi adresa web" să nu sune necondiționat; proprietarul a
respins-o: „sună prost"), la DIY „Pierzi adresa web", la agenții
„Riști să pierzi domeniul" — textele proprietarului, **verificate înainte**, în
surse secundare (paginile Wix și Squarespace nu se pot deschide din mediul de
lucru, rețeaua le blochează):
- **Wix:** când planul plătit se termină, site-ul trece pe o adresă gratuită Wix,
  cu reclame, iar un domeniu propriu nu mai poate sta pe un site gratuit (eroare
  în documentația lor pentru dezvoltatori). Domeniul în sine rămâne în contul
  clientului. De-aia „adresa web", nu „domeniul".
- **Squarespace:** site-ul cade (momentul diferă după surse), iar conținutul se
  șterge după o perioadă de grație; dacă domeniul rămâne al clientului, sursele se
  contrazic.
- **Agenții:** bloguri de profil spun că proprietar practic e cine ține contul de la
  registrar și că unele agenții înregistrează domeniul pe contul lor; de-aici
  „Riști", nu „Pierzi".

**Ținută pe loc: prima celulă dorită, „Păstrezi domeniul și textele".** Domeniul —
da, e al clientului. Textele — exportul există (`/dashboard/export`: setări,
secțiunile primei pagini, pagini, servicii, articole, mesaje; pozele doar ca
listă, iar adresele lor mor odată cu site-ul), dar cere panoul, iar panoul
dispare când site-ul se scoate din Vercel din tot. Deci „păstrezi textele" e
adevărat doar dacă le descarcă ÎNAINTE. Până se hotărăște procesul (avertisment
+ termen, sau acces doar de export după oprire), prima celulă rămâne „Domeniul
îți aparține exclusiv".

Spuse proprietarului o dată, lăsate cum le-a scris el: proprietatea („Licență pe
viață", apoi „Site-ul îți aparține 100%") și „Mentenanță & Securitate: Inclusă"
sunt promisiuni încă nehotărâte (§„Ce vindem") — designul e al platformei, iar
site-ul trăiește cât se plătește anul. WordPress, numit o vreme în antet, a ieșit:
de pe el te poți muta oricând, deci „Ești blocat pe platforma lor" nu era adevărat
la el; la Squarespace, ca la Wix, designul nu se poate lua. Măsurat pe pagină: pe
telefon (390px) se văd doar primele două coloane, restul stă ascuns după derulare
laterală, fără semn că există (aceeași capcană ca la `/proprietar`, 22 sept.);
verdele de la rândul cu programările are contrast ~3:1, sub pragul de 4,5:1. Verificat pe
`/proba-vanzari` (conținutul din `continut.ts`), nu pe site-ul viu.

### Linkul „Despre" din antet apare doar când secțiunea e pornită (8 oct. 2026)

Proprietarul: pe sitepsihologi.ro, „Despre" din bară nu făcea nimic. Cauza: antetul
avea mereu linkul `/#despre`, iar „Despre mine" era oprit pe site (scriptul de la
început a oprit tot ce nu e în site-ul de vânzări) — fără secțiune, browserul doar
adăuga `#despre` la adresă. Confirmat de el: secțiunea era ascunsă în panou, și a
cerut s-o țină așa și să dispară linkul.

**Reparat pentru TOATE site-urile**, nu doar sitepsihologi: `linkuriImplicite` din
`src/lib/antet.ts` pune „Despre" numai dacă secțiunea e vizibilă — aceeași regulă ca la
„Blog". Cheile vizibile vin dintr-o singură interogare memorată pe cerere
(`src/lib/sectiuni-vizibile.ts`), folosită și de subsol (înainte avea interogarea ei);
antetul o primește ca `areDespre`. În previzualizarea din Setări, unde antetul e doar
un exemplu, „Despre" rămâne (fără valoare = apare, ca înainte). Clienții cu „Despre
mine" pornit nu văd nicio diferență; ceilalți pierd un link mort.

Probă: `e2e/antet.proba.mjs` (6 teste; verificat că 2 pică când linkul redevine
necondiționat). Verificat pe pagină, lat și pe telefon cu panoul deschis: fără „Despre"
rămân „Servicii" și „Contact". **Neverificat pe site-ul viu.**

Rămâne, nepropus încă: meniul sitepsihologi e acum doar „Servicii" și „Contact"; „Prețuri"
și „Cum decurge" n-au intrări în bară.

### „Prețuri" în bara de sus, dintr-un câmp al secțiunii „Pachete" (8 oct. 2026)

Proprietarul a cerut un link rapid „Prețuri" în bară, ca „Servicii" și „Contact", doar
pentru sitepsihologi. Propuse trei variante, el a cerut-o pe a doua: **un câmp opțional
în secțiunea „Pachete", „Link în bara de sus"** (`linkMeniu`, cel mult 20 de caractere,
ultimul din formular). Gol = niciun link, deci niciun alt client nu vede nimic; scris,
apare `/#pachete` după „Servicii", dar numai cât secțiunea e pornită ȘI are cel puțin un
pachet (fără pachete secțiunea nu se afișează, deci linkul ar fi mort — ca la „Despre").

Respinse: linkul automat pentru toți (pe site-urile noi „Pachete" e pornită din oficiu,
deci toți psihologii ar fi primit „Prețuri" nechemat) și o cheie pusă din SQL (panoul
salvează doar câmpurile din schemă, `catreStocare`, deci ar fi dispărut la prima salvare).

Cod: câmpul în `src/lib/sectiuni.ts`, regula `linkPachete` în `src/lib/antet.ts`,
interogarea `dateleSectiuniiPachete` în `src/lib/sectiuni-vizibile.ts` (o citire în plus
pe pagină, în paralel cu celelalte), `linkuriSectiuni` din `cadru-site.tsx` către antet.
Probă: `e2e/antet.proba.mjs`, 15 teste; verificat că pică la fiecare regulă stricată pe
rând (fără verificarea pachetelor, cu text gol, fără câmpul din schemă).

Verificat pe pagină: câmpul în formularul real (cu textul de ajutor), linkul apare și
dispare după cum scrii sau golești; antetul probabil de pe sitepsihologi („Servicii |
Prețuri | Contact") stă pe un singur rând de la 901px în sus. **Limită, măsurată:** cu
nume lung de cabinet + Despre + Blog + telefon + Prețuri, între 900 și ~1000px bara se
rupe pe două rânduri (sub 900px e meniul cu buton). **Neverificat pe site-ul viu.**
Previzualizarea din panou arată doar secțiunea, nu bara, deci linkul se vede numai pe
site.

Cum se folosește: Panou → Secțiuni → Pachete → ultimul câmp, „Link în bara de sus" →
„Prețuri" → Salvează.

**Stare la 8 sept. 2026: site-ul EXISTĂ.** Provizionat cu `creeaza_client` pe
`sitepsihologi.vercel.app`, șablonul `claritate`, conținutul turnat din SQL
generat (vezi mai jos).

**Publicat de proprietar (confirmat 9 sept. 2026).** `published_at` e setat —
verificarea de comportament îl arată ca site publicat, iar proprietarul a spus
că e dinadins. Atenție la o nuanță pe care a lămurit-o tot atunci, fiindcă e ușor
de citit greșit: pe `.vercel.app` site-ul e NELISTAT, nu ÎNCHIS. Nu se
INDEXEAZĂ (vezi mai jos), deci nimeni nu dă peste el din căutări — dar se
ÎNCARCĂ pentru oricine are adresa, fiind publicat i se arată site-ul adevărat,
nu pagina „nepublicat", și nu e nicio parolă la mijloc (afară de „Deployment
Protection" din Vercel, opțiune separată). Pentru site-ul NOSTRU de vânzări n-are
importanță — e conținut public, arătat cui vrea proprietarul. **Dar la un site de
CLIENT același raționament ar fi o gaură**: acolo „e pe o adresă temporară, deci
n-o vede nimeni" trebuie citit ca „n-o GĂSEȘTE nimeni", nu „n-o poate DESCHIDE
nimeni". Consecință de care ține și verificarea completă: pe un site publicat cu
politica de confidențialitate încă ciornă, cardul de publicare dă un avertisment,
nu o piedică — vezi §„Comutatorul de lansare".

Adresa e temporară, până se cumpără domeniul. **Cât stă pe `.vercel.app`,
site-ul nu se indexează deloc**: `robots.ts` refuză orice gazdă a platformei, iar
`*.vercel.app` e una. Nu e o scăpare — regula există ca site-ul unui client să
nu ajungă în Google pe două adrese deodată, concurând cu sine. Consecința pentru
noi: e o vitrină pe care o ARĂȚI, nu una pe care o găsește lumea. Costul real e
zero: un site nou n-ar fi ajuns oricum în căutări în săptămânile astea, iar la
mutarea pe domeniul propriu indexarea pornește curat, fără adrese vechi agățate.
Proprietarul știe și a ales asta în cunoștință de cauză.

Ce lipsea din panou pentru asta, și s-a făcut: **secțiunea „Pachete"**. Era deja
pe listă din Faza 0 pentru pachete de ședințe (decizii-faza-0.md §6.1), deci
folosește și psihologilor, nu doar nouă. Prețul e un câmp de TEXT, nu un număr:
„de la 300 €" și „60 €/an, în jur de 300 de lei" sunt prețuri adevărate pe
care un câmp numeric
nu le-ar fi putut ține, iar cu nimic nu se calculează aici. Scoaterea în față a
unui pachet se face cu o etichetă scrisă („Cel mai ales"), nu cu o bifă:
eticheta spune și DE CE, o bifă doar l-ar fi colorat.

**Șabloanele se arată întâi ca poze**, iar demo-urile vii vin când există
domeniul — hotărât de proprietar. Pozele intră în secțiunea „Programe și
materiale", care există deja, deci galeria nu cere cod nou.

**Stare la 8 sept. 2026: galeria e pusă, dar cu desene, nu cu capturi.** Fiecare
dintre cele cinci cartonașe are un SVG construit din paleta ADEVĂRATĂ a
șablonului lui — fundal, accent, culoarea textului, fontul — cu chenar punctat
și scris pe el „exemplu — aici va veni o captură adevărată". Așa se vede
diferența dintre șabloane fără să mintă nimeni că e o poză finală.

Capturile adevărate cer un site COMPLETAT, cu texte și poze reale, din care să
se poată fotografia ceva care vinde. Nu există încă niciunul. La fel și
secțiunea de păreri: are trei locuri goale, în paranteze drepte, scrise ca să
nu poată fi luate drept recenzii. **Nu se inventează păreri**, nici măcar ca
probă — un site care vinde ceva nu are voie să pornească cu recenzii false.

## Prima provizionare adevărată (8 sept. 2026), și ce a scos la iveală

Proprietarul a făcut primul site cu `creeaza_client`, pe o adresă `.vercel.app`,
pentru `sitepsihologi.ro`. Toate cele patru probleme de mai jos existau de zile
sau săptămâni, în cod care trecea lint, tipuri, build și toate probele. Niciuna
nu se putea găsi citind. Se citesc ca o listă de lecții, nu ca un istoric.

**1. Baza reală poate rămâne în urma codului, fără ca nimic s-o spună.**
Migrarea cu al cincilea șablon intrase pe JUMĂTATE: constrângerea de pe tabel se
aplicase, funcția nu. `creeaza_client` a refuzat `claritate`, iar mesajul lui
suna a greșeală de scriere. În SQL Editor, cu text selectat se rulează doar
selecția — de aici jumătatea.

~~Ce lipsește, și rămâne deschis: **nimic nu compară baza reală cu codul.**~~ —
făcut (9 sept. 2026), vezi §„Verificarea că baza reală are ce scriu migrările".
Probele verificau fișierele între ele; bancul local rulează migrările în ordine,
pe o bază goală. Niciunul nu se uita la Supabase. Interogarea de mai jos, care
lămurea cazul ăsta anume în două secunde, a rămas ca punct de plecare al
verificării de acum:

```sql
select
  (select pg_get_functiondef(oid) like '%claritate%'
     from pg_proc where proname = 'creeaza_client') as functia_e_la_zi,
  (select pg_get_constraintdef(oid)
     from pg_constraint where conname = 'sites_template_check') as constrangerea;
```

**2. Un `catch` poate fi întins lângă gaură, nu peste ea.** Numărarea vizitelor
se cheamă din `after()` și citea `headers()` acolo. Next 16 aruncă, iar pagina
ÎNTREAGĂ cade cu 500 — deși funcția prindea eroarea și o scria cuminte în
jurnal, exact cum îi cerea comentariul ei („nu aruncă niciodată"). Next vede
greșeala înaintea lui `catch`. Vezi convenția din CONVENTII.md.

**3. Un site abia provizionat e o stare pe care n-o probase nimeni.** Toate cele
paisprezece secțiuni pornesc APRINSE și cu `{}` (hotărâre de la comutatorul de
lansare, corectă: un site nepublicat nu se vede oricum). Șase componente făceau
`data.ceva.map(...)` de-a dreptul — 500 pe tot site-ul public al clientului.
Două aveau chiar o pază, `data.ceva.length === 0`, scrisă pentru lista GOALĂ, nu
pentru lista LIPSĂ; pica la fel.

**4. Codul 200 nu e o verificare vizuală.** După reparația de mai sus am
verificat că pagina răspunde 200 și m-am oprit. Proprietarul s-a uitat la ea: o
ghilimea albastră singură, atârnând într-o bandă goală, și o bandă neagră cât
ecranul cu un câmp de email și niciun cuvânt lângă el.

### Hotărârea care a ieșit din asta: site-ul nou își arată scheletul

Cerută de proprietar, și mai bună decât ce făcusem. Ascunsul secțiunilor goale
repara urâțenia și făcea în schimb panoul să MINTĂ: acolo scria „vizibilă" la
toate paisprezece, pe site se vedeau două.

Acum fiecare secțiune pornește cu numele pe care îl poartă și în panou —
„Despre mine", „Serviciile mele", „Păreri". Site-ul arată ca un cuprins al lui
însuși: derulezi și vezi ce ai de scris și unde, iar ce apeși în panou
regăsești pe site sub aceeași etichetă. Textele stau în `textul_de_pornire`
(migrarea `schelet_la_provizionare`) — **al patrulea loc** unde trăiește lista
de secțiuni, după registrul de componente, `metaSectiune` și constrângerea din
tabel. Are probă, `e2e/schelet-sql.proba.mjs`, care și-a găsit prada din prima:
`programare` lipsea, fiindcă ea nu vine de la provizionare ci de la un
declanșator, când se pornește modulul plătit.

Regula de randare: **o secțiune se vede dacă are TITLU**, chiar cu lista de sub
el goală. Fără titlu ȘI fără conținut, tot nu randează nimic.

### Ce rămâne deschis

**Panoul încă nu spune tot adevărul.** Ecranul de secțiuni citește dacă e
bifată, nu și dacă are conținut, deci o secțiune golită de client apare
„vizibilă" fără să se vadă pe site. Cu scheletul pus, cazul e rar; rămâne
pentru clientul care își golește o secțiune. Proprietarul a amânat reparația,
în cunoștință de cauză.

### Conținutul site-ului de vânzări se GENEREAZĂ

Textele stau în `src/app/proba-vanzari/continut.ts`, fără JSX, iar
`scripts/sql-vanzari.mjs` scoate din ele SQL-ul care le toarnă în baza reală:

```
node --import ./e2e/alias.mjs scripts/sql-vanzari.mjs sitepsihologi.vercel.app
```

Nu de dragul curățeniei. Node rulează TypeScript direct, dar nu și JSX — iar
scris de mână, în paralel, SQL-ul ar fi ajuns să se contrazică cu previzualizarea
pe care proprietarul a aprobat-o, iar diferența s-ar fi văzut abia pe site.

Totul e legat de un singur `site_id`, luat o dată la început, iar dacă domeniul
nu există se oprește fără să atingă nimic. Rescrie secțiunile și șterge
serviciile, deci se rulează pe un site gol, nu peste unul la care s-a lucrat.

### Șablonul „Claritate" e argintiu, nu alb

Schimbat pe 8 sept., la cererea proprietarului: „vreau ca albul să fie spre
argintiu futurist curat". Nu e o nuanță schimbată, ci o inversare — pardoseala
e argintie (`#EEF2F7`), iar `fundalNuantat` e alb curat, iar cartonașele îl
folosesc pe ăla. Panourile albe plutesc peste argintiu în loc să se piardă în
el. **E invers față de celelalte patru șabloane**, unde `nuantat` e mai închis
decât `fundal`: singurul lucru din fișier care nu se poate copia orbește într-un
șablon nou.

### „Ce primești" stă pe o bandă orizontală

`features` are acum varianta `linie`, cerută pe coloana `variant` din
`site_content` — coloana exista de la prima migrare și n-o folosea nimeni.
Secțiunea NU s-a schimbat pentru toți: își ia conținutul din Servicii, iar la un
cabinet o linie ar fi greșită (nimeni nu ia terapia de cuplu DUPĂ evaluare).
Panoul scrie doar `data`, `position`, `visible` și `is_demo`, deci varianta pusă
din SQL supraviețuiește oricâtor editări.

## Verificarea că baza reală are ce scriu migrările (9 sept. 2026)

Golul rămas deschis pe 8 sept. — „nimic nu compară baza reală cu codul" — e
astupat. Se lipește un fișier în SQL Editor și scrie ori „TOTUL E LA FEL", ori
câte un rând per diferență.

**Cum e construit, fiindcă asta e partea care contează.** Amprenta schemei — 247
de lucruri: tabele, coloane, constrângeri, indecși, politici RLS, funcții cu
drepturile lor de execuție, declanșatori, drepturi pe tabel și pe coloană,
steagul de public al depozitului — se ia cu UN SINGUR `select`,
`supabase/amprenta-schema.sql`. Același `select` rulează în două locuri: o dată
pe bancul local (toate migrările, în ordine, pe un Postgres gol) și o dată pe
baza reală. Scrise separat, cele două părți ar fi putut devia una de alta —
adică exact greșeala pe care verificarea trebuie s-o prindă.

Rezultatul de pe banc se lipește ca listă de valori în
`supabase/verificare-schema.sql`, generat de `genereaza-verificare-schema.sh` la
coada bancului. **Comparația se face ÎN baza reală, nu aici:** mediul de
dezvoltare nu ajunge la Supabase, și nici nu vrem să ajungă — ar fi însemnat un
șir de conectare cu parolă ținut undeva. Lista de valori călătorește prin
fișier; comparația se mută la ea.

**Ce prinde, probat stricând dinadins fiecare:** o migrare care n-a rulat
(coloana lipsește), una intrată pe jumătate (constrângerea rămasă la patru
șabloane în loc de cinci — chiar cazul din 8 sept.), o funcție rămasă la o
versiune veche, o politică RLS ștearsă, RLS stins pe un tabel, un drept lărgit
pe tăcute, depozitul redeschis, și un tabel făcut de mână din tabloul de bord.

**Trei feluri de diferență, fiindcă se repară altfel:** LIPSEȘTE DIN BAZĂ
(migrarea n-a rulat), ALTFEL ÎN BAZĂ (există, dar spune altceva), ÎN PLUS ÎN
BAZĂ (nicio migrare nu-l creează — de obicei ceva făcut de mână). Ultima coloană
arată ultima migrare care pomenește numele: un indiciu, nu o dovadă, și doar
pentru numele distinctive. `sites` sau `name` apar în aproape fiecare migrare,
iar un indiciu care minte e mai rău decât niciunul.

**CI-ul ține fișierul la zi.** Bancul îl rescrie din baza pe care tocmai a
construit-o; dacă cel comis diferă, verificarea pică și spune ce să rulezi.
Comparația se sare dacă runner-ul e pe altă versiune majoră de Postgres decât
cea pe care s-a luat amprenta — o parte din amprentă e text pe care Postgres îl
recompune singur și îl poate scrie altfel, iar un CI care dă roșu pe cod bun se
ignoră în două săptămâni.

**Ce NU acoperă:** datele. Se uită la formă — tabele, drepturi, politici — nu la
ce e în ele. Câte rânduri are fiecare client, dacă un site are secțiunile care
trebuie, rămâne treaba verificării de izolare și a ochilor.

### Ce a găsit prima rulare pe baza reală (9 sept. 2026)

Douăzeci de rânduri, în două grupe. Una era zgomot, cealaltă nu.

**Zgomotul, paisprezece rânduri:** toate drepturile pe tabel aveau un `m` în plus
în baza reală. E MAINTAIN, privilegiu apărut în PostgreSQL 17 și cuprins în
`grant all`; bancul e pe 16, unde nu există. Nu spune nimic despre schema
noastră, deci se scoate acum din amprentă — altfel verificarea s-ar fi plâns la
fiecare rulare de ceva nestricat, iar în două săptămâni n-ar mai fi citit-o
nimeni. De aici știm și că baza reală e pe Postgres 17. Restul amprentei a trecut
fără nicio diferență — zero la constrângeri, indecși, politici, coloane și
declanșatori — deci textul pe care Postgres îl recompune singur iese la fel pe 16
și pe 17 pentru tot ce folosim noi.

**Cealaltă grupă nu era zgomot.** Șase funcții cu alte drepturi de execuție decât
cele așteptate, și două dintre ele contau:

| Funcția | Pe banc | În producție |
|---|---|---|
| `creeaza_client` | niciunul din cele trei roluri | `anon`, `authenticated`, `service_role` |
| `inregistreaza_afisarea` | doar `service_role` | `anon`, `authenticated`, `service_role` |

Cheia `anon` e publică prin construcție — stă în pachetul trimis browserului —
iar funcțiile din schema `public` sunt expuse ca RPC. Deci oricine putea chema
`inregistreaza_afisarea` cu orice `site_id` și umfla cifrele din panoul oricărui
cabinet. Iar `creeaza_client`, care e `security definer` și rulează cu drepturile
proprietarului bazei, era chemabilă de orice client conectat.

**De ce n-a văzut-o nimeni.** În Postgres simplu, o funcție nouă poate fi
executată de PUBLIC, iar `anon` și `authenticated` moștenesc de acolo — deci
`revoke ... from public` chiar e de ajuns. Pe Supabase nu: proiectul are `alter
default privileges ... grant all on functions` către cele trei roluri, așa că
fiecare funcție nouă primește granturi EXPLICITE, pe rol, la creare. Revocarea de
la PUBLIC nu le atinge. Bancul nu reproducea granturile alea, deci acolo apărarea
ținea. Verificarea de izolare avea chiar verificările potrivite — 6 („un vizitator
anonim nu poate umfla cifrele de trafic") și 11 („un client nu poate provizona
site-uri") — și treceau amândouă, din motivul greșit.

**Reparat în trei locuri, în același commit.** Bancul reproduce acum și
granturile implicite pe funcții și pe secvențe; migrarea
`20260909100000_drepturi_de_executie.sql` revocă execuția de la `anon` și
`authenticated` pe cele două funcții; iar cu bancul fidel, verificările 6 și 11
pică fără migrare și trec cu ea — probat în ambele feluri, nu presupus.

**Rămâne de văzut la a doua rulare** dacă cele șase cuprinsuri de funcții mai
diferă după normalizarea spațiilor. Dacă da, în producție stau versiuni mai vechi
ale funcțiilor, și se rulează migrările care le definesc.

### Revocarea a rulat și n-a schimbat nimic (9 sept. 2026)

A doua rulare pe baza reală, după migrarea de revocare. Două lucruri:

**Normalizarea spațiilor a fost bună.** Cinci din cele șase cuprinsuri de funcții
se potrivesc acum la virgulă, inclusiv ale celor două funcții cu pricina. Deci
textul lor din producție E cel din migrări; diferența de dinainte venea din
sfârșituri de rând, cum bănuiam. Rămâne unul singur —
`adauga_sectiunea_programare` — al cărui cuprins chiar diferă, deși migrarea care
îl scrie n-a fost atinsă din 27 aug. Se lămurește citind textul din bază.

**Drepturile n-au mișcat.** Amândouă funcțiile arată tot
`anon=X authenticated=X service_role=X`, deși migrarea a rulat.

Cauza, reprodusă pe banc, nu presupusă: **`REVOKE` scoate doar granturile date de
rolul care revocă.** Un grant dat de altcineva rămâne pe loc, iar comanda nu dă
eroare — pe bancul nostru n-a dat nici măcar avertizare, a răspuns „REVOKE" și a
schimbat nimic. Am făcut un rol străin să acorde `execute` lui `anon`, apoi am
revocat ca proprietar: dreptul a rămas.

**Amprenta n-a putut arăta de ce**, fiindcă tăia partea de după `/` din fiecare
drept — adică exact cine l-a dat. Acum o scrie, dar numai când acordantul NU e
proprietarul obiectului: în cazul obișnuit nu se vede nimic, deci nu face zgomot,
iar în cazul care contează sare în ochi (`anon=X/DAT DE altcineva`).

`supabase/diagnostic-drepturi.sql` întreabă baza reală cine rulează, cine a dat
fiecare drept, ce spune declarația de drepturi implicite a proiectului, și care e
cuprinsul funcției care diferă. Patru răspunsuri, o singură lipire.

### Cum s-a închis (9 sept. 2026)

`supabase/repara-drepturi.sql` — care revocă și se uită IMEDIAT, în aceeași
rulare — a prins din prima. Cele două funcții au acum doar `postgres` și
`service_role`. Verificat apoi într-o sesiune SEPARATĂ, cu o citire simplă care
nu revocă nimic: a rămas așa.

Deosebirea aceea nu e pedanterie. Fișierul de reparație repară înainte să se
uite, deci la a doua rulare ar scrie „închisă" chiar dacă drepturile s-ar fi
întors între timp. Numai o citire care nu schimbă nimic poate spune că A RĂMAS.

**De ce n-a prins prima încercare nu știm**, și probabil nu vom ști: acordantul
era `postgres`, tot `postgres` rulează SQL Editor-ul, deci avea toate condițiile.
Rămâne una dintre acele „reușite" care nu schimbă nimic. De aici regula din
CONVENTII: la o revocare care contează, te uiți pe urmă — răspunsul comenzii nu e
o dovadă.

**Ce NU s-a confirmat încă:** verificarea de schemă întreagă n-a mai rulat după
reparație, deci „TOTUL E LA FEL" pe toate cele 247 de lucruri rămâne nedovedit.
Cele trei care lipseau sunt însă verificate una câte una. Se închide singur la
migrarea următoare, care pleacă cu verificarea lipită la coadă.

### Ce a spus diagnosticul (9 sept. 2026)

**Ipoteza mea era greșită.** Acordantul drepturilor e chiar `postgres`, și tot
`postgres` rulează SQL Editor-ul — deci revocarea avea toate condițiile să
prindă. Nu e o poveste cu roluri străine; rămâne întrebarea dacă a rulat sau a
fost desfăcută, la care răspunde `supabase/repara-drepturi.sql`: revocă și se
uită imediat, în aceeași rulare, cu verdict scris.

**Un lucru s-a lămurit însă de tot:** drepturile implicite pentru schema `public`
sunt declarate de DOUĂ ori — o dată de `postgres`, o dată de `supabase_admin` —
și amândouă dau `execute` lui `anon` și `authenticated`. Deci **fiecare funcție
viitoare chiar se naște deschisă**, nu a fost ceva de o singură dată. Presupunerea
pe care stă `e2e/drepturi-functii.proba.mjs` e confirmată.

**Iar funcția cu cuprins diferit nu era o versiune veche.** Textul din producție
e identic cu migrarea, mai puțin COMENTARIILE. Adică ce s-a rulat pe 27 aug. a
fost o copie din discuție, nu fișierul. Comportamentul e același; se aliniază
rulând din nou blocul, care e idempotent.

### Verificarea amănunțită: formă, comportament și date (9 sept. 2026)

`supabase/verificare-completa.sql`, generat din același loc ca celălalt. O
lipire, un tabel, treizeci și cinci de verificări pe o bază curată, în trei zone.
Cerut de proprietar așa: „cât mai amănunțite, să prindă ce nu prevezi, dar să nu
strice nimic". Cele două jumătăți s-au împăcat pe două principii:

**Nicio listă scrisă de mână.** Tabelele de verificat se iau din catalog (toate
cele cu `site_id`), coloanele lui `sites` la fel, funcțiile, depozitele,
constrângerile la fel. Un tabel adăugat mâine fără RLS, o coloană nouă pe `sites`
dată din greșeală clientului, o funcție `security definer` chemabilă din browser
— prinse fără ca cineva să le fi trecut undeva. Înainte, lista celor 13 tabele
era scrisă în verificare; al paisprezecelea n-ar fi fost verificat niciodată.

**Nicio scriere care să poată rămâne.** Fiecare probă care scrie rulează într-o
sub-tranzacție anulată întotdeauna. Vezi CONVENTII, §„O probă care scrie nu pune
la loc — se anulează".

- **comportament** — 18 probe, care chiar ÎNCEARCĂ: fiecare client caută datele
  altuia în fiecare tabel cu `site_id`; anonimul citește din fiecare tabel și
  scrie în inbox; clientul citește conturile platformei; clientul scrie în
  FIECARE coloană din `sites` (`set coloana = coloana`, anulat) și trebuie să
  poată exact `name` și `published_at`; funcțiile platformei chemate de cine nu
  trebuie; nicio funcție `security definer` chemabilă din browser; toate
  bucket-urile private; nicio politică pe fișiere pentru anon; constrângeri
  validate; `updated_at` cu declanșator; `site_id` cu index. Și, la urmă,
  numărătoarea rândurilor din fiecare tabel față de cele de la început. **Nu mai
  rulaseră pe baza reală din 26 aug.**
- **formă** — cele 247 de lucruri, ca în `verificare-schema.sql`.
- **date** — 16 lucruri pe care nicio constrângere nu le poate opri: site fără
  cont sau fără setări, pagină pe o adresă a platformei, fișier în afara
  dosarului cabinetului, fișier fără rând și rând fără fișier, secțiune cu cheie
  pe care site-ul n-o știe randa (cheile vin din registrul de componente, la
  generare), poză care arată spre un fișier inexistent, domeniu scris murdar sau
  de două ori cu alte litere, site publicat fără nicio secțiune vizibilă sau cu
  secțiuni vizibile și goale, conținut de probă pe un site publicat, politica de
  confidențialitate nepublicată pe un site publicat, modulul de programări fără
  secțiunea lui, conturi de login nelegate de niciun site.

Probat stricând câte ceva din fiecare zonă — 42 de rânduri roșii dintr-o
singură rulare, toate cele pregătite. Iar dovada că nu strică: în rularea aia
trei probe chiar au scris (mesaj anonim, vizită, un site provizionat), și
numărătorile de dinainte și de după, făcute din afară, au fost identice.

**Verificarea de izolare merge acum și cu un singur client în bază.** Înainte se
oprea din prima și scria un singur rând; pe baza reală, unde poate exista un
singur cabinet, asta însemna un tabel gol în loc de verificări — ușor de citit
drept „e bine". Acum se sar doar comparațiile între clienți, cu „NU SE POATE"
scris pe față, iar celelalte unsprezece rulează.

**Găsit în timp ce construiam:** `/programare` e rută a site-ului public de pe
27 aug., dar lipsea din `ADRESE_REZERVATE`. Adică panoul accepta o pagină cu
adresa „programare", clientul o scria, o salva, o vedea la previzualizare — și
n-o citea nimeni, fiindcă ruta noastră câștigă în fața celei după adresă.
Aceeași formă ca greșeala din 1 sept. cu `/dashboard-ul-meu`. Reparat, și apărat
de o probă care se uită la rutele de pe disc, nu la o a doua listă scrisă de
mână. Lipseau și `opengraph-image`, și `proba-vanzari`.

**Găsit cu o clipă înainte de prima rulare pe producție, și e cel mai important
lucru din secțiunea asta:** verificarea de izolare SCRIA într-un rând adevărat
din `sites` și nu punea nimic la loc. Două dintre probele ei trebuie să reușească
— clientul chiar are voie să-și publice site-ul și să-și salveze numele — deci pe
baza reală i-ar fi publicat site-ul nepublicat unui cabinet și i-ar fi scris
„Verificare izolare" în loc de nume. A treia punea domeniul înapoi pe o valoare
scrisă de mână, a clientului de test. Reparată întâi cu „pune la loc", apoi,
în aceeași zi, cu ceva mai tare: probele care scriu se ANULEAZĂ prin construcție,
iar la sfârșit se numără rândurile din nou. Bancul nu putea arăta asta niciodată:
acolo datele sunt de aruncat.

**Și încă una, de mediu:** bancul pornea Postgres și număra două secunde. Pe o
mașină încărcată nu ajung, iar o rulare a picat din motivul ăsta. Acum așteaptă
până răspunde. Un banc care pică din când în când fără legătură cu ce s-a
schimbat e mai rău decât unul lent — în CI se citește ca „e ceva stricat în cod".

### Ce a mai scos un audit pe unghiuri independente (9 sept. 2026)

Concluzia de mai sus a fost pusă la îndoială de trei verificări adversariale, ca
să nu plece o afirmație despre o gaură de securitate pe jumătate dovedită.
Niciuna n-a putut-o dărâma, iar una a adus dovada care lipsea: **`oricine` (adică
PUBLIC) lipsește exact și numai la cele două funcții care au `revoke ... from
public` în migrare.** Deci revocarea chiar a rulat — n-a fost o migrare intrată pe
jumătate — și pur și simplu n-a fost de ajuns. Restul de patru funcții au
`oricine=X`, cum se cuvine unora care n-au avut niciun revoke.

Ce a adus în plus, și e reparat:

- **Fiecare funcție VIITOARE se naște la fel de deschisă.** Reparația pe două
  funcții nu e o reparație pe clasă. De aceea există acum
  `e2e/drepturi-functii.proba.mjs`: cade dacă o migrare adaugă o funcție în
  `public` fără să-i ia execuția de la `anon` și `authenticated` — sau fără să o
  treacă, cu motivul scris, în lista celor deschise dinadins. Cele patru de acolo
  (`current_site_id`, `set_updated_at`, `adauga_sectiunea_programare`,
  `textul_de_pornire`) sunt acum o hotărâre scrisă, nu o scăpare.
- **Mesajele de eroare ale lui `creeaza_client` erau un oracol peste conturi.**
  „Nu există niciun cont cu emailul X" / „Contul X e deja legat de un site" /
  „Domeniul X are deja un site" spuneau, fără nicio autentificare, dacă o adresă
  are cont la noi. Se închide odată cu dreptul de execuție.
- **`page_views_daily` n-are dinadins nicio politică de scriere**, deci funcția
  `security definer` era SINGURA cale de scris în ea — și era deschisă. Cifrele
  puteau fi scrise cu orice `day`, inclusiv în afara ferestrei de 30 de zile pe
  care o citește panoul, deci fără să se vadă.
- **Trei capcane viitoare în amprentă**, astupate: `m` nu poate apărea niciodată
  la drepturile pe coloană (MAINTAIN e privilegiu de tabel), deci normalizarea de
  acolo era cod mort care promitea o apărare inexistentă; `contype = 'n'` face ca
  în PostgreSQL 18 fiecare `not null` să devină rând de catalog, adică un potop
  de „ÎN PLUS ÎN BAZĂ" în ziua în care Supabase trece pe 18; iar `search_path`
  hotărăște dacă textele recompuse de Postgres se scriu calificat sau nu — la
  prima rulare s-a potrivit din noroc, acum e pus pe față în fișierul generat.
- **Bancul își verifică singur fidelitatea.** `alter default privileges` se leagă
  de rolul care o scrie; devenită tăcut inertă, bancul ar fi redevenit orb exact
  pe apărarea asta. Acum se uită la un obiect adevărat creat de migrări și se
  oprește dacă granturile implicite lipsesc.

## Resetarea parolei (10 sept. 2026)

Făcută, pe **puntea** cu expeditorul încorporat al Supabase — nu Resend, prin
decizia despre email. Până acum `/login` avea doar email + parolă.

Fluxul: „Ți-ai uitat parola?" pe `/login` → `/login/parola-uitata` (ceri linkul)
→ emailul lui Supabase → `/login/confirma-resetare` (preschimbă tokenul într-o
sesiune de recuperare) → `/login/parola-noua` (pui parola). Trei bucăți de cod;
emailul îl trimite Supabase, iar parola o ține tot el — codul nostru n-o vede.

Ce a cerut gândire, nu doar scris:

- **Linkul se întoarce pe domeniul CLIENTULUI**, nu pe o adresă a platformei — cel
  rezolvat de proxy (`x-site-domain`), ca după resetare omul să rămână pe site-ul
  lui și `/dashboard` să meargă. Costul: fiecare domeniu de client se trece în
  lista permisă din Supabase (Auth → URL Configuration) — merge la pachet cu
  conectarea domeniului în Vercel, oricum manuală. Un `*.vercel.app` acoperă tot
  cât suntem pe adrese temporare. E aceeași capcană de scalare ca la anti-spam,
  ținută pe un singur loc.
- **Ruta de confirmare acceptă două forme de link:** `token_hash` (șablonul nostru
  de email, merge și de pe alt dispozitiv, fiindcă dovada e întreagă în link) și
  `code` (implicitul PKCE al Supabase, doar în același browser). Așa merge și
  înainte, și după ce se lipește șablonul din `sabloane/email-resetare-parola.md`.
- **Paginile rămân deschise pe un site nepublicat** (`seServesteNepublicat`):
  cererea și linkul vin FĂRĂ sesiune, deci nu le apără „ești proprietarul?", iar
  un client își uită parola cel mai des tocmai cât își scrie site-ul, nepublicat.
  Dar NU sunt tratate ca `/login` exact — altfel proxy-ul ar trimite la
  `/dashboard` un om cu sesiune de recuperare, chiar înainte să-și pună parola.
  Probele: `e2e/resetare-parola.proba.mjs`.
- **Nu se spune niciodată dacă adresa are cont** — altfel formularul devine o
  unealtă de aflat ce emailuri sunt înregistrate.

**Ce trebuie făcut în Supabase, o dată** (proprietarul, nu sesiunea de dev):
adresa de întoarcere în lista permisă, expeditorul încorporat pornit, și —
recomandat — șablonul de email în română. Toate trei, pas cu pas, în
`sabloane/email-resetare-parola.md`.

**Puntea, nu destinația.** Expeditorul încorporat e de mică anvergură (câteva
emailuri pe oră); pentru resetări rare e destul, iar rezerva rămâne resetarea
manuală din tabloul Supabase. Când vine domeniul propriu și Resend, se schimbă o
setare SMTP în Supabase — **codul de aici rămâne neatins**, fiindcă nu știe cine
trimite emailul.

**Corectare (10 sept. 2026), găsită testând cu proprietarul:** puntea livrează
o resetare care merge DOAR în același browser din care a fost cerută. Motivul e
că linkul implicit al Supabase (PKCE, `code`) are nevoie de un cookie pus la
cerere — deschis pe alt dispozitiv (telefon), cade. Varianta profesională, care
merge de oriunde, cere linkul cu `token_hash` — adică ȘABLONUL de email
modificat. Iar Supabase **nu lasă să editezi șablonul de email fără SMTP propriu
configurat** („Set up custom SMTP to edit and save templates"). Deci resetarea
profesională, cross-device, **atârnă de domeniu + Resend** — nu e opțională,
cum părea. Codul e gata (ruta acceptă și `token_hash`, și `code`); ce lipsește e
temelia de email. De reținut: „făcută pe punte" înseamnă „merge, dar
same-browser", nu „client-grade".

## Politica de confidențialitate se schimbă odată cu platforma

Cerut de proprietar, 1 sept. 2026, ca să nu se piardă printre altele.

**Ce trebuie ținut minte:** șablonul din `sabloane/` descrie ce face CHIAR
platforma. De fiecare dată când se schimbă ce pleacă din browserul unui
vizitator, șablonul trebuie schimbat în același commit — altfel textul minte, iar
minciuna ajunge la clienți sub semnătura lor, nu a noastră.

**Și, mai important, partea care NU se rezolvă singură:** șablonul actualizat
nu schimbă pagina niciunui client. Textul lui stă în tabelul `pages`, scris de
el, din ziua în care și-a făcut site-ul. Un client care și-a publicat politica
înainte de o schimbare rămâne cu textul vechi până i-l corectează cineva.

### Ce s-a schimbat până acum, și trebuie dus și la clienți

| Când | Ce s-a schimbat tehnic | Ce trebuie să scrie altfel |
|---|---|---|
| 30 aug. 2026 | Formularele nu mai au căsuță de mesaj; se cer nume + telefon, emailul opțional | Paragraful despre ce se strânge prin formular. Textul vechi spunea „nume, email și mesaj” și „nu îți cerem telefonul” — pe dos față de acum |
| 31 aug. 2026 | Anti-spamul a trecut de la Cloudflare Turnstile la hCaptcha | Numele furnizorului, în paragraful despre anti-spam ȘI în lista de firme care ating datele |
| 1 sept. 2026 | Fonturile se servesc de pe domeniul clientului | Paragraful despre Google Fonts SE SCOATE de tot |
| 16 sept. 2026 | Contactul cere nume + email (obligatoriu); telefonul scos | Rândul despre ce salvează formularul: „numele și numărul tău de telefon, iar adresa de email doar dacă vrei” nu mai e adevărat |
| 14–15 oct. 2026 | Contactul (14 oct.) ȘI programările (15 oct.) cer nume + email (obligatoriu) + telefon (OPȚIONAL) | Același rând (formularul de contact; programările adaugă numele, emailul, telefonul opțional și ora cerută): „se salvează numele și adresa ta de email, iar numărul de telefon doar dacă vrei să-l lași”. **Făcut în șablon pe 15 oct.** (rescris; paginile clienților rămân de corectat de mână) |
| 21 oct. 2026 | Alegerea limbii — bulina cu steag (traducerea Google), pornită din Setări | Paragraful `[TRADUCERE]`, păstrat doar dacă bifa e pornită: la English/Deutsch, vizitatorul ajunge la Google. **Făcut în șablon** (branch, 21 oct.) |

Toate sunt făcute în șablon (ultimele două — 16 sept. și 14–15 oct. — prin rescrierea din 15 oct.). **Niciuna nu e făcută în paginile deja
scrise de clienți** — deocamdată nu există niciun client care să-și fi publicat
politica, deci lista e curată. Dar din prima zi în care există unul, tabelul
ăsta devine o listă de treabă de făcut, nu un istoric.

### De verificat înainte de fiecare client nou

Că șablonul din `sabloane/politica-de-confidentialitate.md` descrie platforma
așa cum e ÎN ZIUA ACEEA. Lista scurtă: ce câmpuri au formularele, ce furnizor de
anti-spam e configurat, de unde se încarcă fonturile, unde e găzduită baza de
date, dacă se trimit emailuri. Cinci întrebări, două minute.

## Ștergerea și exportul datelor

1 sept. 2026. Două butoane pentru două nevoi care se confundă des, dar n-au
nimic în comun.

**Ștergerea** e pentru datele ALTOR oameni. Prin GDPR, cine a lăsat un număr pe
site poate cere oricând să nu mai fie păstrat. Până acum se făcea de mână, în
baza de date, de proprietarul platformei — adică psihologul nu putea răspunde
singur, iar nicăieri nu rămânea urma că a răspuns.

Partea grea nu e ștergerea, e POTRIVIREA. Același om își scrie numărul altfel de
fiecare dată: „0721 123 456”, „+40721123456”, „0040-721-123-456”. O căutare pe
text ar găsi o parte din cereri și le-ar lăsa pe celelalte, iar psihologul ar
rămâne convins că a șters tot. Se compară pe ultimele nouă cifre — atât are un
număr românesc fără prefix — și se caută în ambele câmpuri, telefon și email,
fiindcă cine lasă telefonul la o programare și emailul la newsletter e același
om. Probele din `e2e/date-personale.proba.mjs` țin asta pe loc, inclusiv cazul
cel mai periculos: o căutare goală care s-ar potrivi cu tot și ar mătura datele
tuturor pacienților dintr-o apăsare.

Ce nu era evident: **jurnalul de activitate conține nume.** Scrie propoziții ca
„Programarea lui Ion Popescu a fost confirmată”. O ștergere care lasă numele
acolo nu e o ștergere. Dar rândurile NU se șterg, se albesc: jurnalul e dovada
că nimeni n-a umblat pe ascuns în datele cabinetului, iar unul din care se pot
scoate rânduri nu mai dovedește nimic. Rămâne că s-a întâmplat ceva, dispare
cine. Albirea se face cu cheia de serviciu, fiindcă jurnalul e pentru client
doar de citit și de adăugat — și așa trebuie să rămână; excepția e o operație a
platformei, cerută de lege, și ea însăși lasă o intrare în jurnal.

Ștergerea e ADEVĂRATĂ, nu `deleted_at`. Mesajele au și un coș, de unde se pot
recupera — dar o cerere GDPR nu înseamnă „mută la coș”.

Ecranul nu caută după NUME, dinadins: doi oameni pot fi „Ion Popescu”, iar o
ștergere greșită nu se mai poate da înapoi. Numai că asta lăsa o gaură — cererea
vine la telefon, iar psihologul avea de umblat prin trei ecrane și un copy-paste
tocmai când are omul pe fir. De asta fiecare mesaj și fiecare cerere de
programare are un link „Șterge datele acestei persoane”, care duce la ecran cu
căutarea deja făcută. Link, nu buton cu ștergere pe loc: aceeași persoană poate
avea și mesaje, și programări, și o abonare, iar un buton pe un rând ar fi lăsat
impresia că s-a șters doar rândul acela. La programări linkul stă în afara
blocului cu „Confirmă/Refuză”, care se arată doar la cererile neapucate — o
cerere de ștergere vine de obicei pentru una veche.

**Exportul** e pentru datele CLIENTULUI: tot ce a scris el. Un JSON descărcat
dintr-o rută sub `/dashboard`, fiindcă un Server Action întoarce date către
pagină, nu un fișier către browser. Imaginile nu sunt în fișier — ar fi cerut un
arhivator și zeci de megaocteți — ci lista lor cu adresa fiecăreia.

De ce contează dincolo de lege: fără export, ce ține un client la noi nu e
calitatea produsului, ci faptul că n-are cum să-și scoată munca. Aia e o
legătură pe care n-o vrem.

Fișierul conține și datele primite de la oameni, într-o secțiune separată și cu
un avertisment scris în el: pe un laptop pierdut, e o scurgere de date pe care
legea o pune în seama cabinetului. Un export care le-ar fi omis în tăcere ar fi
fost însă mai rău — psihologul E operatorul lor și i se cuvin.

## Comutatorul de lansare, și de ce vine la pachet cu secțiunile aprinse

1 sept. 2026. Cele două nu se pot despărți, iar motivul e o consecință a
modelului de predare, nu o preferință.

Predarea e „site gol, clientul scrie tot, instructajul e un video”. Ca omul să
afle ce POATE avea pe site, toate secțiunile trebuie să pornească aprinse: ce nu
vede, nu știe că există, iar cineva care n-a mai lucrat cu un panou nu se duce
să caute secțiuni ascunse. E mai ușor să ștergi ce nu-ți trebuie decât să
ghicești ce ți-ar fi trebuit. Numai că un cabinet cu paisprezece secțiuni goale,
vizibil pe internet din clipa în care domeniul rezolvă, arată a site stricat —
și e primul lucru pe care l-ar vedea un pacient. Deci: comutator.

`sites.published_at` null = încă nu e lansat. Proxy-ul trimite vizitatorii la
`/nepublicat` — o pagină scurtă, cu numele cabinetului, fără glume cu șantiere;
poate fi primul lucru pe care îl vede un om care caută ajutor. Clientul logat
vede site-ul adevărat, cu o bandă deasupra care-i spune că doar el îl vede și pe
unde se publică. Publică singur, din Setări.

Ce trebuia gândit, nu doar scris:

- **Ce rămâne deschis pe un site nepublicat** stă în `src/lib/lansare.ts`, rupt
  de proxy ca să poată fi probat. Greșit într-o parte, clientul rămâne închis
  afară din propriul panou și nu-și mai poate publica site-ul fără să sune;
  greșit în cealaltă, un site nescris ajunge public. Amândouă tăcute.
  `/login`, `/dashboard`, `robots.txt` și `sitemap.xml` rămân; restul se ascunde.
- **`robots.txt` gol, `sitemap.xml` gol, `noindex` în layout** — toate trei, nu
  una. Un cabinet care intră prima dată în Google cu „pagina se pregătește”
  rămâne așa săptămâni: reindexarea nu se cere, se așteaptă.
- **Comutatorul e al clientului**, nu al nostru: `grant update (published_at)`
  lângă `name`, singurele două coloane pe care le poate scrie din panou.
  Verificarea 13 din `verificare-izolare.sql` ține dreptul ăsta viu — pierdut,
  butonul ar eșua tăcut.
- **Costul pe cerere e zero pe un site publicat.** `published_at` vine în
  aceeași interogare cu rezolvarea tenantului, iar verificarea „e proprietarul?”
  se face leneș, doar când site-ul chiar e nepublicat.
- **Politica de confidențialitate ciornă** dă un avertisment pe cardul de
  publicare, nu o piedică. Legea îi cere CLIENTULUI politica înainte să strângă
  date prin formulare, dar hotărârea când publică rămâne a lui.

Site-urile care existau la migrare rămân publicate: o migrare n-are voie să
stingă un site pe care îl vede lumea.

## Depozitul de fișiere e privat

1 sept. 2026. Bucket-ul `media` era public, iar politica de citire spunea
„oricine poate citi orice din el”, fără nicio despărțire pe cabinete. Nu doar că
un străin putea deschide o poză știindu-i adresa — putea cere **lista tuturor
fișierelor tuturor clienților**. Cerința proprietarului, fără nuanțe: un client
nu atinge niciodată fișierele altui client.

**Prima descoperire, din sursa serviciului de Storage** (supabase/storage,
`src/http/routes/object/`): `/object/public/…` rulează prin `asSuperUser()` și se
uită DOAR la steagul `public` al bucket-ului — nicio politică nu-l poate opri;
`/object/list/…` rulează sub rolul celui care cere, deci trece prin politici. Cu
alte cuvinte, cât timp steagul e aprins, strânsul politicilor nu apără citirea.
Trebuie stins steagul.

**A doua descoperire, care a hotărât forma soluției.** Prima idee a fost ca ruta
care servește pozele să citească tenantul din antetul pus de proxy și să verifice
acolo apartenența. Nu merge: optimizatorul de imagini din Next își cere singur
fișierul printr-o cerere construită în memorie, iar `fetchInternalImage` cheamă
`createRequestResponseMocks({ url, method, socket })` — **fără niciun antet**
(verificat în `node_modules/next/dist/server/image-optimizer.js` și
`lib/mock-request.js`). O rută care depinde de antetul de tenant s-ar fi rupt în
spatele optimizatorului — sau, mai rău, ar fi mers pe Vercel și ar fi căzut în
dezvoltare, adică exact felul de diferență care se descoperă în ziua lansării.

**Soluția: adresa se apără singură.** Bucket privat; pozele se servesc din
`/imagini/<uploadId>/<semnătură>`, o rută de-a noastră care descarcă fișierul cu
cheia de serviciu. Semnătura e un HMAC-SHA256 trunchiat la 16 octeți, cu cheia de
serviciu drept cheie — deci **nicio variabilă de mediu nouă**, adică nimic care
poate lipsi și nicio ispită de portiță „mergi și fără semnătură”. Nimeni din
afară nu poate fabrica adresa unei poze a altui cabinet.

Detaliile care nu se văd, dar contează:

- **SVG-ul.** Panoul acceptă SVG, iar un SVG poate conține `<script>`. Cât timp
  pozele veneau de pe supabase.co, un SVG rău intenționat rula pe domeniul LOR.
  Servite de noi, ar rula pe `cabinet.ro` — adică am fi mutat singuri o gaură de
  XSS pe domeniul clientului, tocmai prin schimbarea care trebuia să-l apere.
  Ruta trimite `Content-Security-Policy: default-src 'none'; sandbox` și
  `X-Content-Type-Options: nosniff`.
- **Adresele vechi** rămase în JSON-ul secțiunilor se rescriu la CITIRE, nu
  printr-o migrare de date: nu atingem conținutul oamenilor, merge deopotrivă pe
  rândurile vechi și noi, iar o adresă absolută rămasă acolo nu mai poate fi
  randată niciodată — se pierde, înlocuită cu cea derivată din `uploadId`.
- **`remotePatterns` e gol** în `next.config.ts`. Nu e curățenie, e încuietoare:
  cât timp gazda Supabase stătea acolo, o regresie care ar fi reintrodus adrese
  publice ar fi mers în tăcere.
- **Comparația semnăturii se face pe octeți**, nu pe caractere: `timingSafeEqual`
  aruncă pe lungimi diferite, iar un „ă” ocupă doi octeți — 22 de caractere pot
  însemna 23 de octeți. Fără paza asta, oricine putea face ruta să arunce.

**Ordinea la punere în producție:** întâi codul, abia apoi migrarea. Ruta nouă
merge și cu bucket public (descarcă tot cu cheia de serviciu), deci codul poate
sta liniștit înainte. Invers, migrarea ar stinge toate pozele de pe toate
site-urile până la deploy.

Verificările 11 și 12 din `supabase/verificare-izolare.sql` țin steagul stins și
politicile închise; probate că dau PICAT fără migrare.

## Anti-spam: de ce am plecat de la Turnstile la hCaptcha

Găsit pe 28 aug. 2026, verificând de ce nu apare caseta anti-spam pe site.
Cloudflare leagă o pereche de chei Turnstile de o listă de domenii, iar lista are
**maximum 10 intrări**. Metacaracterele NU sunt acceptate, deci
`*.platformata.ro` nu ține loc de nimic. Planul gratuit dă 20 de chei, adică
**200 de domenii cu totul**. Peste ele urmează Enterprise Bot Management, de la
**2.000 $/lună** — peste 108.000 lei pe an, adică mai mult decât tot venitul
recurent al unui produs cu 200 de clienți la 60 €/an (circa 60.000 lei). Nu e un
plan mai scump, e un capăt de drum.

(Cifra a fost recalculată pe 8 sept. 2026, odată cu prețul. Concluzia nu se
schimbă — se întărește.)

Am cântărit întâi un plan de ocolire: o pereche de chei la fiecare zece domenii,
douăzeci de variabile de mediu pentru două sute de clienți. **L-am aruncat pe
31 aug. 2026**, când s-a limpezit orizontul real — 200 de clienți în cel mult un
an, nu „peste ani”. Un ocol care se termină exact acolo unde ajungem oricum nu e
o soluție, e muncă făcută de două ori.

**Decizia: furnizorul implicit e hCaptcha.** La hCaptcha o cheie merge implicit
pe ORICE domeniu; lista de domenii e opțională și, când o pui, e nelimitată
(„some customers need to use many domains per sitekey”,
docs.hcaptcha.com/configuration). O singură pereche de chei ține toată platforma,
la 20 de cabinete ca și la 2.000, iar **un client nou nu se mai înregistrează
nicăieri** — ceea ce contează mai mult decât pare, fiindcă provizionarea unui
cabinet e o linie de SQL și trebuie să rămână așa. Gratis, cu aceeași poveste
GDPR pentru care alesesem Turnstile în locul reCAPTCHA (hCaptcha e al Intuition
Machines, nu al Google, și nu profilează pentru reclame).

**Lecția, care contează mai mult decât furnizorul:** anti-spamul e acum o
variabilă de mediu, nu cod. `src/lib/captcha.ts` ține tabelul celor doi
furnizori — adresa scriptului, obiectul global, numele câmpului ascuns, numele
opțiunii de limbă, endpointul de verificare — și e singurul fișier care se
atinge dacă vreunul schimbă regulile. `NEXT_PUBLIC_CAPTCHA_FURNIZOR` alege
(gol = hCaptcha); o valoare scrisă greșit cade pe implicit și lasă un avertisment
în jurnal, fiindcă un typo într-o variabilă de mediu n-are voie să închidă
formularele de pe toate site-urile. Probele din `e2e/captcha.proba.mjs` țin
implicitul și separarea câmpurilor pe loc.

Cheia publică ajunge oricum în pagină, deci n-are ce căuta ascunsă; secretul stă
într-o singură variabilă de mediu, `CAPTCHA_SECRET_KEY`. **Zero secrete per
client în bază** — n-are nicio legătură cu riscul discutat la plăți.

Ce NU verificăm: gazda din răspunsul furnizorului. Cheia publică fiind aceeași
pentru toate cabinetele, cineva ar putea teoretic s-o folosească de pe pagina
lui — dar tot ar trebui să rezolve o casetă la fiecare cerere, adică exact costul
pe care caseta îl impune oricum, iar plafoanele din bază mărginesc restul. O
comparație de gazde, în schimb, ar pica pe www vs. fără www, pe domenii cu
diacritice și în spatele proxy-urilor, blocând oameni adevărați. Câmpul
`hostname` există în răspuns dacă vreodată se schimbă socoteala.

De reținut și partea bună: de când formularele nu mai adună text liber și au
plafoane, spamul costă mai puțin decât înainte. Caseta e prima linie, dar nu mai
e singura.

## Analytics: de ce numărăm noi, și de ce nu numărăm oameni

Hotărât 27 aug. 2026, la cererea proprietarului: trebuie să meargă la sute de
clienți, fără configurare per client.

Asta a eliminat singură celelalte variante. Google Analytics ar fi cerut câte o
proprietate și un ID de măsurare per cabinet — sute de configurări manuale — plus
un banner de cookie-uri pe fiecare site. Vercel Analytics și Plausible amestecă
toți clienții într-un singur proiect și se plătesc pe trafic cumulat.

Numărăm în baza proprie: paginile se randează deja pe server la fiecare cerere,
`site_id` e știut din tenant, iar RLS-ul care izolează clienții e deja scris.
Un client nou are cifre din prima zi, fără ca cineva să atingă ceva.

**NU numărăm vizitatori unici.** Ar cere o amprentă din IP și browser, adică fix
urmărirea pe care șablonul de politică o exclude în numele clientului („nu pun
niciun cookie", „nu folosesc niciun program de urmărire”). Afișările pe pagină
răspund oricum la întrebarea pentru care se uită omul acolo: se citește ce scriu?
Politica de confidențialitate rămâne adevărată cuvânt cu cuvânt.

Vizitele proprietarului, când e conectat, nu se socotesc — altfel un psiholog
care își verifică pagina de zece ori seara ar vedea a doua zi zece „vizite” care
sunt el.

Ecranul e `/dashboard/vizite`. Migrarea `20260827100000_vizite.sql` TREBUIE
rulată în Supabase înainte ca ecranul să arate ceva.

## Intrarea în cadru a secțiunilor, la scroll (20 sept. 2026)

Proprietarul a întrebat de o animație pe care o văzuse pe referința „Dragoș
Geamănă" (aceeași sursă din care a fost adus șablonul Liniește) — secțiunile
apar cu un fade discret pe măsură ce dai scroll, nu direct, dintr-odată.
Verificat direct în fișierul original primit (`Dragos-Geamana-site.html`, nu
din memorie): sistemul chiar există acolo, în CSS —

```css
[data-reveal] { opacity: 0; transition: opacity 1100ms cubic-bezier(0.22, 0.61, 0.36, 1), transform ...; }
[data-reveal="fade"] { transform: translateY(30px); }
[data-reveal].is-in { opacity: 1; transform: none; }
```

— cu `--anim-distance: 60px`, `--anim-duration: 1100ms`,
`--anim-ease: cubic-bezier(0.22, 0.61, 0.36, 1)`. JS-ul care pune clasa
`is-in` (de obicei un `IntersectionObserver`) nu era în fișierul salvat —
doar CSS-ul definea sistemul, fără nicio folosire pe elemente reale în
export. Reconstruit cu mecanismul standard (observator care adaugă clasa o
singură dată, la prima intrare în ecran).

**Sferă: pe toate cinci șabloanele, nu doar Liniește** — decizia
proprietarului, contrar corecțiilor anterioare (care erau toate „piele":
culori, fonturi, așezări specifice unui singur șablon). Motivul lui, în
propriile cuvinte de arhitectură din 11 sept.: „funcție nouă → disponibilă la
toți, dar apare doar unde e folosită". O animație de intrare la scroll ține de
STRUCTURĂ (comportamentul componentei comune `Section`), nu de piele — deci se
construiește o singură dată, ca `SectionHeading`.

**Unde s-a pus, exact:** `data-reveal="fade"` pe conținutul din `Section`
(`section.tsx`), NU pe `<section>` însuși — fundalul colorat al benzii rămâne
static; doar textul/cardurile dinăuntru fac fade. Așa, nu apare o "gaură" cu
fundalul paginii dedesubt cât conținutul e încă invizibil. Un
`IntersectionObserver` (`reveal-la-scroll.tsx`, componentă client nouă) pune
clasa `is-in` prima dată când elementul intră în ecran, apoi se dezabonează —
nu repetă la fiecare intrare/ieșire.

**Trei plase de siguranță, toate verificate cu Playwright, nu presupuse:**
1. `prefers-reduced-motion: reduce` — regula CSS stă sub
   `@media (prefers-reduced-motion: no-preference)`, deci cine a cerut mai
   puțină mișcare nu intră deloc sub ea: conținutul e vizibil din capul
   locului, fără fade. Verificat cu un context Playwright cu
   `reducedMotion: "reduce"` — opacitate 1, fără scroll.
2. Fără JavaScript deloc — regula CSS tot s-ar aplica și ar ține conținutul
   invizibil la nesfârșit, fiindcă n-ar mai exista observatorul care pune
   `is-in`. `cadru-site.tsx` pune un `<noscript>` cu o regulă care anulează
   `[data-reveal]`. Verificat cu `javaScriptEnabled: false` — opacitate 1.
3. **Previzualizarea live din dashboard** (`CadruPrevizualizare`, folosită de
   cele cinci editoare: secțiuni, servicii, pagini, blog, setări) randează
   conținutul într-un `<iframe>` fără derulare (`scrolling="no"`) — nimic nu
   „intră în ecran" acolo, niciodată, deci fără o plasă separată fiecare
   previzualizare ar fi rămas cu secțiunile invizibile la nesfârșit. Fixat o
   singură dată, în `copiazaStiluri` din `cadru-previzualizare.tsx`: o regulă
   `!important` injectată în documentul iframe-ului anulează `[data-reveal]`
   — previzualizarea rămâne instantă, cum trebuie să fie un instrument de
   scris. Verificat cu o pagină de probă temporară care randează
   `CadruPrevizualizare` izolat.

`/proba-vanzari` (oglinda site-ului de vânzări) primește și ea animația
(`RevealLaScroll` montat acolo) — spre deosebire de previzualizarea din
panou, pagina asta chiar se derulează ca site-ul adevărat, deci comportamentul
corect e să arate LA FEL, nu instant.

Tipuri, lint, cele 218 probe și build-ul trec.

## Scor Lighthouse: LCP și greutatea paginii (21 sept. 2026)

Proprietarul a rulat Lighthouse (pe `cosmin-claritate`, dar codul e comun tuturor
șabloanelor) și a cerut ajutor la scorul de performanță: LCP 4,2s, TBT 270ms,
Speed Index 5,0s. Două cauze, amândouă ale noastre, amândouă reparate.

**1. hCaptcha (~730 KiB) se încărca pe prima pagină, degeaba.** Formularele de
newsletter și contact stau pe prima pagină, dar sub primul ecran. `Caseta`
pornea SDK-ul hCaptcha la montare, deci un site abia deschis descărca ~730 KiB
de captcha (`hsw.js` 439 KiB + `hcaptcha.html` 188 KiB + `api.js` 100 KiB) —
aproape jumătate din toată greutatea paginii (1.576 KiB) — înainte ca omul să
apuce să vadă titlul. Ținea lanțul critic (`checksiteconfig` la 4,1s), TBT-ul
(taskuri de 131ms + 106ms) și munca pe firul principal.

Reparat: componentă nouă `CasetaAmanata` (în `captcha.tsx`), pusă în locul lui
`Caseta` în toate cele patru formulare (newsletter, contact, programare rapidă,
pagina de programare). Montează widgetul abia când locul lui ajunge la ~800px de
ecran (IntersectionObserver, deci e încărcat până derulezi la el) SAU la primul
focus/atingere a formularului din jur. Unde formularul e deja pe primul ecran,
observatorul pornește pe loc — nu se pierde nimic. Verificat cu Playwright, pe o
pagină de probă cu formularul mult sub fold: 0 scripturi hCaptcha la încărcare,
1 după ce derulezi la formular (înainte se încărca imediat).

**2. Animația de scroll ținea titlul hero (LCP) invizibil.** Regresie a
mecanismului de fade adăugat pe 20 sept.: `Section` pune `data-reveal` pe
conținut, iar CSS-ul îl pornea `opacity: 0` până când JS-ul punea clasa care-l
arată. Titlul din hero — elementul LCP (un `span`) — pornea deci invizibil și
aștepta încărcarea + hidratarea + observatorul: exact „element render delay ~3s"
din raport. FCP era 1,1s (antetul, care nu e într-un `Section`), dar LCP sărea
la 4,2s — fix gaura asta.

Reparat prin inversarea logicii (`reveal-la-scroll.tsx` + regula din
`globals.css`): starea implicită e acum VIZIBILĂ. JS-ul pune clasa de ascundere
(`reveal-ascuns`) DOAR pe `[data-reveal]`-urile care sunt sub primul ecran; ce e
deja pe ecran (hero-ul) nu se atinge și se pictează din primul cadru. Fade-ul sub
fold rămâne neschimbat. Verificat cu Playwright: hero `opacity: 1` la încărcare;
`#pareri` (sub fold) pornește `opacity: 0` + `reveal-ascuns`, apoi ajunge la 1
după scroll.

Bonus curat: fiindcă starea implicită e vizibilă, au dispărut două cârlige de
dinainte — plasa `<noscript>` din `cadru-site.tsx` și suprascrierea injectată în
iframe-ul de previzualizare din panou (`cadru-previzualizare.tsx`). Fără JS: 0
secțiuni ascunse (verificat). Previzualizarea din panou: vizibilă din oficiu,
fără hack.

**Ce NU e al nostru** (spus proprietarului): zgomotul din raport de la
`chrome-extension://…` (reader_mode.js, video_toolbar.js etc.) vine din
extensiile browserului lui, nu din site — un Lighthouse rulat în Incognito, cu
extensiile oprite, curăță o parte din „unused JS" și TBT. Rămân, ca îmbunătățiri
mai mici de luat separat dacă se dorește: polyfill-uri legacy (~27 KiB, din
target-ul de build) și cele 7 fonturi woff2 (~390 KiB) — `font-display` e deja
`swap` (audit trecut).

Tipuri, lint, cele 218 probe și build-ul trec.

### Îmbunătățirile mai mici: fonturi și polyfill-uri (21 sept. 2026)

Făcute după cele două de mai sus, la cererea proprietarului, înainte de merge.

**Fonturile nu se mai preîncarcă degeaba.** Cele șase fonturi ale șabloanelor se
declară toate într-un fișier (`fonturi.ts`), iar `next/font` le preîncărca pe
TOATE pe fiecare pagină — ~16 fișiere woff2 (~390 KiB) — deși un site folosește
doar fonturile șablonului lui (două). Plus cele două Geist ale panoului, care pe
site-ul public nici nu se folosesc (textul e cu fontul șablonului). Pus
`preload: false` la toate opt (șase în `fonturi.ts`, două Geist în `layout.tsx`).
Fonturile rămân AUTO-GĂZDUITE (descărcate la build, servite de pe domeniul
clientului — GDPR-ul neatins, vezi comentariul lung din `fonturi.ts`); doar
dispare `<link rel=preload>`. Fontul șablonului activ se încarcă tot, leneș, prin
`@font-face` + elementul care-l cere, iar `display: "swap"` arată textul imediat,
deci LCP-ul nu suferă. Verificat: 0 preload-uri de fonturi în HTML (erau 16), iar
titlul se randează tot cu fontul corect (Inter pe „Claritate"), cu doar 3 fonturi
încărcate în loc de 16.

**Polyfill-uri legacy scoase printr-o țintă de browsere.** Fără `browserslist`,
Next țintea browsere foarte vechi și transpila funcții pe care toate browserele
din ~2022 încoace le au deja (Array.at/flat/flatMap, Object.fromEntries/hasOwn,
String.trimStart/trimEnd) — ~27 KiB de cod inutil (raportul Lighthouse). Adăugat
`browserslist` în `package.json` cu praguri fix acolo unde a apărut cea mai nouă
dintre funcțiile astea (Object.hasOwn: Safari 15.4, Chrome/Edge 93, Firefox 92).
Compromisul, scris pe față: un vizitator pe un browser mai vechi de-atât
(fracțiune de procent în 2026) nu mai primește polyfill-urile — dacă se dorește
altfel, e o linie de schimbat în `package.json`.

Tipuri, lint, cele 218 probe și build-ul trec.

## Hero cu poză lată pe Căldură și Claritate (21 sept. 2026)

Proprietarul a cerut ca, pe „Căldură" și „Claritate", poza din hero să fie mult
mai mare — fiindcă acolo poza NU va fi un portret, ci cabinetul / spațiul de
terapie, care are nevoie de lățime. Iar textul și butonul „Programează o ședință"
să stea SUB poză, nu în dreapta ei.

Așezare nouă `pozaLata` (a treia valoare a `AsezareHero`, lângă `titluLat` și
`textPozaDreapta`): titlul lat sus, o poză peisaj (16/9) pe TOATĂ lățimea
conținutului sub el, iar dedesubt textul (subtitlul, păstrat în serif italic ca
înainte) și butonul — CENTRATE, la mijlocul pozei (cerut de proprietar).
Pornită DOAR pe `caldura.ts` și `claritate.ts` — celelalte
trei (Liniște, Lumină, Apropiere) rămân pe `textPozaDreapta`, neatinse.

Detalii de implementare (`hero.tsx`): poza lată ia `aspectRatio: 16/9` și
`sizes` de lățime plină, în loc de pătratul de 45–47% de la celelalte așezări;
rotunjire simplă (`var(--t-raza)`), nu arcada înaltă; titlul rămâne pe mărimea
mare (ca la `titluLat`), fiindcă e pe toată lățimea, nu lângă poză. `object-fit:
cover` taie ce nu încape, iar punctul focal tras din panou ține cadrul potrivit —
important, fiindcă o poză de cabinet reală rareori e fix 16/9.

Verificat vizual, ambele șabloane randate una sub alta cu o poză de probă lată:
titlu mare → poză lată pe toată lățimea → subtitlu serif italic → buton
(albastru la Claritate, cărămiziu la Căldură). Cele trei șabloane pe
`textPozaDreapta` sunt neatinse (fiecare schimbare din `hero.tsx` e păzită de
steagul `pozaLata` sau se reduce la comportamentul de dinainte).

Tipuri, lint, cele 218 probe și build-ul trec.

## Logoul pulsează la schimbarea paginii (21 sept. 2026)

Clipa cu logoul la trecerea între pagini (`tranzitie-logo.tsx`) exista deja —
la un clic pe un link intern, ecranul se acoperă cu logoul pe fundalul
șablonului cât se încarcă pagina nouă. Proprietarul a cerut ca logoul să
PULSEZE (să „respire") cât timp se încarcă, ca semn că se lucrează, nu că s-a
blocat.

Adăugat `@keyframes puls-logo` în `globals.css` (scale 1 → 1,08 și opacitate
0,82 → 1 și înapoi, 1,1s, ritm calm) și aplicat pe `<img>`-ul logoului din
overlay. Pulsul se oprește cât cade overlay-ul (`iese`), ca ieșirea să rămână o
simplă stingere, nu o zvâcnire. Nu e sub `prefers-reduced-motion`, dar nici nu
trebuie: overlay-ul care poartă logoul nu se arată deloc la cine a cerut mai
puțină mișcare (gardat deja în `tranzitie-logo.tsx`), deci pulsul nu apare.

Verificat cu componenta reală, forțând overlay-ul să se arate prin semnalul din
`sessionStorage`: logoul e vizibil și pulsează — scale-ul măsurat trece prin
1,01 → 1,07 și opacitatea prin 0,84 → 0,98 de la un cadru la altul.

Tipuri, lint, cele 218 probe și build-ul trec.

## Rupturile de rând scrise de client se văd pe site (21 sept. 2026)

Proprietarul a scris subtitlul din hero pe două rânduri (Enter între propoziții)
și pe site apărea pe unul singur. Cauza: din oficiu, o rupere de rând într-un
paragraf HTML e tratată ca un spațiu. În casetele mari din panou Enter chiar
coboară rândul (sunt `<textarea>`), dar afișarea îl înghițea.

Reparat cu o regulă în `globals.css`: `[data-reveal] p, [data-reveal] blockquote
{ white-space: pre-line }`. `pre-line` păstrează rupturile intenționate și doar
pe ele — șirurile de spații tot se string, rândurile tot se rup singure la
marginea coloanei. Ținta e `[data-reveal]`, învelișul de conținut pus de
`Section` la FIECARE secțiune, deci regula prinde peste tot: site viu,
`proba-vanzari` ȘI previzualizarea din panou (unde s-a și văzut problema, fiindcă
iframe-ul copiază foaia de stil). Doar paragrafe și citate — titlurile
(`h1/h2/h3`) și butoanele (`a`) rămân neatinse.

Corpul de articol/servicii (`CorpText` + `blocuriText`) nu e afectat: acolo
parserul taie deja fiecare rând într-un paragraf separat (regula „un rând nou =
un paragraf nou"), deci un `<p>` de-al lui n-are rupturi în interior pe care
`pre-line` să le arate. Verificat vizual: subtitlul scris pe două rânduri apare
pe două rânduri, exact unde a fost apăsat Enter.

Tipuri, lint, cele 218 probe și build-ul trec.

## Galeria de șabloane de pe sitepsihologi.ro: cartonaș „vitrina" (21 sept. 2026)

Proprietarul a arătat referința `softwaves.ro` — cartonașe cu poza mare, într-un
cadru care imită o fereastră de browser (puncte + bară de adresă), cu numele
scris PESTE poză — și a cerut asta pentru galeria de șabloane de pe
`sitepsihologi` (secțiunea „Programe și materiale"). Cerința, cuvânt cu cuvânt:
„nu avem nevoie de scrisul ăla «Crem cald și cărămiziu…». Avem nevoie doar de
denumirea șablonului."

**Sferă, confirmată explicit de proprietar**: STRICT pe `sitepsihologi`, nu pe
secțiunea „Programe și materiale" a tuturor clienților — acolo un psiholog cu
un retreat real are nevoie de descrierea completă (dată, loc, câte locuri), nu
doar de-o poză. Deci nu s-a schimbat comportamentul implicit al secțiunii, s-a
adăugat o a doua formă, pornită STRICT prin `variant`, la fel ca `"linie"` de
la „Serviciile mele".

Adăugat `CartonasVitrina` în `portfolio.tsx`, pornit când rândul din
`site_content` are `variant = 'vitrina'`:

- caseta fixă 16/9, poza o umple, aliniată SUS — vezi §„Cum arată poza în
  cartonașul «vitrina»" mai jos; și grilă pe **două** coloane,
  nu trei (`minmax(min(100%, 400px), 1fr)` — `min(100%, …)` ca pragul de 400px
  să nu scoată cartonașul din ecran pe telefon; măsurat: la 390px lățime nu
  apare derulare laterală). Pe trei coloane, captura unui site întreg ajungea o
  miniatură din care nu se înțelegea nimic;
- colțuri rotunjite la `max(var(--t-raza), 18px)` — Claritate are 6px și lăsa
  cartonașele aproape drepte;
- captura se face pe FEREASTRĂ (`Alt + PrtScn`), nu cu dreptunghi tras cu
  mâna — un decupaj din ochi taie marginea albă din stânga a paginii, și se
  vede pe cartonaș;
- **fără nicio bară deasupra pozei.** A existat o vreme o ramă care imita o
  fereastră de browser (trei puncte + bară de adresă cu domeniul scos din
  `buton.href`). A căzut în două trepte, amândouă cerute de proprietar:
  întâi adresa — demo-urile stau pe `.vercel.app`, iar
  „cosmin-caldura.vercel.app" scris mare pe site-ul care vinde produsul arăta
  a lucru neterminat — apoi toată rama, fiindcă la referință nu e.
  **De notat, fiindcă s-a întâmplat de două ori la rând:** rama a fost o
  presupunere de-a mea despre cum arată softwaves.ro, corectată de cineva care
  chiar îl vede. Mediul de lucru n-are ieșire la internet (nici `WebFetch`,
  nici `curl`, nici Playwright nu ajung afară), deci o referință se citește din
  ce spune proprietarul și din capturile lui, nu din ce-mi închipui eu;
- numele șablonului scris PESTE poză, colț dreapta-jos, pe un voal întunecat
  ținut jos și scurt (se stinge pe la 62% din înălțime): captura e marfa, iar
  un voal întins pe jumătate de cartonaș ar întuneca exact partea de site pe
  care omul vrea s-o vadă;
- **tot cartonașul e link**, dacă elementul are `buton.href` — nu un buton
  într-un colț. La referință dalele se apasă întregi, iar un buton în plus ar
  fi fost exact textul pe care proprietarul l-a scos. Nici textul butonului,
  nici adresa nu se afișează nicăieri; din `buton` se folosește doar `href`. Fără `href`, cartonașul
  arată IDENTIC, doar că nu duce nicăieri — galeria e la fel și înainte, și
  după ce fiecare șablon-demo își primește adresa;
- nimic altceva: fără etichetă, detalii, descriere, materiale sau bandă cu
  buton sub poză.

Cartonașul obișnuit (fără `variant`, cazul oricărui client cu un retreat/
workshop real) e NEATINS — codul lui vechi a rămas identic, doar învelit
într-un `if`, iar grila lui a rămas pe pragul vechi de 320px. Singura regulă
nouă de CSS e `.cartonas-vitrina:hover` (ridicare de 4px, doar unde există
maus și doar dacă nu s-a cerut mai puțină mișcare) — un cartonaș-link fără
niciun semn că e link nu se apasă.

**Ce mai trebuie ca să arate ca la referință.** Două lucruri, niciunul de cod:

1. **Capturile adevărate.** Deocamdată cele cinci poze sunt desene SVG cu
   „exemplu — aici va veni o captură adevărată" scris în ele, iar desenul are
   și numele șablonului scris înăuntru — deci numele apare de două ori, o dată
   desenat și o dată peste poză. Dispare de la sine la prima captură adevărată.
   Cum se fac capturile: vezi §„Unde am rămas (7 oct. 2026)" (secțiunea „Capturi elocvente…" nu a fost niciodată scrisă).
2. **Adresele demo-urilor**, ca să se poată apăsa cartonașele. Se scriu din
   panou: Secțiuni → „Programe și materiale" → fiecare program → câmpul
   „Buton" → adresa (ex. `https://cosmin-caldura.vercel.app`). Textul butonului
   poate fi orice, nu se vede. Pașii pentru a da o adresă unui demo: vezi
   §„Cum dai o adresă unui șablon-demo".

### Bulinele de peste poză: fără emoji (4 oct. 2026)

Proprietarul n-a înțeles cum se pune un emoji în bulină (a scris `:)`, care a
apărut ca atare pe poză), apoi a cerut să fie scos. Câmpul „Emoji" e scos din
panou, iar cercul cu emoji din bulină nu se mai desenează, pe toate șabloanele;
un emoji rămas în conținutul vechi nu mai apare. Bulina rămâne cu rândul mic și
rândul mare. Verificat pe pagină cu o bulină care avea `:)` salvat.

### Reperele de sub „Despre mine": cel mult trei, pe un rând (4 oct. 2026)

Proprietarul, pe Căldură: a adăugat un al treilea reper și nu apărea; apoi, cu
textul completat („fdgfddgfdgdfdf"), ieșea din pagină în dreapta. Două lucruri
diferite:

- **nu apărea** fiindcă „Textul mare" era gol — un reper fără el nu se afișează
  (așa era și înainte). Textul de ajutor al câmpului spune acum asta;
- **ieșea din pagină** fiindcă un cuvânt lung, fără spații, nu încăpea în
  coloană la 38px, iar grila îl lăsa să depășească.

Acum (la toate șabloanele — e așezare, nu înfățișare):
- **cel mult 3** în panou (era 4), verificat și pe server; pe site se văd primele
  trei chiar dacă un conținut vechi are patru (la următoarea salvare, panoul cere
  ștergerea celui în plus);
- pe ecran lat, **toate pe un rând** (`.repere-rand`, câte coloane sunt repere);
  pe telefon, cât încap (două + unul);
- **textul mare se micșorează** cât să încapă cel mai lung cuvânt din rând,
  aceeași mărime la tot rândul: `min(mărimea de dinainte, lățimea reperului /
  (litere × lățimea unei litere))`. Lățimea literei e a fontului șablonului,
  măsurată (`--t-latime-litera-secundar` în `fonturi.ts`): un singur factor
  micșora prea mult scrisul îngust de la Apropiere și prea puțin pe cel lat de
  la Claritate.

**„Domenii / teme", tot atunci.** Proprietarul a scris „Traumă" pe Căldură și
nu s-a întâmplat nimic: temele se afișau DOAR pe Apropiere, deși câmpul e în
panoul tuturor (iar textul de ajutor chiar spunea „pe șablonul Apropiere").
Acum apar peste tot, sub text: pe Apropiere pastila plină de dinainte, la
restul pastila doar conturată, în culorile tonului. Contrast măsurat: 5,7–10,7:1.
Textul de ajutor nu mai pomenește șablonul — regulă ținută de probă: niciun
text de ajutor din secțiuni nu pomenește un șablon.

Măsurat cu reperele din captura proprietarului, pe toate cinci șabloanele, la
1280px și 390px: niciun text nu iese din reperul lui. La Căldură, cu cuvântul de
14 litere, textul mare ajunge la 22,6px; cu cuvinte obișnuite rămâne mai mare.

### Biblioteca: „X" pe fiecare poză, pentru ștergere rapidă (5 oct. 2026)

Cerut de proprietar, pe toate șabloanele: ștergerea unei poze să nu mai ceară
deschiderea ei întâi (clic pe poză → „Șterge imaginea"). Fiecare miniatură din
grilă are acum un „×" în colț, mereu vizibil (pe telefon nu există hover).

**Nu șterge pe loc.** O poză folosită pe site e scoasă și de acolo, iar asta
trebuie spus înainte. „X"-ul duce la ACELAȘI dialog ca butonul din panou
(`dialog-stergere-imagine.tsx`, scos din `panou-imagine.tsx`): „Folosită în
Despre mine… O scoatem și de acolo". Dacă cele două locuri și-ar fi avut fiecare
dialogul, unul ar fi ajuns, la prima schimbare, să șteargă fără avertizare.

„X"-ul e FRATE al butonului cardului, nu copil (buton în buton e HTML invalid, și
un clic pe „X" ar fi selectat și poza). Verificat pe pagină, cu server fals: clic
pe „X" pe o poză folosită → avertizarea apare, poza nu se selectează; „Păstrează"
nu șterge nimic; pe una nefolosită, „Șterge definitiv" o scoate din bază și din
grilă. Văzut pe 1280px și 390px. Rămâne neverificat pe baza reală.

### Mărimea potrivită a pozelor, scrisă în panou (6 oct. 2026)

Cerut de proprietar: „treci dimensiunile potrivite în secțiunea de hero și peste
tot în panou", după ce a întrebat mai întâi care sunt. Panoul spunea doar „cel mult
5 MB". Mai rău, la poza din hero scria „merge cel mai bine una pătrată sau
verticală", deși la **Căldură și Claritate** poza de acolo e **lată (16:9)** — un
text fals pentru două șabloane din cinci (și, probabil, rădăcina încadrării greșite
din hero prinsă mai devreme).

- **Un singur loc pentru cifre:** `src/lib/dimensiuni-poze.ts` (`DIMENSIUNI_POZE`,
  `textDimensiuni`, `dimensiuniPozaSectiune`). Aceleași condiții ca `raportRamei`
  din `rame-poze.ts` (forma ramei depinde de șablon și de varianta rândului).
- **Cum s-au ales:** forma = cea de pe site; „recomandat" = lățimea maximă de pe
  site × 2 (ecrane dense), rotunjită; „cel puțin" = lățimea de pe site la 1×. Peste
  ~2000 px nu câștigi nimic (optimizatorul nu servește mai mult). Sunt
  recomandări: nimic nu se respinge la încărcare.
- **Valori:** hero lat 2000×1125 (min 1200×675); hero pătrat 1200×1200 (700×700);
  „Despre mine" 4:5 → 800×1000 (500×625), cerc la Claritate 700×700 (400×400);
  poza serviciului 16:7 → 1800×790 (1000×440); imaginea articolului 16:9 →
  1600×900 (1000×563); apariții și vitrină 16:9 → 1200×675 (800×450); program 3:2
  → 1200×800 (800×533). Logoul a rămas cu textul lui.
- **Textul depinde de șablonul clientului și nu pomenește niciun nume de șablon**
  (regula de la poza serviciului, 3 oct.). La șablonul cu cerc pe prima pagină,
  textul serviciului spune și că cercul ia doar mijlocul pozei.
- **Cablare:** `CampuriSectiune` primește `dimensiuniPentru` (are întâietate față
  de `dimensiuni` din schemă); o dau editorul de secțiuni, cel de servicii și cel
  de articole. Hintul de la poza din hero a fost făcut neutru.
- **Probă:** `e2e/dimensiuni-poze.proba.mjs` (9 teste: forma cifrelor = forma ramei,
  minim < recomandat ≤ 2048, urmează șablonul ca `raportRamei`, fără nume de
  șabloane, cablarea); cade când se strică un raport sau se inversează hero-ul.
  În panou, cu Supabase fals fără poze: textul potrivit apare la hero, „Despre
  mine" și serviciu pe un șablon lat și unul pătrat. **Nevăzut:** câmpul din editorul
  de articole (același mecanism, nerulat pe pagină) și baza reală.

### Blog: articolele se mută trăgând mânerul „⋯" (5 oct. 2026)

Cerut de proprietar: „din meniul din care se scriu articolele, să apeși pe 3
puncte la fiecare articol și să-l poți urca/coborî". Întâi am făcut un meniu cu
„Mută mai sus / mai jos"; după ce l-a încercat, a cerut altceva: „ții apăsat pe
cele trei puncte și muți sus sau jos, drag and drop" — deci meniul a fost scos și
înlocuit cu tragere (componenta `meniu-actiuni.tsx` a fost ștearsă). Până atunci blogul se
aranja singur, după data publicării, iar lista din panou fusese făcută FĂRĂ
mutare tocmai pe motivul ăsta („ordinea într-un blog e cronologia"). Decizia e
acum inversată, la cererea lui.

- **Migrare nouă, de rulat în Supabase:** `20261005120000_ordine_articole.sql` —
  coloana `blog_articles.position` (`integer not null default 0`), umplută pentru
  articolele existente cu EXACT ordinea de până acum (după dată, în pași de 10),
  deci cine nu mută nimic nu vede nicio schimbare. Probată pe bancul local
  (`proba-locala.sh`, apoi pe date cu două site-uri și o ciornă). Fără ea,
  pagina Blog din panou dă eroare la citire.
- **Ordinea**, în trei locuri identice (probat): `position` crescător, apoi
  `published_at` descrescător (fără dată la coadă), apoi `created_at` descrescător.
  Panoul n-o mai ia după „ultima atingere" — lista din panou și blogul public
  trebuie să arate la fel, altfel mutarea n-ar avea un rezultat vizibil.
- **Articolul nou** se pune primul (`poziția minimă − 10`), deci „cel mai nou
  primul" rămâne purtarea implicită. Publicarea unei ciorne scrise mai demult NU
  o mută în față (înainte o muta, fiindcă ordinea ieșea din data publicării).
- **Mutarea** (`mutaArticolul(id, inaintea)`, acțiune de server): „pune-l ÎNAINTEA
  articolului X" (sau la coadă, cu `null`) — o țintă numită, nu un index, ca un
  panou rămas deschis cu o listă veche să nu mute pe alt articol. Citește ordinea
  din bază și renumerotează lista (10, 20, 30…), scriind doar rândurile care se
  schimbă. Renumerotarea, nu schimbul între vecini, fiindcă la poziții egale
  (rândurile seedate au toate 0) schimbul ar putea sări peste un al treilea
  articol. Răspunde cu ordinea rezultată, iar panoul se potrivește cu ea. Se
  salvează pe loc, fără bară de jos, ca publicarea de pe același rând.
- **Tragerea** (`lista.tsx`): evenimente de pointer pe mânerul „⋯", nu `draggable`
  nativ (acela nu merge pe telefon). `touch-none` pe mâner (altfel degetul
  derulează pagina), `setPointerCapture`, rândul tras urmărește pointerul cu
  `transform`, restul stau pe loc, o linie arată unde ajunge. Locul se alege după
  MIJLOACELE celorlalte rânduri (`locDeLasare`), măsurate o dată la apăsare, în
  coordonate de pagină; lângă marginea ecranului pagina derulează singură. Escape
  anulează; o simplă apăsare fără mișcare nu mută nimic. Pentru cine nu poate trage:
  același mâner răspunde la săgețile sus/jos (`tintaPentruPas`), iar focusul rămâne
  pe el după mutare. Cu un singur articol mânerul nu apare.
- **Secțiunea „Articole recente" de pe prima pagină** arată primele articole din
  AȘA ordine, nu neapărat cele mai noi. Numele ei a rămas; dacă proprietarul vrea,
  se poate schimba în „Articole" sau similar.

**Verificat:** `e2e/ordine-articole.proba.mjs` (15 teste: aritmetica mutării,
egalități, liste vechi, săgeți, locul de lăsare, mutări repetate, cele trei ordonări
identice, migrarea; cade când se scoate ordonarea după poziție). În browser, cu
Supabase fals care ține starea: tragere cu mouse-ul în jos și în sus, o apăsare
simplă nu mută nimic, Escape anulează, săgeata jos de la tastatură, ordinea persistă
după reîncărcare, tragere cu degetul (evenimente touch prin CDP). Din prima variantă
(meniu), verificat pe aceeași cale: serverul care refuză → lista revine la loc cu
mesajul „Nu am putut muta articolul" (cod neschimbat de atunci). **Nevăzut:** tragerea
pe un telefon adevărat (doar emulată), derularea automată lângă marginea ecranului
(scrisă, neprobată). Migrarea a fost rulată de proprietar pe baza reală, iar meniul
(prima variantă) l-a încercat acolo și a spus că merge; tragerea nu a fost încă
încercată de el.

### Apropiere: programarea pe săptămână Luni–Sâmbătă (5 oct. 2026)

Cerut de proprietar după ce zilele nu mai cădeau singure pe rând: „luni trebuie să
fie prima, iar ultima zi sâmbăta". Până atunci grila arăta „următoarele șase zile
cu ore libere", cronologic — cu zilele lui, marți 6 … sâmbătă 10, apoi LUNI 12 —
deci Luni ajungea la sfârșit. Cererea avea mai multe înțelesuri (săptămână
calendaristică, zile sortate după ziua săptămânii cu date amestecate, sau tăiat
la sâmbătă); am întrebat, iar proprietarul a ales **săptămâna Luni–Sâmbătă**.

Acum grila arată mereu șase coloane în ordinea Luni → Sâmbătă. Săptămâna e cea a
PRIMEI zile libere (`cheileSaptamanii`, `src/lib/saptamana-programare.ts`, funcție
pură, cu 7 probe); zilele fără ore libere rămân în coloană, ESTOMPATE, cu „Fără
ore" — ordinea nu se strică, iar omul vede că ziua chiar n-are nimic. Serverul
construiește săptămâna (numele zilelor se scriu în fusul cabinetului, ca și
celelalte) și o trece prin `OreDePrimaPagina.saptamana` până la grilă.

Cu zilele din captura lui: Luni 5 (fără ore, estompată), Marți 6 … Sâmbătă 10;
„Luni 12" iese din grilă și rămâne la „Vezi toate zilele libere →" (link-ul apare
acum și când rămân zile libere în afara săptămânii, nu doar a șasea zi).

**Decizii pe margini, spuse deschis:**
- **Duminica** nu intră în grilă (ultima zi e sâmbăta, cerut). Duminica rămâne la
  „Vezi toate zilele libere"; dacă singura zi liberă a unui interval e duminica, se
  trece la următoarea săptămână care are o zi între luni și sâmbătă.
- Fără nicio zi liberă luni–sâmbătă, grila cade pe lista simplă de până la șase zile.
- Verificat pe pagină cu zile inventate (marți–sâmbătă + luni următoare), nu cu
  calendarul real al unui cabinet; construirea de pe server o acoperă probele pe
  sursă și funcția pură, nu un test cu baza de date.

### Apropiere: zilele din programare nu mai rămân singure pe un rând (5 oct. 2026)

Proprietarul: „așezarea pe zile nu e corectă" — cu șase zile, „Luni" cădea SINGURĂ
sub celelalte cinci, iar în dreapta rămânea gol. Reprodus pe o rută temporară de
probă (zile inventate, fără bază): la TOATE lățimile 6 zile ieșeau pe 2 rânduri.
Cauza: coloanele erau `repeat(auto-fill, minmax(90px, 1fr))`, iar grila are cel
mult ~577px (coloana din stânga e mai îngustă decât rezumatul) — încap 5 coloane
de 90px, nu 6. Regula nu știa că 5 + 1 arată prost.

Acum așezarea știe câte zile sunt (`--zile`, `data-zile`) și lățimea containerului
(`@container zile`, în `globals.css`): toate pe UN rând cât încap cu ~76px fiecare;
altfel se împart egal pe două rânduri, niciodată 5 + 1. Pragurile sunt lățimea la
care N coloane nu mai încap: 4 zile → 333px, 5 → 419px, 6 → 505px. O zi nu se
întinde peste 140px (cu una sau două zile, coloanele rămân coloane, nu benzi).

Măsurat pe pagină, la 1–6 zile și 1326/1000/390px: 6 zile → 6 pe laptop, 3 + 3 pe
telefon; 5 → 5 / 3 + 2; 4 → 4 / 2 + 2; nicio zi singură, nicăieri; nimic nu iese din
coloană (cea mai îngustă zi: 88px pe laptop). Selectarea unei ore și rezumatul din
dreapta merg ca înainte. Doar Apropiere are grila pe zile (`saptamana`).

**Neatins, dar vizibil:** sub zilele cu două ore rămâne gol când o zi are cinci
(sâmbăta); e natura unei grile pe coloane și n-a fost cerut.

### Căldură: „Întrebări frecvente" pe fundalul „relief" (5 oct. 2026)

Cerut de proprietar, cu o mostră: rgb(223,216,209) = #DFD8D1 = `fundalRelief` al
Căldurii (captura lui avea fundalul rgb(248,241,234) = `fundal` al Căldurii, deci
șablonul e Căldură — dedus din culori, nu spus de el). Steag nou `faqRelief`,
aprins DOAR la Căldură; celelalte șabloane își păstrează tonul rândului.

**Capcana prinsă la măsurare:** liniile dintre întrebări erau `--t-chenar`, care
la Căldură e IDENTIC cu fundalul relief (#DFD8D1) — pe noul fundal ar fi dispărut,
fără ca ceva să pară stricat. Acum, când secțiunea e pe relief, liniile se fac
din culoarea textului (`currentColor` 20%), ca în alte locuri unde chenarul n-are
contrast cu fundalul. Regula stă pe `tone === "relief"`, nu pe șablon: un rând
pus pe relief din altă parte ar fi avut aceeași problemă (la Liniște chenarul e
doar cu o treaptă mai deschis).

Măsurat pe pagină: fundal rgb(223,216,209); contrast text 11,4:1, text secundar și
„+" 4,5:1 (paleta Căldurii e făcută să treacă pe acest fundal). Liniște neschimbat.

### Banda cu citat pe fundalul „relief" — Căldură, Apropiere, Claritate, Lumină (5 oct. 2026)

Cerut de proprietar, cu o mostră de culoare. Măsurat pe ea: rgb(223,216,209) =
#DFD8D1 — exact `fundalRelief` al Căldurii, adică o culoare care exista deja în
șablon (o folosesc și testimonialele). Steag nou `citatRelief`, aprins DOAR la
Căldură: banda de citat stă mereu pe „relief", oricare ar fi tonul rândului;
celelalte șabloane își păstrează tonul. Măsurat pe pagină: fundal
rgb(223,216,209), text rgb(42,31,26), contrast 11,4:1.

**Apoi și Apropiere (5 oct. 2026), tot la cererea proprietarului, cu mostra
lui:** rgb(232,220,200) = #E8DCC8 = `fundalRelief` al Apropierii. Același steag,
aprins și acolo; măsurat pe pagină fundal rgb(232,220,200), contrast 8,9:1.

**Și Claritate (5 oct. 2026), tot cu mostră:** rgb(223,230,238) = #DFE6EE =
`fundalRelief` al ei; măsurat pe pagină exact rgb(223,230,238), contrast 14,7:1.

**Și Lumină (5 oct. 2026), cu mostră:** rgb(216,226,245) = #D8E2F5 =
`fundalRelief` al ei; măsurat pe pagină exact rgb(216,226,245), contrast 13,6:1.
Rămâne pe tonul rândului doar **Liniște** (nicio mostră primită — dacă o vrea,
e o linie de `asezari` și o mostră).

### Bulinele de peste poză plutesc (4–5 oct. 2026; întâi Căldură, apoi toate)

Cerut de proprietar, arătând bulina „Online și offline" din hero-ul Căldură:
„să se deplaseze ușor sus-jos, așa cum e la Dragoș Geamănă". Steag nou
`heroBulinePlutitoare`, aprins întâi DOAR la Căldură (tratament vizual → doar
unde s-a cerut). **A doua zi proprietarul a cerut explicit „pe toate
șabloanele"** — aprins la toate cinci; verificat pe Claritate că se mișcă, în
contratimp. Steagul rămâne, pentru un șablon viitor mai static.

Mișcarea de la referință n-a putut fi măsurată (site-ul nu se deschide din
mediul de lucru), deci valorile sunt alese, nu copiate: 8px, un ciclu de 4,5s,
lin la capete; a doua bulină pornește de la jumătatea ciclului, ca să nu urce
amândouă deodată. Doar `transform` — nu mișcă nimic din jur. Sub
`prefers-reduced-motion` stă pe loc. Măsurat pe pagină: 777–785px, adică 8px,
în opoziție de fază; cu mișcare redusă, fixă.

### Previzualizarea aduce în vedere poza pe care o așezi (4 oct. 2026)

Proprietarul, pe Căldură: trăgea de poza din hero și n-o vedea mișcându-se în
previzualizare. Cauza nu era rama (e 16/9 și în panou, și pe site — verificat),
ci FEREASTRA previzualizării: pe ecran lat stă lipită sus cât derulezi
formularul, iar hero-ul Căldură (titlu mare, apoi poza lată dedesubt) o făcea
mai înaltă decât ecranul. Poza rămânea sub marginea de jos, iar o fereastră
lipită sus nu se putea derula până la ea.

Acum:
- fereastra are cel mult înălțimea ecranului și se derulează în interior (și
  cu rotița, verificat — pagina nu se mișcă);
- când apeși pe ramă, muți poza cu săgețile sau schimbi „Mărime", fereastra se
  derulează singură până la poză (`src/lib/arata-poza.ts`), DOAR dacă poza nu
  se vede deja întreagă, ca să nu sară la fiecare pixel;
- ține cont de partea din fereastră care e pe ecran și de bara „Ai modificări
  nesalvate" de jos, care altfel acoperea poza.

**Fereastra fără bară a lăsat capătul secțiunii de nevăzut (5 oct. 2026).**
După scoaterea barei (mai jos), o secțiune mai înaltă decât ecranul rămânea cu
partea de jos inaccesibilă: proprietarul a pus a doua bulină, jos pe poza din
hero-ul Claritate, și n-o vedea nicăieri. Acum fereastra se derulează ÎMPREUNĂ
CU PAGINA, proporțional: cu formularul sus vezi începutul secțiunii, cu
formularul jos capătul ei — tot conținutul e accesibil, fără nicio bară.
Derularea cerută de o poză (`arata`) amuțește sincronizarea 1,5s, ca să nu fie
călcată. Măsurat pe Claritate: derulat la câmpul bulinei a doua, bulina a
trecut de la 0% la 100% vizibilă; tragerea pozei rămâne la 100%.

**Al doilea pâlpâit (5 oct. 2026, tot de la proprietar, în Edge).** După
repararea buclei barei (mai jos), în Edge tot pâlpâia la derularea PAGINII, deși
fereastra nu mai avea bara ei. În Chromium-ul probelor n-a putut fi reprodus
(zero schimbări de mărime la derulare, măsurat cadru cu cadru la 1875×963), deci
cauza exactă rămâne neconfirmată — cel mai probabil felul în care Edge
redesenează, la derulare, o fereastră derulabilă cu un iframe micșorat înăuntru.
Reparat prin scoaterea ferestrei derulabile de pe ecran lat: `overflow-y:
hidden`, fără bară deloc, exact ca înainte de 4 oct. — dar derulabilă DIN COD
(`scrollTo` merge pe `hidden`), deci aducerea pozei în vedere rămâne (verificat:
27% → 100% la apăsarea pe ramă). Ce se pierde: derularea cu rotița ÎN
previzualizare, care exista doar de pe 4 oct.

**Pâlpâitul care a urmat (5 oct. 2026, prins de proprietar).** Fereastra
derulabilă a adus o buclă: la anumite înălțimi de ecran, conținutul era cât
fereastra; apărea bara de derulare, lățimea scădea, previzualizarea se micșora
(scara urmează lățimea) și încăpea, bara dispărea, lățimea creștea, nu mai
încăpea — la fiecare cadru. Reprodus cu Playwright cu bare de derulare reale
(fără `--hide-scrollbars`, pus implicit de Playwright — de-aia nu se văzuse la
prima probă): la 876–884px înălțime, 29 de schimbări de lățime în 30 de cadre.
Reparat cu `scrollbar-gutter: stable` (locul barei e rezervat mereu); după, 0
schimbări pe toate înălțimile 600–1100px. **De ținut minte:** o probă vizuală
cu Playwright ascunde barele de derulare; când contează lățimea, se pornește cu
`ignoreDefaultArgs: ["--hide-scrollbars"]`.

Legătura e un eveniment pe `window`: rama și previzualizarea stau în ramuri
diferite ale paginii, iar formularul e folosit în patru editoare (secțiuni,
servicii, blog, setări) — merge în toate fără să treacă prin fiecare. Poza e
găsită în previzualizare după `data-poza`, pus pe `SectionImage`.

Măsurat pe drumul complet (editorul hero Căldură, Supabase fals, tras cu mouse-ul):
cu pagina sus, poza a trecut de la 60% vizibilă la 100%; cu pagina derulată, ca
în captura proprietarului, de la 76% la 100%, toată deasupra barei de salvare.

### Liniște: „Păreri" pe verde (3 oct. 2026)

Cerut de proprietar, cu o captură a culorii dorite (o bandă verde cu „Un gând",
cel mai probabil din model — în codul nostru nu există un asemenea fundal).
Măsurat pe ea: baza rgb(65,84,71), ușor mai deschisă spre stânga-sus
(71,90,77), mai închisă în dreapta (60,80,66); textul e chiar paleta Liniște
(titlu #F3EDE2, etichetă #C3CFB7). Reprodus în `FundalVerde`
(`testimonials.tsx`): diferă de captură cu cel mult 3–4 unități pe canal.

Steag nou `testimonialeVerde`, aprins DOAR la Liniște. Secțiunea primește tonul
închis (titlul deschis, `--s-*` de fundal închis) iar verdele se pune ca `decor`.

**Cardurile sunt albe, ca pașii din „Cum decurge colaborarea"** (cerut de
proprietar, cu o captură a unui pas): același fundal, chenar, rază și spațiu
interior, text închis din șablon. O primă variantă, cu carduri translucide
verzi, a fost înlocuită înainte de master; la ea textul mic ieșea la 4,1:1,
sub pragul de 4,5:1 — pe alb problema dispare. Proba compară valorile cardului
cu ale pasului, ca cele două să nu se depărteze în tăcere.

### Liniște: cardurile de servicii refăcute după model, măsurat pe pixeli (3 oct. 2026)

Proprietarul a pus alături o captură a modelului și una de la noi. Diferențele,
toate măsurate pe pixelii capturii, nu citite din ochi:

- **cercul**: la model ~83% din lățimea cardului, centrat, cu ~15% ieșit peste
  marginea de sus; la noi avea cel mult 200px, în colț. Pe 19 sept. măsurasem
  chiar noi cele ~82%, dar plafonul de 200px le anula;
- **gradientul** (observat de proprietar): cardul e uniform pe prima treime,
  apoi se închide treptat până jos, iar umbra trece și peste poză și inel.
  Măsurat pe model: rgb(43,52,49) sus → (19,26,21) jos; opacitatea umbrei ~0 la
  35%, ~0,3 la 50%, ~0,6 la 65%, ~0,8 la 85%. La noi: o singură culoare;
- **secțiunea** e închisă la model (rgb(30,43,36) = `--t-fundal-inchis` al
  Liniște); la noi era crem — acum forțată la ton închis, doar la Liniște;
- **titlul** mare, peste partea de jos a cercului; descrierea 2–3 rânduri;
  săgeata ~70px; **fără „Citește mai mult"** (săgeata face asta);
- **textul-fantomă** de jos: literă dreaptă și groasă, centrat (la noi era cu
  serife, aliniat stânga).

Două carduri pe rând pe ecran lat, ca la model. Mărimile sunt în `cqw` (procente
din lățimea CARDULUI): cardurile noastre ies mai înguste decât la model, iar un
titlu de 46px fix se rupea pe două rânduri — cu `cqw` totul se scalează împreună,
în proporțiile modelului.

Verificat după: gradientul nostru, la aceleași fracții de înălțime, diferă de
model cu cel mult 3 unități pe canal. Văzut pe 1485px și pe 390px, cu Supabase
fals și o poză de probă. Cardul fără poză păstrează gradientul și textul jos,
la aceeași mărime ca vecinii (`gridAutoRows: 1fr`), deci are mult spațiu gol
sus — arată uniform când fiecare serviciu are poză.

### Cartonașele de servicii: aceeași mărime, „Citește mai mult”, tăierea văzută în panou (3 oct. 2026)

Proprietarul, uitându-se la Apropiere: cartonașul „Evaluare psihologică” se
oprea la „…depistarea următoarelor:”. Cauza: cartonașul arăta doar PRIMUL RÂND
al descrierii (regula din 10 sept.), iar acolo primul rând anunța o listă
scrisă dedesubt. Clientul n-avea de unde ști, fiindcă editorul serviciului îi
arăta doar pagina de servicii, cu textul întreg.

Cerut, în cuvintele lui: „mărimea cartonașelor trebuie să fie aceeași. Adaugă
doar un citește mai mult, și utilizatorul trebuie să vadă când editează cum se
va vedea trunchierea, ca să știe cât să scrie.”

**Cum e acum:**
- cartonașul ia TOATĂ descrierea, rând sub rând (`textCartonas` din
  `src/lib/servicii.ts`), și o taie la 4 rânduri (`RANDURI_CARTONAS`) cu
  `line-clamp` — browserul taie, pe lățimea reală, cu „…”;
- caseta de text are mereu înălțimea a 4 rânduri, iar grila are
  `gridAutoRows: 1fr`, deci toate cartonașele ies la fel de mari. Măsurat:
  3 × 337×300 (Apropiere), 3 × 335×282 (Liniște), 3 × 337×298 (Căldură) pe
  1280px; la fel între ele pe 390px;
- „Citește mai mult” pe toate patru așezările (cartonaș simplu — unde înlocuiește
  „Află mai multe →” —, linie, Apropiere, Liniște). E text, nu link separat,
  pentru că tot cartonașul e deja link;
- editorul serviciului are în previzualizare comutatorul **Prima pagină / Pagina
  de servicii**, implicit Prima pagină. Arată toată secțiunea, cu vecinii
  adevărați și cu ce e scris acum în formular — fiindcă unde se taie depinde de
  lățimea cartonașului, iar lățimea, de câte sunt pe rând. Un serviciu care nu e
  pe prima pagină (ciornă, sau dincolo de „câte se văd”) ia locul ultimului
  cartonaș, cu o notă care spune de ce (`serviciiPentruPrevizualizare`).

**Cu pagina de servicii OPRITĂ nu se taie nimic** — n-ar exista alt loc unde să
se citească restul. Cartonașele rămân egale prin `1fr` (toate cât cel mai lung).
Înainte, în cazul ăsta, restul descrierii nu apărea nicăieri.

**De știut:** tăierea depinde de lățimea ecranului, deci în previzualizarea
„Laptop” (1180px) rândurile se pot rupe puțin altfel decât pe un monitor de
1280px. Ce se vede în panou e corect ca ordin de mărime, nu la cuvânt pe orice
ecran.

Am propus întâi, greșit, să mut titlul secțiunii la Servicii și apoi să tai și
mai mult (să las deoparte propoziția terminată în „:”). Proprietarul a respins
amândouă, pe bună dreptate: prima rupea regula „titlurile secțiunilor se
editează la Pagina principală”, a doua făcea invers decât cerea.

Ținute de `e2e/cartonas-serviciu.proba.mjs`. Verificat vizual pe paginile
reale, cu Supabase fals (vezi mai jos): site-ul pe trei șabloane și editorul
serviciului.

**Poza serviciului: pe prima pagină NU, cu excepția Liniște (3 oct. 2026).**
Pornit de la proprietar: a pus o poză la un serviciu pe Apropiere și n-a văzut-o
pe prima pagină, deși panoul scria „apare pe cartonașul serviciului". Starea
reală era amestecată: Căldură/Lumină/Claritate o puneau lată pe cartonaș,
Liniște într-un cerc mic, Apropiere deloc (din 18 sept., cartonașele
„Friendly"). Întrebat ce e mai bine din punct de vedere al designului, am
recomandat fără poză, iar proprietarul a hotărât așa:
- cartonașele de pe prima pagină sunt fără poză la Căldură, Lumină, Claritate,
  Apropiere; poza apare sus, pe pagina de servicii, la toate șabloanele;
- **Liniște rămâne cu medalionul rotund** („Liniște e bine așa cum e");
- textul de sub câmpul „Poză" spune acum exact asta — și e cel al ȘABLONULUI
  clientului (`campuriServiciuPentru`): pe Liniște „apare pe cartonaș, într-un
  cerc", pe restul „pe prima pagină, cartonașele sunt fără poză". O primă
  variantă pomenea „șablonul Liniște" tuturor; proprietarul a oprit-o pe bună
  dreptate — un client de pe Apropiere n-are ce face cu numele altui șablon.
  Regula, ținută de probă: textele din panou nu pomenesc niciun șablon.

Motivele, ca să nu se redeschidă din reflex: prima pagină are deja poze (hero,
„Despre mine", coperți de articol); pozele de serviciu ale unui psiholog sunt
de obicei de stoc și seamănă între ele; o poză pusă la UN singur serviciu făcea
toate cartonașele la fel de înalte, cu gol în cele fără poză (văzut în
capturi); pe telefon, fiecare poză adăuga ~230px de derulat. Când un cabinet
are poze proprii, bune și unitare pentru fiecare serviciu, decizia merită
reluată.

O reparație intermediară (poza pusă pe cartonașele Apropiere) a fost anulată
înainte de master, odată cu hotărârea de mai sus.

### Mesajul de limită la blog, servicii și pagini (3 oct. 2026)

Proprietarul a cerut harta tuturor limitelor din panou. Căutând-o, am găsit un
defect: la 500 de articole, 40 de servicii sau 50 de pagini, „+ Adaugă” trimitea
omul înapoi pe listă cu `?eroare=prea-multe` — iar niciuna dintre cele trei
pagini de listă nu citea parametrul. Pentru client, butonul părea că nu face
nimic. Nicio eroare, nicio tăiere: doar tăcere.

Acum fiecare pagină de listă afișează „Ai ajuns la limita de 40 de servicii.
Șterge unul ca să poți adăuga altul.” (cu pluralul corect: „500 de articole”,
„50 de pagini”).

**Două lucruri făcute dinadins, ca defectul să nu se poată întoarce:**

1. **Limitele au un singur loc**, `src/lib/limite-panou.ts`, nu constante private
   în fiecare `actions.ts`. Fișierele de acțiuni sunt `"use server”`, care nu pot
   exporta decât funcții asincrone — deci paginile nu aveau de unde să afle
   numărul, și un număr scris de mână în mesaj ar fi ajuns să mintă la prima
   schimbare. Tot acolo stă și valoarea parametrului (`EROARE_PREA_MULTE`).
   Defectul original era o nepotrivire între două capete (acțiunea trimitea,
   pagina nu asculta); acum capetele citesc din aceeași sursă.
2. **Proba citește sursa** (`e2e/limite-panou.proba.mjs`), fiindcă paginile cer
   Supabase și nu pot rula în Node: pentru fiecare ecran verifică că pagina
   citește `searchParams`, randează `<MesajLimita>` și folosește ACEEAȘI limită pe
   care o verifică acțiunea. Verificată că prinde: scoasă înadins linia din
   pagina blogului, a picat exact testul acela; restaurată, trece.

Mesajul e componenta `src/components/dashboard/mesaj-limita.tsx`; o valoare
necunoscută în adresă nu produce niciun mesaj.

**Văzut apoi pe paginile reale (3 oct. 2026), cerut de proprietar („testează să
vezi mesajul cu ochii tăi”).** Cu un Supabase FALS local (un server Node care
răspunde ca el, cu exact 40 / 500 / 50 de rânduri) și panoul adevărat în
`pnpm dev`: clic real pe „+ Serviciu nou”, „+ Articol nou”, „+ Pagină nouă” →
acțiunea refuză → `?eroare=prea-multe` → mesajul, pe 1280px și pe 390px. Înainte
de clic mesajul lipsește, iar cu `?eroare=altceva` nu apare nimic. Ce rămâne
neverificat: baza adevărată (numărătoarea e a serverului fals).

**Cum se face proba asta din nou** (pentru orice ecran din panou, nu doar
pentru limită): serverul fals pe portul 54321 răspunde la `/auth/v1/user` și la
`/rest/v1/<tabel>` (cu `content-range` pentru numărători, cu filtre `col=eq.val`
— `maybeSingle()` cere un singur rând, altfel pagina dă 404); `pnpm dev` pornit cu
`NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321` și chei false DOAR prin
variabile de mediu, nu în `.env.local`; `src/proxy.ts` dat deoparte; din
Playwright antetele `x-site-id`/`x-site-domain` și cookie-ul `sb-127-auth-token`
(`base64-` + JSON-ul sesiunii). Serverul fals nu intră în repo.

### Limita listelor, verificată și pe server (2 oct. 2026)

Proprietarul a întrebat câte „Apariții și acreditări” se pot adăuga. Răspunsul din
cod: 12 (`max: 12` la lista `aparitii` din `src/lib/sectiuni.ts`). Citind cum se
aplică, a ieșit la iveală o scăpare: limita ținea DOAR în panou, prin butonul
„+ Adaugă” care se oprea (`RepeaterList`). Serverul verifica numărul de elemente
doar la listele de rânduri simple (`listaText`), nu și la cele cu câmpuri
(`lista`). O limită pusă doar în interfață e o sugestie: conținutul venit pe
altă cale (o cerere făcută de mână, o copie din SQL între site-uri) trecea de ea,
iar site-ul îl afișa întreg, fără nicio tăiere.

Acum `valideaza` (`src/lib/sectiuni-editare.ts`) o verifică și la `lista`, cu
același mesaj în română ca la `listaText`, dar cu pluralul corect („13 elemente”,
„20 de elemente”). Merge și la liste din interiorul altor liste („materiale”
dintr-un program). `valideaza` rulează și în formular, și la salvare, deci e
același cod în ambele locuri.

**Efect de știut:** un conținut care DEJA depășește limita (turnat din SQL înainte
de regula asta) nu se mai poate salva până nu se șterg elementele în plus.
Ecranul spune care listă și câte elemente are, iar ștergerea e o apăsare. Am ales
asta în loc de o excepție „pentru conținutul vechi”, care ar fi rămas permanentă
și uitată. Din datele pe care le controlez, nimic nu trece peste limită (conținutul
site-ului de vânzări: 4 pași din 6, 2 pachete din 4, 5 programe din 8); datele
reale de pe demo-uri nu le-am putut vedea.

Doar secțiunile au liste cu câmpuri, deci blogul, serviciile, paginile și
setările nu sunt atinse.

**Ce NU acoperă (corectat în aceeași zi, după ce proprietarul a cerut să i se
explice simplu):** verificarea stă în codul aplicației, deci oprește doar cererile
care trec prin el — salvarea din panou sau o cerere trimisă de mână serverului.
O copie făcută din SQL scrie DIRECT în baza de date și nu trece pe acolo, deci
tot nu e oprită: site-ul ar afișa toate elementele, iar singurul efect ar fi că
la următoarea salvare din panou clientul ar fi oprit până șterge cele în plus.
Rândurile de mai sus pomenesc „o copie din SQL" ca drum pe care limita nu era
ținută; asta era adevărat înainte și rămâne adevărat. Câștigul real al
modificării e deci mic: închide o ușă laterală pentru cereri trimise altfel decât
din panou, lucru pe care un client obișnuit nu-l face. O limită care să țină și
la SQL ar trebui pusă în baza de date însăși (o constrângere Postgres), nu aici.

Proba (`e2e/limita-liste.proba.mjs`) a fost scrisă ÎNAINTE de reparație și a
picat exact unde trebuia (peste limită, mesajul, lista imbricată), apoi a trecut.

### Banda cu servicii: varianta discretă, la toate șabloanele (2 oct. 2026)

Cerut de proprietar: banda de servicii „mai transparentă, pe toate șabloanele
unde nu este". Varianta discretă exista deja din 19 sept. (fundalul ia culoarea
paginii, cuvintele sunt estompate la 55%, steaua ia accentul șablonului), dar
era aprinsă doar la Liniște. Celelalte patru foloseau accentul plin.

Aprinsă acum la Căldură, Lumină, Apropiere și Claritate — patru linii de
`asezari`, nicio linie de componentă. Comutatorul `bandaServiciiDiscreta` rămâne
în loc, deși acum e aprins peste tot: un șablon viitor cu fundal închis ar putea
vrea accentul plin, iar fără comutator ar trebui desfăcută componenta.

**Interpretare, spusă deschis:** „transparentă" l-am citit ca „la fel ca la
Liniște" — adică pe fundalul paginii, estompată — nu ca „fără fundal deloc".
Diferența contează puțin: fundalul benzii e chiar culoarea paginii (măsurat, la
fiecare șablon, pixel cu pixel), deci vizual banda stă direct pe pagină. Dacă
vreodată se cere „și mai estompată", singurul număr de mutat e `opacity` din
`banda-servicii.tsx`. **Același număr pentru toate cinci**, deci o schimbare se
vede și la Liniște, unde 0,55 fusese măsurat pe referință.

**Ajustat apoi (2 oct. 2026), cerut de proprietar: „un grad mai vizibilă”.**
0,55 → 0,7. Un pas mic, nu un salt: la 0,7 cuvintele se citesc mai bine pe
toate cele cinci fundaluri, iar banda tot nu devine o bară.

Verificat vizual pe toate cinci, cu aceleași servicii. Fiecare ia fontul
secundar al șablonului (serif italic la Căldură/Liniște/Lumină, scris de mână la
Apropiere, sans italic la Claritate) și accentul lui la stea.

### Banda cu servicii se desprinde de vecini (2 oct. 2026)

Proprietarul, uitându-se la Lumină: „banda se confunda cu culoarea hero-ului".
Avea dreptate, și greșeala e a interpretării mele: „transparentă" o citisem ca
„exact culoarea paginii", ceea ce însemna că banda dispărea în hero-ul de
deasupra și nu se mai citea ca o fâșie aparte. Măsurat pe pixeli, la Liniște
diferența dintre bandă și hero e 3 (din 765) — practic nulă.

**Fix:** un al doilea steag, `bandaServiciiDelimitata`, separat de
`bandaServiciiDiscreta`. Banda ia o tintă ușoară de accent (8%).

**Liniile fine de sus și de jos s-au scos a doua zi, cerut explicit de
proprietar („să nu aibă dungă pe margine”).** Le pusesem ca plasă de siguranță
pentru șabloanele reci, dar desprinderea o face singură culoarea: măsurat fără
linii, banda diferă de hero cu 36–40 pe toate patru. Cea mai apropiată de
secțiunea de jos e Lumină (18), dar în randare se deosebește clar. Dacă vreodată
o tintă prea slabă cere iar linii, tinta e cea de mutat, nu liniile de readus. Aprins la Căldură, Lumină, Apropiere și Claritate — **nu la
Liniște**, unde banda a fost potrivită pe referință și n-a fost contestată.
Diferența față de hero: 37–43, față de 3 înainte.

**De ce o tintă de accent și nu tonul „nuanțat" al șablonului:** banda stă
între hero (culoarea paginii) și o secțiune care poate fi pe ton nuanțat. Tonul
nuanțat s-ar contopi cu a doua. O tintă ușoară de accent se deosebește de
amândouă — măsurat și față de secțiunea de jos.

**Capcana găsită prin măsurare, nu din ochi:** fundalul tintat e mai închis
decât pagina, deci același text pierde contrast. La opacitatea de 0,7 (pusă cu
o zi înainte, la cererea „un grad mai vizibilă") Căldură și Apropiere cădeau la
2,8:1 — MAI SLAB decât înainte de a cere proprietarul „mai vizibilă". Cele două
au textul secundar deschis din start: chiar la 100% ajung doar la 5,1 și 4,8.
De-aia varianta delimitată folosește opacitate 0,95 (contrast 4,3–8,2:1), iar
cea nedelimitată (Liniște) rămâne la 0,7. Banda e discretă prin culoare, nu prin
text greu de citit.

**Lecția, a doua oară în aceeași zi:** o schimbare de fundal schimbă și
contrastul textului de pe el. Orice ajustare de culoare la un element cu text
se verifică și pe contrast, nu doar pe cum arată.

### De ce dura editarea, și ce s-a scurtat (1 oct. 2026)

Proprietarul: de la clic pe „Editează" până apare pagina trece prea mult, și e
la fel la fiecare. Observația lui e mai importantă decât pare — **panoul E
produsul**: un client care îl simte greoi n-o să-și schimbe singur textele și
pozele, iar atunci cade tot ce s-a construit în jurul lui.

Două cauze, deosebite una de alta:

**1. Nu exista niciun ecran de așteptare.** Fără `loading.tsx`, Next ține
browserul pe pagina VECHE cât timp serverul își adună datele, și abia apoi
navighează. Deci nu se întâmplă nimic vizibil — arată a panou înțepenit, nu a
pagină care se încarcă. Adăugat `src/app/dashboard/loading.tsx`, la rădăcina
panoului, deci acoperă orice ecran de dedesubt care n-are unul al lui.

Mai face ceva, mai puțin vizibil: Next nu preîncarcă rutele dinamice dincolo
de cea mai apropiată graniță de așteptare. Fără fișierul ăla, un link spre un
ecran de editare nu se putea pregăti dinainte DELOC. Cu el, pregătirea începe
de când linkul intră în ecran — iar „Editează" e un `<Link>`, deci chiar
profită.

**2. Patru runde la bază, una după alta.** Editorul de secțiuni cerea: rândul
secțiunii → apoi șase interogări deodată → apoi documentele → apoi orele.
Fiecare săgeată e un drum dus-întors până la Supabase. Dintre ele, doar una era
o dependență adevărată (orele au nevoie de rândul site-ului, ca să știe dacă
modulul Programări e cumpărat).

Rescris în DOUĂ runde: întâi rândul secțiunii ÎMPREUNĂ cu rândul site-ului
(nu depind unul de altul), apoi tot restul deodată, documentele și orele
incluse. De la patru drumuri la două.

Celelalte ecrane de editare (blog, servicii) erau deja strânse într-o singură
rundă — verificat, nu presupus. Doar secțiunile aveau șirul lung, fiindcă au
cele mai multe date de adunat pentru previzualizare.

**Ce NU s-a atins:** `verifySession()` face două drumuri (verificarea contului,
apoi rândul din `users`). E memorată pe cerere (`cache`), deci se face o
singură dată per pagină, dar tot sunt două. Se poate scurta, dar atinge
autentificarea — se face separat, cu probe, nu într-o reparație de viteză.

### Mărirea pozei, ca să se poată mișca pe amândouă axele (1 oct. 2026)

Chiar și cu rama potrivită (vezi mai jos), proprietarul tot nu putea muta poza
sus-jos la „Despre mine". Și avea dreptate să insiste, dar nu era o
defecțiune: `object-fit: cover` micșorează poza exact cât s-o încapă în ramă,
deci pe una dintre axe o potrivește FIX. O poză lată (1500×1000) într-o ramă
verticală (4/5) umple exact înălțimea — deasupra și dedesubt nu există nimic
de adus în cadru. Nu era nimic de reparat acolo; nu era nimic de mutat.

Singurul fel în care „mișcă-o în sus" capătă sens e ca poza să poată fi
MĂRITĂ. Din clipa în care e mai mare decât rama, îi prisosește pe amândouă
axele, deci se poate trage în toate direcțiile. De-aia panoul are acum un
glisor „Mărime", 1×–3×, sub rama de poziționare.

**Unde stă mărirea:** în `PunctFocal`, lângă `x` și `y`, nu într-un câmp
paralel. Motivul e practic: `pozitie` e deja dusă până la fiecare ramă de pe
site (zece locuri). Un câmp nou, separat, ar fi cerut atinse toate zece și
uitat la al unsprezecelea. Așa, zero locuri de atins — mărirea ajunge singură
peste tot unde ajunge și punctul focal.

**Cum se desenează:** `transform: scale(z)` cu `transform-origin` pus CHIAR pe
punctul focal. Originea contează: așa punctul ales rămâne pe loc când poza se
mărește, în loc să fugă din cadru. Și tot de-aici vine mișcarea pe verticală —
la o poză lată, `object-position` pe verticală n-are efect (surplus zero), dar
originea de sus în jos chiar plimbă cadrul.

**Nemărită, nimic nu se schimbă:** `zoom` lipsește din date când e 1, iar
`scaraImaginii` întoarce `undefined`, deci nu se pune niciun `transform`. Toate
pozele de până acum arată exact ca înainte.

Mărirea stă în conținutul secțiunii, nu pe rândul din `uploads` ca punctul
focal — și e corect așa: cât trebuie mărită o poză depinde de RAMA în care e
pusă, iar aceeași poză poate sta în rame de forme diferite.

Măsurat pe drumul complet al panoului: la 1×, trasul în sus nu schimbă nimic
(`y` rămâne 50); la 1,6×, același tras duce `y` la 100 și previzualizarea se
mișcă odată cu el.

**Pe ce șabloane apare:** pe toate, fără nimic de făcut. Panoul nu e al unui
șablon anume — secțiuni, blog, servicii și setări trec toate prin
`CampuriSectiune` → `ImageField` → `RepozitionareImagine`.

**Un singur loc l-a primit greșit, și s-a scos:** Biblioteca
(`panou-imagine.tsx`) folosește direct componenta de poziționare, dar scrie pe
rândul din `uploads`, care ține `focal_x`/`focal_y` și atât. Acolo glisorul ar
fi lăsat omul să miște poza, s-o vadă schimbându-se, și să piardă totul la
reîncărcare — pierdere tăcută, genul cel mai greu de depanat. Stins cu
`cuMarire={false}`, ținut de o probă pe sursă. Nici n-ar fi însemnat ceva:
mărirea depinde de rama în care e pusă poza, iar în bibliotecă poza nu e pusă
nicăieri anume.

### Rama de poziționare ia forma locului de pe site (1 oct. 2026)

Proprietarul trăgea de poză la „Despre mine" pe Lumină și nu se întâmpla
nimic. Măsurat, trăgând efectiv din Playwright pe drumul COMPLET al
editorului (câmp → `catreStocare` → previzualizare), nu doar pe componentă:
mecanismul era întreg — stânga-dreapta mergea, 50% → 100%, și ajungea și în
previzualizare. Sus-jos nu mișca nimic.

Cauza: rama în care se trage poza era PĂTRATĂ peste tot, iar pe site sunt
șapte forme diferite („Despre mine" 4/5, galeria de șabloane 16/9, cartonașul
unui program 3/2, coperta de articol 16/9…). Două urmări, amândouă rele:
ce încadrai nu era ce ieșea; și, fiindcă `object-fit: cover` lasă poza să se
miște DOAR pe axa pe care îi prisosește ceva, axa blocată din pătrat nu era
aceeași cu cea blocată pe site. O poză lată într-o ramă verticală n-are joc pe
înălțime — deci trasul în sus era degeaba, fără ca ceva s-o spună.

Acum rama ia forma locului. `raportRamei` (`src/lib/rame-poze.ts`) întoarce
forma după cheia secțiunii, drumul câmpului, AȘEZĂRILE șablonului și VARIANTA
rândului — forma depinde de amândouă: „Despre mine" e cerc la Claritate și
dreptunghi vertical la restul; galeria de șabloane e 16/9, un program obișnuit
3/2. Se calculează în editor, fiindcă descrierea câmpului din `sectiuni.ts` nu
știe nici șablonul, nici varianta.

Măsurat după reparație: rama din panou 320×400 (0,80), rama de pe site 380×475
(0,80) — aceeași formă.

**Capcana de ținut minte:** `raportRamei` repetă, pentru panou, valori scrise
în componentele site-ului. Două locuri cu același adevăr se despart cu timpul,
iar despărțirea e TĂCUTĂ — panoul ar arăta o ramă, site-ul alta, și nimic n-ar
cădea. De-aia `e2e/rame-poze.proba.mjs` citește `aspectRatio`-urile chiar din
componente și le compară cu ce întoarce funcția.

O formă necunoscută întoarce `undefined`, iar rama rămâne pătrată: un câmp nou
nu strică panoul fiindcă nimeni nu l-a trecut în listă.

### Lumină: coloanele oglindite la hero și la „Despre mine" (1 oct. 2026)

Cerut de proprietar, doar la Lumină: în prima secțiune poza trece la STÂNGA și
textul la dreapta; la „Despre mine" invers, poza la DREAPTA și textul la
stânga. Așa pagina alternează părțile în loc să repete aceeași, iar ochiul are
unde să se odihnească între secțiuni.

Două comutatoare noi în `TemplateAsezari`, `heroPozaStanga` și
`desprePozaDreapta`, aprinse numai în `lumina.ts`. Celelalte patru șabloane
rămân cum erau — verificat prin măsurare, nu din ochi: la Liniște și Apropiere
poza stă în continuare dreapta la hero și stânga la „Despre mine".

Oglindirea se face cu o singură regulă de CSS, `.coloane-oglindite` (`order` pe
cei doi copii ai grilei), nu prin mutarea elementelor în cod. Motivul e cel de
mai jos.

**NUMAI pe ecran lat (prag 760px).** Sub prag, grilele astea se stivuiesc într-o
coloană, iar acolo ordinea din cod e singura bună: titlul întâi, poza sub el.
Oglindită, poza ar împinge titlul sub ea pe telefon — iar titlul e tocmai
elementul după care se măsoară viteza paginii (LCP), problema pe care am
rezolvat-o în septembrie. Pragul de 760px e cât îi trebuie grilei ca să încapă
pe două coloane: 2 × 340px plus spațiul dintre ele și marginile secțiunii; sub
el oglindirea n-ar avea ce oglindi.

Măsurat la randare: pe 1280px, Lumină are poza stânga la hero și dreapta la
„Despre mine"; pe 390px, titlul rămâne deasupra pozei și nu apare derulare
laterală.

### Adresa brută a platformei duce în panou (1 oct. 2026)

Proprietarul a deschis `cms-platform-delta.vercel.app` și a primit pagina
„Platformă sitepsihologi.ro — preview de platformă, fără tenant asociat", fără
nicio ieșire. Întrebarea lui: de ce nu mă duce direct în panou?

Răspunsul cinstit: **nimeni n-a scris regula.** Pagina `/site-unavailable` a
fost făcută pentru alt caz — un domeniu de client cumpărat, dar încă nelegat de
niciun site — unde chiar e util să scrie CE domeniu lipsește din tabel. Adresa
platformei a căzut în aceeași ramură fiindcă și ea e un host care nu duce la
niciun cabinet. N-a fost o decizie, a fost aceeași plasă prinzând două lucruri
diferite.

Acum se deosebesc trei cazuri, printr-o funcție pură în `src/lib/rute.ts`
(`destinatieFaraTenant`), nu printr-un `if` în proxy — proxy-ul nu se poate
rula cu Node fără Supabase, deci o regulă scrisă acolo n-ar avea nicio probă:

- rădăcina adresei platformei → redirect la `/proprietar`;
- orice ALTĂ cale pe adresa platformei → pagina de platformă, ca înainte (cine
  cere `…vercel.app/servicii` căuta o pagină de site, nu panoul);
- un domeniu de client nelegat încă → pagina cu numele domeniului, ca înainte.

**Ce NU s-a făcut, și de ce:** adresa platformei tot nu e trecută în `sites`.
Legată de un cabinet, orice preview al platformei ar începe să arate site-ul
acelui client — capcana `DEV_TENANT_DOMAIN` de la §izolare. Redirectul rezolvă
problema omului fără să atingă regula care ține clienții separați.

**Costul, știut și acceptat:** adresa brută a platformei scoate acum la iveală
ecranul de conectare al administratorului (nelogat, `/proprietar` redirectează
la `/proprietar/login`). Cere oricum parolă, iar `robots.ts` refuză gazdele
platformei, deci adresa nu ajunge în căutări.

### Panoul proprietarului, pe telefon (22 sept. 2026)

Proprietarul a deschis `/proprietar` pe telefon și a văzut doar două coloane
din șase — „Cabinet" și „Adresă". Restul (șablon, stare, programări, butonul
„Intră în panou") rămâneau după marginea ecranului. Derularea laterală exista
(`overflow-x-auto`), dar **nimic nu spune că e acolo**: pe telefon nu există
bară de derulare vizibilă, deci lista părea pur și simplu ciuntită.

Reparat cu DOUĂ ÎNFĂȚIȘĂRI, nu cu un tabel care se strâmbă: pe telefon,
cartonașe stivuite (`sm:hidden`); de la `sm` în sus, tabelul de dinainte,
neatins. Aceleași date în amândouă — cine administrează platforma de pe telefon
are nevoie de aceleași lucruri ca de pe calculator, deci nu s-a ascuns nimic.

Trei amănunte care se uită ușor și se văd imediat:
- `break-all` pe domeniu și pe email: n-au spații în ele, deci fără asta ies din
  cartonaș și împing toată pagina la dreapta;
- `shrink-0` pe pastila de stare, ca să nu se turtească lângă un nume lung;
- caseta de căutare ia rândul ei întreg pe telefon (`w-full sm:w-auto`);
  înghesuită lângă filtru și buton, îi tăia și textul de îndrumare.

Pastila de stare și linkul de adresă sunt scrise o dată și folosite în amândouă
înfățișările: două copii ar fi ajuns să difere la prima schimbare de culoare.

Măsurat la randare, pe 393px lățime: fără derulare laterală (documentul are
exact lățimea ferestrei), tabelul ascuns, cinci cartonașe. Pe 1280px: tabelul
vizibil, cartonașele ascunse.

### Poza de la „Despre mine": colțuri rotunjite peste tot (22 sept. 2026)

Cerut de proprietar, uitându-se la Lumină: portretul era singurul dreptunghi cu
colțuri drepte într-o pagină în care tot restul e rotunjit, și se citea ca o
scăpare. Rotunjirea era pusă doar la Apropiere (unde vine oricum cu cardul
decalat din spate) și la Claritate (unde poza e cerc).

Raza e a ȘABLONULUI (`--t-raza`), nu un număr scris în componentă: 16px la
Căldură, 24px la Liniște și Lumină, 36px la Apropiere. Rotunjirea e o trăsătură
a înfățișării, iar portretul n-are de ce să iasă din ea. Claritate rămâne cerc.

`overflow: hidden` se pune de-acum întotdeauna, nu doar la cerc și la Apropiere:
fără el colțurile tăiate n-ar ascunde nimic, fiindcă poza umple rama
(`object-fit: cover`) și ar ieși peste rotunjire.

Cardul închis suprapus („12+ ani", doar Liniște) rămâne neatins — e frate cu
rama, nu copil, deci tăierea nu-l prinde. Verificat vizual pe toate cinci
șabloanele, cu reperele puse, plus măsurat la randare: 16 / 24 / 24 / 36 / 50%.

### Cum arată poza în cartonașul „vitrina" (22 sept. 2026)

**Regula de acum:** caseta e fixă (16/9, aceeași la toate cartonașele), poza o
UMPLE, iar punctul focal implicit e SUS (`{x: 50, y: 0}`), nu la mijloc ca
peste tot altundeva. Deci se vede partea de sus a capturii — titlul, textul,
butonul — și se pierde restul paginii, care oricum n-ar fi lizibil într-un
cartonaș. Dacă clientul a tras de poză în panou, alegerea lui bate implicitul.

**Drumul până aici merită citit înainte de a-l relua.** Cerințele
proprietarului, în cuvintele lui, erau trei deodată: „mărimea și forma căsuței
nu se schimbă", „orice poză pe care o încarc să ia automat mărimea căsuței",
„nici alungită, nici înghesuită". Geometria nu lasă decât trei purtări când
forma pozei nu e forma casetei: poza umple caseta și se taie ce prisosește, sau
încape toată și rămâne loc pe margini, sau se deformează.

Încercate pe rând, toate respinse până la ultima:

1. raport fix 3/2, apoi 16/10, apoi 16/9 — fiecare tăia altă margine;
2. caseta potrivită după măsurile pozei — corect în principiu, dar măsurile
   aveau de străbătut un drum lung (încărcare → conținut → salvare → randare)
   și orice verigă lipsă o întorcea TĂCUT la tăiere. Proprietarul a văzut de
   trei ori „e la fel", fără ca ceva să pară stricat;
3. poza întreagă, cu margini simple — dungi albe, citite ca o greșeală;
4. poza întreagă, cu marginile umplute de o copie estompată a ei — respinsă;
5. **poza umple caseta, aliniată sus** — acceptată.

**Două lecții, niciuna despre imagini.** Prima: când nereușita unui mecanism
arată exact ca purtarea veche, nu se poate depana nici de developer, nici de
client — se alege varianta care nu are ce să-i lipsească. A doua, mai scumpă:
patru încercări s-au dus pe deduceri din capturi de ecran, fără să întreb
niciodată ce anume trebuie să se VADĂ în cartonaș. Răspunsul („partea de sus a
paginii") făcea alegerea evidentă de la bun început. Pentru un lucru vizual,
întrebarea „ce trebuie să se vadă" vine înaintea oricărei soluții.

### Măsurile pozei: de la „taie" la „nicio dungă" (22 sept. 2026)

Trei încercări de raport fix, fiecare tăind altă margine din capturile
proprietarului: 3/2 la început, apoi 16/10, apoi 16/9. La a treia a spus, pe
bună dreptate: „fă în așa fel încât odată ce încarc poza să se randeze automat
pe dimensiunea potrivită și să încapă toată."

Avea dreptate, și greșeala e de recunoscut ca atare: am schimbat raportul de
două ori deducând din capturile lui de ecran cum arată fișierul, fără să-i cer
niciodată măsurile adevărate. A doua schimbare a înrăutățit lucrurile. Un
raport fix taie orice captură care nu e chiar pe el, iar a cere cuiva să
decupeze la milimetru înainte de fiecare încărcare e o unealtă care-și mută
munca pe om.

**Cum e acum.** `ImageValue` are `latime` și `inaltime`, în pixeli, citite din
fișier la încărcare (`measureImage`, care exista deja — măsurile se scriau în
`uploads`, dar nu ajungeau mai departe). Stau LÂNGĂ poză, în conținutul
secțiunii, din exact motivul pentru care stă și `url` acolo: site-ul public
randează imaginile fără să întrebe tabelul `uploads`, deci pagina unui client
nu capătă o a doua interogare.

O vreme, cartonașul „vitrina" și-a pus `aspect-ratio` egal cu raportul pozei,
ca să nu rămână nicio dungă. **S-a renunțat**: rezolva dungile, dar strica
lucrul cerut mai apăsat — ca toate cartonașele să aibă aceeași formă. Dungile
se rezolvă acum altfel (copia estompată), fără să atingă forma casetei.

Măsurile rămân în date fiindcă se văd în bibliotecă („1600 × 900 pixeli") și
pot folosi altundeva. Galeria nu le mai citește. Grila primește
`align-items: start` doar la „vitrina": cu raporturi diferite, întinderea
obișnuită ar lăsa o fâșie de fundal gol sub pozele mai scunde.

**Rezervă:** fără măsuri — un SVG fără dimensiuni scrise în el, o poză al
cărei fișier n-a putut fi măsurat — rămâne 16/9, adică purtarea de dinainte.

**Completarea e treaba serverului, nu a omului (tot 22 sept. 2026).** Prima
variantă cerea clientului să-și RE-ALEAGĂ poza din bibliotecă, de unde și-ar
fi adus măsurile. A picat la primul om care a folosit-o: proprietarul a văzut
site-ul „la fel ca înainte" — fie pasul nu s-a făcut, fie a picat undeva pe
drum, și n-avea cum să-și dea seama, fiindcă nereușita e tăcută (cartonașul
cade pe raportul de rezervă, care arată exact ca vechiul comportament). Un pas
manual a cărui nereușită nu se vede nu e o soluție.

Acum `salveazaSectiune` completează singură, la ORICE salvare: adună
imaginile fără măsuri din conținut (`imaginileFaraMasuri`), le citește
`width/height` din `uploads` (unde se scriau de la bun început) și le scrie în
conținut (`completeazaMasurileImaginilor`, amândouă în `src/lib/imagini.ts` —
ținute de probe în `e2e/masuri-imagine.proba.mjs`). Dacă interogarea pică sau
un rând n-are măsuri, salvarea merge înainte fără ele: completarea nu are voie
să blocheze salvarea unui text. Pentru client: deschide secțiunea, apasă
Salvează, gata — iar pozele noi vin cu măsurile de la încărcare, deci fără
niciun pas.

**Trei locuri enumeră câmpurile unei imagini pe nume**, deci pot pierde
măsurile în tăcere: reconstrucția din `campuri-sectiune.tsx`, alegerea din
`biblioteca-imagini.tsx` și răspunsul lui `uploadImage`. Pierdute, poza nu
cade și nu arată rupt — doar se întoarce tăcut la caseta de rezervă, iar
nimeni n-ar lega asta de o salvare făcută cu o oră înainte. De-aia
`e2e/masuri-imagine.proba.mjs` ține și dus-întorsul prin formular, și o probă
pe sursă că locurile alea pomenesc `latime`/`inaltime`.

### Linkul fără text dispărea la salvare (22 sept. 2026)

Proprietarul a pus capturile adevărate și adresele demo-urilor din panou, apoi
a apăsat un cartonaș și n-a dus nicăieri. Cauza: `catreStocare`
(`src/lib/sectiuni-editare.ts`) arunca TOT linkul când „Textul de pe buton"
era gol — „un buton fără text n-are ce căuta pe pagină". Regula era bună cât
timp din `buton` se citeau mereu și textul, și adresa; a încetat să fie în
clipa în care cartonașul „vitrina" a început să folosească doar `href`.

Și e o capcană pe care chiar eu am întins-o: îi spusesem „textul butonului
poate fi orice, nu se vede". Firesc, l-a lăsat gol. Panoul arăta adresa
scrisă, baza n-o primea — pierdere tăcută, la salvare, vizibilă abia apăsând.

Reparat în două jumătăți care trebuie să rămână împreună:
1. datele păstrează ce-a scris omul: linkul se salvează dacă are text, dacă
   are adresă, sau amândouă (gol de tot, tot nu se scrie);
2. componentele care DESENEAZĂ un buton se uită la `buton?.text`, nu la
   existența lui `buton` — altfel un link fără text ar produce o pastilă
   colorată fără nicio literă. Corectat la `hero` (ambele butoane),
   `aboutTeaser` și cartonașul obișnuit din `portfolio`; `pricing` era deja
   așa.

Ținute de `e2e/link-fara-text.proba.mjs`: patru probe pentru stocare și una pe
SURSĂ, care caută în toate secțiunile pază de forma `{data.buton && (` și cade
dacă găsește vreuna. Proba a fost verificată că într-adevăr pică, nu doar că
trece — stricând înadins paza din `aboutTeaser` și punând-o la loc.

**Pornirea pe site-ul viu.** `variant` nu se poate scrie din panou (panoul
scrie doar `data`, `position`, `visible`, `is_demo`) — și e bine că nu se
poate: așa forma cartonașului rămâne pusă oricâte editări ar face cineva peste
texte. Se pornește o singură dată, din Supabase:

1. supabase.com → proiectul → **SQL Editor** (în meniul din stânga) → **New
   query**;
2. lipit textul de mai jos, cu domeniul potrivit (azi
   `sitepsihologi.vercel.app`; după cumpărarea domeniului, `sitepsihologi.ro`);
3. **Run**. Dacă arată un rând (`portfolio | vitrina`), e gata — se vede la
   reîncărcarea paginii. Dacă nu arată niciun rând, domeniul scris nu s-a
   potrivit cu niciun site. (Fără `returning`, Supabase scrie „Success. No rows
   returned” oricum — vezi capcana de la §„Tabelul comparativ din «Pachete»”.)

```sql
update public.site_content
set variant = 'vitrina'
where site_id = (select id from public.sites where domain = 'sitepsihologi.vercel.app')
  and key = 'portfolio'
returning key, variant;
```

Linia asta schimbă STRICT forma cartonașului. NU atinge `data` — adică niciun
text, nicio poză, nimic din ce s-a scris în panou. Se dă o singură dată; după
ea, panoul se folosește normal.

**De ce nu se rulează din nou `scripts/sql-vanzari.mjs`**, deși `continut.ts`
are acum `variant: "vitrina"` pe rândul „sabloane": acela REFACE toate
secțiunile de la zero din `src/app/proba-vanzari/continut.ts` — ar pierde
textele scrise deja manual pe site-ul viu. `continut.ts` s-a actualizat doar ca
sursa de adevăr să nu mintă, și ca previzualizarea `/proba-vanzari` să arate
exact ce se va vedea pe site.

Verificat vizual pe `/proba-vanzari`, cu toate cele cinci cartonașe, pe
calculator și pe telefon. Tipuri, lint, cele 218 probe și build-ul trec.
