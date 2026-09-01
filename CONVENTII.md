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
