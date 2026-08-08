"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function UpdatePasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpdate(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setError("");

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } =
      await supabase.auth.updateUser({
        password,
      });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-md items-center justify-center">

        <div className="w-full">

          <div className="mb-8 text-center">

            <p className="text-xs uppercase tracking-[0.25em] text-white/30">
              Account recovery
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">
              Set new password.
            </h1>

            <p className="mt-3 text-sm leading-6 text-white/40">
              Choose a new password for your account.
            </p>

          </div>

          <form
            onSubmit={handleUpdate}
            className="space-y-5"
          >

            <div>

              <label
                htmlFor="password"
                className="mb-2 block text-sm text-white/60"
              >
                New password
              </label>

              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="••••••••"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/25 focus:bg-white/[0.07]"
              />

            </div>

            <div>

              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm text-white/60"
              >
                Confirm password
              </label>

              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                placeholder="••••••••"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/25 focus:bg-white/[0.07]"
              />

            </div>

            {error && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-white/85 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Updating..."
                : "Update password"}
            </button>

          </form>

        </div>

      </div>
    </main>
  );
}