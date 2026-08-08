import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import LogoutButton from "@/components/LogoutButton";

export default async function DashboardPage() {
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
              Private space
            </p>

            <h1 className="mt-3 text-5xl font-semibold tracking-[-0.06em]">
              My Digital Space
            </h1>

            <p className="mt-4 text-white/40">
              Your personal cloud, available wherever you go.
            </p>
          </div>

          <LogoutButton />

        </header>

        {/* Account */}
        <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">

          <p className="text-xs uppercase tracking-[0.2em] text-white/30">
            Signed in as
          </p>

          <p className="mt-3 text-lg">
            {user.email}
          </p>

        </div>

        {/* Main Storage Card */}
        <section className="mt-8">

          <a
            href="/dashboard/files"
            className="group block rounded-[32px] border border-white/10 bg-white/[0.04] p-8 transition duration-300 hover:border-white/20 hover:bg-white/[0.07]"
          >

            <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-center">

              <div>

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl">
                  ☁️
                </div>

                <h2 className="mt-6 text-3xl font-semibold tracking-[-0.04em]">
                  My Files
                </h2>

                <p className="mt-3 max-w-xl text-white/40">
                  Store your photos, videos, documents and other
                  important files securely in the cloud.
                </p>

              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 text-xl text-white/40 transition group-hover:border-white/20 group-hover:text-white">
                →
              </div>

            </div>

          </a>

        </section>

        {/* File categories */}
        <section className="mt-8 grid gap-4 sm:grid-cols-3">

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="text-2xl">
              📷
            </div>

            <h3 className="mt-5 font-medium">
              Photos
            </h3>

            <p className="mt-2 text-sm text-white/30">
              Keep your memories accessible anywhere.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="text-2xl">
              🎬
            </div>

            <h3 className="mt-5 font-medium">
              Videos
            </h3>

            <p className="mt-2 text-sm text-white/30">
              Store your videos without filling your device.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="text-2xl">
              📄
            </div>

            <h3 className="mt-5 font-medium">
              Documents
            </h3>

            <p className="mt-2 text-sm text-white/30">
              Keep important files available whenever you need them.
            </p>
          </div>

        </section>

        {/* Status */}
        <div className="mt-10 rounded-3xl border border-emerald-500/10 bg-emerald-500/[0.04] p-6">

          <p className="text-sm text-emerald-300">
            ● Private cloud active
          </p>

          <p className="mt-2 text-sm text-white/30">
            Your account is securely connected to your cloud storage.
          </p>

        </div>

      </div>
    </main>
  );
}