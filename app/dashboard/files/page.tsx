"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const BUCKET = "my-files";

/*
 * Supabase Storage quotas:
 *
 * Free      = 1 GB
 * Pro       = 100 GB
 * Team      = 100 GB
 * Enterprise = Custom
 *
 * The browser cannot safely read your Supabase billing plan.
 *
 * For your current project we use FREE by default.
 *
 * If you later upgrade, change:
 *
 * NEXT_PUBLIC_SUPABASE_PLAN=pro
 *
 * in your .env.local file.
 */

const SUPABASE_PLAN =
  process.env.NEXT_PUBLIC_SUPABASE_PLAN || "free";

const STORAGE_LIMITS: Record<string, number> = {
  free: 1 * 1024 * 1024 * 1024,
  pro: 100 * 1024 * 1024 * 1024,
  team: 100 * 1024 * 1024 * 1024,
};

const PLAN_NAMES: Record<string, string> = {
  free: "Supabase Free",
  pro: "Supabase Pro",
  team: "Supabase Team",
  enterprise: "Supabase Enterprise",
};

type StorageItem = {
  name: string;
  id: string | null;
  updated_at: string | null;
  created_at: string | null;
  last_accessed_at: string | null;
  metadata: {
    size?: number;
    mimetype?: string;
    cacheControl?: string;
    eTag?: string;
  } | null;
};

type UploadFile = File & {
  webkitRelativePath?: string;
};

export default function FilesPage() {
  const router = useRouter();

  const [items, setItems] = useState<StorageItem[]>([]);
  const [currentPath, setCurrentPath] = useState("");

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [progress, setProgress] = useState(0);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [storageUsed, setStorageUsed] = useState(0);
  const [storageLoading, setStorageLoading] = useState(true);

  // ============================================================
  // STORAGE QUOTA
  // ============================================================

  const storageLimit =
    STORAGE_LIMITS[SUPABASE_PLAN] ||
    STORAGE_LIMITS.free;

  const planName =
    PLAN_NAMES[SUPABASE_PLAN] ||
    PLAN_NAMES.free;

  // ============================================================
  // FORMAT BYTES
  // ============================================================

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes <= 0) {
      return "0 Bytes";
    }

    const units = ["Bytes", "KB", "MB", "GB", "TB"];

    const index = Math.min(
      Math.floor(Math.log(bytes) / Math.log(1024)),
      units.length - 1
    );

    return `${(bytes / Math.pow(1024, index)).toFixed(
      index === 0 ? 0 : 2
    )} ${units[index]}`;
  };

  // ============================================================
  // GET TOTAL STORAGE USAGE
  // ============================================================

  const calculateStorageUsage = useCallback(
    async (folderPath = ""): Promise<number> => {
      let total = 0;

      const { data, error } = await supabase.storage
        .from(BUCKET)
        .list(folderPath, {
          limit: 1000,
          offset: 0,
        });

      if (error) {
        throw error;
      }

      for (const item of (data || []) as StorageItem[]) {
        const itemPath = folderPath
          ? `${folderPath}/${item.name}`
          : item.name;

        /*
         * Supabase folders have no file ID.
         */
        if (item.id === null) {
          total += await calculateStorageUsage(itemPath);
        } else {
          total += Number(item.metadata?.size || 0);
        }
      }

      return total;
    },
    []
  );

  const loadStorageUsage = useCallback(async () => {
    setStorageLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const total = await calculateStorageUsage();

      setStorageUsed(total);
    } catch (err) {
      console.error(
        "Storage usage calculation error:",
        err
      );
    } finally {
      setStorageLoading(false);
    }
  }, [calculateStorageUsage, router]);

  // ============================================================
  // STORAGE CALCULATIONS
  // ============================================================

  const storagePercentage = Math.min(
    (storageUsed / storageLimit) * 100,
    100
  );

  const storageRemaining = Math.max(
    storageLimit - storageUsed,
    0
  );

  // ============================================================
  // LOAD CURRENT FOLDER
  // ============================================================

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase.storage
        .from(BUCKET)
        .list(currentPath, {
          limit: 1000,
          offset: 0,
          sortBy: {
            column: "name",
            order: "asc",
          },
        });

      if (error) {
        throw error;
      }

      setItems((data || []) as StorageItem[]);
    } catch (err: any) {
      console.error("Load files error:", err);

      setError(
        err?.message || "Unable to load files."
      );
    } finally {
      setLoading(false);
    }
  }, [currentPath, router]);

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  useEffect(() => {
    loadStorageUsage();
  }, [loadStorageUsage]);

  // ============================================================
  // HELPERS
  // ============================================================

  const clearMessages = () => {
    setError("");
    setMessage("");
  };

  const isFolder = (item: StorageItem) => {
    return item.id === null;
  };

  const getFullPath = (name: string) => {
    return currentPath
      ? `${currentPath}/${name}`
      : name;
  };

  // ============================================================
  // BREADCRUMBS
  // ============================================================

  const breadcrumbs = useMemo(() => {
    if (!currentPath) {
      return [];
    }

    const parts = currentPath.split("/");

    return parts.map((part, index) => ({
      name: part,
      path: parts.slice(0, index + 1).join("/"),
    }));
  }, [currentPath]);

  // ============================================================
  // UPLOAD FILES
  // ============================================================

  const uploadFiles = async (
    fileList: FileList | File[]
  ) => {
    const files = Array.from(fileList) as UploadFile[];

    if (!files.length) {
      return;
    }

    clearMessages();

    setUploading(true);
    setProgress(0);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      let completed = 0;

      for (const file of files) {
        /*
         * Folder upload:
         *
         * webkitRelativePath:
         *
         * Photos/2026/trip.jpg
         *
         * Normal file:
         *
         * trip.jpg
         */

        let relativePath =
          file.webkitRelativePath ||
          file.name;

        relativePath = relativePath.replace(
          /^\/+/,
          ""
        );

        const storagePath = currentPath
          ? `${currentPath}/${relativePath}`
          : relativePath;

        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(storagePath, file, {
            cacheControl: "3600",
            upsert: true,
            contentType:
              file.type ||
              "application/octet-stream",
          });

        if (error) {
          throw error;
        }

        completed++;

        setProgress(
          Math.round(
            (completed / files.length) * 100
          )
        );
      }

      setMessage(
        `${files.length} ${
          files.length === 1
            ? "file"
            : "files"
        } uploaded successfully.`
      );

      await loadFiles();
      await loadStorageUsage();
    } catch (err: any) {
      console.error("Upload error:", err);

      setError(
        err?.message || "Upload failed."
      );
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  // ============================================================
  // FILE UPLOAD
  // ============================================================

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;

    if (!files || files.length === 0) {
      return;
    }

    await uploadFiles(files);

    event.target.value = "";
  };

  // ============================================================
  // FOLDER UPLOAD
  // ============================================================

  const handleFolderUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;

    if (!files || files.length === 0) {
      return;
    }

    await uploadFiles(files);

    event.target.value = "";
  };

  // ============================================================
  // OPEN FOLDER
  // ============================================================

  const openFolder = (folderName: string) => {
    clearMessages();

    setCurrentPath(
      currentPath
        ? `${currentPath}/${folderName}`
        : folderName
    );
  };

  // ============================================================
  // GO TO PATH
  // ============================================================

  const goToPath = (path: string) => {
    clearMessages();
    setCurrentPath(path);
  };

  // ============================================================
  // GO BACK
  // ============================================================

  const goBack = () => {
    if (!currentPath) {
      return;
    }

    const parts = currentPath.split("/");

    parts.pop();

    setCurrentPath(parts.join("/"));
  };

  // ============================================================
  // OPEN FILE
  // ============================================================

  const openFile = async (
    file: StorageItem
  ) => {
    clearMessages();

    try {
      const path = getFullPath(file.name);

      const { data, error } =
        await supabase.storage
          .from(BUCKET)
          .createSignedUrl(
            path,
            60 * 60
          );

      if (error) {
        throw error;
      }

      if (!data?.signedUrl) {
        throw new Error(
          "Unable to create file URL."
        );
      }

      window.open(
        data.signedUrl,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          "Unable to open file."
      );
    }
  };

  // ============================================================
  // DOWNLOAD FILE
  // ============================================================

  const downloadFile = async (
    file: StorageItem
  ) => {
    clearMessages();

    try {
      const path = getFullPath(file.name);

      const { data, error } =
        await supabase.storage
          .from(BUCKET)
          .createSignedUrl(
            path,
            60 * 60
          );

      if (error) {
        throw error;
      }

      if (!data?.signedUrl) {
        throw new Error(
          "Unable to create download URL."
        );
      }

      const link =
        document.createElement("a");

      link.href = data.signedUrl;
      link.target = "_blank";
      link.rel =
        "noopener noreferrer";
      link.download = file.name;

      document.body.appendChild(link);

      link.click();

      link.remove();
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          "Unable to download file."
      );
    }
  };

  // ============================================================
  // DELETE FILE
  // ============================================================

  const deleteFile = async (
    file: StorageItem
  ) => {
    const confirmed =
      window.confirm(
        `Delete "${file.name}"?`
      );

    if (!confirmed) {
      return;
    }

    clearMessages();

    try {
      const path =
        getFullPath(file.name);

      const { error } =
        await supabase.storage
          .from(BUCKET)
          .remove([path]);

      if (error) {
        throw error;
      }

      setMessage(
        `"${file.name}" deleted successfully.`
      );

      await loadFiles();
      await loadStorageUsage();
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          "Unable to delete file."
      );
    }
  };

  // ============================================================
  // GET FILES RECURSIVELY
  // ============================================================

  const getAllFiles = async (
    folderPath: string
  ): Promise<string[]> => {
    const paths: string[] = [];

    const { data, error } =
      await supabase.storage
        .from(BUCKET)
        .list(folderPath, {
          limit: 1000,
          offset: 0,
        });

    if (error) {
      throw error;
    }

    for (const item of (data ||
      []) as StorageItem[]) {
      const path =
        `${folderPath}/${item.name}`;

      if (item.id === null) {
        const nested =
          await getAllFiles(path);

        paths.push(...nested);
      } else {
        paths.push(path);
      }
    }

    return paths;
  };

  // ============================================================
  // DELETE FOLDER
  // ============================================================

  const deleteFolder = async (
    folder: StorageItem
  ) => {
    const confirmed =
      window.confirm(
        `Delete "${folder.name}" and everything inside it?`
      );

    if (!confirmed) {
      return;
    }

    clearMessages();

    try {
      const folderPath =
        getFullPath(folder.name);

      const files =
        await getAllFiles(folderPath);

      if (files.length > 0) {
        const { error } =
          await supabase.storage
            .from(BUCKET)
            .remove(files);

        if (error) {
          throw error;
        }
      }

      setMessage(
        `Folder "${folder.name}" deleted successfully.`
      );

      await loadFiles();
      await loadStorageUsage();
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          "Unable to delete folder."
      );
    }
  };

  // ============================================================
  // REFRESH EVERYTHING
  // ============================================================

  const refreshEverything = async () => {
    clearMessages();

    await Promise.all([
      loadFiles(),
      loadStorageUsage(),
    ]);
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <button
              onClick={() =>
                router.push("/dashboard")
              }
              className="mb-4 text-sm text-gray-400 transition hover:text-white"
            >
              ← Back to Dashboard
            </button>

            <h1 className="text-4xl font-bold tracking-tight">
              My Files
            </h1>

            <p className="mt-2 text-gray-400">
              Store and organize your digital space.
            </p>
          </div>

          {/* UPLOAD BUTTONS */}

          <div className="flex flex-wrap gap-3">

            {/* FILE UPLOAD */}

            <label className="cursor-pointer">
              <input
                type="file"
                multiple
                className="hidden"
                onChange={
                  handleFileUpload
                }
              />

              <div className="rounded-2xl bg-white px-5 py-3 font-semibold text-black shadow-lg transition hover:bg-gray-200">
                📄 Upload Files
              </div>
            </label>

            {/* FOLDER UPLOAD */}

            <label className="cursor-pointer">
              <input
                type="file"
                multiple
                className="hidden"
                {...({
                  webkitdirectory: "",
                } as any)}
                onChange={
                  handleFolderUpload
                }
              />

              <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 font-semibold text-white shadow-lg transition hover:bg-white/20">
                📁 Upload Folder
              </div>
            </label>

            {/* REFRESH */}

            <button
              onClick={
                refreshEverything
              }
              disabled={
                loading ||
                storageLoading
              }
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition hover:bg-white/10 disabled:opacity-50"
              title="Refresh"
            >
              ↻
            </button>
          </div>
        </div>

        {/* ================================================== */}
        {/* STORAGE CARD */}
        {/* ================================================== */}

        <section className="mb-7 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            {/* LEFT */}

            <div className="flex items-start gap-4">

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-2xl">
                ☁️
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3">

                  <h2 className="text-lg font-semibold">
                    Storage
                  </h2>

                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-400">
                    {planName}
                  </span>

                </div>

                {storageLoading ? (
                  <p className="mt-2 text-sm text-gray-500">
                    Calculating storage usage...
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-gray-400">
                    {formatBytes(storageUsed)} used of{" "}
                    {formatBytes(storageLimit)}
                  </p>
                )}
              </div>
            </div>

            {/* RIGHT */}

            <div className="lg:text-right">

              {!storageLoading && (
                <>
                  <p className="text-3xl font-bold">
                    {storagePercentage.toFixed(1)}%
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {formatBytes(
                      storageRemaining
                    )}{" "}
                    remaining
                  </p>
                </>
              )}

            </div>
          </div>

          {/* PROGRESS BAR */}

          <div className="mt-6">

            <div className="h-3 overflow-hidden rounded-full bg-white/10">

              {storageLoading ? (
                <div className="h-full w-1/4 animate-pulse rounded-full bg-white/20" />
              ) : (
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    storagePercentage >= 90
                      ? "bg-red-500"
                      : storagePercentage >= 75
                      ? "bg-yellow-400"
                      : "bg-white"
                  }`}
                  style={{
                    width: `${storagePercentage}%`,
                  }}
                />
              )}

            </div>

            <div className="mt-3 flex justify-between text-xs text-gray-600">
              <span>0 GB</span>
              <span>
                {formatBytes(storageLimit)}
              </span>
            </div>

          </div>

          {/* WARNING */}

          {!storageLoading &&
            storagePercentage >= 90 && (
              <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                ⚠️ Your storage is almost full.
                Consider deleting unused files
                or upgrading your Supabase plan.
              </div>
            )}

        </section>

        {/* ================================================== */}
        {/* UPLOAD PROGRESS */}
        {/* ================================================== */}

        {uploading && (
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">

            <div className="mb-3 flex justify-between">

              <span className="text-sm font-medium">
                Uploading...
              </span>

              <span className="text-sm text-gray-400">
                {progress}%
              </span>

            </div>

            <div className="h-2 overflow-hidden rounded-full bg-white/10">

              <div
                className="h-full rounded-full bg-white transition-all duration-300"
                style={{
                  width: `${progress}%`,
                }}
              />

            </div>

          </div>
        )}

        {/* ================================================== */}
        {/* SUCCESS */}
        {/* ================================================== */}

        {message && (
          <div className="mb-6 rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-300">
            ✓ {message}
          </div>
        )}

        {/* ================================================== */}
        {/* ERROR */}
        {/* ================================================== */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            ⚠ {error}
          </div>
        )}

        {/* ================================================== */}
        {/* BREADCRUMB */}
        {/* ================================================== */}

        <div className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-xl">

          <button
            onClick={() =>
              goToPath("")
            }
            className={`rounded-lg px-2 py-1 text-sm transition ${
              currentPath === ""
                ? "font-semibold text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            My Files
          </button>

          {breadcrumbs.map(
            (crumb) => (
              <div
                key={crumb.path}
                className="flex items-center gap-2"
              >
                <span className="text-gray-600">
                  /
                </span>

                <button
                  onClick={() =>
                    goToPath(
                      crumb.path
                    )
                  }
                  className="rounded-lg px-2 py-1 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
                >
                  {crumb.name}
                </button>
              </div>
            )
          )}

        </div>

        {/* ================================================== */}
        {/* BACK */}
        {/* ================================================== */}

        {currentPath && (
          <button
            onClick={goBack}
            className="mb-5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300 transition hover:bg-white/10 hover:text-white"
          >
            ← Go Back
          </button>
        )}

        {/* ================================================== */}
        {/* FILE AREA */}
        {/* ================================================== */}

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-2xl backdrop-blur-xl">

          {loading ? (

            <div className="flex min-h-[300px] items-center justify-center">

              <div className="text-center">

                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />

                <p className="text-gray-400">
                  Loading files...
                </p>

              </div>

            </div>

          ) : items.length === 0 ? (

            <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">

              <div className="mb-5 text-6xl">
                📂
              </div>

              <h2 className="text-xl font-semibold">
                This folder is empty
              </h2>

              <p className="mt-2 max-w-md text-sm text-gray-400">
                Upload files or an entire
                folder to start building your
                digital space.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-3">

                <label className="cursor-pointer">

                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={
                      handleFileUpload
                    }
                  />

                  <div className="rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-gray-200">
                    📄 Upload Files
                  </div>

                </label>

                <label className="cursor-pointer">

                  <input
                    type="file"
                    multiple
                    className="hidden"
                    {...({
                      webkitdirectory: "",
                    } as any)}
                    onChange={
                      handleFolderUpload
                    }
                  />

                  <div className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/20">
                    📁 Upload Folder
                  </div>

                </label>

              </div>

            </div>

          ) : (

            <div className="divide-y divide-white/5">

              {items.map(
                (item) => {

                  const folder =
                    isFolder(item);

                  return (
                    <div
                      key={item.name}
                      className="group flex flex-col gap-4 px-5 py-5 transition hover:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between"
                    >

                      {/* NAME */}

                      <button
                        onClick={() =>
                          folder
                            ? openFolder(
                                item.name
                              )
                            : openFile(
                                item
                              )
                        }
                        className="flex min-w-0 items-center gap-4 text-left"
                      >

                        <span className="text-3xl">
                          {folder
                            ? "📁"
                            : "📄"}
                        </span>

                        <div className="min-w-0">

                          <p className="truncate font-medium text-white">
                            {item.name}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {folder
                              ? "Folder"
                              : item
                                  .metadata
                                  ?.mimetype ||
                                "File"}
                          </p>

                        </div>

                      </button>

                      {/* ACTIONS */}

                      <div className="flex flex-wrap items-center gap-2">

                        {folder ? (

                          <>
                            <button
                              onClick={() =>
                                openFolder(
                                  item.name
                                )
                              }
                              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-300 transition hover:bg-white/10 hover:text-white"
                            >
                              Open
                            </button>

                            <button
                              onClick={() =>
                                deleteFolder(
                                  item
                                )
                              }
                              className="rounded-lg border border-red-500/10 bg-red-500/5 px-3 py-2 text-xs text-red-300 transition hover:bg-red-500/10"
                            >
                              Delete
                            </button>
                          </>

                        ) : (

                          <>

                            <span className="px-2 py-2 text-xs text-gray-500">
                              {formatBytes(
                                item
                                  .metadata
                                  ?.size ||
                                  0
                              )}
                            </span>

                            <button
                              onClick={() =>
                                openFile(
                                  item
                                )
                              }
                              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-300 transition hover:bg-white/10 hover:text-white"
                            >
                              Open
                            </button>

                            <button
                              onClick={() =>
                                downloadFile(
                                  item
                                )
                              }
                              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-300 transition hover:bg-white/10 hover:text-white"
                            >
                              Download
                            </button>

                            <button
                              onClick={() =>
                                deleteFile(
                                  item
                                )
                              }
                              className="rounded-lg border border-red-500/10 bg-red-500/5 px-3 py-2 text-xs text-red-300 transition hover:bg-red-500/10"
                            >
                              Delete
                            </button>

                          </>

                        )}

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          )}

        </section>

        {/* ================================================== */}
        {/* FOOTER INFO */}
        {/* ================================================== */}

        <div className="mt-5 flex flex-col gap-2 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">

          <span>
            {items.length}{" "}
            {items.length === 1
              ? "item"
              : "items"}{" "}
            in this folder
          </span>

          <span>
            {planName} •{" "}
            {formatBytes(
              storageLimit
            )} storage quota
          </span>

        </div>

      </div>
    </main>
  );
}