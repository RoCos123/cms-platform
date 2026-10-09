/**
 * Tabelul comparativ din dreapta pachetelor — DOAR pe sitepsihologi.ro.
 *
 * Cerut de proprietar pe 7 oct. 2026, cu textele și înfățișarea lui, scrise aici
 * în cod la cererea lui (nu se editează din panou). Apare numai când rândul
 * secțiunii „Pachete" are `variant = 'comparatie'`, pus o singură dată din SQL —
 * la fel ca „vitrina" la galerie și „linie" la „Ce primești". Panoul nu scrie
 * `variant`, deci niciun alt client nu-l poate porni și nu-l vede.
 *
 * Textele stau o singură dată, în `COLOANE` și `RANDURI`, și din ele se desenează
 * două înfățișări (brief 9 oct. 2026, 1.5): tabelul, de la 768px în sus, și pe
 * ecran îngust câte un card pe rând, cu fiecare valoare etichetată cu numele
 * coloanei — ca să nu mai fie nevoie de derulare în lateral. Un text schimbat aici
 * se schimbă în amândouă.
 */

const COLOANE = {
  functionalitate: "Funcționalitate",
  noi: "sitepsihologi.ro",
  diy: "Platforme DIY (Wix, Squarespace)",
  agentii: "Agenții Web",
};

/** Cum e scrisă valoarea noastră: îngroșată, mai îngroșată, sau verde (programările). */
type Accent = "semibold" | "bold" | "verde";

const RANDURI: { functionalitate: string; noi: string; accent: Accent; diy: string; agentii: string }[] = [
  {
    functionalitate: "Model de preț",
    noi: "Plată unică + 50€/an",
    accent: "bold",
    diy: "Abonament lunar",
    agentii: "Prețuri mari, uneori peste 1000 €",
  },
  {
    functionalitate: "Efortul tău tehnic",
    noi: "Minim: doar încarci pozele și textele.",
    accent: "semibold",
    diy: "Construiești singur",
    agentii: "Ședințe lungi, du-te-vino obositor",
  },
  {
    functionalitate: "Mentenanță & Securitate",
    noi: "Inclusă",
    accent: "semibold",
    diy: "Te descurci singur",
    agentii: "Factură separat la oră",
  },
  {
    functionalitate: "Sistem de programări",
    noi: "Inclus. 0% comision pe ședință.",
    accent: "verde",
    diy: "Modul plătit separat / Abonament extra",
    agentii: "Necesită dezvoltare custom",
  },
  {
    functionalitate: "Timp de lansare",
    noi: "Maxim 5 zile lucrătoare.",
    accent: "semibold",
    diy: "Săptămâni întregi de frustrări",
    agentii: "1-3 luni de așteptare",
  },
  {
    functionalitate: "Proprietate",
    noi: "Domeniul îți aparține exclusiv",
    accent: "semibold",
    diy: "Pierzi adresa web",
    agentii: "Riști să pierzi domeniul",
  },
];

const CULOARE_ACCENT: Record<Accent, string> = {
  semibold: "font-semibold text-[#1e3a8a]",
  bold: "font-bold text-[#1e3a8a]",
  verde: "font-bold text-green-600",
};

export function TabelComparativ() {
  return (
    <>
      {/* Ecran îngust: un card pe rând, fără derulare în lateral. */}
      <ul className="md:hidden m-0 p-0 list-none flex flex-col gap-3 w-full text-left">
        {RANDURI.map((rand) => (
          <li
            key={rand.functionalitate}
            className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
          >
            <p className="m-0 px-4 pt-4 pb-3 text-base font-semibold text-gray-900">
              {rand.functionalitate}
            </p>
            <dl className="m-0 text-sm">
              <div className="px-4 py-3 bg-[#f4f6f8] border-y border-gray-200">
                <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">{COLOANE.noi}</dt>
                <dd className={`m-0 mt-1 ${CULOARE_ACCENT[rand.accent]}`}>{rand.noi}</dd>
              </div>
              <div className="px-4 py-3 border-b border-gray-100">
                <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">{COLOANE.diy}</dt>
                <dd className="m-0 mt-1 text-gray-500">{rand.diy}</dd>
              </div>
              <div className="px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">{COLOANE.agentii}</dt>
                <dd className="m-0 mt-1 text-gray-500">{rand.agentii}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      {/* De la 768px în sus: tabelul, ca până acum. */}
      <div className="hidden md:block w-full h-full max-w-3xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="h-full overflow-x-auto">
          <table className="w-full h-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="p-4 bg-gray-50 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  {COLOANE.functionalitate}
                </th>
                <th className="p-4 bg-[#f4f6f8] text-base font-bold text-[#1e3a8a] border-x border-gray-200 w-1/3">
                  {COLOANE.noi}
                </th>
                <th className="p-4 bg-gray-50 text-sm font-semibold text-gray-500 w-1/4">{COLOANE.diy}</th>
                <th className="p-4 bg-gray-50 text-sm font-semibold text-gray-500 w-1/4">{COLOANE.agentii}</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700">
              {RANDURI.map((rand, i) => (
                <tr
                  key={rand.functionalitate}
                  // Ultimul rând fără linie dedesubt: îl închide chenarul tabelului.
                  className={i < RANDURI.length - 1 ? "border-b border-gray-100 hover:bg-gray-50/50" : undefined}
                >
                  <td className="p-4 font-medium text-gray-900">{rand.functionalitate}</td>
                  <td className={`p-4 bg-[#f4f6f8] border-x border-gray-200 ${CULOARE_ACCENT[rand.accent]}`}>
                    {rand.noi}
                  </td>
                  <td className="p-4 text-gray-500">{rand.diy}</td>
                  <td className="p-4 text-gray-500">{rand.agentii}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
