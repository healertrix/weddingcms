'use client';

import { useState, useEffect } from 'react';
import FormField from '../components/forms/FormField';
import Input from '../components/forms/Input';
import Button from '../components/Button';
import { RiSaveLine, RiCloseLine, RiErrorWarningLine, RiZoomInLine } from 'react-icons/ri';
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
  const [formData, setFormData] = useState<BlogFormData>({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    content: initialData?.content || '',
    featuredImageKey: initialData?.featuredImageKey || '',
    featuredImageUrl: initialData?.featuredImageUrl || '',
    weddingDate: initialData?.weddingDate || '',
    location: initialData?.location || '',
    isFeaturedHome: initialData?.isFeaturedHome || false,
    isFeaturedBlog: initialData?.isFeaturedBlog || false,
    gallery_images: Array.isArray(initialData?.gallery_images) ? initialData.gallery_images : []
  });
  const [showDeleteImageConfirm, setShowDeleteImageConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showTitleWarning, setShowTitleWarning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [initialFormData] = useState(formData);
  const [showIncompleteWarning, setShowIncompleteWarning] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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
        ...formData,
        featured_image_key: formData.featuredImageKey || null,
        featured_image_url: formData.featuredImageUrl || null,
        wedding_date: formData.weddingDate || null,
        location: formData.location || null,
        gallery_images: formData.gallery_images || [],
        status: saveAsDraft ? 'draft' : 'published'
      };

      if (saveAsDraft) {
        onSaveAsDraft(formData);
      } else {
        onSubmit(formData);
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

  const handleGalleryImageUpload = (files: Array<{ key: string; url: string }>) => {
    const newUrls = files.map(file => file.url);
    setFormData(prevData => ({
      ...prevData,
      gallery_images: [...(prevData.gallery_images || []), ...newUrls]
    }));
  };

  const handleGalleryImageDelete = (index: number | undefined) => {
    if (typeof index !== 'number') return;
    
    const imageToDelete = formData.gallery_images[index];
    
    try {
      // Create a new array without the deleted image immediately for better UX
      const updatedGallery = [...formData.gallery_images];
      updatedGallery.splice(index, 1);
      
      setFormData(prevData => ({
        ...prevData,
        gallery_images: updatedGallery
      }));

      // Then attempt to delete from storage
      fetch('/api/upload/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageKey: imageToDelete }),
      }).catch(error => {
        console.error('Error deleting gallery image:', error);
        // Revert the state if delete fails
        setFormData(prevData => ({
          ...prevData,
          gallery_images: formData.gallery_images
        }));
      });
    } catch (error) {
      console.error('Error handling gallery image delete:', error);
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
            <div className="space-y-2">
              {formData.featuredImageUrl && (
                <div className="relative aspect-video rounded-lg overflow-hidden group">
                  <img
                    src={formData.featuredImageUrl}
                    alt="Featured image"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setPreviewImage(formData.featuredImageUrl || null);
                        }}
                        className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100 shadow-lg transition-all"
                        aria-label="View full size"
                        title="View full size"
                        type="button"
                      >
                        <RiZoomInLine size={20} />
                      </button>
                      {!isDeleting && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleDeleteClick();
                          }}
                          className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50 shadow-lg transition-all"
                          disabled={isDeleting}
                          aria-label="Delete image"
                          title="Delete image"
                          type="button"
                        >
                          <RiCloseLine size={20} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <ImageDropzone
                onChange={handleFeaturedImageUpload}
                maxFiles={1}
                onDelete={handleDeleteClick}
                disabled={isDeleting}
                folder="blogposts"
                multiple={false}
              />
            </div>
          </FormField>

          <FormField label="Gallery Images">
            <div className="space-y-4">
              <ImageDropzone
                onChange={handleGalleryImageUpload}
                maxFiles={Math.max(0, 10 - (formData.gallery_images?.length || 0))}
                disabled={isDeleting || (formData.gallery_images?.length || 0) >= 10}
                folder="bloggallery"
                multiple={true}
              />
              <p className="text-sm text-gray-500 mb-4">
                Upload up to 10 images for the blog gallery ({formData.gallery_images?.length || 0}/10 uploaded)
              </p>
              
              {formData.gallery_images && formData.gallery_images.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Gallery Preview</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {formData.gallery_images.map((imageUrl, index) => (
                      <div key={`${imageUrl}-${index}`} className="relative aspect-video rounded-lg overflow-hidden group">
                        <img
                          src={imageUrl}
                          alt={`Gallery image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all">
                          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                setPreviewImage(imageUrl);
                              }}
                              className="p-1 bg-white rounded-full text-gray-700 hover:bg-gray-100 shadow-lg transition-all"
                              type="button"
                              aria-label={`View gallery image ${index + 1}`}
                              title="View full size"
                            >
                              <RiZoomInLine size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                handleGalleryImageDelete(index);
                              }}
                              className="p-1 bg-white rounded-full text-red-600 hover:bg-red-50 shadow-lg transition-all"
                              type="button"
                              aria-label={`Delete gallery image ${index + 1}`}
                              title={`Delete gallery image ${index + 1}`}
                            >
                              <RiCloseLine size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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

      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-90"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 z-10 p-2 text-white hover:text-gray-300 transition-colors"
            aria-label="Close preview"
            type="button"
          >
            <RiCloseLine className="w-8 h-8" />
          </button>
          <div 
            className="w-full h-full flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewImage}
              alt="Full size preview"
              className="max-w-[90vw] max-h-[90vh] object-contain"
            />
          </div>
        </div>
      )}

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