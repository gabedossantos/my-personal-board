import { NextRequest, NextResponse } from "next/server";
import { processFile } from "@/lib/file-processor"; // via local shim
import { ErrorResponse } from "@/packages/types";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json<ErrorResponse>(
        { success: false, error: "No file provided" },
        { status: 400 },
      );
    }

    // Validate file size (10MB limit)
    const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json<ErrorResponse>(
        { success: false, error: "File size must be less than 10MB" },
        { status: 400 },
      );
    }

    // Optional simple type check (allow text/markdown/docx)
    const allowed = [
      "text/",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.some((p) => file.type.startsWith(p) || file.type === p)) {
      // Non-fatal: proceed but could log or reject; here we reject for safety
      return NextResponse.json<ErrorResponse>(
        { success: false, error: "Unsupported file type" },
        { status: 400 },
      );
    }

    // Process the file
    const result = await processFile(file);

    if (result.success) {
      return NextResponse.json({
        success: true,
        content: result.content,
        fileName: result.fileName,
        fileType: result.fileType,
      });
    }
    return NextResponse.json<ErrorResponse>(
      { success: false, error: result.error || "File processing failed" },
      { status: 500 },
    );
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json<ErrorResponse>(
      { success: false, error: "Failed to process file upload" },
      { status: 500 },
    );
  }
}
