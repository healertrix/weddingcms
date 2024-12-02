'use client';

import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import { RiAddLine, RiEditLine, RiDeleteBin6Line, RiSearchLine, RiCalendarLine, RiMapPinLine, RiUserSmileLine, RiVideoLine, RiZoomInLine, RiCloseLine } from 'react-icons/ri';
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
  const [deletingTestimonial, setDeletingTestimonial] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
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

  const handleStatusChange = async (testimonialId: string, newStatus: TestimonialStatus) => {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .update({
          status: newStatus
        })
        .eq('id', testimonialId)
        .select()
        .single();

      if (error) {
        console.error('Error updating testimonial status:', error.message);
        // You might want to add a notification here to show the error to the user
        return;
      }

      // Optimistically update the UI
      setTestimonials(prevTestimonials =>
        prevTestimonials.map(t =>
          t.id === testimonialId ? { ...t, status: newStatus } : t
        )
      );

      router.refresh();
    } catch (error) {
      console.error('Error in handleStatusChange:', error);
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

  const handleDeleteClick = (id: string) => {
    setDeletingTestimonial(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (deletingTestimonial) {
      try {
        // Get the testimonial data first
        const { data: testimonialData } = await supabase
          .from('testimonials')
          .select('image_key')
          .eq('id', deletingTestimonial)
          .single();

        // If there's an image, delete it from Digital Ocean
        if (testimonialData?.image_key) {
          const response = await fetch('/api/upload/delete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageKey: testimonialData.image_key }),
          });

          if (!response.ok) {
            console.error('Failed to delete image from storage');
          }
        }

        // Delete the testimonial from the database
        const { error } = await supabase
          .from('testimonials')
          .delete()
          .eq('id', deletingTestimonial);

        if (error) {
          console.error('Error deleting testimonial:', error);
          return;
        }

        fetchTestimonials();
        setShowDeleteConfirm(false);
        setDeletingTestimonial(null);
        router.refresh();
      } catch (error) {
        console.error('Error in handleDeleteConfirm:', error);
      }
    }
  };

  const filteredTestimonials = testimonials.filter(testimonial => 
    testimonial.couple_names.toLowerCase().includes(searchQuery.toLowerCase()) ||
    testimonial.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    testimonial.review.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <div className="relative">
            <input
              type="text"
              placeholder="Search testimonials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B4513] border-gray-200"
            />
            <RiSearchLine 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
          </div>
        </div>
      </div>

      <div className='flex-1 bg-white rounded-lg shadow-sm mt-6 overflow-hidden flex flex-col min-h-0'>
        <div className='flex-1 overflow-y-auto'>
          <div className='grid grid-cols-1 gap-6 p-6'>
            {filteredTestimonials.map((testimonial) => (
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
                          <span className="flex items-center text-blue-600">
                            <RiVideoLine className="mr-1.5" />
                            Video Available
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-600 flex-grow mb-4 line-clamp-3">{testimonial.review}</p>

                  <div className="flex items-center gap-3 pt-4 border-t">
                    {testimonial.status === 'draft' ? (
                      <Button
                        variant="secondary"
                        onClick={() => handleStatusChange(testimonial.id, 'published')}
                        className="bg-green-50 text-green-600 hover:bg-green-100"
                      >
                        Publish
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
                      icon={RiDeleteBin6Line}
                      onClick={() => handleDeleteClick(testimonial.id)}
                      className="bg-red-50 text-red-600 hover:bg-red-100"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {filteredTestimonials.length === 0 && (
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

      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete Testimonial"
          message="Are you sure you want to delete this testimonial? This action cannot be undone."
          confirmLabel="Delete"
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setDeletingTestimonial(null);
          }}
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
    </div>
  );
} 