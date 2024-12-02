'use client';

import { useState } from 'react';
import FormField from '../components/forms/FormField';
import Input from '../components/forms/Input';
import Button from '../components/Button';
import { RiSaveLine } from 'react-icons/ri';
import ImageDropzone from '../components/forms/ImageDropzone';
import FormModal from '../components/forms/FormModal';
import ConfirmModal from '../components/ConfirmModal';

type TestimonialFormProps = {
  onClose: () => void;
  onSubmit: (data: TestimonialFormData) => void;
  onSaveAsDraft: (data: TestimonialFormData) => void;
  initialData?: TestimonialFormData;
};

export type TestimonialFormData = {
  coupleNames: string;
  weddingDate: string;
  location: string;
  review: string;
  imageKey?: string;
  imageUrl?: string;
  videoUrl?: string;
};

export default function TestimonialForm({ onClose, onSubmit, onSaveAsDraft, initialData }: TestimonialFormProps) {
  const [formData, setFormData] = useState<TestimonialFormData>(initialData || {
    coupleNames: '',
    weddingDate: '',
    location: '',
    review: '',
    imageKey: '',
    imageUrl: '',
    videoUrl: ''
  });
  const [showDeleteImageConfirm, setShowDeleteImageConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);

  const handleSubmit = (e: React.FormEvent, asDraft: boolean = false) => {
    e.preventDefault();
    if (asDraft) {
      onSaveAsDraft(formData);
    } else {
      onSubmit(formData);
    }
  };

  const handleImageUpload = (files: Array<{ key: string; url: string }>) => {
    if (files.length > 0) {
      setFormData({
        ...formData,
        imageKey: files[0].key,
        imageUrl: files[0].url
      });
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteImageConfirm(true);
  };

  const handleImageDelete = async () => {
    if (formData.imageKey && !isDeleting) {
      setIsDeleting(true);
      setDeleteProgress(0);
      
      try {
        // Start progress animation
        const progressInterval = setInterval(() => {
          setDeleteProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 100);

        const response = await fetch('/api/upload/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageKey: formData.imageKey }),
        });

        if (!response.ok) {
          throw new Error('Failed to delete image');
        }

        // Complete the progress bar
        setDeleteProgress(100);
        setTimeout(() => {
          setFormData({
            ...formData,
            imageKey: '',
            imageUrl: ''
          });
          setShowDeleteImageConfirm(false);
          setIsDeleting(false);
          setDeleteProgress(0);
        }, 500); // Give time for the progress bar to complete

        clearInterval(progressInterval);
      } catch (error) {
        console.error('Error deleting image:', error);
        setDeleteProgress(0);
        setIsDeleting(false);
        // TODO: Show error notification
      }
    }
  };

  return (
    <>
      <FormModal
        title={initialData ? 'Edit Testimonial' : 'Add Testimonial'}
        onClose={onClose}
      >
        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <FormField label="Couple Names" required>
              <Input
                required
                value={formData.coupleNames}
                onChange={(e) => setFormData({ ...formData, coupleNames: e.target.value })}
                placeholder="e.g., Sarah & John"
              />
            </FormField>

            <FormField label="Wedding Date" required>
              <Input
                type="date"
                required
                value={formData.weddingDate}
                onChange={(e) => setFormData({ ...formData, weddingDate: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Location" required>
            <Input
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Mumbai, India"
            />
          </FormField>

          <FormField label="Review" required>
            <textarea
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 border-gray-300 focus:ring-[#8B4513]"
              rows={8}
              required
              value={formData.review}
              onChange={(e) => setFormData({ ...formData, review: e.target.value })}
              placeholder="Write the client's review here..."
            />
          </FormField>

          <div className="grid grid-cols-2 gap-6">
            <FormField label="Photo">
              <ImageDropzone
                onChange={handleImageUpload}
                value={formData.imageUrl}
                maxFiles={1}
                onDelete={handleDeleteClick}
                disabled={isDeleting}
              />
              {isDeleting && (
                <div className="mt-2">
                  <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-600 transition-all duration-300 ease-out"
                      style={{ width: `${deleteProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Deleting image... {deleteProgress}%
                  </p>
                </div>
              )}
            </FormField>

            <FormField label="Video URL">
              <Input
                type="url"
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                placeholder="Enter video testimonial URL"
              />
            </FormField>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t mt-8">
            <Button 
              variant="secondary" 
              onClick={(e) => {
                e.preventDefault();
                handleSubmit(e, true);
              }}
            >
              Save as Draft
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" icon={RiSaveLine}>
              {initialData ? 'Update Testimonial' : 'Publish Testimonial'}
            </Button>
          </div>
        </form>
      </FormModal>

      {showDeleteImageConfirm && (
        <ConfirmModal
          title="⚠️ Delete Image Permanently"
          message={`WARNING: You are about to permanently delete this image!\n\nThis action:\n• Cannot be undone\n• Will permanently remove the image\n• Will delete the image from the testimonial\n\nAre you absolutely sure you want to proceed?`}
          confirmLabel="Yes, Delete Image Permanently"
          onConfirm={handleImageDelete}
          onCancel={() => setShowDeleteImageConfirm(false)}
          confirmButtonClassName="bg-red-600 hover:bg-red-700 text-white"
        />
      )}
    </>
  );
} 