'use client';

import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import { RiAddLine, RiEditLine, RiDeleteBin6Line } from 'react-icons/ri';
import BlogForm, { BlogFormData } from './BlogForm';
import { formatDate } from '../utils/dateFormat';
import ConfirmModal from '../components/ConfirmModal';

export default function BlogPage() {
  const [showForm, setShowForm] = useState(false);
  const [blogs, setBlogs] = useState<BlogFormData[]>([
    {
      title: 'Modern Wedding Trends 2024',
      publishDate: '2024-03-15',
      content: 'Sample content...',
      isFeaturedHome: true,
      isFeaturedStory: false,
    },
  ]);
  const [editingBlog, setEditingBlog] = useState<BlogFormData | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingBlog, setDeletingBlog] = useState<string | null>(null);

  const handleSubmit = (data: BlogFormData) => {
    if (editingBlog) {
      setBlogs(blogs.map(b => 
        b.title === editingBlog.title ? data : b
      ));
    } else {
      setBlogs([...blogs, data]);
    }
    setShowForm(false);
    setEditingBlog(null);
  };

  const handleDeleteClick = (title: string) => {
    setDeletingBlog(title);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    if (deletingBlog) {
      setBlogs(blogs.filter(b => b.title !== deletingBlog));
      setShowDeleteConfirm(false);
      setDeletingBlog(null);
    }
  };

  return (
    <div className='p-8'>
      <PageHeader
        title="Blog Posts"
        description="Manage your blog posts and stories"
        action={
          <Button icon={RiAddLine} onClick={() => setShowForm(true)}>
            Add Post
          </Button>
        }
      />
      
      <div className='bg-white rounded-lg shadow'>
        <div className='grid grid-cols-1 gap-4 p-6'>
          {blogs.map((blog) => (
            <div key={blog.title} className='flex items-center justify-between p-4 border rounded-lg'>
              <div>
                <h3 className='text-lg font-medium'>{blog.title}</h3>
                <div className='mt-1 flex items-center text-sm text-gray-500 space-x-4'>
                  <span>Published: {formatDate(blog.publishDate)}</span>
                  {blog.isFeaturedHome && <span className="text-[#8B4513]">Featured Home</span>}
                  {blog.isFeaturedStory && <span className="text-[#8B4513]">Featured Story</span>}
                </div>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant='secondary' 
                  icon={RiEditLine}
                  onClick={() => {
                    setEditingBlog(blog);
                    setShowForm(true);
                  }}
                >
                  Edit
                </Button>
                <Button 
                  variant='secondary' 
                  icon={RiDeleteBin6Line}
                  onClick={() => handleDeleteClick(blog.title)}
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
        <BlogForm 
          onClose={() => {
            setShowForm(false);
            setEditingBlog(null);
          }}
          onSubmit={handleSubmit}
          initialData={editingBlog || undefined}
        />
      )}

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingBlog(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Blog Post"
        message="Are you sure you want to delete this blog post? This action cannot be undone."
      />
    </div>
  );
} 