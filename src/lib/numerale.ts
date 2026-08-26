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

/** „1 minut", „19 minute", „20 de minute". */
export function numara(numar: number, singular: string, plural: string): string {
  if (Math.abs(numar) === 1) return `${numar} ${singular}`;
  return `${numar}${cereDe(numar) ? " de" : ""} ${plural}`;
}
