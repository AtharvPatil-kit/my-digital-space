import { createSupabaseServerClient } from "@/lib/supabase-server";

export default async function StorageTestPage() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.storage
    .from("my-files")
    .list("", {
      limit: 10,
    });

  return (
    <main className="min-h-screen p-10">
      <h1 className="text-3xl font-bold">
        Storage Test
      </h1>

      <pre className="mt-8 whitespace-pre-wrap rounded-xl bg-white/10 p-5">
        {JSON.stringify(
          {
            data,
            error,
          },
          null,
          2
        )}
      </pre>
    </main>
  );
}