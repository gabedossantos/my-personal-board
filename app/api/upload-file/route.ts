
import { NextRequest, NextResponse } from 'next/server';
import { processFile } from '@/lib/file-processor';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Enforce allowed types: PDF, Markdown, TXT
    const allowed = new Set(['application/pdf', 'text/markdown', 'text/plain']);
    if (!allowed.has(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Unsupported file type. Please upload PDF, Markdown (.md), or TXT files.' },
        { status: 400 }
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
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process file upload' },
      { status: 500 }
    );
  }
}
