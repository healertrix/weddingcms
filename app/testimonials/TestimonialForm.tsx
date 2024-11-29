'use client';

import { useState } from 'react';
import FormField from '../components/forms/FormField';
import Input from '../components/forms/Input';
import Button from '../components/Button';
import { RiSaveLine } from 'react-icons/ri';
import ImageDropzone from '../components/forms/ImageDropzone';
import FormModal from '../components/forms/FormModal';

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
  videoUrl?: string;
};

export default function TestimonialForm({ onClose, onSubmit, onSaveAsDraft, initialData }: TestimonialFormProps) {
  const [formData, setFormData] = useState<TestimonialFormData>(initialData || {
    coupleNames: '',
    weddingDate: '',
    location: '',
    review: '',
    imageKey: '',
    videoUrl: ''
  });

  const handleSubmit = (e: React.FormEvent, asDraft: boolean = false) => {
    e.preventDefault();
    if (asDraft) {
      onSaveAsDraft(formData);
    } else {
      onSubmit(formData);
    }
  };

  return (
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
              onChange={(files) => setFormData({ ...formData, imageKey: files[0]?.key || '' })}
              value={formData.imageKey}
              maxFiles={1}
            />
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
  );
} 