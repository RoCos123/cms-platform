import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { adresaSiteuluiOptionala } from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Doar plasa de siguranță, pentru rutele care nu-și pun titlu propriu.
 *
 * Fără `template`, deliberat: layoutul ăsta înfășoară și panoul, și site-urile
 * publice ale clienților. Un tipar de forma „%s · sitepsihologi.ro” ar fi lipit
 * numele platformei noastre la titlul din Google al fiecărui cabinet.
 *
 * A devenit `generateMetadata` ca să poată citi domeniul clientului din cererea
 * curentă — un obiect constant n-are de unde să-l știe.
 */
export async function generateMetadata(): Promise<Metadata> {
  return {
    /**
     * Adresa față de care se rezolvă tot ce e relativ în metadate: adresa
     * canonică, linkurile și imaginile din cardurile sociale.
     *
     * Fără ea, Next le rezolvă față de `localhost:3000`. Nu e o ipoteză —
     * originalul chiar a plecat așa în producție, iar fiecare partajare pe
     * Facebook sau WhatsApp arăta un card rupt, cu o imagine care nu se putea
     * încărca de nicăieri (audit-site-public.md).
     *
     * Fiindcă stă aici, în layoutul rădăcină, fiecare pagină de mai jos își
     * scrie adresa canonică relativ („/servicii”) și n-o mai lipește de mână din
     * domeniu. Domeniul rămâne într-un singur loc: ăsta.
     *
     * `null` doar pe `/site-unavailable`, singura pagină servită tocmai fiindcă
     * n-a putut fi rezolvat niciun client. Ea nu declară nicio adresă, deci n-are
     * ce rămâne nerezolvat.
     */
    metadataBase: await adresaSiteuluiOptionala(),
    title: "sitepsihologi.ro",
    description: "Platformă CMS multi-tenant pentru site-uri de prezentare profesională.",
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ro"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
