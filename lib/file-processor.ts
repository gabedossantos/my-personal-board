import mammoth from 'mammoth';

export async function processFile(file: File): Promise<{
  success: boolean;
  content?: string;
  error?: string;
  fileName: string;
  fileType: string;
}> {
  const fileName = file.name;
  const fileType = file.type;

  try {
    let content = '';

    if (fileType === 'application/pdf') {
      // For PDF files, encode the document for server-side analysis
      const base64Buffer = await file.arrayBuffer();
      const base64String = Buffer.from(base64Buffer).toString('base64');
      return {
        success: true,
        content: base64String,
        fileName,
        fileType: 'pdf-base64'
      };
    } else if (fileType === 'text/markdown') {
      // Markdown file processing
      content = await file.text();
    } else if (fileType === 'text/plain') {
      // TXT file processing
      content = await file.text();
    } else {
      return {
        success: false,
        error: 'Unsupported file type. Please upload PDF, Markdown (.md), or TXT files.',
        fileName,
        fileType
      };
    }

    return {
      success: true,
      content,
      fileName,
      fileType
    };
  } catch (error) {
    console.error('File processing error:', error);
    return {
      success: false,
      error: 'Failed to process file. Please try again.',
      fileName,
      fileType
    };
  }
}
