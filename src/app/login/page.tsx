import { LoginForm } from "./login-form";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      {/* Cont valid, dar al altui tenant — proxy.ts ne-a trimis aici cu acest motiv. */}
      <LoginForm wrongTenant={error === "cont-gresit"} />
    </div>
  );
}
