'use client';

import { useState } from 'react';
import FormField from '../components/forms/FormField';
import Input from '../components/forms/Input';
import Button from '../components/Button';
import { RiSaveLine, RiCloseLine } from 'react-icons/ri';

type FilmFormProps = {
  onClose: () => void;
  onSubmit: (data: FilmFormData) => void;
  initialData?: FilmFormData;
};

export type FilmFormData = {
  title: string;
  coupleNames: string;
  location: string;
  description: string;
  videoUrl: string;
};

export default function FilmForm({ onClose, onSubmit, initialData }: FilmFormProps) {
  const [formData, setFormData] = useState<FilmFormData>(initialData || {
    title: '',
    coupleNames: '',
    location: '',
    description: '',
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
            {initialData ? 'Edit Film' : 'Add Film'}
          </h2>
          <Button variant="secondary" icon={RiCloseLine} onClick={onClose}>
            Close
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
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

          <FormField label="Location">
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Mumbai, India"
            />
          </FormField>

          <FormField label="Description">
            <textarea
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 border-gray-300 focus:ring-[#8B4513]"
              rows={4}
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
              placeholder="Enter video URL"
            />
          </FormField>

          <div className="flex justify-end space-x-4 mt-6">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" icon={RiSaveLine}>
              Save Film
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 