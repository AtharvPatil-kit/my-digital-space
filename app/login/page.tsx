"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  const [showPhone, setShowPhone] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Email/password login
  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
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

  // Google login
  async function handleGoogleLogin() {
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  // Send phone OTP
  async function handleSendOTP(event: React.FormEvent) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      phone,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setOtpSent(true);
    setMessage("OTP sent to your phone.");
    setLoading(false);
  }

  // Verify phone OTP
  async function handleVerifyOTP(event: React.FormEvent) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: "sms",
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

          {/* Header */}
          <div className="mb-8 text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-white/30">
              Private space
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">
              Welcome back.
            </h1>

            <p className="mt-3 text-sm leading-6 text-white/40">
              Sign in to access your personal dashboard.
            </p>
          </div>

          {!showPhone ? (
            <>
              {/* Email Login */}
              <form
                onSubmit={handleLogin}
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

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-sm text-white/60"
                    >
                      Password
                    </label>

                    <a
                      href="/forgot-password"
                      className="text-xs text-white/40 transition hover:text-white"
                    >
                      Forgot password?
                    </a>
                  </div>

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
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </form>

              {/* Divider */}
              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs text-white/20">
                  OR
                </span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              {/* Google */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="text-lg">G</span>
                Continue with Google
              </button>

              {/* Phone */}
              <button
                type="button"
                onClick={() => {
                  setShowPhone(true);
                  setError("");
                  setMessage("");
                }}
                className="mt-3 flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10"
              >
                <span>📱</span>
                Continue with Phone
              </button>
            </>
          ) : (
            <>
              {/* Phone Login */}
              <form
                onSubmit={
                  otpSent
                    ? handleVerifyOTP
                    : handleSendOTP
                }
                className="space-y-5"
              >
                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm text-white/60"
                  >
                    Phone number
                  </label>

                  <input
                    id="phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(event) =>
                      setPhone(event.target.value)
                    }
                    placeholder="+91 9876543210"
                    disabled={otpSent}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/25 focus:bg-white/[0.07] disabled:opacity-50"
                  />
                </div>

                {otpSent && (
                  <div>
                    <label
                      htmlFor="otp"
                      className="mb-2 block text-sm text-white/60"
                    >
                      Verification code
                    </label>

                    <input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(event) =>
                        setOtp(event.target.value)
                      }
                      placeholder="Enter 6-digit OTP"
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-lg tracking-[0.3em] text-white outline-none placeholder:text-white/20 focus:border-white/25 focus:bg-white/[0.07]"
                    />
                  </div>
                )}

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
                    ? "Please wait..."
                    : otpSent
                    ? "Verify OTP"
                    : "Send OTP"}
                </button>
              </form>

              <button
                type="button"
                onClick={() => {
                  setShowPhone(false);
                  setOtpSent(false);
                  setOtp("");
                  setError("");
                  setMessage("");
                }}
                className="mt-5 w-full text-center text-sm text-white/40 transition hover:text-white"
              >
                ← Back to email login
              </button>
            </>
          )}

          {/* Signup */}
          <div className="mt-8 border-t border-white/10 pt-6 text-center">
            <p className="text-sm text-white/30">
              Don't have an account?
            </p>

            <a
              href="/signup"
              className="mt-2 inline-block text-sm text-white/70 transition hover:text-white"
            >
              Create an account →
            </a>
          </div>

        </div>
      </div>
    </main>
  );
}