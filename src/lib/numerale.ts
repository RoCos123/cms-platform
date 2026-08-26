/**
 * Regula românească pe care nicio bibliotecă de internaționalizare n-o rezolvă
 * din prima: de la 20 în sus, numeralul cere „de" înaintea substantivului.
 *
 * 19 minute, dar 20 DE minute. 101 locuri, dar 100 DE locuri. Se uită la
 * ultimele două cifre, nu la numărul întreg.
 *
 * Stă într-un singur loc fiindcă apare peste tot unde numărăm ceva pentru
 * client — iar scrisă din nou de fiecare dată, s-ar fi nimerit greșit undeva.
 */
export function cereDe(numar: number): boolean {
  const ultimeleDoua = Math.abs(numar) % 100;
  return ultimeleDoua === 0 || ultimeleDoua > 19;
}

const NUMERE = new Intl.NumberFormat("ro-RO");

/**
 * Numărul scris ca în română: „3.000", nu „3000" și cu atât mai puțin „3,000".
 * Contează abia de la mii în sus, dar de-acolo încolo contează peste tot —
 * inclusiv în mesajul de eroare de lângă contorul care arată deja „3.000".
 */
export function formateazaNumar(numar: number): string {
  return NUMERE.format(numar);
}

/** „1 minut", „19 minute", „20 de minute", „3.000 de cuvinte". */
export function numara(numar: number, singular: string, plural: string): string {
  const scris = formateazaNumar(numar);
  if (Math.abs(numar) === 1) return `${scris} ${singular}`;
  return `${scris}${cereDe(numar) ? " de" : ""} ${plural}`;
}
