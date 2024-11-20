'use client';

import { useState } from 'react';
import FormField from '../components/forms/FormField';
import Input from '../components/forms/Input';
import Button from '../components/Button';
import { RiSaveLine, RiCloseLine } from 'react-icons/ri';

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
  coverImage?: File;
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">
            {initialData ? 'Edit Blog Post' : 'Add Blog Post'}
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

          <FormField label="Content" required>
            <textarea
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 border-gray-300 focus:ring-[#8B4513]"
              rows={6}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Write your blog content here..."
            />
          </FormField>

          <FormField label="Cover Image">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setFormData({ ...formData, coverImage: file });
                }
              }}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <FormField label="Featured Options">
              <div className="space-y-2">
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
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" icon={RiSaveLine}>
              Save Blog Post
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 