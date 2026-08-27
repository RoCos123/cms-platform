# Cum se lucrează în proiectul ăsta

Convențiile de mai jos nu sunt preferințe de stil. Fiecare vine dintr-un lucru
care a mers prost o dată și nu trebuie să meargă prost a doua oară.

---

## Limba și scrisul

**Totul în română** — cod, comentarii, mesaje de eroare, mesaje de commit,
denumiri de variabile și de funcții. Proprietarul e român, clienții finali sunt
psihologi români.

**Ghilimelele românești se scriu `„…”`**, nu `„…"`. Ghilimeaua dreaptă de
închidere (`"`) termină un șir JavaScript sau un atribut JSX și rupe fișierul.
S-a întâmplat de vreo cinci ori. Când apare o eroare de sintaxă inexplicabilă
într-un fișier cu text românesc, ăsta e primul lucru de verificat.

**Textele pentru client descriu ce SE VEDE, nu cum se cheamă.** „Titlul albastru
pe care se apasă", nu „meta title". Regula a apărut după un „nu înțeleg asta" la
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

**Măsoară, nu presupune.** Lățimea documentului la 390px, contrastul în cifre,
înălțimea antetului la fiecare prag. Erorile găsite așa: pagina ieșea din ecran
cu 300px, accentul avea 2,5:1 pe fundal închis, numele cabinetului se tăia peste
900px.

Logica pură (parsere, validări, formatări) se testează cu Node direct:
`node --experimental-strip-types`, cu un hook care rezolvă `@/`.

---

## Cum vorbește proprietarul și ce așteaptă

Întreabă „de ce avem nevoie de asta?" și merită un răspuns cinstit, nu unul de
vânzător. A acceptat de mai multe ori „nu-ți trebuie" și a mulțumit pentru el.

Când cere ceva ce pare greșit, spune o dată de ce și, dacă insistă, **fă exact ce
a cerut** — a avut dreptate la limita de cuvinte care chiar oprește scrisul.

Nu ascunde ce n-a mers. A întrebat „cât mai e până terminăm" tocmai fiindcă
listele anterioare fuseseră incomplete; răspunsul corect a fost să caut în cod și
să găsesc trei lucruri care nu erau în niciun plan.
