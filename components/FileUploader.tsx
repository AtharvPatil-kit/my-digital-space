"use client";

import { useState } from "react";

export default function FileUploader() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setUploading(true);
      setMessage("");

      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed.");
      }

      setMessage("✅ File uploaded successfully.");

      event.target.value = "";
    } catch (error) {
      console.error("Upload error:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Upload failed."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label
        htmlFor="file-upload"
        className="inline-flex cursor-pointer items-center rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-white/85"
      >
        {uploading ? "Uploading..." : "+ Upload file"}
      </label>

      <input
        id="file-upload"
        type="file"
        className="hidden"
        onChange={handleUpload}
        disabled={uploading}
      />

      {message && (
        <p className="mt-4 text-sm text-white/60">
          {message}
        </p>
      )}
    </div>
  );
}