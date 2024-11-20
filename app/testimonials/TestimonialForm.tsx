'use client';

import { useState } from 'react';
import FormField from '../components/forms/FormField';
import Input from '../components/forms/Input';
import Button from '../components/Button';
import { RiSaveLine, RiCloseLine } from 'react-icons/ri';

type TestimonialFormProps = {
  onClose: () => void;
  onSubmit: (data: TestimonialFormData) => void;
  initialData?: TestimonialFormData;
};

export type TestimonialFormData = {
  coupleNames: string;
  weddingDate: string;
  location: string;
  review: string;
  photo?: File;
  videoUrl?: string;
};

export default function TestimonialForm({ onClose, onSubmit, initialData }: TestimonialFormProps) {
  const [formData, setFormData] = useState<TestimonialFormData>(initialData || {
    coupleNames: '',
    weddingDate: '',
    location: '',
    review: '',
    videoUrl: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">
            {initialData ? 'Edit Testimonial' : 'Add Testimonial'}
          </h2>
          <Button variant="secondary" icon={RiCloseLine} onClick={onClose}>
            Close
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
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

          <FormField label="Location">
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Mumbai, India"
            />
          </FormField>

          <FormField label="Review" required>
            <textarea
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 border-gray-300 focus:ring-[#8B4513]"
              rows={4}
              required
              value={formData.review}
              onChange={(e) => setFormData({ ...formData, review: e.target.value })}
              placeholder="Write the client's review here..."
            />
          </FormField>

          <FormField label="Photo">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setFormData({ ...formData, photo: file });
                }
              }}
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

          <div className="flex justify-end space-x-4 mt-6">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" icon={RiSaveLine}>
              Save Testimonial
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 