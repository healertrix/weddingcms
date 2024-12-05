'use client';

import { useState, useEffect } from 'react';
import FormField from '../components/forms/FormField';
import Input from '../components/forms/Input';
import Button from '../components/Button';
import { RiSaveLine, RiCloseLine, RiErrorWarningLine } from 'react-icons/ri';
import ImageDropzone from '../components/forms/ImageDropzone';
import FormModal from '../components/forms/FormModal';
import TextEditor from '../components/forms/TextEditor';
import { Switch } from '../components/forms/Switch';
import ConfirmModal from '../components/ConfirmModal';

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
  featuredImageKey?: string;
  featuredImageUrl?: string;
  weddingDate: string;
  location: string;
  isFeaturedHome: boolean;
  isFeaturedBlog: boolean;
  gallery_images: string[];
}

export default function BlogForm({ onClose, onSubmit, onSaveAsDraft, initialData }: BlogFormProps) {
  const [formData, setFormData] = useState<BlogFormData>(initialData || {
    title: '',
    slug: '',
    content: '',
    featuredImageKey: '',
    featuredImageUrl: '',
    weddingDate: '',
    location: '',
    isFeaturedHome: false,
    isFeaturedBlog: false,
    gallery_images: ['asdasdasd']
  });
  const [showDeleteImageConfirm, setShowDeleteImageConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showTitleWarning, setShowTitleWarning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [initialFormData] = useState(formData);
  const [showIncompleteWarning, setShowIncompleteWarning] = useState(false);

  const isFormComplete = () => {
    const requiredFields = {
      title: formData.title.trim() !== '',
      slug: formData.slug.trim() !== '',
      content: formData.content.trim() !== '',
      weddingDate: formData.weddingDate.trim() !== '',
      location: formData.location.trim() !== '',
      featuredImage: !!formData.featuredImageKey
    };

    return Object.values(requiredFields).every(field => field);
  };

  const getMissingFields = () => {
    const missingFields = [];
    if (!formData.title.trim()) missingFields.push('Title');
    if (!formData.slug.trim()) missingFields.push('Slug');
    if (!formData.content.trim()) missingFields.push('Content');
    if (!formData.weddingDate.trim()) missingFields.push('Wedding Date');
    if (!formData.location.trim()) missingFields.push('Location');
    if (!formData.featuredImageKey) missingFields.push('Featured Image');
    return missingFields;
  };

  const handleSubmit = async (e: React.FormEvent, saveAsDraft: boolean) => {
    e.preventDefault();

    // First check if we can save as draft
    if (saveAsDraft && !formData.title.trim()) {
      setShowTitleWarning(true);
      return;
    }

    // Then check if we can publish
    if (!saveAsDraft && !isFormComplete()) {
      setShowIncompleteWarning(true);
      return;
    }

    try {
      const postData = {
        title: formData.title,
        slug: formData.slug,
        content: formData.content,
        featured_image_key: formData.featuredImageKey || null,
        featured_image_url: formData.featuredImageUrl || null,
        wedding_date: formData.weddingDate || null,
        location: formData.location || null,
        is_featured_home: formData.isFeaturedHome,
        is_featured_blog: formData.isFeaturedBlog,
        gallery_images: formData.gallery_images,
        status: saveAsDraft ? 'draft' : 'published'
      };

      if (saveAsDraft) {
        onSaveAsDraft(formData); // Use formData instead of postData
      } else {
        onSubmit(formData); // Use formData instead of postData
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
    }
  };

  const handleFeaturedImageUpload = (files: Array<{ key: string; url: string }>) => {
    if (files.length > 0) {
      setFormData({
        ...formData,
        featuredImageKey: files[0].url,
        featuredImageUrl: files[0].url
      });
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteImageConfirm(true);
  };

  const handleImageDelete = async () => {
    if (formData.featuredImageKey && !isDeleting) {
      setIsDeleting(true);
      setDeleteProgress(0);
      
      try {
        const progressInterval = setInterval(() => {
          setDeleteProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 100);

        const response = await fetch('/api/upload/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageKey: formData.featuredImageKey }),
        });

        if (!response.ok) {
          throw new Error('Failed to delete image');
        }

        setDeleteProgress(100);
        setTimeout(() => {
          setFormData({
            ...formData,
            featuredImageKey: '',
            featuredImageUrl: ''
          });
          setShowDeleteImageConfirm(false);
          setIsDeleting(false);
          setDeleteProgress(0);
        }, 500);

        clearInterval(progressInterval);
      } catch (error) {
        console.error('Error deleting image:', error);
        setDeleteProgress(0);
        setIsDeleting(false);
      }
    }
  };

  const hasUnsavedChanges = () => {
    return JSON.stringify(initialFormData) !== JSON.stringify(formData);
  };

  const handleClose = () => {
    if (hasUnsavedChanges()) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  // Continue with the existing return statement, but add the modals at the end
  return (
    <>
      <FormModal
        title={initialData ? 'Edit Blog Post' : 'Add Blog Post'}
        onClose={handleClose}
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
              onChange={handleFeaturedImageUpload}
              value={formData.featuredImageUrl}
              maxFiles={1}
              onDelete={handleDeleteClick}
              disabled={isDeleting}
              folder="blogposts"
            />
            {isDeleting && (
              <div className="mt-2">
                <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-600 transition-all duration-300 ease-out"
                    style={{ width: `${deleteProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Deleting image... {deleteProgress}%
                </p>
              </div>
            )}
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
              className="bg-gray-50 text-gray-600 hover:bg-gray-100"
            >
              Save as Draft
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleClose}
              className="bg-gray-50 text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              icon={RiSaveLine}
              disabled={!isFormComplete()}
              onClick={(e) => {
                e.preventDefault();
                if (!isFormComplete()) {
                  setShowIncompleteWarning(true);
                  return;
                }
                handleSubmit(e, false);
              }}
              className={`${
                isFormComplete()
                  ? 'bg-[#8B4513] text-white hover:bg-[#693610]'
                  : 'bg-brown-100 text-brown-300 cursor-not-allowed opacity-50'
              }`}
              title={
                !isFormComplete()
                  ? `Cannot publish: Missing ${getMissingFields().join(', ')}`
                  : initialData ? 'Update blog post' : 'Publish blog post'
              }
            >
              {!isFormComplete() ? (
                <span className="flex items-center gap-1">
                  <RiErrorWarningLine className="w-4 h-4" />
                  Incomplete
                </span>
              ) : (
                initialData ? 'Update Post' : 'Publish Post'
              )}
            </Button>
          </div>
        </form>
      </FormModal>

      {showDeleteImageConfirm && (
        <ConfirmModal
          title="⚠️ Delete Image Permanently"
          message={
            <div className="space-y-4">
              <div className="space-y-4">
                <p>Are you sure you want to delete this image?</p>
                <div className="bg-red-50 p-4 rounded-lg space-y-2">
                  <div className="font-medium text-red-800">This will permanently delete:</div>
                  <ul className="list-disc list-inside text-red-700 space-y-1 ml-2">
                    <li>The featured image</li>
                    <li>The image from storage</li>
                  </ul>
                  <div className="text-red-800 font-medium mt-2">This action cannot be undone.</div>
                </div>
              </div>
              {isDeleting && (
                <div className="mt-4">
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-600 transition-all duration-300 ease-out"
                      style={{ width: `${deleteProgress}%` }}
                    />
                  </div>
                  <div className="text-sm text-gray-500 mt-2 text-center">
                    Deleting image... {deleteProgress}%
                  </div>
                </div>
              )}
            </div>
          }
          confirmLabel={isDeleting ? "Deleting..." : "Delete Permanently"}
          onConfirm={(e) => {
            if (!isDeleting) {
              handleImageDelete();
            }
          }}
          onCancel={() => {
            setShowDeleteImageConfirm(false);
          }}
          confirmButtonClassName={`bg-red-600 hover:bg-red-700 text-white ${
            isDeleting ? 'opacity-50 cursor-not-allowed bg-red-400' : ''
          }`}
          disabled={isDeleting}
          showCancelButton={!isDeleting}
          allowBackgroundCancel={!isDeleting}
        />
      )}

      {showCloseConfirm && (
        <ConfirmModal
          title="Unsaved Changes"
          message="You have unsaved changes. What would you like to do?"
          confirmLabel="Save Changes"
          onConfirm={(e) => {
            setShowCloseConfirm(false);
            handleSubmit(e as any, true);
          }}
          onCancel={() => {
            setShowCloseConfirm(false);
            onClose();
          }}
          confirmButtonClassName="bg-[#8B4513] hover:bg-[#693610] text-white"
          showCloseButton={true}
          onCloseButtonClick={() => setShowCloseConfirm(false)}
        />
      )}

      {showTitleWarning && (
        <ConfirmModal
          title="Title Required"
          message={
            <div className="space-y-4">
              <p className="text-gray-600">Title is required even when saving as a draft.</p>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <RiErrorWarningLine className="flex-shrink-0" />
                  <p>Please enter a title before saving.</p>
                </div>
              </div>
            </div>
          }
          confirmLabel="OK"
          onConfirm={() => setShowTitleWarning(false)}
          onCancel={() => setShowTitleWarning(false)}
          confirmButtonClassName="bg-[#8B4513] hover:bg-[#693610] text-white"
        />
      )}

      {showIncompleteWarning && (
        <ConfirmModal
          title="Cannot Publish Incomplete Post"
          message={
            <div className="space-y-4">
              <p className="text-gray-600">The following required fields are missing:</p>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <RiErrorWarningLine className="flex-shrink-0" />
                  <ul className="list-disc list-inside">
                    {getMissingFields().map((field, index) => (
                      <li key={index}>{field}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="text-gray-600">
                You can either complete these fields to publish, or save as a draft to finish later.
              </p>
            </div>
          }
          confirmLabel="OK"
          onConfirm={() => setShowIncompleteWarning(false)}
          onCancel={() => setShowIncompleteWarning(false)}
          confirmButtonClassName="bg-[#8B4513] hover:bg-[#693610] text-white"
        />
      )}
    </>
  );
} 