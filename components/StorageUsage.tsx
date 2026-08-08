"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

// Supabase Free Storage quota
const TOTAL_STORAGE = 1 * 1024 * 1024 * 1024;

export default function StorageUsage() {
  const [used, setUsed] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function calculateStorage() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { data, error } = await supabase.storage
          .from("my-files")
          .list(user.id, {
            limit: 1000,
          });

        if (error) {
          console.error(error);
          return;
        }

        const total = (data ?? []).reduce(
          (sum, file) => sum + (file.metadata?.size ?? 0),
          0
        );

        setUsed(total);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    calculateStorage();
  }, []);

  function formatBytes(bytes: number) {
    if (bytes === 0) return "0 B";

    const units = ["B", "KB", "MB", "GB", "TB"];

    const index = Math.min(
      Math.floor(Math.log(bytes) / Math.log(1024)),
      units.length - 1
    );

    return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${
      units[index]
    }`;
  }

  const available = Math.max(TOTAL_STORAGE - used, 0);

  const percentage = Math.min(
    (used / TOTAL_STORAGE) * 100,
    100
  );

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <p className="text-sm text-white/40">
          Calculating storage...
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">

      <div className="flex items-center justify-between">

        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/30">
            Storage
          </p>

          <p className="mt-2 text-xl font-semibold">
            {formatBytes(used)}
          </p>

          <p className="mt-1 text-sm text-white/30">
            of 1 GB used
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm text-white/40">
            Available
          </p>

          <p className="mt-1 font-medium">
            {formatBytes(available)}
          </p>
        </div>

      </div>

      <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-white transition-all duration-500"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>

      <div className="mt-3 flex justify-between text-xs text-white/30">
        <span>
          {percentage.toFixed(1)}% used
        </span>

        <span>
          1 GB total
        </span>
      </div>

    </div>
  );
}