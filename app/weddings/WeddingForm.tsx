'use client';

import { useState } from 'react';
import FormField from '../components/forms/FormField';
import Input from '../components/forms/Input';
import Button from '../components/Button';
import { RiSaveLine } from 'react-icons/ri';
import ImageDropzone from '../components/forms/ImageDropzone';
import FormModal from '../components/forms/FormModal';
import { Switch } from '../components/forms/Switch';

type WeddingFormProps = {
  onClose: () => void;
  onSubmit: (data: WeddingFormData) => void;
  onSaveAsDraft: (data: WeddingFormData) => void;
  initialData?: WeddingFormData;
};

export interface WeddingFormData {
  coupleNames: string;
  weddingDate: string;
  location: string;
  featuredImageKey: string;
  galleryImages: Array<{
    key: string;
    order_index: number;
    alt_text?: string;
  }>;
  isFeaturedHome: boolean;
}

export default function WeddingForm({ onClose, onSubmit, onSaveAsDraft, initialData }: WeddingFormProps) {
  const [formData, setFormData] = useState<WeddingFormData>({
    coupleNames: initialData?.coupleNames || '',
    weddingDate: initialData?.weddingDate || '',
    location: initialData?.location || '',
    featuredImageKey: initialData?.featuredImageKey || '',
    galleryImages: initialData?.galleryImages || [],
    isFeaturedHome: initialData?.isFeaturedHome || false
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
      title={initialData ? 'Edit Wedding Gallery' : 'Add Wedding Gallery'}
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

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Featured on Home</h4>
              <p className="text-sm text-gray-500">Show this wedding on the home page</p>
            </div>
            <Switch
              checked={formData.isFeaturedHome}
              onChange={(checked) => setFormData({ ...formData, isFeaturedHome: checked })}
            />
          </div>
        </div>

        <FormField 
          label="Featured Image" 
          required
          description="This will be the main image for the wedding gallery"
        >
          <ImageDropzone
            onChange={(files) => setFormData({ ...formData, featuredImageKey: files[0]?.key || '' })}
            value={formData.featuredImageKey}
            multiple={false}
          />
        </FormField>

        <FormField 
          label="Gallery Images"
          description="Add multiple images to the wedding gallery"
        >
          <ImageDropzone
            multiple
            onChange={(files) => {
              const galleryImages = files.map((file, index) => ({
                key: file.key,
                order_index: index,
                alt_text: `${formData.coupleNames} wedding image ${index + 1}`
              }));
              setFormData({ ...formData, galleryImages });
            }}
            value={formData.galleryImages?.map(img => img.key)}
            accept="image/*"
          />
        </FormField>

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
            {initialData ? 'Update Wedding' : 'Publish Wedding'}
          </Button>
        </div>
      </form>
    </FormModal>
  );
} 