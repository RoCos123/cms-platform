/**
 * Ecranul de așteptare al panoului, pentru orice ecran care se încarcă.
 *
 * DE CE EXISTĂ. Fără un `loading.tsx`, Next ține browserul pe pagina VECHE cât
 * timp serverul își adună datele, și abia apoi navighează. Pentru client asta
 * arată ca un panou înțepenit: apasă „Editează", nu se întâmplă nimic o
 * secundă, apasă din nou. Proprietarul a semnalat-o pe 1 oct. 2026 — pe bună
 * dreptate, fiindcă panoul E produsul: un client care îl simte greoi n-o să-și
 * schimbe singur textele și pozele, iar atunci tot rostul lui cade.
 *
 * Mai face ceva, mai puțin vizibil și la fel de important: Next nu preîncarcă
 * rutele dinamice dincolo de cea mai apropiată graniță de așteptare. Fără
 * fișierul ăsta, un link spre un ecran de editare nu se poate pregăti dinainte
 * DELOC. Cu el, pregătirea începe de când linkul intră în ecran.
 *
 * Stă la rădăcina panoului, deci acoperă fiecare ecran de dedesubt care n-are
 * unul al lui — secțiuni, blog, servicii, pagini, setări. Nu înlocuiește
 * scurtarea drumurilor spre bază (vezi CONTEXT.md §„De ce dura editarea"):
 * aia face așteptarea mai scurtă, asta o face să nu mai arate a defecțiune.
 */
export default function SeIncarca() {
  return (
    // `aria-busy` + `status`: cine folosește un cititor de ecran aude „se
    // încarcă" în loc să rămână pe tăcere.
    <div role="status" aria-busy className="animate-pulse space-y-6" aria-label="Se încarcă">
      <div className="space-y-2">
        <div className="h-7 w-56 rounded-base bg-surface-muted" />
        <div className="h-4 w-80 rounded-base bg-surface-muted" />
      </div>

      {/*
        Două coloane pe ecran lat, ca ecranele de editare: formularul la stânga,
        previzualizarea la dreapta. Scheletul care seamănă cu ce urmează face
        așteptarea să pară mai scurtă decât una care sare într-o altă formă.
      */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-32 rounded-base bg-surface-muted" />
              <div className="h-10 w-full rounded-base bg-surface-muted" />
            </div>
          ))}
        </div>

        <div className="hidden h-80 rounded-base bg-surface-muted lg:block" />
      </div>
    </div>
  );
}
