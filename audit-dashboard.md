# Documentație dashboard CMS — analiză pentru replicare

**Sursă:** `rodi-cotenescu.vercel.app/dashboard`, sesiune autentificată, inspecție read-only (nicio salvare, publicare sau ștergere executată).
**Data analizei:** 27 iulie 2026
**Metodă:** navigare pe toate rutele din meniu + citirea arborelui de accesibilitate (etichete, câmpuri, stări) + inspecția traficului de rețea.

**Notă de acuratețe:** tot ce e marcat „observat" a fost citit direct din interfață. Ce e marcat „dedus" e inferență din denumiri, comportament sau convenții de framework. Unde nu se poate ști, scrie explicit.

---

## 1. Overview general al dashboard-ului

### Scop principal
Panou de administrare pentru un site de prezentare (marketing site) construit ca landing page pe secțiuni, cu blog atașat. Nu e un CMS generalist gen WordPress: fiecare secțiune a paginii publice are un formular dedicat, cu câmpuri fixe. Utilizatorul nu construiește pagini din blocuri — completează sloturi predefinite.

### Utilizator țintă
Un singur rol vizibil: proprietarul site-ului (în cazul de față psihologul, autentificat cu adresa lui de e-mail). Nu există pagină de administrare utilizatori, nu există selector de rol, nu există invitații. **Dedus:** aplicația e single-tenant, single-user, cu un cont de admin per deployment. Textele de tip „Drafts and unpublished articles are admin-only" sugerează totuși existența unei distincții admin / vizitator la nivel de vizibilitate a conținutului, nu de roluri multiple în panou.

### Tip de site administrat
Site de servicii / prezentare profesională: hero, servicii, tarife, proces, testimoniale, FAQ, contact, plus blog și pagini libere. Zero funcționalități de e-commerce (fără produse, comenzi, stocuri, plăți).

### Ce poate face utilizatorul (rezumat)
1. Editează fiecare secțiune a paginii principale separat, cu câmpuri specifice tipului de secțiune.
2. Ascunde sau afișează orice secțiune printr-un comutator, fără să-i șteargă conținutul.
3. Alege între variante vizuale predefinite (A / B / C) pentru anumite secțiuni.
4. Adaugă, reordonează prin drag & drop și șterge elemente în secțiunile de tip listă (servicii, pași, testimoniale, rânduri de tarife).
5. Încarcă imagini, le atribuie text alternativ și le refolosește dintr-o bibliotecă media centralizată.
6. Scrie și publică articole de blog cu editor de text îmbogățit, slug editabil, categorie și câmpuri SEO proprii.
7. Organizează articolele pe categorii.
8. Citește mesajele primite prin formularul public de contact, cu filtrare citite / necitite și coș de gunoi.
9. Configurează global brandul, SEO-ul implicit, cardul social și ID-ul Google Analytics.
10. Consultă un jurnal de activitate append-only, filtrabil, cu diff pentru fiecare modificare.

---

## 2. Structura de navigație

### Layout general
Trei zone fixe:
- **Sidebar stânga** (lățime fixă, cu scroll propriu) — brand sus, meniu la mijloc, contul utilizatorului jos.
- **Bara de sus (topbar)** — pe toată lățimea zonei de conținut, la dreapta: link Inbox, comutator temă, e-mailul contului, buton de deconectare.
- **Zona de conținut** — antet cu supratitlu (breadcrumb simplificat, ex. „Content") și titlul paginii, apoi corpul.

### Brand (sus în sidebar)
Logo + numele site-ului + subtitlu (rol/poziție). Întregul bloc e link către `/dashboard`.

### Meniu principal — hartă completă de rute

| Element meniu | Rută | Scop | Subsecțiuni |
|---|---|---|---|
| Overview | `/dashboard` | Ecran de start, stare generală | — |
| **Content** (grup pliabil) | — | Editarea secțiunilor paginii principale | 17 subsecțiuni, mai jos |
| Portfolio | `/dashboard/portfolio` | Studii de caz / proiecte | — |
| Pages | `/dashboard/pages` | Pagini libere publicate la `/<slug>` | — |
| About | `/dashboard/about` | Pagina `/about`, un singur rând editabil | — |
| **Blog** (grup pliabil) | — | Conținut editorial | Categories, Articles |
| Contacts | `/dashboard/contacts` | Mesaje din formularul public | `/trash` |
| Settings | `/dashboard/settings` | Configurare globală | — |
| Media | `/dashboard/media` | Bibliotecă de imagini | — |
| Activity | `/dashboard/audit` | Jurnal de audit | — |

### Subsecțiunile grupului „Content" (în ordinea din meniu)

| Etichetă afișată | Rută |
|---|---|
| Hero | `/dashboard/content/hero` |
| Logos | `/dashboard/content/logos` |
| Stats | `/dashboard/content/stats` |
| About teaser | `/dashboard/content/aboutTeaser` |
| Problem | `/dashboard/content/problem` |
| Solution | `/dashboard/content/solution` |
| Features | `/dashboard/content/features` |
| Showcase | `/dashboard/content/showcase` |
| How it works | `/dashboard/content/howItWorks` |
| Use cases | `/dashboard/content/useCases` |
| **Templates** | `/dashboard/content/portfolio` ← eticheta nu corespunde rutei |
| Testimonials | `/dashboard/content/testimonials` |
| Pricing | `/dashboard/content/pricing` |
| FAQ | `/dashboard/content/faq` |
| CTA | `/dashboard/content/cta` |
| Contact | `/dashboard/content/contact` |
| Footer | `/dashboard/content/footer` |

Cheile de rută sunt camelCase (`aboutTeaser`, `howItWorks`, `useCases`) → **dedus:** cheia rutei e chiar cheia sub care se salvează secțiunea în baza de date.

### Elemente globale de navigație

| Element | Prezent | Detalii |
|---|---|---|
| Breadcrumb | Parțial | Doar un supratitlu de o treaptă („Content", „Audit", „Inbox") deasupra titlului. Fără cale completă, fără linkuri. |
| Căutare globală | **Nu** | Nu există câmp de căutare nicăieri în panou. |
| Comutator temă | Da | Buton în topbar, etichetă dinamică: „Switch to light mode" / „Switch to dark mode". |
| Comutator limbă | **Nu** | Interfața panoului e integral în engleză; conținutul editat e în română. |
| Comutator site / proiect | **Nu** | Confirmă ipoteza single-tenant. |
| Link rapid Inbox | Da | În topbar, duce la `/dashboard/contacts?filter=unseen`. |
| Identitate cont | Da, duplicat | E-mailul și butonul „Sign out" apar de două ori: în subsolul sidebar-ului și în topbar. |

---

## 3. Pagini și secțiuni detaliate

### 3.1 Overview — `/dashboard`

**Scop:** ecran de aterizare. Răspunde la „ce s-a întâmplat de când am fost ultima dată aici".

**Elemente observate, în ordine:**
1. Supratitlu „DASHBOARD" + titlu „Overview" + salut „Welcome back, <email>."
2. **Card de stare mesaje** — pictogramă bifă într-un cerc, titlu „All caught up", subtitlu „No new messages." Când există mesaje necitite, **dedus:** afișează numărul și devine link către Inbox.
3. **Card „Site activity"** — starea integrării Google Analytics. În lipsa configurării, afișează textul: analytics neconectat, cu numele exacte ale variabilelor de mediu necesare (`GA4_PROPERTY_ID`, `GA_SA_CLIENT_EMAIL`, `GA_SA_PRIVATE_KEY`) și trimitere la `.env.example`. Când e configurat, **dedus:** afișează grafice de trafic.
4. **Card „Recent articles"** — ultimele 5 articole, fiecare cu titlu (link către editor), badge de status, categorie și vechime relativă („6h ago"). Link în antet: „Manage articles →".
5. **Card „Recent activity"** — ultimele intrări din jurnal, fiecare cu tipul acțiunii („LOGIN"), entitatea și identificatorul („Session cms32vmog000..."), actorul și vechimea. Link în antet: „View all →".

**Layout:** carduri pe toată lățimea sus, apoi două coloane egale (articole stânga, activitate dreapta).

---

### 3.2 Editor de secțiune — `/dashboard/content/<key>`

Toate cele 17 secțiuni folosesc același schelet. Diferă doar corpul formularului.

**Schelet comun (observat pe Hero, Features, Pricing):**
1. Antet: supratitlu „Content" + numele secțiunii.
2. **Comutator de vizibilitate** — etichetă „Visible" + switch, cu `aria-label` de forma „Toggle <Secțiune> visibility". Separat de formular → **dedus:** se salvează instant, fără Save.
3. Formular cu titlul secțiunii și, uneori, o descriere explicativă (Hero: „The first thing visitors see.").
4. Buton **Save** unic, la baza formularului, `type="submit"`.

**Nu există:** buton Cancel, buton Preview, indicator de modificări nesalvate, salvare automată.

#### Arhetip A — secțiune simplă cu variante (exemplu: Hero)

| Câmp | Tip | Text ajutător observat |
|---|---|---|
| Variant | radio A / B / C | „A — asymmetric + floating cards" / „B — centered cinematic + case study frame" / „C — editorial split + live changelog" |
| Eyebrow | text | „Optional, small label above the title." |
| Title | textarea | „For B and C, separate lines with a newline; the last line is highlighted." |
| Subtitle | textarea | — |
| Primary CTA label | text | — |
| Primary CTA href | text | — |
| Secondary CTA label | text | „Optional." |
| Secondary CTA href | text | — |
| Hero image | widget imagine | vezi 4.4 |

Sub formular apar două panouri pliabile suplimentare: „Variant B — case study frame" și „Variant C — changelog feed" → **dedus:** fiecare variantă are câmpuri proprii, ascunse până e relevantă.

**Observație importantă:** sistemul de variante A/B/C înseamnă că fiecare secțiune are mai multe componente React interschimbabile, selectate din date. Aceasta e cea mai costisitoare parte de replicat și principalul diferențiator al platformei.

#### Arhetip B — secțiune cu listă de elemente (exemplu: Features)

Antet de secțiune: Eyebrow, Title, Subtitle.
Apoi grup **„Items"**, listă de carduri, fiecare cu:

| Câmp | Tip | Text ajutător |
|---|---|---|
| (mâner) | buton | „Drag to reorder" |
| Title | text | — |
| Icon (optional) | text | „A single emoji or short text." |
| Description | textarea | — |
| Card image (optional) | widget imagine | — |
| Number badge | text | „e.g. 01" |
| Price / duration | text | „e.g. 50 min · 300 RON" |
| Link href (optional) | text | — |
| Remove | buton | șterge elementul |

Sub listă: buton **„+ Add feature"**. La final, două câmpuri de secțiune: „Section CTA label (optional)" și „Section CTA href (optional)", apoi Save.

**Observat:** 8 elemente în listă la momentul analizei, fără limită superioară vizibilă și fără paginare.

#### Arhetip C — secțiune tabelară (exemplu: Pricing)

Antet: Eyebrow, Title, Subtitle.

**Grup „Price table rows"** — fiecare rând:

| Câmp | Tip |
|---|---|
| (mâner) „Drag to reorder" | buton |
| Service | text |
| In person (fizic) | text |
| Online | text |
| Detail / duration | text |
| „Mark this row as free" | checkbox |
| Remove | buton |

Buton „+ Add price row".

**Grup „Footnotes (optional)"** — listă de note, fiecare cu mâner de reordonare, câmp text etichetat dinamic („Note 1", „Note 2") și Remove. Buton „+ Add footnote".

**Grup „Tiers (legacy — optional)"** — listă goală, cu buton „+ Add tier". Etichetat explicit *legacy*. **Dedus:** rămășiță de la modelul original de preț pe pachete (SaaS), înlocuit cu tabelul de rânduri. Cod mort păstrat pentru compatibilitate.

**Observație de tip:** prețurile sunt câmpuri **text liber**, nu numerice. Valorile observate includ „300 RON", „—", „Gratuit". Flexibil, dar imposibil de sortat, filtrat sau agregat.

---

### 3.3 Articles — `/dashboard/blog/articles`

**Scop:** lista tuturor articolelor. Subtitlu: „All blog articles. Drafts and unpublished articles are admin-only."

**Tabel, coloane observate:** Title (cu slug-ul afișat dedesubt, ca text secundar) · Status · Category · Author · Updated · acțiuni (Edit ca link, Delete ca buton).

Buton „New article" → `/dashboard/blog/articles/new`.

**Nu există:** căutare, filtrare pe status sau categorie, sortare pe coloane, paginare, selecție multiplă, acțiuni în masă. La 5 articole nu deranjează; la 60 devine inutilizabil.

### 3.4 Editor articol — `/dashboard/blog/articles/<cuid>`

Titlu „Edit article", plus link „View live →" către URL-ul public.

| Câmp | Tip | Detalii observate |
|---|---|---|
| Title | text | placeholder „A great article title" |
| Slug | text | „Used in /blog/&lt;slug&gt;. Lowercase letters, digits, and hyphens." + buton „Regenerate from title" |
| Excerpt | textarea | „A sentence or two shown on /blog cards + fallback meta description." |
| Author | text | placeholder „Jane Doe" — **text liber, nu legătură către un utilizator** |
| Category | select | opțiuni: „— No category —" + categoriile existente (valoare = cuid) |
| Status | 3 radio | Draft · Published · Unpublished |
| Cover image (optional) | widget imagine | cu text alternativ |
| Content | editor îmbogățit | bară: Heading 2, Heading 3, Bold, Italic, Underline, Bulleted list, Numbered list, Link, Clear formatting |
| SEO (optional) | panou pliabil | Meta title, Meta description, OG image (zonă de drop separată) |
| Save changes | submit | — |

**Trei stări, nu două.** `draft` (niciodată publicat) ≠ `unpublished` (publicat și retras). Distincție utilă, dar neexplicată nicăieri în interfață.

### 3.5 Blog categories — `/dashboard/blog/categories`

Titlu „Blog categories", subtitlu care enunță direct regula de business: ștergerea unei categorii lasă articolele fără categorie, **nu** le șterge.

Formular inline de creare: Name, Slug, buton „Add category". Sub el, lista „All categories (2)" cu nume, slug afișat ca `/relatii-si-familie`, și acțiuni Edit / Delete.

### 3.6 Pages — `/dashboard/pages`

„Free-form content pages published at `/<slug>`. Drafts are admin-only." Buton „New page". Structură de listă analogă articolelor. **Dedus:** același editor, fără categorie și fără autor.

### 3.7 About — `/dashboard/about`

„About / Team — The /about page — a single row, edited here. Changes publish immediately."

Singurul ecran care declară explicit că **nu are stare de draft**: ce salvezi devine public instant. Inconsistență de model față de restul.

### 3.8 Portfolio — `/dashboard/portfolio`

Titlu în pagină: „Case studies". Subtitlu: „All portfolio projects. Drafts and unpublished projects are admin-only." Stare goală: „No case studies yet. Create the first one →".

Complet neutilizat pe acest site. Rămășiță de template de agenție.

### 3.9 Contacts — `/dashboard/contacts`

Supratitlu „Inbox", titlu „Contacts", subtitlu „Briefs submitted via the public contact form." Link „Trash" către `/dashboard/contacts/trash`.

**Filtre ca butoane cu contor:** „All (0)", „Unread (0)", „Read (0)". Stare goală: „No messages here."

Ștergerea e soft delete (există coș de gunoi separat).

### 3.10 Media — `/dashboard/media`

„All uploaded images. Click one to copy its URL or delete it."

Buton „Add image" + zonă de drop: „Drop an image here or click to browse", „PNG, JPEG, WebP, SVG, ICO · up to 5 MB", „or pick from the library".
Panou de detalii în dreapta, cu stare inițială: „Select an image to see its details."

**Nu există:** foldere, etichete, căutare, filtrare pe tip, informație despre unde e folosită o imagine. Ștergerea unei imagini folosite într-o secțiune nu e avertizată — **dedus**, dar e riscul evident.

### 3.11 Activity (Audit) — `/dashboard/audit`

Supratitlu „Audit", titlu „Activity", subtitlu „Who edited what, when. Entries are append-only."

**Filtre:**
| Filtru | Tip | Valori |
|---|---|---|
| Actor | select | „All users" + lista utilizatorilor (valoare = cuid) |
| Action | select | All · Create · Update · Delete · Publish · Unpublish · Sign in · Sign out |
| Entity | select | All · BlogArticle · BlogCategory · SiteContent · SiteSettings · Upload · ContactSubmission · Session |
| From | date | selector de dată |
| (To) | date | selector de dată, fără etichetă vizibilă |
| Reset filters | buton | — |

**Tabel:** When (dată+oră completă, format `27/07/2026, 16:10:37`) · Actor · Action · Entity (+ id-ul entității) · buton **„Open diff"**.
Paginare afișată ca text: „1–2 of 2".

Singurul ecran cu filtrare reală din tot panoul.

### 3.12 Settings — `/dashboard/settings`

„Brand, SEO, social cards, and analytics. Changes apply across every page."

**Patru formulare independente, fiecare cu propriul buton Save:**

**Brand** — „Site name, tagline, logo, and favicon."
Name · Tagline („Optional. Shown in the footer.") · Logo · Logo (dark mode) · Favicon.

**SEO** — „Title, description, canonical URL, and Open Graph card."
Default title · Title template („Use `%s` as a placeholder, e.g. `%s | Acme`") · Description · Keywords („Comma separated.") · Canonical URL („Optional. Set this if this site is mirrored elsewhere.") · Robots (radio: `index,follow` / `noindex,nofollow`) · Open Graph image.

**Social** — „Twitter / X card settings."
Twitter handle („Include `@`, e.g. `@acme`. Optional.") · Twitter card (radio: Large image / Summary).

**Analytics** — „Google Analytics 4. The tag only loads after the visitor accepts the cookie banner."
GA4 Measurement ID, placeholder `G-XXXXXXXXXX`, ajutor: „From GA4 → Admin → Data streams… Leave empty to disable."

**Atenție — două integrări GA distincte:**
- ID-ul de măsurare din Settings = tag-ul care *colectează* date pe site-ul public.
- Variabilele de mediu de pe Overview (`GA4_PROPERTY_ID` + credențiale service account) = *citirea* datelor pentru afișare în panou.
Sunt lucruri diferite, configurate în locuri diferite, iar interfața nu explică asta nicăieri. Sursă sigură de confuzie.

---

## 4. Elemente de UI și componente

### 4.1 Sidebar navigation
Listă cu grupuri pliabile (Content, Blog) declanșate de butoane. Elementul activ e evidențiat cu fundal plin colorat și text alb. Subsolul afișează contul și „Sign out".

### 4.2 Tabel
Antet de coloane fără sortare. Rânduri cu celulă primară pe două niveluri (titlu + slug secundar). Ultima coloană conține acțiuni: link „Edit" și buton „Delete". Fără casete de selecție, fără acțiuni în masă. Paginare doar în Audit, ca text „1–2 of 2".

### 4.3 Badge de status
Punct colorat + text scurt, majuscule (`PUBLISHED`). Verde pentru publicat. **Dedus:** culori distincte pentru draft și unpublished.

### 4.4 Widget de imagine (componentă cheie, reutilizată peste tot)
Două stări:
- **Gol:** zonă de drop, „Drop an image here or click to browse", cu subtext despre formate și limita de 5 MB, plus buton „pick from the library".
- **Plin:** previzualizare + câmp „Alt text" + trei butoane: **Replace** · **Library** · **Remove**. Input-ul de fișier real e ascuns.

Apare identic în: Hero, fiecare item din liste, cover-ul articolului, OG image, Logo, Logo dark, Favicon, Media. **Aceasta e componenta cu cel mai mare raport valoare/efort din tot sistemul.**

### 4.5 Listă cu reordonare (repeater)
Elemente de tip card, fiecare cu mâner „Drag to reorder" și buton „Remove". Buton de adăugare la final, etichetat contextual („+ Add feature", „+ Add price row", „+ Add footnote", „+ Add tier").

### 4.6 Comutator de vizibilitate
`role="switch"` cu etichetă „Visible", plasat în afara formularului, la nivel de secțiune.

### 4.7 Selector de variantă
Grup de radio cu descriere lungă pentru fiecare opțiune. Afișează sau ascunde panouri de câmpuri specifice variantei.

### 4.8 Editor de text îmbogățit
Bară de instrumente cu 9 acțiuni: H2, H3, Bold, Italic, Underline, listă cu buline, listă numerotată, link, ștergere formatare. Zonă editabilă dedesubt. Fără vizualizare cod, fără inserare de imagine în corpul textului, fără tabele, fără citate.

### 4.9 Panou pliabil
Folosit pentru „SEO (optional)" și pentru câmpurile de variantă. Buton care extinde conținutul în loc.

### 4.10 Filtre (doar în Audit)
Selectoare native + două câmpuri de dată + buton de resetare.

### 4.11 Stări de încărcare
Schelete („skeleton") afișate la navigare, plus un ecran de întâmpinare cu logo și textul „Se încarcă…" — singurul text în română din tot panoul.

### 4.12 Notificări
**Nu se pot deduce din interfață** fără a executa o salvare. Nu am declanșat niciun submit. Există un buton clopoțel în topbar, dar nu i-am verificat comportamentul.

---

## 5. Funcționalități și fluxuri

### Flux 1 — Editarea unei secțiuni
1. Sidebar → Content → secțiunea dorită.
2. Opțional: comută vizibilitatea (efect imediat, în afara formularului).
3. Opțional: alege varianta A / B / C → se afișează câmpurile specifice.
4. Completează câmpurile de text.
5. Pentru elemente de listă: adaugă, reordonează prin drag, șterge.
6. Pentru imagini: încarcă sau alege din bibliotecă, completează alt text.
7. Save.

**Puncte de decizie:** varianta; vizibil / ascuns; imagine nouă vs. din bibliotecă.
**Fără confirmări** la ștergerea unui element din listă — **dedus**, nu am testat.

### Flux 2 — Publicarea unui articol
1. Blog → Articles → „New article".
2. Titlu → slug generat automat (regenerabil manual).
3. Excerpt, autor, categorie.
4. Cover image + alt text.
5. Conținut în editorul îmbogățit.
6. Opțional: extinde SEO și completează meta title, meta description, OG image.
7. Alege statusul: Draft / Published / Unpublished.
8. „Save changes".
9. Verificare cu „View live →".

### Flux 3 — Gestionarea mesajelor
Topbar „Inbox" (sau Contacts) → filtrează All / Unread / Read → deschide mesajul → citit / șters (soft delete, recuperabil din Trash).

### Flux 4 — Configurare globală
Settings → completează unul dintre cele patru blocuri → Save pe blocul respectiv. Modificările se aplică pe tot site-ul.

### Flux 5 — Auditul modificărilor
Activity → filtrează după actor, acțiune, entitate, interval → „Open diff" pe o intrare pentru a vedea ce s-a schimbat concret.

---

## 6. Tipuri de date și relații

Numele entităților sunt **observate direct** din filtrul de entitate al jurnalului de audit — nu deduse.

### `SiteContent`
Un rând per cheie de secțiune (`hero`, `logos`, `stats`, `aboutTeaser`, `problem`, `solution`, `features`, `showcase`, `howItWorks`, `useCases`, `portfolio`, `testimonials`, `pricing`, `faq`, `cta`, `contact`, `footer`).
Câmpuri deduse: `key` (unic), `visible` (boolean), `variant` (enum A/B/C), `data` (JSON cu forma specifică secțiunii), `updatedAt`.
**Dedus:** payload-ul e JSON, nu coloane tipizate — altfel 17 forme diferite ar cere 17 tabele.

### `BlogArticle`
`id` (cuid) · `title` · `slug` (unic) · `excerpt` · `authorName` (**text liber, nu cheie străină**) · `categoryId` (nullable) · `status` (`draft` | `published` | `unpublished`) · `coverImage` + `coverAlt` · `content` (HTML sau JSON de la editor) · `metaTitle` · `metaDescription` · `ogImage` · `updatedAt`.
Relație: `BlogArticle` → `BlogCategory` (mulți la unu, opțională).

### `BlogCategory`
`id` (cuid) · `name` · `slug`.
La ștergere: articolele rămân, cu `categoryId` setat pe null (regulă enunțată explicit în interfață).

### `SiteSettings`
Un singur rând. Grupuri: brand (name, tagline, logo, logoDark, favicon) · seo (defaultTitle, titleTemplate, description, keywords, canonicalUrl, robots, ogImage) · social (twitterHandle, twitterCard) · analytics (ga4MeasurementId).

### `Upload`
`id` · `url` · `filename` · `mimeType` · `size` · `createdAt`. Formate acceptate: PNG, JPEG, WebP, SVG, ICO. Maxim 5 MB.
**Nu există** legătură inversă vizibilă către locurile unde e folosită imaginea.

### `ContactSubmission`
Din formularul public: nume, e-mail, mesaj, acord GDPR, plus `read` (boolean) și `deletedAt` (soft delete).

### `Session` / `User`
`User`: id (cuid) + e-mail. `Session`: id, userId, timestamp. Autentificarea generează intrări `login` / `logout` în audit.

### `AuditLog`
`id` · `actorId` → User · `action` (`create` | `update` | `delete` | `publish` | `unpublish` | `login` | `logout`) · `entityType` (una din cele 7 de mai sus) · `entityId` · `diff` (JSON) · `createdAt`.
Append-only, declarat explicit.

**Identificatori:** toate id-urile observate sunt **cuid** (`cms32vn2p00043esrn4h0hmha`), nu UUID și nu autoincrement.

---

## 7. Reguli de business și permisiuni

**Observate direct (text din interfață):**
1. Draft-urile și articolele nepublicate sunt vizibile doar administratorului.
2. Ștergerea unei categorii nu șterge articolele; le lasă necategorizate.
3. Pagina About se publică instantaneu, fără stare de draft.
4. Jurnalul de audit e append-only.
5. Tag-ul Google Analytics se încarcă doar după acceptarea bannerului de cookie-uri.
6. Slug-ul acceptă doar litere mici, cifre și cratime.
7. Încărcările sunt limitate la 5 MB și la cinci formate de imagine.
8. Mesajele de contact se șterg soft (recuperabile din Trash).

**Deduse:**
9. Un singur rol (admin). Fără permisiuni granulare.
10. Titlul e probabil obligatoriu la salvarea unui articol; restul câmpurilor opționale.
11. Slug-ul trebuie să fie unic — nu am testat coliziunea.
12. Ascunderea unei secțiuni păstrează datele.

**Nu se poate deduce din interfață:** ce se întâmplă la publicarea unui articol fără conținut, fără categorie sau cu slug duplicat; dacă există validare pe href-urile CTA; dacă ștergerea unei imagini folosite e blocată sau doar rupe referința.

---

## 8. Comportamente dinamice și stări

| Comportament | Stare |
|---|---|
| Filtrare | Doar în Audit (5 filtre) și Contacts (3 butoane de status). Nicăieri altundeva. |
| Sortare | **Inexistentă** pe orice tabel. Articolele par ordonate după `updatedAt` descrescător, fix. |
| Paginare | Doar în Audit, afișată ca text („1–2 of 2"). Articolele, categoriile și media nu au paginare. |
| Căutare | **Inexistentă**, la nivel global și local. |
| Loading | Schelete la navigare + ecran de întâmpinare „Se încarcă…". Lent perceptibil (câteva secunde per rută). |
| Empty state | Prezent și bine scris: „No case studies yet. Create the first one →", „No messages here.", „Select an image to see its details." |
| Error state | Nu a fost observat niciun ecran de eroare în timpul analizei. |
| Auto-refresh / live updates | Absente. |
| Temă | Comutator light/dark în topbar, aplicat instant. |
| Drag & drop | Reordonare în toate listele; upload prin drop în toate zonele de imagine. |
| Timp relativ vs. absolut | Overview și tabele folosesc „6h ago"; auditul folosește dată+oră completă. Inconsistent. |

**Arhitectură tehnică observată:** Next.js App Router compilat cu Turbopack. La încărcarea unei rute de dashboard nu se face **niciun** apel către un `/api/...` — doar documentul, chunk-urile JS/CSS și fonturile. Concluzie: date randate pe server (React Server Components) și mutații prin Server Actions, nu prin API REST client-side.

---

## 9. Edge cases, limitări și observații

### Inconsistențe reale găsite
1. **Etichetă vs. rută:** meniul afișează „Templates" dar rutează către `/dashboard/content/portfolio`. Cineva a redenumit eticheta fără să redenumească cheia.
2. **Cod mort vizibil utilizatorului:** grupul „Tiers (legacy — optional)" din Pricing e afișat cu tot cu buton de adăugare, deși e explicit depășit. Un client va încerca să-l folosească.
3. **Două module Portfolio fără legătură:** `/dashboard/portfolio` („Case studies") și `/dashboard/content/portfolio` („Templates"). Nume identic, funcții diferite, zero clarificare.
4. **About se publică instant**, spre deosebire de tot restul. Model inconsistent, fără avertisment înainte de salvare.
5. **Duplicare de cont în interfață:** e-mail + „Sign out" apar simultan în sidebar și în topbar.
6. **Autorul e text liber**, nu utilizator. Trei grafii diferite ale aceluiași nume produc trei „autori".
7. **Interfață în engleză, conținut în română**, iar ecranul de încărcare e în română. Amestec vizibil pentru clientul final.
8. **Trei stări de publicare fără explicație.** Nimic nu spune utilizatorului diferența dintre Draft și Unpublished.
9. **Două configurări GA în locuri diferite** (vezi 3.12), fără nicio legătură explicativă între ele.

### Limitări funcționale
- Fără căutare, fără sortare, fără paginare pe conținut. Se degradează previzibil la volum.
- Fără previzualizare înainte de publicare. Singura verificare e „View live →", adică *după* salvare.
- Fără versionare sau restaurare. Auditul arată diff-ul, dar **nu se poate deduce** dacă permite revenirea.
- Fără programare a publicării.
- Fără indicator de modificări nesalvate. Navigarea în alt ecran pierde tăcut munca.
- Fără gestiune de utilizatori, roluri sau invitații.
- Bibliotecă media fără foldere, căutare sau referințe inverse.
- Fără management al redirecturilor sau al meniului public.

### Unde se blochează un utilizator nespecialist
- Nu găsește unde se schimbă ordinea secțiunilor pe pagină — se pare că e fixă.
- Nu înțelege ce înseamnă „Eyebrow", „Showcase", „CTA", „Hero" — vocabular de developer expus direct clientului.
- Nu știe ce face „Unpublished" față de „Draft".
- Completează „Tiers" crezând că sunt tarifele reale.
- Șterge o imagine din Media și rupe o secțiune fără să primească niciun avertisment.

---

## 10. Recomandări pentru replicare

### De păstrat ca atare
- **Un formular per secțiune, cu câmpuri fixe.** E motivul pentru care un client nespecialist poate întreține site-ul singur, fără să-l strice.
- **Widget-ul de imagine cu alt text obligatoriu la vedere.** Rezolvă simultan accesibilitatea și SEO-ul, fără ca utilizatorul să știe că o face.
- **Comutatorul de vizibilitate per secțiune.** Ascunde fără să distrugă. Extrem de util în perioada de lansare.
- **Jurnalul de audit cu diff.** Rar în CMS-uri mici, foarte convingător la vânzare, și te scapă de discuții cu clientul despre „cine a stricat".
- **Settings împărțit în patru formulare independente.** Salvări mici, risc mic.
- **Stările goale bine scrise.**
- **Cele trei stări de publicare** — dar cu explicație în interfață.

### De schimbat
1. **Traduceți integral panoul în română** și redenumiți secțiunile în limbajul clientului: Hero → „Prima secțiune", Features → „Servicii", Showcase → „Cabinetul", CTA → „Invitație la programare". Vocabularul de developer e cel mai mare obstacol pentru un utilizator nespecialist.
2. **Scoateți codul mort** (Tiers legacy, Case studies/Portfolio dacă nu se folosește). Ce nu se folosește, nu se afișează.
3. **Adăugați indicator de modificări nesalvate** și avertisment la părăsirea paginii.
4. **Adăugați previzualizare** înainte de publicare, măcar prin URL de draft.
5. **Uniformizați modelul de publicare.** About trebuie să se comporte ca restul.
6. **Autorul devine cheie străină** către utilizator, nu text liber.
7. **Adăugați căutare și paginare** pe articole și media, înainte să fie nevoie.
8. **Avertizați la ștergerea unei imagini folosite** — un simplu „folosită în 3 locuri" e suficient.
9. **Unificați formatele de timp.**
10. **Adăugați programări** — golul funcțional cel mai mare al produsului și cel mai ușor de vândut unui psiholog.

### Arhitectura informației propusă

```
Panou
├─ Acasă                       (stare, mesaje noi, articole recente, activitate)
├─ Pagina principală           (secțiuni, cu ordine și vizibilitate)
│  └─ <secțiune>               (formular dedicat + variantă + previzualizare)
├─ Pagini                      (pagini libere)
├─ Blog
│  ├─ Articole
│  └─ Categorii
├─ Programări                  ← modul nou
├─ Mesaje                      (inbox, citite, coș)
├─ Imagini
├─ Setări                      (brand · SEO · social · analytics · integrări)
└─ Activitate
```

### Design system — componente necesare

**Layout:** AppShell (sidebar + topbar + conținut) · SidebarNav cu grupuri pliabile · PageHeader cu supratitlu și acțiuni · Card.

**Formulare:** TextField · TextArea · Select · RadioGroup · Checkbox · Switch · DatePicker · FormSection cu Save propriu · SaveBar cu stare „nesalvat".

**Conținut:** **ImageField** (gol/plin, drop, bibliotecă, alt text) · **RepeaterList** (drag, add, remove) · **VariantPicker** · RichTextEditor · CollapsiblePanel · SlugField cu regenerare.

**Date:** DataTable (sortare, paginare, căutare, acțiuni pe rând) · StatusBadge · EmptyState · Skeleton · RelativeTime · DiffViewer.

**Feedback:** Toast · ConfirmDialog (obligatoriu pentru orice ștergere) · InlineError.

### Model de date propus (Postgres / Supabase)

```
sites            id, slug, name, created_at              ← doar dacă mergi multi-tenant
users            id, email, site_id, role
site_content     id, site_id, key, variant, visible, position, data jsonb, updated_at
                 UNIQUE(site_id, key)
site_settings    id, site_id, brand jsonb, seo jsonb, social jsonb, analytics jsonb
pages            id, site_id, slug, title, content, status, seo jsonb
blog_categories  id, site_id, name, slug
blog_articles    id, site_id, title, slug, excerpt, author_id, category_id,
                 status, cover_upload_id, cover_alt, content, seo jsonb,
                 published_at, updated_at
uploads          id, site_id, url, filename, mime_type, size, width, height
contact_messages id, site_id, name, email, message, consent, read_at, deleted_at
appointments     id, site_id, name, email, phone, service, starts_at, status  ← modul nou
audit_log        id, site_id, actor_id, action, entity_type, entity_id,
                 diff jsonb, created_at
```

Indici pe `(site_id, key)`, `(site_id, slug)`, `(site_id, created_at desc)` pentru audit.
RLS pe `site_id` din prima zi dacă mergi multi-tenant — retrofitarea e dureroasă.

### Suprafață de API

Nu construi REST. Aplicația originală folosește Server Actions, și e alegerea corectă aici: mai puțin cod, tipare capăt-la-capăt, revalidare directă.

Acțiuni necesare: `saveSection(key, data)` · `toggleSectionVisibility(key, visible)` · `reorderSectionItems(key, order)` · `saveSettings(group, data)` · `upsertArticle(input)` · `deleteArticle(id)` · `upsertCategory(input)` · `deleteCategory(id)` · `uploadImage(file)` · `deleteUpload(id)` · `markMessageRead(id)` · `trashMessage(id)` · `restoreMessage(id)`.

Fiecare acțiune scrie o intrare în `audit_log` și apelează `revalidatePath` pe rutele publice afectate.

### Estimare de efort
Interfața în sine: câteva zile. Sistemul de variante per secțiune și widget-ul de imagine cu bibliotecă sunt piesele care consumă timpul real. Restul (audit, settings, contacts) e muncă directă, fără surprize.
