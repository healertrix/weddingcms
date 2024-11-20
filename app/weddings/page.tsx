'use client';

import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import { RiAddLine, RiEditLine, RiDeleteBin6Line } from 'react-icons/ri';
import WeddingForm, { WeddingFormData } from './WeddingForm';

export default function WeddingsPage() {
  const [showForm, setShowForm] = useState(false);
  const [weddings, setWeddings] = useState<WeddingFormData[]>([
    {
      coupleNames: 'Priya & Rahul',
      weddingDate: '2024-03-15',
      location: 'Delhi',
    },
    // Add more sample data as needed
  ]);
  const [editingWedding, setEditingWedding] = useState<WeddingFormData | null>(null);

  const handleSubmit = (data: WeddingFormData) => {
    if (editingWedding) {
      setWeddings(weddings.map(w => 
        w.coupleNames === editingWedding.coupleNames ? data : w
      ));
    } else {
      setWeddings([...weddings, data]);
    }
    setShowForm(false);
    setEditingWedding(null);
  };

  const handleDelete = (coupleNames: string) => {
    if (confirm('Are you sure you want to delete this wedding story?')) {
      setWeddings(weddings.filter(w => w.coupleNames !== coupleNames));
    }
  };

  return (
    <div className='p-8'>
      <PageHeader
        title="Wedding Stories"
        description="Manage wedding stories and collections"
        action={
          <Button icon={RiAddLine} onClick={() => setShowForm(true)}>
            Add Story
          </Button>
        }
      />
      
      <div className='bg-white rounded-lg shadow'>
        <div className='grid grid-cols-1 gap-4 p-6'>
          {weddings.map((wedding) => (
            <div key={wedding.coupleNames} className='flex items-center justify-between p-4 border rounded-lg'>
              <div>
                <h3 className='text-lg font-medium'>{wedding.coupleNames}</h3>
                <div className='mt-1 flex items-center text-sm text-gray-500 space-x-4'>
                  <span>Date: {new Date(wedding.weddingDate).toLocaleDateString()}</span>
                  <span>Location: {wedding.location}</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant='secondary' 
                  icon={RiEditLine}
                  onClick={() => {
                    setEditingWedding(wedding);
                    setShowForm(true);
                  }}
                >
                  Edit
                </Button>
                <Button 
                  variant='secondary' 
                  icon={RiDeleteBin6Line}
                  onClick={() => handleDelete(wedding.coupleNames)}
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
        <WeddingForm 
          onClose={() => {
            setShowForm(false);
            setEditingWedding(null);
          }}
          onSubmit={handleSubmit}
          initialData={editingWedding || undefined}
        />
      )}
    </div>
  );
} 