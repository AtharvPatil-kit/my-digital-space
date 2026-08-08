import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import FileUploader from "@/components/FileUploader";
import FileList from "@/components/FileList";
import StorageUsage from "@/components/StorageUsage";
import LogoutButton from "@/components/LogoutButton";

export default async function FilesPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen px-6 py-12 sm:px-10">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <header className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/30">
              Private cloud
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">
              My Files
            </h1>

            <p className="mt-2 text-sm text-white/40">
              Your personal files, available anywhere.
            </p>
          </div>

          <LogoutButton />
        </header>

        {/* Storage Usage */}
        <section className="mt-10">
          <StorageUsage />
        </section>

        {/* Upload */}
        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <h2 className="text-lg font-medium">
            Upload a file
          </h2>

          <p className="mt-2 text-sm text-white/35">
            Photos, videos, documents and other files.
          </p>

          <div className="mt-6">
            <FileUploader />
          </div>
        </section>

        {/* Files */}
        <section className="mt-10">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/30">
              Your storage
            </p>

            <h2 className="mt-2 text-2xl font-medium">
              Files
            </h2>
          </div>

          <FileList />
        </section>

        {/* Back to Dashboard */}
        <div className="mt-10">
          <a
            href="/dashboard"
            className="text-sm text-white/30 transition hover:text-white"
          >
            ← Back to dashboard
          </a>
        </div>

      </div>
    </main>
  );
}