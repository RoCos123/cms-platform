# Cum se lucrează în proiectul ăsta

Convențiile de mai jos nu sunt preferințe de stil. Fiecare vine dintr-un lucru
care a mers prost o dată și nu trebuie să meargă prost a doua oară.

---

## Regula care le acoperă pe toate

**Lansarea se face fără grabă, când totul e gata.** Stabilit de proprietar pe
28 aug. 2026, ca principiu, nu ca preferință de moment: *„Nu ne permitem
greșeli, erori. Drept urmare, vreau să acorzi cea mai mare atenție și grijă."*

Ce înseamnă în practică, când o sesiune viitoare are de ales:

- **Nu există presiune de timp.** Dacă un lucru cere încă o verificare, se face.
  Niciodată „merge și așa, corectăm după lansare” — nu există un după-lansare în
  care greșeala să coste puțin: clienții sunt cabinete de psihologie, iar
  vizitatorii lor sunt oameni în perioade grele.
- **Nimic nu pleacă neverificat.** Nu „am scris codul, pare bine”. Rulat, probat,
  privit cu ochii pe ecran. Regulile din restul fișierului spun cum.
- **Ce nu s-a putut verifica se spune pe față**, nu se trece sub tăcere. O
  garanție nedovedită se scrie ca nedovedită.
- **Când e de ales între repede și corect, se alege corect.** Iar dacă ceva pare
  gata prea ușor, aia e chiar clipa în care merită mai atent — jumătate din
  greșelile din fișierul ăsta au arătat exact așa.

---

## Plafonul unui furnizor se citește înainte de a-l alege

31 aug. 2026. Alesesem Cloudflare Turnstile pentru anti-spam pe motive bune
(GDPR, gratuit, ușor de pus). Ce nu verificasem era cum se poartă la scara
noastră: Turnstile leagă o cheie de cel mult 10 domenii, cu 20 de chei pe cont.
Pentru o platformă care înseamnă „un site per cabinet”, plafonul acela nu e o
limită de ocolit — e capătul produsului, la 200 de clienți, iar planul de peste
el pornește de la 2.000 $/lună.

Regula care rămâne: la orice serviciu extern pe care îl legăm de **domeniul
clientului**, prima întrebare nu e „cât costă” și nici „e GDPR-friendly”, ci
**„câte domenii duce, și ce urmează după”**. Turnstile pica la a doua întrebare
și am aflat abia când n-a mai apărut caseta pe un site.

A doua parte a lecției, mai importantă decât furnizorul: **alegerea trebuie să
fie o variabilă de mediu, nu cod.** `src/lib/captcha.ts` ține acum ce diferă
între furnizori (adresa scriptului, obiectul global, numele câmpului ascuns,
numele opțiunii de limbă, endpointul de verificare) într-un tabel, iar restul
codului nu știe la cine se uită. Când următorul furnizor schimbă regulile, se
atinge un fișier.

Corolar pentru probe: dacă o decizie e luată ca să nu ne mai lovim de un plafon,
ea se apără cu o probă, nu cu un comentariu. `e2e/captcha.proba.mjs` cade dacă
implicitul nu mai e cel fără plafon.


---

## Ce se cheamă singur nu primește anteturi

1 sept. 2026, la trecerea depozitului de fișiere pe privat. Ruta care servește
pozele trebuia să verifice că imaginea e a cabinetului al cărui site se
randează — firesc, din antetul de tenant pus de proxy. Am verificat înainte să
scriu, și bine am făcut: optimizatorul de imagini din Next își cere singur
fișierul printr-o cerere construită în memorie, cu `headers = {}`. Zero anteturi.

Ruta ar fi mers pe Vercel (unde cererea vine pe HTTP, cu gazda adevărată) și ar
fi căzut în dezvoltare. Sau invers, după cum bate vântul. Adică exact felul de
diferență care nu se vede la nicio probă și se descoperă în ziua lansării.

Regula: **înainte să sprijini o rută pe un antet, cookie sau sesiune, întreabă-te
cine altcineva o mai cheamă.** Optimizatorul de imagini, prefetch-ul, un job, un
webhook, o previzualizare — niciunul nu duce cu el contextul cererii omului. Ce
poate fi chemat din interior trebuie să se apere din ceea ce poartă adresa lui.

Și corolarul care a scos-o la iveală: răspunsul era în `node_modules`, la două
grep-uri distanță. Când o presupunere despre o unealtă hotărăște forma unei
soluții, se citește sursa — nu se caută în amintiri și nu se întreabă internetul.


---

## Un prefix nu e un segment de cale

1 sept. 2026. Proxy-ul hotăra „e pagină de panou?” cu
`cale.startsWith("/dashboard")`. Adevărat și pentru `/dashboard-ul-meu` — o
adresă pe care clientul are voie să și-o facă, fiindcă lista de adrese rezervate
oprește doar `dashboard` exact. Urmarea: pagina lui cerea conectare, deci n-o
putea citi niciun vizitator. Aceeași greșeală era și în `robots.txt`, unde
`Disallow: /dashboard` o ținea afară din Google.

Ce o face urâtă e că nu se vede din nicio parte: pagina exista, se salva, se
vedea în panou, arăta bine la previzualizare. Doar nu ajungea la nimeni.

Regula: **o cale se compară pe segmente, nu pe litere.** `x === "/a"` sau
`x.startsWith("/a/")`, niciodată `x.startsWith("/a")`. Iar în `robots.txt`, unde
potrivirea e pe prefix de text prin însăși definiția formatului, fiecare intrare
se termină ori cu `/`, ori cu `$`.

Corolarul, care e de fapt lecția: **o reparație pe jumătate e mai rea decât
niciuna.** Dacă reparam doar proxy-ul, pagina ar fi mers și n-ar fi fost găsită
de nimeni — iar clientul n-ar fi avut cum să afle de ce. Când o greșeală are
două capete, se caută amândouă înainte de a repara vreunul.


---

## Ce se cheamă după ce răspunsul a plecat nu mai are cerere

8 sept. 2026. Numărarea vizitelor se cheamă din `after()` — mutată după ce
pagina a plecat spre vizitator, ca o scriere în bază să nu-l facă să aștepte.
Acolo citea `headers()`, plus `getTenant()` și `getSesiuneOptionala()`, care le
folosesc și ele. Next 16 aruncă „used `headers()` inside `after()` while
rendering", iar pagina ÎNTREAGĂ cade cu 500.

**Partea care merită ținută minte nu e regula, ci de ce n-a ajutat plasa.**
Funcția prindea eroarea și o scria cuminte în jurnal, exact cum îi cerea
comentariul ei: „nu aruncă niciodată". Și tot cădea pagina — Next vede greșeala
înaintea lui `catch`. Un `catch` întins lângă gaură, nu peste ea.

Regula: **ce se cheamă din `after()` primește valori, nu citește cererea.**
Antetele, sesiunea și tenantul se iau în componenta care randează și se dau ca
argument. Proba e `e2e/dupa-raspuns.proba.mjs` și e mai largă decât cazul: caută
toate apelurile `after(...)`, urmărește ce funcție cheamă fiecare și interzice
acolo `next/headers` și `@/lib/dal`.

Nu se putea găsi citind: nici lintul, nici tipurile, nici build-ul nu văd asta.
S-a găsit în jurnalele Vercel, după digest, pe un site real.

---

## Un site abia provizionat nu e un caz limită, e prima zi a fiecărui client

8 sept. 2026. `creeaza_client` aprinde toate cele paisprezece secțiuni și le
pune `{}`. Nimeni nu randase vreodată starea aia. Șase componente făceau
`data.ceva.map(...)` de-a dreptul, deci prima pagină a primului site provizionat
a căzut cu 500 — și nu doar prima: cadrul e comun, deci tot site-ul public.

Două dintre ele aveau chiar o pază, `if (data.aparitii.length === 0)`. Scrisă
pentru lista GOALĂ, nu pentru lista LIPSĂ — `.length` pe `undefined` aruncă la
fel de bine ca `.map`.

Tipurile nu prind asta: `data` e turnat cu `as` din JSON-ul din bază, deci
TypeScript crede că listele există.

Regula: **în componentele site-ului, o listă din `data` se ia o dată, cu
`?? []`, într-o variabilă locală.** Niciodată `data.x.map` sau `data.x.length`
de-a dreptul — nici măcar păzit cu `&&`, ca regula să n-aibă excepții de ținut
minte. Și fiecare secțiune are o cale prin care nu randează nimic. Probele:
`e2e/sectiuni-goale.proba.mjs`.

---

## Codul 200 nu e o verificare vizuală

8 sept. 2026, în aceeași zi cu cea de mai sus. După ce am oprit secțiunile din
căzut, am verificat că pagina răspunde 200 și m-am oprit acolo.

Proprietarul s-a uitat la ea. O ghilimea albastră singură, atârnând într-o bandă
goală — de două ori, fiindcă șablonul are două benzi cu citat. Și o bandă neagră
cât ecranul, cu un câmp de email și niciun cuvânt lângă el. Pagina răspundea 200
și arăta a site stricat.

Regula era deja scrisă mai jos, la „Verificare vizuală"; ce lipsea e că se aplică
**și după o reparație**, nu doar la o funcție nouă. Dacă schimbarea atinge ce se
vede, se face captura și se privește. Un cod HTTP spune că serverul n-a căzut,
nu că pagina arată a ceva.

---

## Ce se revocă de la PUBLIC nu e revocat de la roluri

9 sept. 2026, la prima rulare a verificării de schemă pe baza reală. Două funcții
pe care migrările le închideau cu `revoke execute ... from public` erau, în
producție, chemabile de `anon` și `authenticated` — adică de oricine deschide
site-ul, fiindcă cheia `anon` stă în pachetul trimis browserului, iar funcțiile
din schema `public` sunt expuse ca RPC.

Mecanica: în Postgres simplu, o funcție nouă poate fi executată de PUBLIC, iar
rolurile moștenesc de acolo, deci o revocare de la PUBLIC le taie pe toate. Pe
Supabase, proiectul are `alter default privileges ... grant all on functions to
anon, authenticated, service_role`, așa că fiecare funcție nouă primește granturi
EXPLICITE, pe rol, chiar la creare. Revocarea de la PUBLIC nu le atinge.

Regula: **la funcții, se revocă și de la roluri, pe nume.** Iar când o apărare stă
în granturi și nu în RLS, ea se scrie ca verificare în
`supabase/verificare-izolare.sql` și se probează stricând-o dinadins.

Partea care merită ținută minte e însă alta. Migrarea din 27 aug. spune exact pe
dos, și o spune cu dovadă: *„Un `revoke ... from anon` în plus n-ar face nimic —
l-am scris, l-am probat, și nu schimba nimic."* Era adevărat pe banc. **Un lucru
probat pe un banc infidel e mai periculos decât unul neprobat**, fiindcă închide
întrebarea: nimeni nu mai verifică ce are „probat" scris lângă.

Corolarul se leagă de regula despre banc de mai jos. Când adaugi o apărare de alt
fel decât RLS, întrebarea nu e doar „o vede bancul?", ci **„ce face Supabase la
crearea obiectului, pe care bancul nu-l face?"**. Drepturile implicite pe tabele
au fost prima oară (27 aug.), cele pe funcții a doua (9 sept.). Aceeași formă, la
două săptămâni distanță.


---

## Un generator care n-a scris nimic arată exact ca unul care n-a avut ce schimba

9 sept. 2026, la verificarea care compară baza reală cu migrările. Generatorul
rulează cu `set -euo pipefail`, iar înăuntru caută nume prin fișierele de migrare
cu `grep`. `grep` întoarce 1 când un fișier n-are nicio potrivire — ceea ce aici
e normal, nu o eroare. Cu `pipefail`, acel 1 omora scriptul pe loc, fără niciun
mesaj, iar fișierul generat rămânea cel de dinainte.

Partea urâtă nu e greșeala, ci ce am făcut cu ea. Ca să dovedesc că generatorul
scoate același fișier la fiecare rulare, l-am rulat de două ori și am comparat
rezultatele: identice. Numai că amândouă rulările muriseră în tăcere, iar
comparația se făcea între același fișier vechi și el însuși. Proba a spus
„determinist" tocmai fiindcă nu se generase nimic.

Regula: **când rezultatul unei unelte e un fișier, verifică fișierul, nu codul
de ieșire.** Că s-a schimbat atunci când te așteptai să se schimbe, și că are
înăuntru ce trebuie. Un `diff` între două rulări nu dovedește nimic dacă niciuna
n-a scris.

Corolarul se leagă de regula de mai jos despre probe care nu pică niciodată: o
verificare care iese verde fără să fi rulat lucrul verificat e mai rea decât una
care lipsește — pe a doua măcar o vezi că lipsește.


---

## Ce ține de unealtă nu stă lângă ce ține de judecată

1 sept. 2026, mutând fonturile pe serverul nostru. Familiile de font se puneau
firesc lângă culori, în `templateStyle` — sunt tot variabile CSS ale șablonului.
Numai că fonturile vin prin `next/font`, care se poate încărca doar înăuntrul
build-ului Next. Odată adus acolo, fișierul cu toate culorile a devenit
neîncărcabil în Node curat, iar proba de contrast — cea care apără lizibilitatea
fiecărui șablon — s-a rupt pe loc.

Împărțit: culorile, spațiile și greutățile rămân în `index.ts`, pur și probabil;
familiile de font stau în `fonturi.ts`, iar componenta le pune una lângă alta.

Regula: **înainte să adaugi un import într-un fișier probat, întreabă-te dacă
noul import poate trăi în afara build-ului.** Dacă nu, judecata din fișierul
acela nu mai poate fi apărată de nicio probă — iar asta se plătește mai târziu,
la prima schimbare de culoare făcută în grabă.

Semnul că e vorba de asta: probele nu pică una câte una, ci dispare tot fișierul
de probe deodată. Numărul total scade, dar „fail" rămâne mic — ușor de trecut cu
vederea dacă te uiți doar la câte au picat.


---

## Ce pleacă din browserul vizitatorului se scrie în politică, în același commit

Cerut de proprietar, 1 sept. 2026.

Politica de confidențialitate a unui cabinet nu e un text de umplutură: e o
declarație despre ce face chiar produsul nostru, semnată de client. Când se
schimbă ce pleacă din browserul unui vizitator — un furnizor de anti-spam, un
font de la altcineva, un câmp în plus într-un formular — textul devine fals în
clipa aceea, iar minciuna e sub numele lui, nu al nostru.

Deci: **șablonul din `sabloane/` se schimbă în ACELAȘI commit cu codul.** Nu în
următorul, nu „când ajungem la documentație”.

Partea care nu se rezolvă singură, și de care trebuie ținut minte separat:
șablonul actualizat NU schimbă pagina niciunui client. Textul lui stă în baza de
date, scris de el, din ziua în care și-a făcut site-ul. Tabelul din CONTEXT.md,
§„Politica de confidențialitate se schimbă odată cu platforma”, ține evidența a
ce trebuie dus mai departe la clienții care și-au publicat deja politica.

---

## Limba și scrisul

**Totul în română** — cod, comentarii, mesaje de eroare, mesaje de commit,
denumiri de variabile și de funcții. Proprietarul e român, clienții finali sunt
psihologi români.

**Ghilimelele românești se scriu `„…”`**, nu `„…”`. Ghilimeaua dreaptă de
închidere (`"`) termină un șir JavaScript sau un atribut JSX și rupe fișierul.
S-a întâmplat de vreo cinci ori. Când apare o eroare de sintaxă inexplicabilă
într-un fișier cu text românesc, ăsta e primul lucru de verificat.

**Textele pentru client descriu ce SE VEDE, nu cum se cheamă.** „Titlul albastru
pe care se apasă", nu „meta title”. Regula a apărut după un „nu înțeleg asta” la
cardul de previzualizare Google.

---

## Reguli de arhitectură

**Un singur loc pentru fiecare lucru.** Serviciile se scriu la Servicii, nu și
în secțiunea de pe prima pagină. Articolele la Blog. Descrierea unei imagini în
bibliotecă, de unde se propagă. Când două ecrane ar arăta același conținut, al
doilea îl CITEȘTE, nu îl copiază.

**Formularele se construiesc din descriere, nu de mână.** `CampSchema[]` în
`src/lib/sectiuni.ts` (și `servicii.ts`, `blog.ts`, `pagini.ts`), randat de
`CampuriSectiune`. Un câmp nou se adaugă în descriere; formularul, validarea,
salvarea și previzualizarea îl preiau singure.

**Textul lung se scrie natural.** Enter = paragraf nou. `## ` la începutul
rândului = subtitlu. Fără markdown, fără editor cu butoane. Parserul e
`src/lib/blocuri-text.ts`, randorul `src/components/site/corp-text.tsx`. Aceeași
regulă la articole și la descrierea completă a serviciilor — dacă ar diferi,
clientul ar învăța de două ori.

**Secțiunile site-ului folosesc `<a>`, nu `next/link`.** Aceleași componente se
randează și în previzualizarea din panou, printr-un portal într-un iframe. Acolo
contextul de rutare e al PANOULUI, deci un `Link` ar naviga panoul, nu site-ul.
Unde ESLint se plânge, se pune `eslint-disable-next-line` cu motivul scris.

**Un vizitator nu vede niciodată o eroare fiindcă cineva a scris ceva neașteptat
în panou.** Citirile publice întorc listă goală la eroare, nu aruncă.
`SectionImage` randează `<img>` simplu pentru o gazdă necunoscută în loc să
dărâme pagina.

---

## Înainte să trimiți ceva clientului

**Bancul local nu vede tot ce crezi.** Până pe 27 aug. 2026 rula un
`grant all on all tables` DUPĂ migrări, „ca la Supabase” — dar Supabase nu
re-acordă nimic după migrările tale; dă drepturile la crearea tabelului, prin
`alter default privileges`. Diferența ștergea orice `revoke` scris într-o
migrare, adică fix apărarea care blochează coloanele pe care clientul n-are voie
să scrie. Garanția „domeniul e blocat prin grant” era scrisă în CONTEXT.md de
săptămâni și n-a putut fi verificată nici măcar o dată. Când adaugi o apărare de
alt fel decât RLS, întreabă-te dacă bancul o poate vedea.

S-a repetat pe 9 sept., la funcții: bancul nu reproducea nici granturile pe care
Supabase le dă implicit pe FUNCȚII noi, deci două `revoke ... from public` păreau
apărări și nu erau. Vezi §„Ce se revocă de la PUBLIC nu e revocat de la roluri".
Bancul le pune acum pe amândouă, și pe secvențe.

**Un tip nou de secțiune nu ajunge singur pe un site care există deja.**
Panoul NU are flux de „adaugă secțiune” — rândurile din `site_content` vin
seedate la provizionare, iar clientul le poate doar reordona, ascunde și edita.
Componenta de programare a fost scrisă, pusă în registru și în randare, și tot
n-a apărut nicăieri: nimic n-o putea crea. A trebuit o migrare cu trigger. Când
adaugi un tip de secțiune, întreabă-te întâi CINE îi creează rândul, la clienții
care există deja.

**SQL netestat nu pleacă.** Există `supabase/proba-locala.sh`: pornește un
Postgres gol, rulează toate migrările în ordine, seedează doi clienți și rulează
verificarea de izolare. Rulează-l. Au plecat de două ori scripturi netestate
înainte să existe.

**Conținutul SQL se pune în răspuns, nu doar numele fișierului.** Proprietarul
lucrează prin interfața web, nu are depozitul deschis în față. Un „rulează
migrarea `2026...sql`" nu înseamnă nimic pentru el. Trimite și fișierul cu
`SendUserFile`, și textul în chat.

**Un test care nu pică niciodată nu dovedește nimic.** Verificarea de izolare a
trecut senin peste o politică stricată dinadins, fiindcă număra un refuz ca
reușită. Strică lucrul pe care testul ar trebui să-l prindă și uită-te dacă
pică.

S-a repetat la datele structurate: proba din browser se uita doar după un dialog
`alert`, iar cu scăparea scoasă dinadins a spus tot „trecut” — codul care ieșise
din bloc era prea rupt ca să mai ruleze. Se uită acum și după erori de pagină,
și abia atunci pică. Când scrii proba, întreabă-te ce vezi dacă stricăciunea e
pe jumătate reușită, nu doar dacă e completă.

---

## Verificare vizuală

Mediul de dezvoltare NU ajunge la Supabase. Ca să vezi un ecran, se face o rută
de probă cu date inventate:

1. `mv src/proxy.ts src/proxy.ts.deoparte` (proxy-ul cere un tenant rezolvat)
2. rută temporară în `src/app/proba/page.tsx` care randează componenta reală
3. `pnpm dev -p 4321` (un singur server o dată — omoară-l pe cel vechi întâi)
4. Playwright: import din `@playwright/test`, NU din `playwright`;
   `chromium.launch({ executablePath: "/opt/pw-browsers/chromium" })`
5. la final: șterge ruta, `mv src/proxy.ts.deoparte src/proxy.ts`,
   `rm -rf .next/dev/types` (altfel build-ul se plânge de ruta ștearsă)

**O variabilă CSS inventată nu dă nicio eroare.** `var(--s-chenar)` pur și
simplu nu se aplică: cartonașul rămâne fără chenar, textul fără culoare. S-a
întâmplat de trei ori într-o zi — `--s-text-pe-accent` (text închis pe fundal
închis), `--s-chenar`, `--s-fundal` — și toate au fost prinse cu ochiul, din
noroc. `Section` pune exact cinci: `--s-accent`, `--s-buton-fundal`,
`--s-buton-text`, `--s-eroare`, `--s-text-secundar`. Pentru chenare și fundaluri
de câmp se folosește `currentColor`, ca în `stilControl`. Verificarea e în
`e2e/culori-sectiuni.proba.mjs` și merge în ambele sensuri: prinde și o
variabilă inventată, și una adăugată în `Section` fără să fie trecută în listă.

**Măsoară, nu presupune.** Lățimea documentului la 390px, contrastul în cifre,
înălțimea antetului la fiecare prag. Erorile găsite așa: pagina ieșea din ecran
cu 300px, accentul avea 2,5:1 pe fundal închis, numele cabinetului se tăia peste
900px.

Logica pură (parsere, validări, formatări) se testează cu Node direct, fără
server și fără Supabase: **`pnpm test:logica`**. Rulează tot ce se cheamă
`e2e/*.proba.mjs`, cu hook-ul din `e2e/alias.mjs` care rezolvă `@/`.

Node rulează TypeScript direct, dar **nu și JSX**: nimic dintr-un `.tsx` nu
poate fi probat așa. De asta măsurile cartonașului stau în `cartonas-masuri.ts`,
separat de desenul din `cartonas-og.tsx`. Aceeași despărțire la sitemap: regula
(`sitemap-reguli.ts`) e ruptă de interogări (`app/sitemap.ts`), altfel n-ar fi
putut fi verificată deloc, fiindcă mediul de dezvoltare nu ajunge la Supabase.
Când scrii ceva cu o regulă în el, pune regula unde poate fi probată.

---

## Cum vorbește proprietarul și ce așteaptă

Întreabă „de ce avem nevoie de asta?” și merită un răspuns cinstit, nu unul de
vânzător. A acceptat de mai multe ori „nu-ți trebuie” și a mulțumit pentru el.

Când cere ceva ce pare greșit, spune o dată de ce și, dacă insistă, **fă exact ce
a cerut** — a avut dreptate la limita de cuvinte care chiar oprește scrisul.

Nu ascunde ce n-a mers. A întrebat „cât mai e până terminăm” tocmai fiindcă
listele anterioare fuseseră incomplete; răspunsul corect a fost să caut în cod și
să găsesc trei lucruri care nu erau în niciun plan.
