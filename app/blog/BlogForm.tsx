'use client';

import { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import FormField from '../components/forms/FormField';
import Input from '../components/forms/Input';
import Button from '../components/Button';
import { RiSaveLine, RiCloseLine, RiErrorWarningLine, RiZoomInLine, RiArrowLeftSLine, RiArrowRightSLine, RiDragMove2Line } from 'react-icons/ri';
import ImageDropzone from '../components/forms/ImageDropzone';
import FormModal from '../components/forms/FormModal';
import TextEditor from '../components/forms/TextEditor';
import { Switch } from '../components/forms/Switch';
import ConfirmModal from '../components/ConfirmModal';
import Image from 'next/image';

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
  const titleInputRef = useRef<HTMLInputElement>(null);
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
  const [showImageDeleteWarning, setShowImageDeleteWarning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [initialFormData] = useState(formData);
  const [showIncompleteWarning, setShowIncompleteWarning] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewImageIndex, setPreviewImageIndex] = useState<number>(-1);
  const [deleteImageIndex, setDeleteImageIndex] = useState<number | null>(null);
  const [showUnsavedChangesWarning, setShowUnsavedChangesWarning] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadingWarning, setShowUploadingWarning] = useState(false);

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
    // Create copies of the data without gallery_images
    const { gallery_images: currentGallery, ...currentDataWithoutGallery } = formData;
    const { gallery_images: initialGallery, ...initialDataWithoutGallery } = initialFormData;
    
    return JSON.stringify(initialDataWithoutGallery) !== JSON.stringify(currentDataWithoutGallery);
  };

  const handleClose = () => {
    const hasTitle = formData.title.trim() !== '';
    const hasImages = (formData.featuredImageUrl || (formData.gallery_images && formData.gallery_images.length > 0));
    const isNewPost = !initialData;

    if (hasImages && !hasTitle && isNewPost) {
      setShowTitleWarning(true);
    } else if (hasUnsavedChanges()) {
      setShowUnsavedChangesWarning(true);
    } else {
      onClose();
    }
  };

  const handleCleanupAndClose = async () => {
    if (!formData.featuredImageUrl && (!formData.gallery_images || formData.gallery_images.length === 0)) {
      onClose();
      return;
    }

    // Only delete images if this is a new post without a title
    const isNewPost = !initialData;
    const hasTitle = formData.title.trim() !== '';
    
    if (!isNewPost || hasTitle) {
      onClose();
      return;
    }

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

      // Delete featured image if exists
      if (formData.featuredImageUrl) {
        setDeleteProgress(20);
        const featuredResponse = await fetch('/api/upload/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageKey: formData.featuredImageUrl }),
        });

        if (!featuredResponse.ok) {
          throw new Error('Failed to delete featured image');
        }
      }

      // Delete gallery images if exist
      if (formData.gallery_images && formData.gallery_images.length > 0) {
        setDeleteProgress(40);
        for (const imageUrl of formData.gallery_images) {
          const galleryResponse = await fetch('/api/upload/delete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageKey: imageUrl }),
          });

          if (!galleryResponse.ok) {
            throw new Error('Failed to delete gallery image');
          }
        }
      }

      setDeleteProgress(100);
      
      setTimeout(() => {
        setIsDeleting(false);
        setDeleteProgress(0);
        setShowImageDeleteWarning(false);
        onClose();
      }, 500);

    } catch (error) {
      console.error('Error cleaning up images:', error);
      setIsDeleting(false);
      setDeleteProgress(0);
    }
  };

  const handleGalleryImageUpload = (files: Array<{ key: string; url: string }>) => {
    const newUrls = files.map(file => file.url);
    setFormData(prevData => ({
      ...prevData,
      gallery_images: [...(prevData.gallery_images || []), ...newUrls]
    }));
  };

  const handleGalleryImageDelete = async (index: number) => {
    try {
      setIsDeleting(true);
      setDeleteProgress(0);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setDeleteProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const imageToDelete = formData.gallery_images[index];

      // Delete the image from storage
      const response = await fetch('/api/upload/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageKey: imageToDelete }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete image from storage');
      }

      // Remove from array only after successful deletion
      const newGalleryImages = [...formData.gallery_images];
      newGalleryImages.splice(index, 1);
      
      // Update form data
      setFormData(prevData => ({
        ...prevData,
        gallery_images: newGalleryImages
      }));

      // Complete the progress
      clearInterval(progressInterval);
      setDeleteProgress(100);
      
      setTimeout(() => {
        setIsDeleting(false);
        setDeleteProgress(0);
        setShowDeleteImageConfirm(false);
        setDeleteImageIndex(null);
      }, 500);

    } catch (error) {
      console.error('Error deleting image:', error);
      setIsDeleting(false);
      setDeleteProgress(0);
      // Show error state but don't revert the UI since we want to allow retry
      setShowDeleteImageConfirm(false);
      setDeleteImageIndex(null);
    }
  };

  const handlePreviewImage = (imageUrl: string, index: number) => {
    setPreviewImage(imageUrl);
    setPreviewImageIndex(index);
  };

  const handleNavigatePreview = (direction: 'prev' | 'next') => {
    if (!formData.gallery_images || previewImageIndex === -1) return;
    
    let newIndex = previewImageIndex;
    if (direction === 'prev') {
      newIndex = newIndex > 0 ? newIndex - 1 : formData.gallery_images.length - 1;
    } else {
      newIndex = newIndex < formData.gallery_images.length - 1 ? newIndex + 1 : 0;
    }
    
    setPreviewImageIndex(newIndex);
    setPreviewImage(formData.gallery_images[newIndex]);
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (previewImage) {
      if (e.key === 'ArrowLeft') {
        handleNavigatePreview('prev');
      } else if (e.key === 'ArrowRight') {
        handleNavigatePreview('next');
      } else if (e.key === 'Escape') {
        setPreviewImage(null);
        setPreviewImageIndex(-1);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [previewImage, previewImageIndex, formData.gallery_images]);

  const handleDragEnd = (result: any) => {
    const { destination, source } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newItems = Array.from(formData.gallery_images);
    const [removed] = newItems.splice(source.index, 1);
    newItems.splice(destination.index, 0, removed);

    setFormData(prevData => ({
      ...prevData,
      gallery_images: newItems
    }));
  };

  const handleImageDeleteClick = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteImageIndex(index);
    setShowDeleteImageConfirm(true);
  };

  const confirmImageDelete = () => {
    if (deleteImageIndex !== null) {
      handleGalleryImageDelete(deleteImageIndex);
      setShowDeleteImageConfirm(false);
      setDeleteImageIndex(null);
    }
  };

  const hasAnyData = () => {
    // In edit mode, always show the draft flow
    if (initialData) {
      return true;
    }

    // For new blog posts, check if any field has content
    return formData.title.trim() !== '' ||
      formData.slug.trim() !== '' ||
      formData.content.trim() !== '' ||
      formData.weddingDate.trim() !== '' ||
      formData.location.trim() !== '' ||
      formData.featuredImageKey !== '' ||
      (formData.gallery_images && formData.gallery_images.length > 0);
  };

  // Continue with the existing return statement, but add the modals at the end
  return (
    <>
      <FormModal
        title={initialData ? 'Edit Blog Post' : 'Add Blog Post'}
        onClose={() => {
          if (isUploading) {
            setShowUploadingWarning(true);
            return;
          }
          if (hasAnyData()) {
            handleSubmit(new Event('submit') as any, true);
          } else {
            onClose();
          }
        }}
        closeButtonLabel={isUploading ? "Upload in progress..." : (hasAnyData() ? "Save as Draft" : "Cancel")}
        icon={hasAnyData() ? RiSaveLine : RiCloseLine}
        disableClose={isUploading}
      >
        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
          <FormField label="Title" required>
            <Input
              ref={titleInputRef}
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
              {formData.featuredImageUrl ? (
                <div className="relative aspect-video rounded-lg overflow-hidden group">
                  <Image
                    src={formData.featuredImageUrl}
                    alt="Featured image"
                    className="object-cover"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
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
                          disabled={isDeleting || isUploading}
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
              ) : (
                <ImageDropzone
                  onChange={handleFeaturedImageUpload}
                  maxFiles={1}
                  onDelete={handleDeleteClick}
                  disabled={isDeleting || isUploading}
                  folder="blogposts"
                  multiple={false}
                  onUploadStatusChange={(status) => {
                    setIsUploading(status === 'uploading');
                  }}
                />
              )}
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
            </div>
          </FormField>

          <FormField label="Gallery Images">
            <div className="space-y-4">
              <ImageDropzone
                onChange={handleGalleryImageUpload}
                value={formData.gallery_images}
                disabled={isDeleting || isUploading}
                folder="bloggallery"
                multiple={true}
                hidePreview={true}
                onUploadStatusChange={(status) => {
                  setIsUploading(status === 'uploading');
                }}
              />
              <p className="text-sm text-gray-500 mb-4">
                Upload images for the blog gallery ({formData.gallery_images?.length || 0} uploaded)
              </p>
              
              {formData.gallery_images && formData.gallery_images.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">
                    Gallery Preview (Drag images to reorder)
                  </h4>
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable
                      droppableId="gallery"
                      direction="horizontal"
                      renderClone={(provided, snapshot, rubric) => (
                        <div
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          ref={provided.innerRef}
                          className="relative aspect-video rounded-lg overflow-hidden shadow-2xl"
                          style={{
                            ...provided.draggableProps.style,
                            width: '300px',
                            height: '180px',
                          }}
                        >
                          <Image
                            src={formData.gallery_images[rubric.source.index]}
                            alt={`Gallery image ${rubric.source.index + 1}`}
                            className="w-full h-full object-cover"
                            fill
                            sizes="300px"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-30">
                            <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                              {rubric.source.index + 1}
                            </div>
                          </div>
                        </div>
                      )}
                    >
                      {(provided) => (
                        <div 
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="flex items-start gap-6 overflow-x-auto pb-4 min-h-[160px]"
                        >
                          {formData.gallery_images.map((imageUrl, index) => (
                            <Draggable 
                              key={`${imageUrl}-${index}`} 
                              draggableId={`${imageUrl}-${index}`} 
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  style={{
                                    ...provided.draggableProps.style,
                                    width: '300px',
                                    height: snapshot.isDragging ? '180px' : 'auto',
                                  }}
                                  className={`
                                    relative aspect-video rounded-lg overflow-hidden group flex-shrink-0
                                    ${snapshot.isDragging ? 'opacity-0' : 'opacity-100'}
                                    hover:ring-2 hover:ring-[#8B4513] transition-all
                                  `}
                                >
                                  {/* Image number */}
                                  <div className="absolute top-2 left-2 z-30 bg-black bg-opacity-75 text-white px-2 py-1 rounded-full text-sm font-medium">
                                    {index + 1}
                                  </div>

                                  {/* Drag handle overlay - centered */}
                                  <div
                                    {...provided.dragHandleProps}
                                    className="absolute inset-0 z-20 cursor-move flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
                                  >
                                    <div className="bg-black bg-opacity-50 rounded-lg p-2 transform scale-75 group-hover:scale-100 transition-all duration-200">
                                      <RiDragMove2Line className="w-6 h-6 text-white" />
                                    </div>
                                  </div>

                                  <Image
                                    src={imageUrl}
                                    alt={`Gallery image ${index + 1}`}
                                    className="w-full h-full object-cover"
                                    fill
                                    sizes="300px"
                                  />

                                  {/* Controls overlay */}
                                  <div 
                                    className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all"
                                  >
                                    {/* Control buttons container */}
                                    <div className="absolute top-2 right-2 flex items-center gap-2 z-30">
                                      {/* Preview button */}
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handlePreviewImage(imageUrl, index);
                                        }}
                                        className="p-1.5 bg-white rounded-full text-gray-600 opacity-0 group-hover:opacity-100 hover:bg-gray-100 shadow-lg transition-all"
                                        type="button"
                                        aria-label={`Preview gallery image ${index + 1}`}
                                        title="Preview image"
                                      >
                                        <RiZoomInLine size={16} />
                                      </button>

                                      {/* Delete button */}
                                      <button
                                        onClick={(e) => handleImageDeleteClick(index, e)}
                                        className="p-1.5 bg-white rounded-full text-red-600 opacity-0 group-hover:opacity-100 hover:bg-red-50 shadow-lg transition-all"
                                        type="button"
                                        aria-label={`Delete gallery image ${index + 1}`}
                                        title="Delete image"
                                      >
                                        <RiCloseLine size={16} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
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
            {/* Always show buttons in edit mode or when there are changes */}
            {(initialData || hasAnyData()) && (
              <>
                <Button 
                  variant="secondary" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (isUploading) {
                      setShowUploadingWarning(true);
                      return;
                    }
                    handleSubmit(e, true);
                  }}
                  className={`bg-gray-50 text-gray-600 hover:bg-gray-100 ${
                    isUploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={isUploading}
                  title={isUploading ? 'Please wait for upload to complete' : undefined}
                >
                  Save as Draft
                </Button>
                <Button 
                  type="submit" 
                  icon={RiSaveLine}
                  disabled={!isFormComplete() || isUploading}
                  onClick={(e) => {
                    e.preventDefault();
                    if (isUploading) {
                      setShowUploadingWarning(true);
                      return;
                    }
                    if (!isFormComplete()) {
                      setShowIncompleteWarning(true);
                      return;
                    }
                    handleSubmit(e, false);
                  }}
                  className={`${
                    isFormComplete() && !isUploading
                      ? 'bg-[#8B4513] text-white hover:bg-[#693610]'
                      : 'bg-brown-100 text-brown-300 cursor-not-allowed opacity-50'
                  }`}
                  title={
                    isUploading
                      ? 'Please wait for upload to complete'
                      : !isFormComplete()
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
              </>
            )}
          </div>
        </form>
      </FormModal>

      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-90"
          onClick={() => {
            setPreviewImage(null);
            setPreviewImageIndex(-1);
          }}
        >
          {/* Close button */}
          <button
            onClick={() => {
              setPreviewImage(null);
              setPreviewImageIndex(-1);
            }}
            className="absolute top-4 right-4 z-10 p-2 text-white hover:text-gray-300 transition-colors"
            aria-label="Close preview"
            type="button"
          >
            <RiCloseLine className="w-8 h-8" />
          </button>

          {/* Navigation buttons */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNavigatePreview('prev');
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white hover:text-gray-300 transition-colors"
            aria-label="Previous image"
            type="button"
          >
            <RiArrowLeftSLine className="w-8 h-8" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNavigatePreview('next');
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white hover:text-gray-300 transition-colors"
            aria-label="Next image"
            type="button"
          >
            <RiArrowRightSLine className="w-8 h-8" />
          </button>

          {/* Image container with counter */}
          <div 
            className="w-full h-full flex flex-col items-center justify-center gap-4 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={previewImage}
              alt={`Gallery image ${previewImageIndex + 1}`}
              className="max-w-[90vw] max-h-[85vh] object-contain"
              width={1920}
              height={1080}
              priority
            />
            <div className="text-white text-sm font-medium bg-black bg-opacity-75 px-4 py-1.5 rounded-full">
              Image {previewImageIndex + 1} of {formData.gallery_images?.length}
            </div>
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
                    {deleteImageIndex === null ? (
                      <li>The featured image</li>
                    ) : (
                      <li>The gallery image</li>
                    )}
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
          onConfirm={() => {
            if (!isDeleting) {
              if (deleteImageIndex !== null) {
                handleGalleryImageDelete(deleteImageIndex);
              } else {
                handleImageDelete();
              }
            }
          }}
          onCancel={() => {
            if (!isDeleting) {
              setShowDeleteImageConfirm(false);
              setDeleteImageIndex(null);
            }
          }}
          confirmButtonClassName={`bg-red-600 hover:bg-red-700 text-white ${
            isDeleting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={isDeleting}
          showCancelButton={!isDeleting}
          allowBackgroundCancel={!isDeleting}
        />
      )}

      {showTitleWarning && (
        <ConfirmModal
          title="Title Required"
          message={
            <div className="space-y-4">
              <p className="text-gray-600">A title is required even when saving as a draft.</p>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-[#8B4513]">
                  <RiErrorWarningLine className="flex-shrink-0 w-5 h-5" />
                  <p>Please enter the title before saving.</p>
                </div>
              </div>
            </div>
          }
          confirmLabel="OK"
          onConfirm={() => {
            setShowTitleWarning(false);
            setTimeout(() => {
              titleInputRef.current?.focus();
            }, 100);
          }}
          onCancel={() => setShowTitleWarning(false)}
          confirmButtonClassName="bg-[#8B4513] hover:bg-[#693610] text-white"
          showCancelButton={false}
          showCloseButton={false}
          allowBackgroundCancel={false}
        />
      )}

      {showImageDeleteWarning && (
        <ConfirmModal
          title="⚠️ Delete Uploaded Images"
          message={
            <div className="space-y-4">
              <div className="space-y-4">
                <p>Are you sure you want to close without saving?</p>
                <div className="bg-red-50 p-4 rounded-lg space-y-2">
                  <div className="font-medium text-red-800">This will permanently delete:</div>
                  <ul className="list-disc list-inside text-red-700 space-y-1 ml-2">
                    {formData.featuredImageUrl && <li>The featured image</li>}
                    {formData.gallery_images && formData.gallery_images.length > 0 && (
                      <li>All uploaded gallery images ({formData.gallery_images.length} images)</li>
                    )}
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
                    Deleting images... {deleteProgress}%
                  </div>
                </div>
              )}
            </div>
          }
          confirmLabel={isDeleting ? "Deleting..." : "Delete and Close"}
          onConfirm={handleCleanupAndClose}
          onCancel={() => {
            if (!isDeleting) {
              setShowImageDeleteWarning(false);
            }
          }}
          confirmButtonClassName={`bg-red-600 hover:bg-red-700 text-white ${
            isDeleting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={isDeleting}
          showCancelButton={!isDeleting}
          allowBackgroundCancel={!isDeleting}
        />
      )}

      {showUnsavedChangesWarning && (
        <ConfirmModal
          title="Unsaved Changes"
          message={
            <div className="space-y-4">
              <p className="text-gray-600">You have unsaved changes. What would you like to do?</p>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <RiErrorWarningLine className="flex-shrink-0 w-5 h-5" />
                  <p>Choose to save your changes or close without saving.</p>
                </div>
              </div>
            </div>
          }
          confirmLabel="Save"
          onConfirm={(e) => {
            setShowUnsavedChangesWarning(false);
            handleSubmit(e as any, true);
          }}
          onCancel={() => {
            setShowUnsavedChangesWarning(false);
            onClose();
          }}
          confirmButtonClassName="bg-[#8B4513] hover:bg-[#693610] text-white"
          showCancelButton={true}
          cancelLabel="Exit without saving"
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

      {showUploadingWarning && (
        <ConfirmModal
          title="Upload in Progress"
          message={
            <div className="space-y-4">
              <p className="text-gray-600">Please wait for the image upload to complete before proceeding.</p>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <RiErrorWarningLine className="flex-shrink-0 w-5 h-5" />
                  <p>Images are still being uploaded. Please wait for the upload to finish.</p>
                </div>
              </div>
            </div>
          }
          confirmLabel="OK"
          onConfirm={() => setShowUploadingWarning(false)}
          onCancel={() => setShowUploadingWarning(false)}
          confirmButtonClassName="bg-[#8B4513] hover:bg-[#693610] text-white"
          showCancelButton={false}
        />
      )}
    </>
  );
} 