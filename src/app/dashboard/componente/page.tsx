import { verifySession } from "@/lib/dal";
import { ComponentGallery } from "./gallery";

/**
 * Livrabilul Fazei 2 din plan: „o pagină-galerie cu toate componentele
 * funcționale". Nu e o pagină de produs — e locul unde se verifică o componentă
 * înainte să ajungă într-un ecran real, și unde se vede dacă tema închisă,
 * tastatura și stările goale chiar funcționează.
 */
export default async function ComponentGalleryPage() {
  await verifySession();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Panou
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Componente</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Piesele din care se construiesc ecranele de editare. Toate sunt funcționale —
          încearcă-le, inclusiv cu tastatura și pe tema închisă.
        </p>
      </div>

      <ComponentGallery />
    </div>
  );
}
