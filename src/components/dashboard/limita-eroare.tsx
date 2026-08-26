"use client";

import { Component, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback: ReactNode;
  /** Se schimbă odată cu conținutul: la o valoare nouă, se mai încearcă o dată. */
  cheie: unknown;
};

/**
 * Prinde o eroare de randare din previzualizare, ca să nu ia cu ea tot ecranul.
 *
 * Fără asta, o singură componentă care se împiedică de o valoare neașteptată
 * dărâmă toată pagina panoului — iar clientul pierde tot ce a scris și n-a
 * salvat. S-a întâmplat: un rând nou, gol, în datele de contact.
 *
 * Formularul e ce contează; previzualizarea e un ajutor. Când ajutorul cade,
 * cade singur.
 *
 * Trebuie să fie o clasă: React n-are echivalent cu funcții pentru
 * `getDerivedStateFromError`.
 */
export class LimitaEroare extends Component<Props, { aEsuat: boolean }> {
  state = { aEsuat: false };

  static getDerivedStateFromError() {
    return { aEsuat: true };
  }

  componentDidUpdate(propsAnterioare: Props) {
    // Se reface la următoarea modificare: altfel o valoare greșită ar bloca
    // previzualizarea până la reîncărcarea paginii, chiar după ce e reparată.
    if (this.state.aEsuat && propsAnterioare.cheie !== this.props.cheie) {
      this.setState({ aEsuat: false });
    }
  }

  componentDidCatch(eroare: Error) {
    console.error("Previzualizarea nu s-a putut randa:", eroare);
  }

  render() {
    return this.state.aEsuat ? this.props.fallback : this.props.children;
  }
}
