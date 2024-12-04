'use client';

import { useState, useEffect } from 'react';
import FormField from '../components/forms/FormField';
import Input from '../components/forms/Input';
import Button from '../components/Button';
import { RiSaveLine, RiDraftLine, RiCloseLine } from 'react-icons/ri';
import FormModal from '../components/forms/FormModal';

type FilmFormProps = {
  onClose: () => void;
  onSubmit: (data: FilmFormData) => void;
  onSaveAsDraft: (data: FilmFormData) => void;
  initialData?: FilmFormData;
};

export type FilmFormData = {
  title: string;
  coupleNames: string;
  weddingDate: string;
  location: string;
  description: string;
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

export default function FilmForm({ onClose, onSubmit, onSaveAsDraft, initialData }: FilmFormProps) {
  const [formData, setFormData] = useState<FilmFormData>(initialData || {
    title: '',
    coupleNames: '',
    weddingDate: '',
    location: '',
    description: '',
    videoUrl: '',
  });
  const [isValidVideo, setIsValidVideo] = useState(false);

  useEffect(() => {
    if (formData.videoUrl) {
      const videoInfo = getVideoId(formData.videoUrl);
      setIsValidVideo(!!videoInfo);
    } else {
      setIsValidVideo(false);
    }
  }, [formData.videoUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleSaveAsDraft = (e: React.MouseEvent) => {
    e.preventDefault();
    onSaveAsDraft(formData);
  };

  return (
    <FormModal
      title={initialData ? 'Edit Film' : 'Add Film'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
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
        </div>

        <div className="grid grid-cols-2 gap-6">
          <FormField label="Wedding Date" required>
            <Input
              required
              type="date"
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

        <FormField label="Description">
          <textarea
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 border-gray-300 focus:ring-[#8B4513]"
            rows={8}
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

        <div className="flex justify-end space-x-4 pt-6 border-t mt-8">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="secondary" 
            icon={RiDraftLine}
            onClick={handleSaveAsDraft}
          >
            Save as Draft
          </Button>
          <Button type="submit" icon={RiSaveLine}>
            {initialData ? 'Update Film' : 'Publish Film'}
          </Button>
        </div>
      </form>
    </FormModal>
  );
} 