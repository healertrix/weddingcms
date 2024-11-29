'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { RiImageAddLine, RiCloseLine } from 'react-icons/ri';
import Image from 'next/image';

interface ImageDropzoneProps {
  onChange: (files: Array<{ key: string }>) => void;
  value?: string | string[];
  multiple?: boolean;
  maxFiles?: number;
  accept?: string;
}

export default function ImageDropzone({
  onChange,
  value = [],
  multiple = false,
  maxFiles,
  accept = 'image/*'
}: ImageDropzoneProps) {
  const [files, setFiles] = useState<Array<{ preview: string; key: string }>>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      preview: URL.createObjectURL(file),
      key: `temp-${file.name}-${Date.now()}`
    }));

    if (multiple) {
      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      onChange(updatedFiles);
    } else {
      const singleFile = [newFiles[0]];
      setFiles(singleFile);
      onChange(singleFile);
    }
  }, [files, multiple, onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple,
    maxFiles
  });

  const removeFile = (indexToRemove: number) => {
    const updatedFiles = files.filter((_, index) => index !== indexToRemove);
    setFiles(updatedFiles);
    onChange(updatedFiles);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center text-gray-500">
          <RiImageAddLine className="w-12 h-12 mb-2" />
          <p className="text-sm text-center">
            {isDragActive ? (
              "Drop your images here"
            ) : (
              <>
                Drop images here or click to browse
                {multiple && maxFiles && (
                  <span className="block text-xs text-gray-400 mt-1">
                    You can add up to {maxFiles} images
                  </span>
                )}
              </>
            )}
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {files.map((file, index) => (
            <div key={file.key} className="relative group aspect-square">
              <div className="w-full h-full relative rounded-lg overflow-hidden">
                <Image
                  src={file.preview}
                  alt={`Preview ${index + 1}`}
                  fill
                  className="object-cover"
                />
                <div 
                  className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                >
                  <RiCloseLine 
                    className="absolute top-2 right-2 w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:scale-110"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 