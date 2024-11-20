'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { RiImageAddLine, RiCloseLine } from 'react-icons/ri';

interface ImageDropzoneProps {
  onChange: (files: File[]) => void;
  multiple?: boolean;
  value?: File[];
}

export default function ImageDropzone({ 
  onChange, 
  multiple = false, 
  value = []
}: ImageDropzoneProps) {
  const [preview, setPreview] = useState<string[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (multiple) {
      const newFiles = [...value, ...acceptedFiles];
      onChange(newFiles);
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPreview(prev => {
        // Clean up old previews
        prev.forEach(url => URL.revokeObjectURL(url));
        return newPreviews;
      });
    } else {
      const file = acceptedFiles[0];
      onChange([file]);
      setPreview(prev => {
        prev.forEach(url => URL.revokeObjectURL(url));
        return [URL.createObjectURL(file)];
      });
    }
  }, [multiple, value, onChange]);

  const removeImage = (index: number) => {
    const newFiles = value.filter((_, i) => i !== index);
    onChange(newFiles);
    URL.revokeObjectURL(preview[index]);
    setPreview(prev => prev.filter((_, i) => i !== index));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    multiple,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-[#8B4513] bg-[#8B4513]/5' : 'border-gray-300 hover:border-[#8B4513]'}`}
      >
        <input {...getInputProps()} />
        <RiImageAddLine className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {isDragActive ? 
            'Drop the images here...' : 
            'Drag & drop images here, or click to select'
          }
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {multiple ? 
            'Upload multiple images' :
            'Upload one image'
          }
        </p>
      </div>

      {preview.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {preview.map((url, index) => (
            <div key={url} className="relative group">
              <img
                src={url}
                alt={`Preview ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
              <button
                type="button"
                title="Remove image"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <RiCloseLine className="w-4 h-4" />
              </button>
            </div>
          ))}
          {multiple && (
            <div
              {...getRootProps()}
              className="w-full h-32 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-[#8B4513]"
            >
              <RiImageAddLine className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>
      )}
    </div>
  );
} 