'use client';

import { useState, useEffect, useRef } from 'react';
import FormField from '../components/forms/FormField';
import Input from '../components/forms/Input';
import Button from '../components/Button';
import { RiSaveLine, RiPlayLine, RiCloseLine, RiErrorWarningLine, RiZoomInLine } from 'react-icons/ri';
import ImageDropzone from '../components/forms/ImageDropzone';
import FormModal from '../components/forms/FormModal';
import ConfirmModal from '../components/ConfirmModal';

type TestimonialFormProps = {
  onClose: () => void;
  onSubmit: (data: TestimonialFormData) => void;
  onSaveAsDraft: (data: TestimonialFormData) => void;
  initialData?: TestimonialFormData;
};

export type TestimonialFormData = {
  coupleNames: string;
  weddingDate: string | null;
  location: string;
  review: string;
  imageKey?: string;
  imageUrl?: string;
  videoUrl: string;
};

function getVideoId(url: string) {
  try {
    // YouTube URL patterns
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch) return { type: 'youtube', id: youtubeMatch[1] };

    // Vimeo URL patterns
    const vimeoRegex = /(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|))(\d+)(?:[a-zA-Z0-9_\-]+)?/;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch) return { type: 'vimeo', id: vimeoMatch[1] };

    return null;
  } catch (error) {
    return null;
  }
}

function VideoPreview({ url }: { url: string }) {
  const videoInfo = getVideoId(url);
  
  if (!videoInfo) return null;

  let embedUrl = '';
  if (videoInfo.type === 'youtube') {
    embedUrl = `https://www.youtube.com/embed/${videoInfo.id}`;
  } else if (videoInfo.type === 'vimeo') {
    embedUrl = `https://player.vimeo.com/video/${videoInfo.id}`;
  }

  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
      <iframe
        src={embedUrl}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

export default function TestimonialForm({ onClose, onSubmit, onSaveAsDraft, initialData }: TestimonialFormProps) {
  const [formData, setFormData] = useState<TestimonialFormData>(initialData || {
    coupleNames: '',
    weddingDate: null,
    location: '',
    review: '',
    imageKey: '',
    imageUrl: '',
    videoUrl: ''
  });
  const [showDeleteImageConfirm, setShowDeleteImageConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showCoupleNamesWarning, setShowCoupleNamesWarning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [isValidVideo, setIsValidVideo] = useState(false);
  const [initialFormData] = useState<TestimonialFormData>(
    initialData ? 
    JSON.parse(JSON.stringify(initialData)) : 
    {
      coupleNames: '',
      weddingDate: null,
      location: '',
      review: '',
      imageKey: '',
      imageUrl: '',
      videoUrl: ''
    }
  );
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const coupleNamesInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadingWarning, setShowUploadingWarning] = useState(false);
  const [showIncompleteWarning, setShowIncompleteWarning] = useState(false);

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && previewImage) {
        setPreviewImage(null);
      }
    };

    if (previewImage) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [previewImage]);

  useEffect(() => {
    if (formData.videoUrl) {
      const videoInfo = getVideoId(formData.videoUrl);
      setIsValidVideo(!!videoInfo);
    } else {
      setIsValidVideo(false);
    }
  }, [formData.videoUrl]);

  const isFormComplete = () => {
    return (
      formData.coupleNames?.trim() !== '' &&
      formData.weddingDate?.trim() !== '' &&
      formData.location?.trim() !== '' &&
      formData.review?.trim() !== '' &&
      formData.videoUrl?.trim() !== '' &&
      isValidVideo
    );
  };

  const handleSubmit = async (e: React.FormEvent, saveAsDraft: boolean) => {
    e.preventDefault();

    if (isUploading) {
      setShowUploadingWarning(true);
      return;
    }

    if (saveAsDraft && !formData.coupleNames?.trim()) {
      setShowCoupleNamesWarning(true);
      return;
    }

    if (!saveAsDraft && !isFormComplete()) {
      setShowIncompleteWarning(true);
      return;
    }

    const submissionData: TestimonialFormData = {
      ...formData,
      weddingDate: formData.weddingDate?.trim() || null,
      videoUrl: formData.videoUrl?.trim() || ''
    };

    if (saveAsDraft) {
      onSaveAsDraft(submissionData);
    } else {
      onSubmit(submissionData);
    }
  };

  const handleImageUpload = (files: Array<{ key: string; url: string }>) => {
    if (files.length > 0) {
      setFormData({
        ...formData,
        imageKey: files[0].key,
        imageUrl: files[0].url
      });
      // Reset upload state after successful upload
      setIsUploading(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteImageConfirm(true);
  };

  const handleImageDelete = async () => {
    if (formData.imageKey && !isDeleting) {
      setIsDeleting(true);
      setDeleteProgress(0);
      
      try {
        // Start progress animation
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
          body: JSON.stringify({ imageKey: formData.imageKey }),
        });

        if (!response.ok) {
          throw new Error('Failed to delete image');
        }

        // Complete the progress bar
        setDeleteProgress(100);
        setTimeout(() => {
          setFormData({
            ...formData,
            imageKey: '',
            imageUrl: ''
          });
          setShowDeleteImageConfirm(false);
          setIsDeleting(false);
          setDeleteProgress(0);
        }, 500); // Give time for the progress bar to complete

        clearInterval(progressInterval);
      } catch (error) {
        console.error('Error deleting image:', error);
        setDeleteProgress(0);
        setIsDeleting(false);
        // TODO: Show error notification
      }
    }
  };

  const hasUnsavedChanges = () => {
    // In edit mode, always show the draft flow
    if (initialData) {
      return true;
    }

    // For new testimonials, check if any required field has content
    return Boolean(
      formData.coupleNames?.trim() ||
      formData.weddingDate ||
      formData.location?.trim() ||
      formData.review?.trim() ||
      formData.videoUrl?.trim() ||
      formData.imageUrl
    );
  };

  const handleSaveAsDraft = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!formData.coupleNames?.trim()) {
      setShowCoupleNamesWarning(true);
      return;
    }

    const submissionData: TestimonialFormData = {
      ...formData,
      weddingDate: formData.weddingDate?.trim() || null,
      videoUrl: formData.videoUrl?.trim() || ''
    };

    onSaveAsDraft(submissionData);
  };

  const handleClose = () => {
    if (hasUnsavedChanges()) {
      if (!formData.coupleNames?.trim()) {
        setShowCoupleNamesWarning(true);
        return;
      }
      // Create a synthetic event object
      const syntheticEvent = {
        preventDefault: () => {},
      } as React.FormEvent;
      handleSubmit(syntheticEvent, true);
    } else {
      onClose();
    }
  };

  const focusCoupleNames = () => {
    setTimeout(() => {
      coupleNamesInputRef.current?.focus();
    }, 100);
  };

  return (
    <>
      <FormModal
        title={initialData ? 'Edit Testimonial' : 'Add Testimonial'}
        onClose={() => {
          if (isUploading) {
            setShowUploadingWarning(true);
            return;
          }
          if (hasUnsavedChanges()) {
            if (!formData.coupleNames?.trim()) {
              setShowCoupleNamesWarning(true);
              return;
            }
            const submissionData: TestimonialFormData = {
              ...formData,
              weddingDate: formData.weddingDate?.trim() || null,
              videoUrl: formData.videoUrl?.trim() || ''
            };
            onSaveAsDraft(submissionData);
          } else {
            onClose();
          }
        }}
        closeButtonLabel={isUploading ? "Upload in progress..." : (hasUnsavedChanges() ? "Save as Draft" : "Cancel")}
        icon={hasUnsavedChanges() ? RiSaveLine : RiCloseLine}
      >
        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <FormField label="Couple Names" required>
              <div>
                <Input
                  ref={coupleNamesInputRef}
                  required
                  value={formData.coupleNames}
                  onChange={(e) => setFormData({ ...formData, coupleNames: e.target.value })}
                  placeholder="e.g., Sarah & John"
                />
                <p className="text-sm text-gray-500 mt-1">Required even for drafts</p>
              </div>
            </FormField>

            <FormField label="Wedding Date">
              <Input
                type="date"
                value={formData.weddingDate || ''}
                min="2000-01-01"
                max="2100-12-31"
                onChange={(e) => {
                  setFormData({ ...formData, weddingDate: e.target.value });
                }}
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

          <FormField label="Review" required>
            <textarea
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 border-gray-300 focus:ring-[#8B4513]"
              rows={8}
              required
              value={formData.review}
              onChange={(e) => setFormData({ ...formData, review: e.target.value })}
              placeholder="Write the client's review here..."
            />
          </FormField>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <FormField label="Photo">
                {formData.imageUrl ? (
                  <div className="relative aspect-video rounded-lg overflow-hidden group">
                    <img
                      src={formData.imageUrl}
                      alt="Testimonial photo"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setPreviewImage(formData.imageUrl || null);
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
                    onChange={handleImageUpload}
                    value={formData.imageUrl || ''}
                    onDelete={handleDeleteClick}
                    disabled={isDeleting || isUploading}
                    folder="testimonial"
                    multiple={false}
                    onUploadStatusChange={(status) => {
                      setIsUploading(status === 'uploading');
                    }}
                  />
                )}
              </FormField>
            </div>

            <div>
              <FormField label="Video URL" required>
                {!isValidVideo ? (
                  <div>
                    <Input
                      type="url"
                      required
                      value={formData.videoUrl}
                      onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                      placeholder="Enter YouTube or Vimeo URL"
                      className={formData.videoUrl && !isValidVideo ? 'border-red-500' : ''}
                    />
                    {formData.videoUrl && !isValidVideo && (
                      <p className="text-sm text-red-500 mt-1">
                        Please enter a valid YouTube or Vimeo URL
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="relative rounded-lg overflow-hidden">
                      <VideoPreview url={formData.videoUrl || ''} />
                      <div className="absolute top-3 right-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, videoUrl: '' })}
                          className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50 hover:text-red-700 shadow-lg transition-all hover:scale-110 border border-red-100 group"
                          title="Change video"
                        >
                          <RiCloseLine size={24} className="group-hover:rotate-90 transition-transform duration-200" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </FormField>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t mt-8">
            {(initialData || hasUnsavedChanges()) && (
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
                      ? 'Cannot publish: Missing required fields'
                      : initialData ? 'Update testimonial' : 'Publish testimonial'
                  }
                >
                  {!isFormComplete() ? (
                    <span className="flex items-center gap-1">
                      <RiErrorWarningLine className="w-4 h-4" />
                      Incomplete
                    </span>
                  ) : (
                    initialData ? 'Update Testimonial' : 'Publish Testimonial'
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
              className="max-w-[90vw] max-h-[85vh] object-contain"
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
                    <li>The testimonial photo</li>
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
          onConfirm={handleImageDelete}
          onCancel={() => {
            if (!isDeleting) {
              setShowDeleteImageConfirm(false);
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

      {showCoupleNamesWarning && (
        <ConfirmModal
          title="Couple Names Required"
          message={
            <div className="space-y-4">
              <p className="text-gray-600">Couple names are required even when saving as a draft.</p>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <RiErrorWarningLine className="flex-shrink-0" />
                  <p>Please enter the couple names before saving.</p>
                </div>
              </div>
            </div>
          }
          confirmLabel="OK"
          onConfirm={() => {
            setShowCoupleNamesWarning(false);
            focusCoupleNames();
          }}
          onCancel={() => {
            setShowCoupleNamesWarning(false);
            focusCoupleNames();
          }}
          confirmButtonClassName="bg-[#8B4513] hover:bg-[#693610] text-white"
          showCancelButton={false}
        />
      )}

      {showIncompleteWarning && (
        <ConfirmModal
          title="Cannot Publish Incomplete Testimonial"
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