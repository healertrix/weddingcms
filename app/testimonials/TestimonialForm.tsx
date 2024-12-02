'use client';

import { useState, useEffect } from 'react';
import FormField from '../components/forms/FormField';
import Input from '../components/forms/Input';
import Button from '../components/Button';
import { RiSaveLine, RiPlayLine, RiCloseLine, RiErrorWarningLine } from 'react-icons/ri';
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
  weddingDate: string;
  location: string;
  review: string;
  imageKey?: string;
  imageUrl?: string;
  videoUrl?: string;
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
    weddingDate: '',
    location: '',
    review: '',
    imageKey: '',
    imageUrl: '',
    videoUrl: ''
  });
  const [showDeleteImageConfirm, setShowDeleteImageConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [isValidVideo, setIsValidVideo] = useState(false);
  const [initialFormData] = useState(formData);

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
      formData.coupleNames.trim() !== '' &&
      formData.weddingDate.trim() !== '' &&
      formData.location.trim() !== '' &&
      formData.review.trim() !== '' &&
      formData.imageUrl !== '' &&  // Require image for publishing
      (!formData.videoUrl || isValidVideo) // If video URL exists, it must be valid
    );
  };

  const handleSubmit = (e: React.FormEvent, asDraft: boolean = false) => {
    e.preventDefault();
    if (asDraft) {
      onSaveAsDraft(formData);
    } else {
      if (isFormComplete()) {
        onSubmit(formData);
      }
    }
  };

  const handleImageUpload = (files: Array<{ key: string; url: string }>) => {
    if (files.length > 0) {
      setFormData({
        ...formData,
        imageKey: files[0].key,
        imageUrl: files[0].url
      });
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
    return JSON.stringify(initialFormData) !== JSON.stringify(formData);
  };

  const handleClose = () => {
    if (hasUnsavedChanges()) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  return (
    <>
      <FormModal
        title={initialData ? 'Edit Testimonial' : 'Add Testimonial'}
        onClose={handleClose}
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
                <ImageDropzone
                  onChange={handleImageUpload}
                  value={formData.imageUrl}
                  maxFiles={1}
                  onDelete={handleDeleteClick}
                  disabled={isDeleting}
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
            </div>

            <div>
              <FormField label="Video URL">
                {!isValidVideo ? (
                  <div>
                    <Input
                      type="url"
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
                      <VideoPreview url={formData.videoUrl} />
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
              className={`${
                isFormComplete()
                  ? 'bg-[#8B4513] text-white hover:bg-[#693610]'
                  : 'bg-brown-100 text-brown-300 cursor-not-allowed opacity-50'
              }`}
              title={
                !isFormComplete()
                  ? 'Cannot publish: Missing required fields or image'
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
          </div>
        </form>
      </FormModal>

      {showDeleteImageConfirm && (
        <ConfirmModal
          title="⚠️ Delete Image Permanently"
          message={`WARNING: You are about to permanently delete this image!\n\nThis action:\n• Cannot be undone\n• Will permanently remove the image\n• Will delete the image from the testimonial\n\nAre you absolutely sure you want to proceed?`}
          confirmLabel="Yes, Delete Image Permanently"
          onConfirm={handleImageDelete}
          onCancel={() => setShowDeleteImageConfirm(false)}
          confirmButtonClassName="bg-red-600 hover:bg-red-700 text-white"
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
        />
      )}
    </>
  );
} 