/**
 * Găsirea unei persoane în datele unui cabinet, ca să i se poată șterge.
 *
 * DE CE E NEVOIE. Prin GDPR, cine a lăsat date pe site poate cere oricând să nu
 * mai fie păstrate. Cererea vine de obicei la telefon, iar psihologul are atât:
 * un număr sau o adresă de email. Până acum, ștergerea se făcea de mână, direct
 * în baza de date — adică de tine, nu de el, și fără nicio urmă că s-a făcut.
 *
 * DE CE POTRIVIREA E PARTEA GREA. Același om își scrie numărul altfel de
 * fiecare dată: „0721 123 456”, „0721123456”, „+40 721 123 456”,
 * „0040-721-123-456”. Toate sunt același telefon. O căutare care compară
 * textele ar găsi una dintre cereri și le-ar lăsa pe celelalte în bază — iar
 * psihologul ar rămâne convins că a șters tot. Ăsta e felul de greșeală care se
 * descoperă abia când te întreabă cineva de ce mai ai datele lui.
 *
 * Fișierul e pur, fără acces la bază, tocmai ca potrivirea să poată fi probată.
 */

export type FelCautare = "telefon" | "email" | "necunoscut";

export type Cautare = {
  fel: FelCautare;
  /** Forma pe care se compară: cifrele semnificative, sau adresa în litere mici. */
  cheie: string;
};

/**
 * Ultimele nouă cifre ale unui număr de telefon.
 *
 * Nouă, fiindcă atât are un număr românesc fără prefixul de țară și fără zeroul
 * de la început: 0721 123 456 → 721123456. Comparând doar atât, toate formele de
 * mai sus cad una peste alta, indiferent dacă omul a scris +40, 0040 sau 0.
 *
 * Nu încearcă să valideze că numărul e adevărat: aici nu se decide dacă cineva
 * poate fi sunat, ci doar dacă două șiruri sunt același om.
 */
export function cifreleTelefonului(brut: string): string {
  const cifre = brut.replace(/\D/g, "");
  return cifre.length <= 9 ? cifre : cifre.slice(-9);
}

/** E-mailul, adus la o formă comparabilă. Adresele nu sunt sensibile la majuscule. */
export function cheiaEmailului(brut: string): string {
  return brut.trim().toLowerCase();
}

/**
 * Ce a scris psihologul în căsuța de căutare: un telefon sau un email?
 *
 * Un `@` înseamnă email; altfel, dacă rămân măcar șase cifre, e telefon. Șase,
 * nu nouă: cineva care caută după ultimele cifre pe care le are trebuie să
 * găsească, iar restrângerea prea devreme l-ar lăsa cu „n-am găsit nimic” în
 * fața unui om care așteaptă la telefon.
 */
export function citesteCautarea(brut: string): Cautare {
  const curat = brut.trim();
  if (curat === "") return { fel: "necunoscut", cheie: "" };

  if (curat.includes("@")) return { fel: "email", cheie: cheiaEmailului(curat) };

  const cifre = curat.replace(/\D/g, "");
  if (cifre.length >= 6) return { fel: "telefon", cheie: cifreleTelefonului(curat) };

  return { fel: "necunoscut", cheie: "" };
}

/** Un rând care poartă datele cuiva, oricare ar fi tabelul din care vine. */
export type RandCuPersoana = {
  phone?: string | null;
  email?: string | null;
};

/**
 * Rândul ăsta e al omului căutat?
 *
 * Se compară AMBELE câmpuri, nu doar cel de felul căutării: cineva care lasă
 * telefonul la o programare și emailul la newsletter e același om, iar o
 * ștergere care sare peste jumătate din date nu e o ștergere.
 *
 * La telefon se compară pe cifrele semnificative — vezi `cifreleTelefonului`.
 * Un câmp gol nu se potrivește niciodată cu nimic: altfel, o căutare ar fi
 * măturat toate rândurile fără telefon.
 */
export function esteAlPersoanei(rand: RandCuPersoana, cautare: Cautare): boolean {
  if (cautare.cheie === "") return false;

  if (cautare.fel === "email") {
    return !!rand.email && cheiaEmailului(rand.email) === cautare.cheie;
  }

  if (cautare.fel === "telefon") {
    if (!rand.phone) return false;
    const cifre = cifreleTelefonului(rand.phone);
    return cifre !== "" && cifre === cautare.cheie;
  }

  return false;
}

/**
 * Scoate numele unei persoane dintr-un rezumat de jurnal.
 *
 * Jurnalul de activitate scrie propoziții ca „Programarea lui Ion Popescu a fost
 * confirmată”. Numele ăla e tot dată personală, iar o ștergere care-l lasă
 * acolo nu e o ștergere.
 *
 * Rândul din jurnal NU se șterge, se albește. Jurnalul e dovada că nimeni n-a
 * umblat pe ascuns în datele cabinetului; șters bucată cu bucată, n-ar mai
 * dovedi nimic. Rămâne că s-a întâmplat ceva, dispare cine.
 */
export function albesteRezumatul(rezumat: string, nume: string): string {
  const curat = nume.trim();
  if (curat === "") return rezumat;

  // Fără expresii regulate construite din numele omului: un nume cu paranteze
  // sau puncte ar fi devenit un tipar care prinde altceva decât trebuie.
  return rezumat.split(curat).join("o persoană (date șterse la cerere)");
}
