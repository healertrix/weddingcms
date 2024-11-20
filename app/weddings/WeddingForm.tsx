'use client';

import { useState } from 'react';
import FormField from '../components/forms/FormField';
import Input from '../components/forms/Input';
import Button from '../components/Button';
import { RiSaveLine, RiCloseLine } from 'react-icons/ri';

type WeddingFormProps = {
  onClose: () => void;
  onSubmit: (data: WeddingFormData) => void;
  initialData?: WeddingFormData;
};

export type WeddingFormData = {
  coupleNames: string;
  weddingDate: string;
  location: string;
  featuredImage?: File;
  galleryImages?: File[];
};

export default function WeddingForm({ onClose, onSubmit, initialData }: WeddingFormProps) {
  const [formData, setFormData] = useState<WeddingFormData>(initialData || {
    coupleNames: '',
    weddingDate: '',
    location: '',
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
            {initialData ? 'Edit Wedding Story' : 'Add Wedding Story'}
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

          <FormField label="Wedding Date">
            <Input
              type="date"
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

          <FormField label="Featured Image">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setFormData({ ...formData, featuredImage: file });
                }
              }}
            />
          </FormField>

          <div className="flex justify-end space-x-4 mt-6">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" icon={RiSaveLine}>
              Save Wedding Story
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 