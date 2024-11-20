'use client';

import { useState } from 'react';
import FormField from '../components/forms/FormField';
import Input from '../components/forms/Input';
import Button from '../components/Button';
import { RiSaveLine } from 'react-icons/ri';
import ImageDropzone from '../components/forms/ImageDropzone';
import FormModal from '../components/forms/FormModal';

type BlogFormProps = {
  onClose: () => void;
  onSubmit: (data: BlogFormData) => void;
  initialData?: BlogFormData;
};

export type BlogFormData = {
  title: string;
  slug?: string;
  publishDate: string;
  content: string;
  coverImage?: File[];
  isFeaturedHome: boolean;
  isFeaturedStory: boolean;
  images?: File[];
};

export default function BlogForm({ onClose, onSubmit, initialData }: BlogFormProps) {
  const [formData, setFormData] = useState<BlogFormData>(initialData || {
    title: '',
    publishDate: '',
    content: '',
    isFeaturedHome: false,
    isFeaturedStory: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <FormModal
      title={initialData ? 'Edit Blog Post' : 'Add Blog Post'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <FormField label="Title" required>
            <Input
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter blog title"
            />
          </FormField>

          <FormField label="Publish Date">
            <Input
              type="date"
              value={formData.publishDate}
              onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
            />
          </FormField>
        </div>

        <FormField label="Content" required>
          <textarea
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 border-gray-300 focus:ring-[#8B4513]"
            rows={12}
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Write your blog content here..."
          />
        </FormField>

        <div className="grid grid-cols-2 gap-6">
          <FormField label="Cover Image">
            <ImageDropzone
              onChange={(files) => setFormData({ ...formData, coverImage: files })}
              value={formData.coverImage}
            />
          </FormField>

          <FormField label="Gallery Images">
            <ImageDropzone
              multiple
              onChange={(files) => setFormData({ ...formData, images: files })}
              value={formData.images}
            />
          </FormField>
        </div>

        <FormField label="Featured Options">
          <div className="flex space-x-6">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isFeaturedHome}
                onChange={(e) => setFormData({ ...formData, isFeaturedHome: e.target.checked })}
                className="rounded text-[#8B4513] focus:ring-[#8B4513]"
              />
              <span>Featured in Home Page</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isFeaturedStory}
                onChange={(e) => setFormData({ ...formData, isFeaturedStory: e.target.checked })}
                className="rounded text-[#8B4513] focus:ring-[#8B4513]"
              />
              <span>Featured in Story</span>
            </label>
          </div>
        </FormField>

        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" icon={RiSaveLine}>
            Save Blog Post
          </Button>
        </div>
      </form>
    </FormModal>
  );
} 