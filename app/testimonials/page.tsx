'use client';

import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import { RiAddLine, RiEditLine, RiDeleteBin6Line, RiSearchLine, RiCalendarLine, RiMapPinLine, RiUserSmileLine, RiVideoLine, RiZoomInLine, RiCloseLine, RiErrorWarningLine } from 'react-icons/ri';
import TestimonialForm, { TestimonialFormData } from './TestimonialForm';
import { formatDate } from '../utils/dateFormat';
import ConfirmModal from '../components/ConfirmModal';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../types/supabase';
import { useRouter } from 'next/navigation';

type TestimonialStatus = 'draft' | 'published';

type Testimonial = {
  id: string;
  couple_names: string;
  wedding_date: string;
  location: string;
  review: string;
  video_url: string | null;
  image_key: string | null;
  status: TestimonialStatus;
  missingFields?: string[];
};

const formatReview = (review: string) => {
  const strippedContent = review.replace(/<[^>]+>/g, ' ').trim();
  return strippedContent.length > 150 ? `${strippedContent.substring(0, 150)}...` : strippedContent;
};

export default function TestimonialsPage() {
  const [showForm, setShowForm] = useState(false);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMissingFieldsModal, setShowMissingFieldsModal] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
  const [deletingTestimonial, setDeletingTestimonial] = useState<Testimonial | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();

  useEffect(() => {
    fetchTestimonials();
  }, []);

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

  const fetchTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching testimonials:', error.message);
        return;
      }

      if (data) {
        setTestimonials(data as Testimonial[]);
      }
    } catch (error) {
      console.error('Error in fetchTestimonials:', error);
    }
  };

  const isTestimonialComplete = (testimonial: Testimonial) => {
    const missingFields = [];
    
    if (!testimonial.couple_names?.trim()) missingFields.push('Couple Names');
    if (!testimonial.wedding_date?.trim()) missingFields.push('Wedding Date');
    if (!testimonial.location?.trim()) missingFields.push('Location');
    if (!testimonial.review?.trim()) missingFields.push('Review');
    if (!testimonial.image_key) missingFields.push('Photo');
    if (!testimonial.video_url || !isValidVideoUrl(testimonial.video_url)) missingFields.push('Video');

    testimonial.missingFields = missingFields;
    return missingFields.length === 0;
  };

  const isValidVideoUrl = (url: string) => {
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const vimeoRegex = /(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|))(\d+)(?:[a-zA-Z0-9_\-]+)?/;
    return youtubeRegex.test(url) || vimeoRegex.test(url);
  };

  const handleStatusChange = async (id: string, newStatus: TestimonialStatus) => {
    const testimonial = testimonials.find(t => t.id === id);
    if (!testimonial) return;

    if (newStatus === 'published' && !isTestimonialComplete(testimonial)) {
      alert(`Cannot publish incomplete testimonial. Missing fields:\n${testimonial.missingFields?.join('\n')}`);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('testimonials')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setTestimonials(prevTestimonials =>
        prevTestimonials.map(testimonial =>
          testimonial.id === id
            ? { ...testimonial, status: newStatus }
            : testimonial
        )
      );
    } catch (error) {
      console.error('Error updating testimonial status:', error);
    }
  };

  const handleSubmit = async (data: TestimonialFormData, saveAsDraft: boolean = false) => {
    try {
      const testimonialData = {
        couple_names: data.coupleNames,
        wedding_date: data.weddingDate,
        location: data.location,
        review: data.review,
        video_url: data.videoUrl || null,
        image_key: data.imageUrl || null,
        status: saveAsDraft ? 'draft' : 'published'
      };

      if (editingTestimonial) {
        const { error } = await supabase
          .from('testimonials')
          .update(testimonialData)
          .eq('id', editingTestimonial.id);

        if (error) {
          console.error('Error updating testimonial:', error.message);
          return;
        }
      } else {
        const { error } = await supabase
          .from('testimonials')
          .insert([testimonialData]);

        if (error) {
          console.error('Error creating testimonial:', error.message);
          return;
        }
      }

      await fetchTestimonials();
      setShowForm(false);
      setEditingTestimonial(null);
      router.refresh();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
    }
  };

  const handleDeleteClick = (testimonial: Testimonial) => {
    setDeletingTestimonial(testimonial);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTestimonial) return;
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

      // First, delete the image from DigitalOcean if it exists
      if (deletingTestimonial.image_key) {
        setDeleteProgress(30);
        const imageResponse = await fetch('/api/upload/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageKey: deletingTestimonial.image_key }),
        });

        if (!imageResponse.ok) {
          throw new Error('Failed to delete image from storage');
        }
        setDeleteProgress(60);
      }

      // Then delete the testimonial record from the database
      const { error: deleteError } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', deletingTestimonial.id);

      if (deleteError) {
        throw deleteError;
      }

      setDeleteProgress(100);

      // Update local state after a brief delay to show completion
      setTimeout(() => {
        setTestimonials(prevTestimonials => 
          prevTestimonials.filter(t => t.id !== deletingTestimonial.id)
        );
        setShowDeleteConfirm(false);
        setDeletingTestimonial(null);
        setDeleteProgress(0);
      }, 500);

      clearInterval(progressInterval);
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      alert('Failed to delete testimonial. Please try again.');
      setDeleteProgress(0);
    } finally {
      setIsDeleting(false);
    }
  };

  const filterTestimonials = (testimonials: Testimonial[]) => {
    return testimonials.filter(testimonial => {
      const matchesSearch = testimonial.couple_names.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           testimonial.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           testimonial.review.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'published' && testimonial.status === 'published') ||
                           (statusFilter === 'draft' && testimonial.status === 'draft');
      return matchesSearch && matchesStatus;
    });
  };

  const handleIncompleteClick = (testimonial: Testimonial) => {
    setSelectedTestimonial(testimonial);
    setShowMissingFieldsModal(true);
  };

  return (
    <div className='min-h-screen max-h-screen flex flex-col p-8 overflow-hidden'>
      <div className="flex-none">
        <PageHeader
          title="Testimonials"
          description="Manage client reviews and testimonials"
          action={
            <Button icon={RiAddLine} onClick={() => setShowForm(true)}>
              Add Testimonial
            </Button>
          }
        />

        <div className="mt-4 relative">
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search testimonials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B4513] border-gray-200"
              />
              <RiSearchLine 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'draft' | 'published')}
              className="px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B4513] border-gray-200 bg-white min-w-[130px]"
              aria-label="Filter testimonials by status"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>
          </div>
        </div>
      </div>

      <div className='flex-1 bg-white rounded-lg shadow-sm mt-6 overflow-hidden flex flex-col min-h-0'>
        <div className='flex-1 overflow-y-auto'>
          <div className='grid grid-cols-1 gap-6 p-6'>
            {filterTestimonials(testimonials).map((testimonial) => (
              <div 
                key={testimonial.id} 
                className='flex flex-col md:flex-row gap-6 p-6 bg-white border rounded-xl hover:shadow-md transition-all duration-200'
              >
                {testimonial.image_key && (
                  <div className="flex-shrink-0 w-full md:w-64 h-64 md:h-48 relative rounded-lg overflow-hidden group">
                    <img
                      src={testimonial.image_key}
                      alt={`${testimonial.couple_names}'s wedding`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div 
                      className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center cursor-pointer"
                      onClick={() => setPreviewImage(testimonial.image_key)}
                    >
                      <RiZoomInLine className="text-white opacity-0 group-hover:opacity-100 w-8 h-8 transform scale-0 group-hover:scale-100 transition-all duration-300" />
                    </div>
                  </div>
                )}

                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className='text-xl font-medium text-gray-900'>{testimonial.couple_names}</h3>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          testimonial.status === 'published' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {testimonial.status === 'published' ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      
                      <div className='flex items-center flex-wrap gap-4 text-sm text-gray-500 mb-4'>
                        <span className="flex items-center">
                          <RiCalendarLine className="mr-1.5" />
                          {formatDate(testimonial.wedding_date)}
                        </span>
                        <span className="flex items-center">
                          <RiMapPinLine className="mr-1.5" />
                          {testimonial.location}
                        </span>
                        {testimonial.video_url && (
                          <button
                            onClick={() => setPreviewVideo(testimonial.video_url)}
                            className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            <RiVideoLine className="mr-1.5" />
                            Watch Video
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-600 flex-grow mb-4 line-clamp-3">{testimonial.review}</p>

                  <div className="flex items-center gap-3 pt-4 border-t">
                    {testimonial.status === 'draft' ? (
                      <Button
                        variant="secondary"
                        onClick={() => isTestimonialComplete(testimonial) 
                          ? handleStatusChange(testimonial.id, 'published')
                          : handleIncompleteClick(testimonial)
                        }
                        className={`${
                          isTestimonialComplete(testimonial)
                            ? 'bg-green-50 text-green-600 hover:bg-green-100'
                            : 'bg-red-50 text-red-600 border-red-100 opacity-80'
                        }`}
                        disabled={false}
                        title={
                          !isTestimonialComplete(testimonial)
                            ? 'Click to see missing fields'
                            : 'Publish testimonial'
                        }
                      >
                        {!isTestimonialComplete(testimonial) ? (
                          <span className="flex items-center gap-1">
                            <RiErrorWarningLine className="w-4 h-4" />
                            Incomplete
                          </span>
                        ) : (
                          'Publish'
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        onClick={() => handleStatusChange(testimonial.id, 'draft')}
                        className="bg-gray-50 text-gray-600 hover:bg-gray-100"
                      >
                        Unpublish
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      icon={RiEditLine}
                      onClick={() => {
                        setEditingTestimonial(testimonial);
                        setShowForm(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleDeleteClick(testimonial)}
                      className="text-red-600 hover:bg-red-50"
                      title="Delete testimonial"
                    >
                      <RiDeleteBin6Line />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {filterTestimonials(testimonials).length === 0 && (
              <div className="text-center py-12">
                <RiUserSmileLine className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-lg text-gray-500">No testimonials found</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your search or add a new testimonial</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <TestimonialForm
          onClose={() => {
            setShowForm(false);
            setEditingTestimonial(null);
          }}
          onSubmit={(data) => handleSubmit(data, false)}
          onSaveAsDraft={(data) => handleSubmit(data, true)}
          initialData={editingTestimonial ? {
            coupleNames: editingTestimonial.couple_names,
            weddingDate: editingTestimonial.wedding_date,
            location: editingTestimonial.location,
            review: editingTestimonial.review,
            videoUrl: editingTestimonial.video_url || '',
            imageKey: editingTestimonial.image_key || '',
            imageUrl: editingTestimonial.image_key || ''
          } : undefined}
        />
      )}

      {showDeleteConfirm && deletingTestimonial && (
        <ConfirmModal
          title="Delete Testimonial"
          message={
            <div className="space-y-4">
              <div className="space-y-4">
                <p>Are you sure you want to delete this testimonial?</p>
                <div className="bg-red-50 p-4 rounded-lg space-y-2">
                  <div className="font-medium text-red-800">This will permanently delete:</div>
                  <ul className="list-disc list-inside text-red-700 space-y-1 ml-2">
                    <li>The testimonial record</li>
                    <li>Associated image</li>
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
                    Deleting testimonial... {deleteProgress}%
                  </div>
                </div>
              )}
            </div>
          }
          confirmLabel={isDeleting ? "Deleting..." : "Delete Permanently"}
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            if (!isDeleting) {
              setShowDeleteConfirm(false);
              setDeletingTestimonial(null);
            }
          }}
          confirmButtonClassName={`bg-red-600 hover:bg-red-700 text-white ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isDeleting}
        />
      )}

      {showMissingFieldsModal && selectedTestimonial && (
        <ConfirmModal
          title="Incomplete Testimonial"
          message={
            <div className="space-y-4">
              <p className="text-gray-600">The following fields are required before publishing:</p>
              <ul className="list-disc list-inside space-y-2 text-red-600">
                {selectedTestimonial.missingFields?.map((field, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <RiErrorWarningLine className="flex-shrink-0" />
                    {field}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-gray-500 mt-4">Click Edit to complete these fields.</p>
            </div>
          }
          confirmLabel="Edit Testimonial"
          onConfirm={() => {
            setShowMissingFieldsModal(false);
            setEditingTestimonial(selectedTestimonial);
            setShowForm(true);
          }}
          onCancel={() => {
            setShowMissingFieldsModal(false);
            setSelectedTestimonial(null);
          }}
          confirmButtonClassName="bg-[#8B4513] hover:bg-[#693610] text-white"
        />
      )}

      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-black"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 z-10 p-2 text-white hover:text-gray-300 transition-colors"
            aria-label="Close preview"
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
              className="w-full h-full object-contain"
              style={{
                maxWidth: '100vw',
                maxHeight: '100vh',
                objectFit: 'contain'
              }}
            />
          </div>
        </div>
      )}

      {previewVideo && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-90"
          onClick={() => setPreviewVideo(null)}
        >
          <button
            onClick={() => setPreviewVideo(null)}
            className="absolute top-4 right-4 z-10 p-2 text-white hover:text-gray-300 transition-colors"
            aria-label="Close preview"
          >
            <RiCloseLine className="w-8 h-8" />
          </button>
          <div 
            className="w-full h-full flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-4xl aspect-video">
              <VideoPreview url={previewVideo} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VideoPreview({ url }: { url: string }) {
  const videoInfo = getVideoId(url);
  
  if (!videoInfo) return null;

  let embedUrl = '';
  if (videoInfo.type === 'youtube') {
    embedUrl = `https://www.youtube.com/embed/${videoInfo.id}?autoplay=1`;
  } else if (videoInfo.type === 'vimeo') {
    embedUrl = `https://player.vimeo.com/video/${videoInfo.id}?autoplay=1`;
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