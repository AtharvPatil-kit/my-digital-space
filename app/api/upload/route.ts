import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    // Check logged-in user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "You are not logged in." },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No file was provided." },
        { status: 400 }
      );
    }

    // Unique filename
    const fileName = `${Date.now()}-${file.name}`;

    // User-specific folder
    const filePath = `${user.id}/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("my-files")
      .upload(filePath, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (error) {
      console.error("SUPABASE STORAGE ERROR:", error);

      return NextResponse.json(
        {
          error: error.message,
          details: error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      file: data,
    });
  } catch (error) {
    console.error("UPLOAD API ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Upload failed.",
      },
      { status: 500 }
    );
  }
}