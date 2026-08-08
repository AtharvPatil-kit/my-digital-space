"use client";

import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

export default function Navbar() {
  return (
    <nav className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-10">

        {/* Logo */}
        <Link
          href="/dashboard"
          className="text-lg font-semibold tracking-tight"
        >
          My Digital Space
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-6">

          <Link
            href="/dashboard"
            className="text-sm text-white/50 transition hover:text-white"
          >
            Home
          </Link>

          <Link
            href="/dashboard/files"
            className="text-sm text-white/50 transition hover:text-white"
          >
            My Files
          </Link>

          <LogoutButton />

        </div>

      </div>
    </nav>
  );
}