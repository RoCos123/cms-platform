import type { NextConfig } from "next";

/**
 * Gazda din care se servesc imaginile încărcate (bucketul public `media`).
 * Se citește din aceeași variabilă ca și clientul Supabase, ca project ref-ul să
 * nu fie scris de mână în două locuri. `next.config.ts` e evaluat DUPĂ ce Next
 * încarcă fișierele `.env*`, deci variabila e disponibilă aici.
 *
 * Fallback-ul acoperă build-urile fără `.env` (CI cu variabile injectate abia la
 * runtime): fără niciun tipar, `next/image` ar arunca „hostname is not
 * configured" la prima previzualizare.
 */
const SUPABASE_IMAGE_HOST = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "*.supabase.co";

const nextConfig: NextConfig = {
  images: {
    /**
     * Fără asta, orice `<Image src={url}>` cu o adresă Supabase aruncă în dev
     * („Invalid src prop … hostname is not configured") și primește 400 de la
     * optimizator în producție — adică previzualizarea din ImageField și
     * miniaturile din bibliotecă nu s-ar vedea niciodată.
     *
     * `pathname` e restrâns la prefixul obiectelor publice: optimizatorul nostru
     * nu are ce căuta pe restul API-ului Supabase.
     */
    remotePatterns: [
      {
        protocol: "https",
        hostname: SUPABASE_IMAGE_HOST,
        pathname: "/storage/v1/object/public/**",
      },
    ],
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
       * Validarea noastră acceptă imagini de până la 5 MB, dar limita implicită
       * a corpului unui Server Action e 1 MB: fără linia asta, orice fotografie
       * făcută cu telefonul ar fi respinsă de runtime cu o excepție, nu de
       * `describeImageProblem` cu un mesaj omenesc. Marja de 1 MB acoperă
       * overhead-ul `multipart/form-data` (delimitatori, anteturi de parte).
       */
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
