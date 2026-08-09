"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleReset(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/update-password`,
        }
      );

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setMessage(
      "Password reset link has been sent to your email."
    );

    setLoading(false);
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
              Forgot password?
            </h1>

            <p className="mt-3 text-sm leading-6 text-white/40">
              Enter your email and we&apos;ll send you a
              password reset link.
            </p>

          </div>

          <form
            onSubmit={handleReset}
            className="space-y-5"
          >

            <div>

              <label
                htmlFor="email"
                className="mb-2 block text-sm text-white/60"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/25 focus:bg-white/[0.07]"
              />

            </div>

            {error && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-white/85 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Sending..."
                : "Send reset link"}
            </button>

          </form>

          <div className="mt-8 text-center">

            <Link
              href="/login"
              className="text-sm text-white/40 transition hover:text-white"
            >
              ← Back to login
            </Link>

          </div>

        </div>

      </div>
    </main>
  );
}