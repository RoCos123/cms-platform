import { redirect } from "next/navigation";
import { getProprietarOptional } from "@/lib/proprietar";
import { LoginProprietarForm } from "./login-form";

// Panoul de proprietar n-are ce căuta în motoarele de căutare. robots.txt îl
// oprește deja (vezi DISALLOW_ROBOTS); aici e plasa pe pagină.
export const metadata = { robots: { index: false, follow: false } };

export default async function LoginProprietarPage() {
  // Deja proprietar și conectat? Mergi direct în panou, nu te mai punem să intri.
  if (await getProprietarOptional()) redirect("/proprietar");

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-zinc-950">
      <LoginProprietarForm />
    </div>
  );
}
