'use client';

import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import { RiAddLine, RiEditLine, RiDeleteBin6Line } from 'react-icons/ri';
import TestimonialForm, { TestimonialFormData } from './TestimonialForm';

export default function TestimonialsPage() {
  const [showForm, setShowForm] = useState(false);
  const [testimonials, setTestimonials] = useState<TestimonialFormData[]>([
    {
      coupleNames: 'Anjali & Vikram',
      weddingDate: '2024-02-20',
      location: 'Jaipur',
      review: 'Our wedding was absolutely magical...',
      videoUrl: 'https://example.com/video1',
    },
  ]);
  const [editingTestimonial, setEditingTestimonial] = useState<TestimonialFormData | null>(null);

  const handleSubmit = (data: TestimonialFormData) => {
    if (editingTestimonial) {
      setTestimonials(testimonials.map(t => 
        t.coupleNames === editingTestimonial.coupleNames ? data : t
      ));
    } else {
      setTestimonials([...testimonials, data]);
    }
    setShowForm(false);
    setEditingTestimonial(null);
  };

  const handleDelete = (coupleNames: string) => {
    if (confirm('Are you sure you want to delete this testimonial?')) {
      setTestimonials(testimonials.filter(t => t.coupleNames !== coupleNames));
    }
  };

  return (
    <div className='p-8'>
      <PageHeader
        title="Testimonials"
        description="Manage client reviews and testimonials"
        action={
          <Button icon={RiAddLine} onClick={() => setShowForm(true)}>
            Add Testimonial
          </Button>
        }
      />
      
      <div className='bg-white rounded-lg shadow'>
        <div className='grid grid-cols-1 gap-4 p-6'>
          {testimonials.map((testimonial) => (
            <div key={testimonial.coupleNames} className='flex items-center justify-between p-4 border rounded-lg'>
              <div>
                <h3 className='text-lg font-medium'>{testimonial.coupleNames}</h3>
                <div className='mt-1 flex items-center text-sm text-gray-500 space-x-4'>
                  <span>Wedding Date: {new Date(testimonial.weddingDate).toLocaleDateString()}</span>
                  <span>Location: {testimonial.location}</span>
                </div>
                <p className='mt-2 text-gray-600 line-clamp-2'>{testimonial.review}</p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant='secondary' 
                  icon={RiEditLine}
                  onClick={() => {
                    setEditingTestimonial(testimonial);
                    setShowForm(true);
                  }}
                >
                  Edit
                </Button>
                <Button 
                  variant='secondary' 
                  icon={RiDeleteBin6Line}
                  onClick={() => handleDelete(testimonial.coupleNames)}
                  className="text-red-600 hover:bg-red-50"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <TestimonialForm 
          onClose={() => {
            setShowForm(false);
            setEditingTestimonial(null);
          }}
          onSubmit={handleSubmit}
          initialData={editingTestimonial || undefined}
        />
      )}
    </div>
  );
} 