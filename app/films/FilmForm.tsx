'use client';

import { useState } from 'react';
import FormField from '../components/forms/FormField';
import Input from '../components/forms/Input';
import Button from '../components/Button';
import { RiSaveLine, RiDraftLine } from 'react-icons/ri';
import FormModal from '../components/forms/FormModal';

type FilmFormProps = {
  onClose: () => void;
  onSubmit: (data: FilmFormData) => void;
  onSaveAsDraft: (data: FilmFormData) => void;
  initialData?: FilmFormData;
};

export type FilmFormData = {
  title: string;
  coupleNames: string;
  weddingDate: string;
  location: string;
  description: string;
  videoUrl: string;
};

export default function FilmForm({ onClose, onSubmit, onSaveAsDraft, initialData }: FilmFormProps) {
  const [formData, setFormData] = useState<FilmFormData>(initialData || {
    title: '',
    coupleNames: '',
    weddingDate: '',
    location: '',
    description: '',
    videoUrl: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleSaveAsDraft = (e: React.MouseEvent) => {
    e.preventDefault();
    onSaveAsDraft(formData);
  };

  return (
    <FormModal
      title={initialData ? 'Edit Film' : 'Add Film'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <FormField label="Title" required>
            <Input
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter film title"
            />
          </FormField>

          <FormField label="Couple Names" required>
            <Input
              required
              value={formData.coupleNames}
              onChange={(e) => setFormData({ ...formData, coupleNames: e.target.value })}
              placeholder="e.g., Sarah & John"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <FormField label="Wedding Date" required>
            <Input
              required
              type="date"
              value={formData.weddingDate}
              onChange={(e) => setFormData({ ...formData, weddingDate: e.target.value })}
            />
          </FormField>

          <FormField label="Location" required>
            <Input
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Mumbai, India"
            />
          </FormField>
        </div>

        <FormField label="Description">
          <textarea
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 border-gray-300 focus:ring-[#8B4513]"
            rows={8}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Write film description here..."
          />
        </FormField>

        <FormField label="Video URL" required>
          <Input
            required
            type="url"
            value={formData.videoUrl}
            onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
            placeholder="Enter video URL (e.g., YouTube, Vimeo)"
          />
        </FormField>

        <div className="flex justify-end space-x-4 pt-6 border-t mt-8">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="secondary" 
            icon={RiDraftLine}
            onClick={handleSaveAsDraft}
          >
            Save as Draft
          </Button>
          <Button type="submit" icon={RiSaveLine}>
            {initialData ? 'Update Film' : 'Publish Film'}
          </Button>
        </div>
      </form>
    </FormModal>
  );
} 