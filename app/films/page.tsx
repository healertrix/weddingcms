'use client';

import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import { RiAddLine, RiEditLine, RiDeleteBin6Line } from 'react-icons/ri';
import FilmForm, { FilmFormData } from './FilmForm';

export default function FilmsPage() {
  const [showForm, setShowForm] = useState(false);
  const [films, setFilms] = useState<FilmFormData[]>([
    {
      title: 'A Magical Day',
      coupleNames: 'Sarah & Mike',
      location: 'Mumbai',
      description: 'A beautiful celebration of love...',
      videoUrl: 'https://example.com/video1',
    },
  ]);
  const [editingFilm, setEditingFilm] = useState<FilmFormData | null>(null);

  const handleSubmit = (data: FilmFormData) => {
    if (editingFilm) {
      setFilms(films.map(f => 
        f.title === editingFilm.title ? data : f
      ));
    } else {
      setFilms([...films, data]);
    }
    setShowForm(false);
    setEditingFilm(null);
  };

  const handleDelete = (title: string) => {
    if (confirm('Are you sure you want to delete this film?')) {
      setFilms(films.filter(f => f.title !== title));
    }
  };

  return (
    <div className='p-8'>
      <PageHeader
        title="Wedding Films"
        description="Manage your wedding films and videos"
        action={
          <Button icon={RiAddLine} onClick={() => setShowForm(true)}>
            Add Film
          </Button>
        }
      />
      
      <div className='bg-white rounded-lg shadow'>
        <div className='grid grid-cols-1 gap-4 p-6'>
          {films.map((film) => (
            <div key={film.title} className='flex items-center justify-between p-4 border rounded-lg'>
              <div>
                <h3 className='text-lg font-medium'>{film.title}</h3>
                <div className='mt-1 flex items-center text-sm text-gray-500 space-x-4'>
                  <span>Couple: {film.coupleNames}</span>
                  <span>Location: {film.location}</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant='secondary' 
                  icon={RiEditLine}
                  onClick={() => {
                    setEditingFilm(film);
                    setShowForm(true);
                  }}
                >
                  Edit
                </Button>
                <Button 
                  variant='secondary' 
                  icon={RiDeleteBin6Line}
                  onClick={() => handleDelete(film.title)}
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
        <FilmForm 
          onClose={() => {
            setShowForm(false);
            setEditingFilm(null);
          }}
          onSubmit={handleSubmit}
          initialData={editingFilm || undefined}
        />
      )}
    </div>
  );
} 