'use client';

import { useState } from 'react';
import FormField from '../components/forms/FormField';
import Input from '../components/forms/Input';
import Button from '../components/Button';
import { RiSaveLine, RiCloseLine } from 'react-icons/ri';
import ImageDropzone from '../components/forms/ImageDropzone';
import FormModal from '../components/forms/FormModal';

type WeddingFormProps = {
  onClose: () => void;
  onSubmit: (data: WeddingFormData) => void;
  initialData?: WeddingFormData;
};

export type WeddingFormData = {
  coupleNames: string;
  weddingDate: string;
  location: string;
  featuredImage?: File[];
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
    <FormModal
      title={initialData ? 'Edit Wedding Gallery' : 'Add Wedding Gallery'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
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
        </div>

        <FormField label="Location">
          <Input
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g., Mumbai, India"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-6">
          <FormField label="Featured Image">
            <ImageDropzone
              onChange={(files) => setFormData({ ...formData, featuredImage: files })}
              value={formData.featuredImage}
            />
          </FormField>

          <FormField label="Gallery Images">
            <ImageDropzone
              multiple
              onChange={(files) => setFormData({ ...formData, galleryImages: files })}
              value={formData.galleryImages}
            />
          </FormField>
        </div>

        <div className="flex justify-end space-x-4 pt-6 border-t mt-8">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" icon={RiSaveLine}>
            Save Wedding Gallery
          </Button>
        </div>
      </form>
    </FormModal>
  );
} 