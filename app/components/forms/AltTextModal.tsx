'use client';

import { useState, useEffect } from 'react';
import { RiCloseLine, RiSaveLine } from 'react-icons/ri';
import Button from '../Button';
import Input from './Input';
import FormField from './FormField';

interface AltTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (altText: string) => void;
  currentAltText?: string;
  imageUrl: string;
  title?: string;
}

export default function AltTextModal({
  isOpen,
  onClose,
  onSave,
  currentAltText = '',
  imageUrl,
  title = 'Add Alt Text',
}: AltTextModalProps) {
  const [altText, setAltText] = useState(currentAltText);

  // Update altText when currentAltText changes (when switching between images)
  useEffect(() => {
    setAltText(currentAltText);
  }, [currentAltText]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(altText.trim());
    onClose();
  };

  const handleClose = () => {
    setAltText(currentAltText); // Reset to original value
    onClose();
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg w-full max-w-2xl'>
        <div className='flex justify-between items-center px-6 py-4 border-b'>
          <h3 className='text-lg font-semibold text-gray-900'>{title}</h3>
          <button
            onClick={handleClose}
            className='p-2 hover:bg-gray-100 rounded-full transition-colors'
            aria-label='Close'
          >
            <RiCloseLine size={20} />
          </button>
        </div>

        <div className='p-6 space-y-4'>
          {/* Image preview */}
          <div className='aspect-video rounded-lg overflow-hidden bg-gray-100'>
            <img
              src={imageUrl}
              alt='Preview'
              className='w-full h-full object-cover'
            />
          </div>

          {/* Alt text input */}
          <FormField label='Alt Text' required>
            <Input
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder='Describe this image for accessibility...'
              className='w-full'
              autoFocus
            />
            <p className='text-sm text-gray-500 mt-1'>
              Describe what's in the image for screen readers and accessibility.
            </p>
          </FormField>
        </div>

        <div className='flex justify-end gap-3 px-6 py-4 border-t bg-gray-50'>
          <Button variant='secondary' onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} icon={RiSaveLine}>
            Save Alt Text
          </Button>
        </div>
      </div>
    </div>
  );
}
