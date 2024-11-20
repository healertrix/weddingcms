'use client';

import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import { RiAddLine, RiEditLine, RiDeleteBin6Line } from 'react-icons/ri';
import WeddingForm, { WeddingFormData } from './WeddingForm';
import { formatDate } from '../utils/dateFormat';
import ConfirmModal from '../components/ConfirmModal';

export default function WeddingsPage() {
  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingWedding, setDeletingWedding] = useState<string | null>(null);
  const [weddings, setWeddings] = useState<WeddingFormData[]>([
    {
      coupleNames: 'Priya & Rahul',
      weddingDate: '2024-03-15',
      location: 'Delhi',
    },
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

  const handleDeleteClick = (coupleNames: string) => {
    setDeletingWedding(coupleNames);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    if (deletingWedding) {
      setWeddings(weddings.filter(w => w.coupleNames !== deletingWedding));
      setShowDeleteConfirm(false);
      setDeletingWedding(null);
    }
  };

  return (
    <div className='p-8'>
      <PageHeader
        title="Wedding Gallery"
        description="Manage wedding galleries and collections"
        action={
          <Button icon={RiAddLine} onClick={() => setShowForm(true)}>
            Add Gallery
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
                  <span>Date: {formatDate(wedding.weddingDate)}</span>
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
                  onClick={() => handleDeleteClick(wedding.coupleNames)}
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

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingWedding(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Wedding Gallery"
        message="Are you sure you want to delete this wedding gallery? This action cannot be undone."
      />
    </div>
  );
} 