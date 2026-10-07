/**
 * Tabelul comparativ de sub pachete — DOAR pe sitepsihologi.ro.
 *
 * Cerut de proprietar pe 7 oct. 2026, cu textele și înfățișarea lui, scrise aici
 * în cod la cererea lui (nu se editează din panou). Apare numai când rândul
 * secțiunii „Pachete" are `variant = 'comparatie'`, pus o singură dată din SQL —
 * la fel ca „vitrina" la galerie și „linie" la „Ce primești". Panoul nu scrie
 * `variant`, deci niciun alt client nu-l poate porni și nu-l vede.
 */
export function TabelComparativ() {
  return (
    <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm mt-8">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="p-4 bg-gray-50 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                Funcționalitate
              </th>
              <th className="p-4 bg-[#f4f6f8] text-base font-bold text-[#1e3a8a] border-x border-gray-200 w-1/3">
                sitepsihologi.ro
              </th>
              <th className="p-4 bg-gray-50 text-sm font-semibold text-gray-500 w-1/4">
                Platforme DIY
              </th>
              <th className="p-4 bg-gray-50 text-sm font-semibold text-gray-500 w-1/4">
                Agenții Web
              </th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-700">
            {/* Rândul 1 */}
            <tr className="border-b border-gray-100 hover:bg-gray-50/50">
              <td className="p-4 font-medium text-gray-900">Model de preț</td>
              <td className="p-4 bg-[#f4f6f8] border-x border-gray-200 font-bold text-[#1e3a8a]">
                Plată unică + 50€/an
              </td>
              <td className="p-4 text-gray-500">Abonament lunar</td>
              <td className="p-4 text-gray-500">Mii de euro (Cost mare)</td>
            </tr>

            {/* Rândul 2 */}
            <tr className="border-b border-gray-100 hover:bg-gray-50/50">
              <td className="p-4 font-medium text-gray-900">Efortul tău tehnic</td>
              <td className="p-4 bg-[#f4f6f8] border-x border-gray-200 font-semibold text-[#1e3a8a]">
                ZERO. Ne ocupăm noi.
              </td>
              <td className="p-4 text-gray-500">Construiești singur</td>
              <td className="p-4 text-gray-500">Ședințe lungi și feedback</td>
            </tr>

            {/* Rândul 3 */}
            <tr className="border-b border-gray-100 hover:bg-gray-50/50">
              <td className="p-4 font-medium text-gray-900">Mentenanță & Suport</td>
              <td className="p-4 bg-[#f4f6f8] border-x border-gray-200 font-semibold text-[#1e3a8a]">
                Inclusă
              </td>
              <td className="p-4 text-gray-500">Te descurci singur</td>
              <td className="p-4 text-gray-500">Facturată separat la oră</td>
            </tr>

            {/* Rândul 4 */}
            <tr className="border-b border-gray-100 hover:bg-gray-50/50">
              <td className="p-4 font-medium text-gray-900">Comision programări</td>
              <td className="p-4 bg-[#f4f6f8] border-x border-gray-200 font-bold text-green-600">
                0% Comision
              </td>
              <td className="p-4 text-gray-500">Plătit extra / % din ședință</td>
              <td className="p-4 text-gray-500">Necesită modul custom</td>
            </tr>

            {/* Rândul 5 */}
            <tr>
              <td className="p-4 font-medium text-gray-900">Proprietate design</td>
              <td className="p-4 bg-[#f4f6f8] border-x border-gray-200 font-semibold text-[#1e3a8a]">
                Licență pe viață
              </td>
              <td className="p-4 text-gray-500">Aparține platformei</td>
              <td className="p-4 text-gray-500">Aparține agenției</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
