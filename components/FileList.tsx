"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type StorageFile = {
  name: string;
  id: string | null;
  updated_at: string | null;
  created_at: string | null;
  last_accessed_at: string | null;
  metadata: {
    size?: number;
    mimetype?: string;
  } | null;
};

export default function FileList() {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadFiles() {
    try {
      setLoading(true);
      setMessage("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You are not logged in.");
      }

      const { data, error } = await supabase.storage
        .from("my-files")
        .list(user.id, {
          limit: 100,
          sortBy: {
            column: "created_at",
            order: "desc",
          },
        });

      if (error) {
        throw error;
      }

      setFiles(data ?? []);
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Could not load files."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      await loadFiles();
    })();
  }, []);

  function isImage(file: StorageFile) {
    return file.metadata?.mimetype?.startsWith("image/");
  }

  function isVideo(file: StorageFile) {
    return file.metadata?.mimetype?.startsWith("video/");
  }

  function formatSize(size?: number) {
    if (!size) return "Unknown size";

    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    if (size < 1024 * 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  async function openFile(file: StorageFile) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You are not logged in.");
      }

      const path = `${user.id}/${file.name}`;

      const { data, error } = await supabase.storage
        .from("my-files")
        .createSignedUrl(path, 60 * 60);

      if (error) {
        throw error;
      }

      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank");
      }
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Could not open file."
      );
    }
  }

  async function downloadFile(file: StorageFile) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You are not logged in.");
      }

      const path = `${user.id}/${file.name}`;

      const { data, error } = await supabase.storage
        .from("my-files")
        .download(path);

      if (error) {
        throw error;
      }

      const url = URL.createObjectURL(data);

      const link = document.createElement("a");

      link.href = url;
      link.download = file.name;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Could not download file."
      );
    }
  }

  async function deleteFile(file: StorageFile) {
    const confirmed = window.confirm(
      `Delete "${file.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You are not logged in.");
      }

      const path = `${user.id}/${file.name}`;

      const { error } = await supabase.storage
        .from("my-files")
        .remove([path]);

      if (error) {
        throw error;
      }

      setFiles((current) =>
        current.filter((item) => item.name !== file.name)
      );
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Could not delete file."
      );
    }
  }

  if (loading) {
    return (
      <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-center">
        <p className="text-white/40">
          Loading your files...
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">

      {message && (
        <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          {message}
        </div>
      )}

      {files.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center">

          <div className="text-4xl">
            ☁️
          </div>

          <p className="mt-4 text-lg">
            No files yet
          </p>

          <p className="mt-2 text-sm text-white/30">
            Upload your first photo, video or document.
          </p>

        </div>
      ) : (
        <div className="space-y-3">

          {files.map((file) => (
            <div
              key={file.name}
              className="group flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4 transition hover:bg-white/[0.07] sm:flex-row sm:items-center"
            >

              {/* Preview */}
              <button
                onClick={() => openFile(file)}
                className="flex min-w-0 flex-1 items-center gap-4 text-left"
              >

                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/10">

                  {isImage(file) ? (
                    <ImagePreview
                      userFileName={file.name}
                    />
                  ) : isVideo(file) ? (
                    <span className="text-2xl">
                      🎬
                    </span>
                  ) : (
                    <span className="text-2xl">
                      📄
                    </span>
                  )}

                </div>

                <div className="min-w-0">

                  <p className="truncate font-medium">
                    {file.name}
                  </p>

                  <p className="mt-1 text-sm text-white/30">
                    {formatSize(file.metadata?.size)}
                  </p>

                </div>

              </button>

              {/* Actions */}
              <div className="flex items-center gap-2">

                <button
                  onClick={() => openFile(file)}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/50 transition hover:bg-white/10 hover:text-white"
                >
                  View
                </button>

                <button
                  onClick={() => downloadFile(file)}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/50 transition hover:bg-white/10 hover:text-white"
                >
                  Download
                </button>

                <button
                  onClick={() => deleteFile(file)}
                  className="rounded-full border border-red-500/10 px-4 py-2 text-sm text-red-300/60 transition hover:bg-red-500/10 hover:text-red-300"
                >
                  Delete
                </button>

              </div>

            </div>
          ))}

        </div>
      )}
    </div>
  );
}

function ImagePreview({
  userFileName,
}: {
  userFileName: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    async function getUrl() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const path = `${user.id}/${userFileName}`;

      const { data } = await supabase.storage
        .from("my-files")
        .createSignedUrl(path, 60 * 60);

      if (data?.signedUrl) {
        setUrl(data.signedUrl);
      }
    }

    getUrl();
  }, [userFileName]);

  if (!url) {
    return <span className="text-2xl">📷</span>;
  }

  return (
    <Image
      src={url}
      alt=""
      width={64}
      height={64}
      className="object-cover"
    />
  );
}