"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setEmail(user.email || "");
      setLoading(false);
    };

    loadUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* HEADER */}
        <header className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-sm text-gray-500">MY DIGITAL SPACE</p>

            <h1 className="text-4xl font-bold tracking-tight">
              Welcome back 👋
            </h1>

            <p className="mt-2 text-gray-400">{email}</p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
          >
            Logout
          </button>
        </header>

        {/* CARDS */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {/* FILES */}
          <button
            onClick={() => router.push("/dashboard/files")}
            className="group rounded-3xl border border-white/10 bg-white/[0.04] p-7 text-left transition hover:-translate-y-1 hover:bg-white/[0.07]"
          >
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-3xl">
              📁
            </div>

            <h2 className="text-xl font-semibold">My Files</h2>

            <p className="mt-2 text-sm leading-6 text-gray-400">
              Upload, organize, view and download your personal files and
              folders.
            </p>

            <div className="mt-6 text-sm font-medium text-white">
              Open Files →
            </div>
          </button>

          {/* BLOGS */}
          <button
            onClick={() => router.push("/dashboard/blogs")}
            className="group rounded-3xl border border-white/10 bg-white/[0.04] p-7 text-left transition hover:-translate-y-1 hover:bg-white/[0.07]"
          >
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-3xl">
              ✍️
            </div>

            <h2 className="text-xl font-semibold">My Blogs</h2>

            <p className="mt-2 text-sm leading-6 text-gray-400">
              Create and manage your blog posts and personal content.
            </p>

            <div className="mt-6 text-sm font-medium text-white">
              Open Blogs →
            </div>
          </button>

          {/* FUTURE */}
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-7">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-3xl">
              🚀
            </div>

            <h2 className="text-xl font-semibold">More Coming</h2>

            <p className="mt-2 text-sm leading-6 text-gray-400">
              Your digital space can grow with more features, tools and
              personal content.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}