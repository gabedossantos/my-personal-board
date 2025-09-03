
'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { FileUploadResult } from '@/lib/types';

interface FileUploadProps {
  onFileProcessed: (result: FileUploadResult) => void;
  currentFile?: FileUploadResult | null;
  onRemoveFile: () => void;
}

export default function FileUpload({ onFileProcessed, currentFile, onRemoveFile }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-file', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        onFileProcessed(result);
      } else {
        setError(result.error || 'Failed to process file');
      }
    } catch (err) {
      setError('Failed to upload file. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  }, [onFileProcessed]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/markdown': ['.md'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploading || !!currentFile
  });

  if (currentFile) {
    return (
      <div className="border border-green-200 bg-green-50 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div>
            <p className="font-medium text-green-800">File uploaded successfully</p>
            <p className="text-sm text-green-600">{currentFile.fileName}</p>
          </div>
        </div>
        <button
          onClick={onRemoveFile}
          className="p-1 hover:bg-green-100 rounded"
          type="button"
        >
          <X className="w-4 h-4 text-green-600" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-400 bg-blue-50'
            : uploading
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600">Processing file...</p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400" />
              <div>
                <p className="text-gray-600 font-medium">
                  {isDragActive ? 'Drop your file here' : 'Upload supplementary materials'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Optional: Business plan, pitch deck, or financial projections
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Supports PDF, Markdown (.md), TXT up to 10MB
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
