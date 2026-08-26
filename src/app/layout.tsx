import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
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
 * publice ale clienților. Un tipar de forma „%s · sitepsihologi.ro" ar fi lipit
 * numele platformei noastre la titlul din Google al fiecărui cabinet.
 */
export const metadata: Metadata = {
  title: "sitepsihologi.ro",
  description: "Platformă CMS multi-tenant pentru site-uri de prezentare profesională.",
};

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
