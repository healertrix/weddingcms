'use client';

import { useState, useEffect, useRef } from 'react';
import FormField from '../components/forms/FormField';
import Input from '../components/forms/Input';
import Button from '../components/Button';
import { RiSaveLine, RiDraftLine, RiCloseLine, RiErrorWarningLine, RiInformationLine } from 'react-icons/ri';
import FormModal from '../components/forms/FormModal';
import ConfirmModal from '../components/ConfirmModal';

type FilmFormProps = {
  onClose: () => void;
  onSubmit: (data: FilmFormData) => void;
  onSaveAsDraft: (data: FilmFormData) => void;
  initialData?: FilmFormData;
};

export type FilmFormData = {
  title: string;
  couple_names: string;
  wedding_date: string;
  location: string;
  description: string;
  video_url: string;
  status?: 'draft' | 'published';
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

export default function FilmForm({ onClose, onSubmit, onSaveAsDraft, initialData }: FilmFormProps) {
  const coupleNamesInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<FilmFormData>({
    title: initialData?.title || '',
    couple_names: initialData?.couple_names || '',
    wedding_date: initialData?.wedding_date || '',
    location: initialData?.location || '',
    description: initialData?.description || '',
    video_url: initialData?.video_url || '',
  });
  const [isValidVideo, setIsValidVideo] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showCoupleNameWarning, setShowCoupleNameWarning] = useState(false);
  const [showIncompleteWarning, setShowIncompleteWarning] = useState(false);

  useEffect(() => {
    if (formData.video_url) {
      const videoInfo = getVideoId(formData.video_url);
      setIsValidVideo(!!videoInfo);
    } else {
      setIsValidVideo(false);
    }
  }, [formData.video_url]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Format the data to match database schema
    const filmData = {
      title: formData.title.trim() || null,
      couple_names: formData.couple_names.trim(),
      wedding_date: formData.wedding_date || null,
      location: formData.location.trim() || null,
      description: formData.description.trim() || null,
      video_url: formData.video_url.trim() || null,
      status: 'published'
    };

    console.log('Publishing with data:', filmData);
    onSubmit(filmData);
  };

  const handleSaveAsDraft = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!formData.couple_names.trim()) {
      setShowCoupleNameWarning(true);
      return;
    }

    // Format the data to match database schema
    const filmData = {
      title: formData.title.trim() || null,
      couple_names: formData.couple_names.trim(),
      wedding_date: formData.wedding_date || null,
      location: formData.location.trim() || null,
      description: formData.description.trim() || null,
      video_url: formData.video_url.trim() || null,
      status: 'draft'
    };

    console.log('Saving draft with data:', filmData);
    onSaveAsDraft(filmData);
  };

  const isFormComplete = () => {
    return (
      formData.title.trim() !== '' &&
      formData.couple_names.trim() !== '' &&
      formData.wedding_date.trim() !== '' &&
      formData.location.trim() !== '' &&
      formData.description.trim() !== '' &&
      formData.video_url.trim() !== '' &&
      isValidVideo
    );
  };

  const hasUnsavedChanges = () => {
    if (!initialData) {
      return formData.title !== '' ||
        formData.couple_names !== '' ||
        formData.wedding_date !== '' ||
        formData.location !== '' ||
        formData.description !== '' ||
        formData.video_url !== '';
    }

    return formData.title !== initialData.title ||
      formData.couple_names !== initialData.couple_names ||
      formData.wedding_date !== initialData.wedding_date ||
      formData.location !== initialData.location ||
      formData.description !== initialData.description ||
      formData.video_url !== initialData.video_url;
  };

  const getMissingFields = () => {
    const missingFields = [];
    if (!formData.title.trim()) missingFields.push('Title');
    if (!formData.couple_names.trim()) missingFields.push('Couple Names');
    if (!formData.wedding_date.trim()) missingFields.push('Wedding Date');
    if (!formData.location.trim()) missingFields.push('Location');
    if (!formData.description.trim()) missingFields.push('Description');
    if (!formData.video_url.trim() || !isValidVideo) missingFields.push('Valid Video URL');
    return missingFields;
  };

  const focusCoupleNames = () => {
    setTimeout(() => {
      coupleNamesInputRef.current?.focus();
    }, 100);
  };

  return (
    <FormModal
      title={initialData ? 'Edit Film' : 'Add Film'}
      onClose={() => {
        if (hasUnsavedChanges()) {
          if (!formData.couple_names.trim()) {
            setShowCoupleNameWarning(true);
            return;
          }
          // Format the data to match database schema
          const filmData = {
            title: formData.title.trim() || null,
            couple_names: formData.couple_names.trim(),
            wedding_date: formData.wedding_date || null,
            location: formData.location.trim() || null,
            description: formData.description.trim() || null,
            video_url: formData.video_url.trim() || null,
            status: 'draft'
          };
          console.log('Saving draft on close with data:', filmData);
          onSaveAsDraft(filmData);
        } else {
          onClose();
        }
      }}
      closeButtonLabel={hasUnsavedChanges() ? "Save as Draft" : "Cancel"}
      icon={hasUnsavedChanges() ? RiSaveLine : RiCloseLine}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <FormField label="Couple Names" required>
            <div>
              <Input
                ref={coupleNamesInputRef}
                required
                value={formData.couple_names}
                onChange={(e) => setFormData({ ...formData, couple_names: e.target.value })}
                placeholder="e.g., Sarah & John"
              />
              <p className="text-sm text-gray-500 mt-1">Required even for drafts</p>
            </div>
          </FormField>

          <FormField label="Title" required>
            <Input
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter film title"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <FormField label="Wedding Date" required>
            <Input
              required
              type="date"
              value={formData.wedding_date}
              onChange={(e) => setFormData({ ...formData, wedding_date: e.target.value })}
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

        <FormField label="Description" required>
          <textarea
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 border-gray-300 focus:ring-[#8B4513]"
            rows={8}
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Write film description here..."
          />
        </FormField>

        <FormField label="Video URL" required>
          {!isValidVideo ? (
            <div>
              <Input
                type="url"
                required
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                placeholder="Enter YouTube or Vimeo URL"
                className={formData.video_url && !isValidVideo ? 'border-red-500' : ''}
              />
              {formData.video_url && !isValidVideo && (
                <p className="text-sm text-red-500 mt-1">
                  Please enter a valid YouTube or Vimeo URL
                </p>
              )}
            </div>
          ) : (
            <div>
              <div className="relative rounded-lg overflow-hidden">
                <VideoPreview url={formData.video_url} />
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, video_url: '' })}
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

        <div className="flex justify-end space-x-4 pt-6 border-t mt-8">
          {hasUnsavedChanges() && (
            <>
              <Button 
                variant="secondary" 
                onClick={handleSaveAsDraft}
                type="button"
                className="bg-gray-50 text-gray-600 hover:bg-gray-100"
              >
                Save as Draft
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
                  handleSubmit(e);
                }}
                className={`${
                  isFormComplete()
                    ? 'bg-[#8B4513] text-white hover:bg-[#693610]'
                    : 'bg-brown-100 text-brown-300 cursor-not-allowed opacity-50'
                }`}
                title={
                  !isFormComplete()
                    ? `Cannot publish: Missing ${getMissingFields().join(', ')}`
                    : initialData ? 'Update film' : 'Publish film'
                }
              >
                {!isFormComplete() ? (
                  <span className="flex items-center gap-1">
                    <RiErrorWarningLine className="w-4 h-4" />
                    Incomplete
                  </span>
                ) : (
                  initialData ? 'Update Film' : 'Publish Film'
                )}
              </Button>
            </>
          )}
        </div>
      </form>

      {showCloseConfirm && (
        <ConfirmModal
          title="Unsaved Changes"
          message="You have unsaved changes. What would you like to do?"
          confirmLabel="Save Changes"
          onConfirm={(e) => {
            setShowCloseConfirm(false);
            handleSubmit(e as any);
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

      {showCoupleNameWarning && (
        <ConfirmModal
          title="Couple Names Required"
          message={
            <div className="space-y-4">
              <p className="text-[#4A4A4A]">Couple names are required even when saving as a draft.</p>
              <div className="bg-[#FEF3C7] p-4 rounded-lg flex items-start gap-3">
                <RiInformationLine className="text-[#92400E] w-5 h-5 mt-0.5" />
                <p className="text-[#92400E]">Please enter the couple names before saving.</p>
              </div>
            </div>
          }
          confirmLabel="OK"
          onConfirm={() => {
            setShowCoupleNameWarning(false);
            focusCoupleNames();
          }}
          showCancelButton={false}
          confirmButtonClassName="bg-[#92400E] hover:bg-[#78340F] text-white"
          showCloseButton={false}
          allowBackgroundCancel={false}
        />
      )}

      {showIncompleteWarning && (
        <ConfirmModal
          title="Cannot Publish Incomplete Film"
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
    </FormModal>
  );
} 