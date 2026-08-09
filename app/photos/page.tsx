import Link from "next/link";

export default function PhotosPage() {
  return (
    <main className="min-h-screen bg-[#050505] px-6 py-10 text-white lg:px-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="text-sm text-white/40 transition hover:text-white"
        >
          ← Back home
        </Link>

        <div className="mt-20">
          <p className="text-xs uppercase tracking-[0.25em] text-white/30">
            04 / Memories
          </p>

          <h1 className="mt-4 text-6xl font-semibold tracking-[-0.06em]">
            Photos
          </h1>

          <p className="mt-6 max-w-xl text-white/40">
            A personal archive of moments, places and memories.
          </p>
        </div>

        <div className="mt-16 rounded-[28px] border border-white/10 bg-white/[0.035] p-8">
          <p className="text-sm text-white/30">
            Your photo archive will appear here.
          </p>

          <h2 className="mt-4 text-3xl font-medium">
            Coming soon.
          </h2>
        </div>
      </div>
    </main>
  );
}