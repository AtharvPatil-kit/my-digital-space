"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();

    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-white/60 transition hover:bg-white/10 hover:text-white"
    >
      Sign out
    </button>
  );
}