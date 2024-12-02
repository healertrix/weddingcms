'use client';

import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { RiImageAddLine, RiCloseLine, RiZoomInLine } from 'react-icons/ri';

interface ImagePreviewModalProps {
  imageUrl: string;
  onClose: () => void;
}

const ImagePreviewModal = ({ imageUrl, onClose }: ImagePreviewModalProps) => {
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 bg-black"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 text-white hover:text-gray-300 transition-colors"
        aria-label="Close preview"
      >
        <RiCloseLine className="w-8 h-8" />
      </button>
      <div 
        className="w-full h-full flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt="Full size preview"
          className="w-full h-full object-contain"
          style={{
            maxWidth: '100vw',
            maxHeight: '100vh',
            objectFit: 'contain'
          }}
        />
      </div>
    </div>
  );
};

interface ImageDropzoneProps {
  onChange: (files: Array<{ key: string; url: string }>) => void;
  value?: string;
  maxFiles?: number;
  onDelete?: () => void;
  disabled?: boolean;
}

export default function ImageDropzone({ 
  onChange, 
  value, 
  maxFiles = 1,
  onDelete,
  disabled = false
}: ImageDropzoneProps) {
  const [uploadStatus, setUploadStatus] = useState<{
    status: 'idle' | 'uploading' | 'success' | 'error';
    message?: string;
  }>({ status: 'idle' });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    if (acceptedFiles.length > maxFiles) {
      setUploadStatus({
        status: 'error',
        message: `Maximum ${maxFiles} file${maxFiles === 1 ? '' : 's'} allowed`
      });
      return;
    }

    setUploadStatus({ status: 'uploading' });
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', acceptedFiles[0]);

      // Start progress simulation
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      // Complete the progress
      setUploadProgress(100);
      setTimeout(() => {
        onChange([{ key: data.key, url: data.url }]);
        setUploadStatus({ status: 'success' });
        setUploadProgress(0);
      }, 500);

      clearInterval(progressInterval);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({
        status: 'error',
        message: 'Failed to upload image'
      });
      setUploadProgress(0);
    }
  }, [onChange, maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles,
    multiple: false,
    disabled: disabled || uploadStatus.status === 'uploading'
  });

  return (
    <div className="relative">
      {value ? (
        <div className="relative w-full aspect-video rounded-lg overflow-hidden group">
          <img
            src={value}
            alt="Uploaded image"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-40 transition-all flex items-center justify-center">
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowPreview(true);
                }}
                className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100 shadow-lg transition-all"
                aria-label="View full size"
                title="View full size"
              >
                <RiZoomInLine size={20} />
              </button>
              {onDelete && !disabled && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50 shadow-lg transition-all"
                  disabled={disabled}
                  aria-label="Delete image"
                  title="Delete image"
                >
                  <RiCloseLine size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-lg p-4 text-center hover:border-gray-400 transition-colors
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
            ${disabled || uploadStatus.status === 'uploading' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${uploadStatus.status === 'error' ? 'border-red-500 bg-red-50' : ''}
            ${uploadStatus.status === 'success' ? 'border-green-500 bg-green-50' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center text-gray-500">
            <RiImageAddLine className={`w-12 h-12 mb-2 ${uploadStatus.status === 'error' ? 'text-red-500' : ''}`} />
            <p className="text-sm">
              {uploadStatus.status === 'uploading' ? (
                'Uploading...'
              ) : uploadStatus.status === 'error' ? (
                uploadStatus.message || 'Error uploading image'
              ) : isDragActive ? (
                'Drop the image here'
              ) : (
                `Drag & drop an image here, or click to select`
              )}
            </p>
            {maxFiles > 1 && (
              <p className="text-xs text-gray-400 mt-1">
                Maximum {maxFiles} files allowed
              </p>
            )}
          </div>
          {uploadStatus.status === 'uploading' && (
            <div className="mt-4">
              <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}
        </div>
      )}
      {uploadStatus.status === 'error' && uploadStatus.message && (
        <p className="text-sm text-red-500 mt-2">{uploadStatus.message}</p>
      )}

      {showPreview && value && (
        <ImagePreviewModal
          imageUrl={value}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
} 