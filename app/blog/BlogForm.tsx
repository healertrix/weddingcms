'use client';

import { useState } from 'react';
import FormField from '../components/forms/FormField';
import Input from '../components/forms/Input';
import Button from '../components/Button';
import { RiSaveLine, RiCloseLine } from 'react-icons/ri';
import ImageDropzone from '../components/forms/ImageDropzone';
import FormModal from '../components/forms/FormModal';
import TextEditor from '../components/forms/TextEditor';
import { Switch } from '../components/forms/Switch';

type BlogFormProps = {
  onClose: () => void;
  onSubmit: (data: BlogFormData) => void;
  onSaveAsDraft: (data: BlogFormData) => void;
  initialData?: BlogFormData;
};

export interface BlogFormData {
  title: string;
  slug: string;
  content: string;
  featuredImageKey: string;
  galleryImages: Array<{
    key: string;
    order_index: number;
    alt_text?: string;
  }>;
  weddingDate: string;
  location: string;
  isFeaturedHome: boolean;
  isFeaturedBlog: boolean;
}

export default function BlogForm({ onClose, onSubmit, onSaveAsDraft, initialData }: BlogFormProps) {
  const [formData, setFormData] = useState<BlogFormData>(initialData || {
    title: '',
    slug: '',
    content: '',
    featuredImageKey: '',
    galleryImages: [],
    weddingDate: '',
    location: '',
    isFeaturedHome: false,
    isFeaturedBlog: false
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
      title={initialData ? 'Edit Blog Post' : 'Add Blog Post'}
      onClose={onClose}
    >
      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        <FormField label="Title" required>
          <Input
            required
            value={formData.title}
            onChange={(e) => {
              const title = e.target.value;
              setFormData({
                ...formData,
                title,
                slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
              });
            }}
            placeholder="Enter blog post title"
          />
        </FormField>

        <FormField label="Slug" required>
          <Input
            required
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            placeholder="url-friendly-slug"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-6">
          <FormField label="Wedding Date" required>
            <Input
              type="date"
              required
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

        <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Featured on Home</h4>
              <p className="text-sm text-gray-500">Show this post on the home page</p>
            </div>
            <Switch
              checked={formData.isFeaturedHome}
              onChange={(checked) => setFormData({ ...formData, isFeaturedHome: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Featured in Blog</h4>
              <p className="text-sm text-gray-500">Highlight in blog stories</p>
            </div>
            <Switch
              checked={formData.isFeaturedBlog}
              onChange={(checked) => setFormData({ ...formData, isFeaturedBlog: checked })}
            />
          </div>
        </div>

        <FormField label="Featured Image" required>
          <ImageDropzone
            onChange={(files) => setFormData({ ...formData, featuredImageKey: files[0]?.key || '' })}
            value={formData.featuredImageKey}
            maxFiles={1}
            accept="image/*"
          />
        </FormField>

        <FormField label="Gallery Images">
          <ImageDropzone
            multiple
            onChange={(files) => {
              const galleryImages = files.map((file, index) => ({
                key: file.key,
                order_index: index,
                alt_text: `${formData.title} image ${index + 1}`
              }));
              setFormData({ ...formData, galleryImages });
            }}
            value={formData.galleryImages.map(img => img.key)}
            accept="image/*"
          />
        </FormField>

        <FormField label="Content" required>
          <TextEditor
            value={formData.content}
            onChange={(content) => setFormData({ ...formData, content })}
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
            Publish Post
          </Button>
        </div>
      </form>
    </FormModal>
  );
} 