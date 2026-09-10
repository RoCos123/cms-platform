import { FormularParolaUitata } from "./form";

type Props = {
  searchParams: Promise<{ eroare?: string }>;
};

export default async function ParolaUitataPage({ searchParams }: Props) {
  const { eroare } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <FormularParolaUitata linkInvalid={eroare === "link-invalid"} />
    </div>
  );
}
