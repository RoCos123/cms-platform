import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /**
     * NICIO gazdă externă. Din 1 sept. 2026, depozitul de fișiere e privat, iar
     * pozele se servesc doar de la noi, pe adrese relative
     * (`/imagini/<id>/<semnătură>`) — pe care optimizatorul le acceptă oricum,
     * fără niciun tipar.
     *
     * Lista goală nu e o curățenie, e o încuietoare. Cât timp aici stătea
     * `**.supabase.co/storage/v1/object/public/**`, o regresie care ar fi
     * reintrodus adrese publice ar fi mers în tăcere, iar izolarea ar fi căzut
     * fără ca nimic să pară stricat. Acum o astfel de adresă e refuzată
     * zgomotos de `next/image`.
     *
     * Adresele puse de client către alte site-uri se randează ca `<img>` simplu
     * (vezi `poateFiOptimizata` în src/components/site/section-image.tsx), deci
     * nu se rupe nimic pentru vizitator.
     */
    remotePatterns: [],

    /**
     * SVG e unul dintre formatele acceptate la încărcare (vezi
     * `ACCEPTED_IMAGE_TYPES`). Next îl refuză implicit, pentru că un SVG poate
     * conține script. CSP-ul de mai jos e exact mitigarea recomandată: imaginea
     * se randează, dar nimic din ea nu se execută.
     */
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  experimental: {
    serverActions: {
      /**
       * Validarea noastră acceptă imagini ȘI documente de până la 5 MB
       * (`MAX_IMAGE_BYTES`, `MAX_DOCUMENT_BYTES` din `lib/uploads.ts`), dar limita
       * implicită a corpului unui Server Action e 1 MB: fără linia asta, orice
       * fotografie făcută cu telefonul ar fi respinsă de runtime cu o excepție,
       * nu de `describeImageProblem`/`describeDocumentProblem` cu un mesaj omenesc.
       * Marja de 1 MB acoperă overhead-ul `multipart/form-data` (delimitatori,
       * anteturi de parte). Plafonul ăsta trebuie să rămână peste cea mai mare
       * limită de upload; dacă vreuna crește, crește și el.
       */
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
