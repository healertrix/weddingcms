'use client';

import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import { RiAddLine, RiEditLine, RiDeleteBin6Line, RiSearchLine, RiCalendarLine, RiMapPinLine, RiLinkM, RiArticleLine } from 'react-icons/ri';
import BlogForm, { BlogFormData } from './BlogForm';
import ConfirmModal from '../components/ConfirmModal';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../types/supabase';
import { useRouter } from 'next/navigation';

type BlogStatus = 'draft' | 'published';

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  content: string;
  featured_image_key: string | null;
  status: BlogStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  wedding_date?: string;
  location?: string;
  is_featured_home?: boolean;
  is_featured_blog?: boolean;
};

// Update the formatContentPreview function
const formatContentPreview = (content: string) => {
  // First remove HTML tags
  const strippedContent = content.replace(/<[^>]+>/g, ' ').trim();
  // Then truncate to a reasonable length
  return strippedContent.length > 150 ? `${strippedContent.substring(0, 150)}...` : strippedContent;
};

export default function BlogPage() {
  const [showForm, setShowForm] = useState(false);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingPost, setDeletingPost] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error.message);
        return;
      }

      if (data) {
        setPosts(data as BlogPost[]);
      }
    } catch (error) {
      console.error('Error in fetchPosts:', error);
    }
  };

  const handleStatusChange = async (postId: string, newStatus: BlogStatus) => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({ 
          status: newStatus,
          published_at: newStatus === 'published' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId);

      if (error) {
        console.error('Error updating post status:', error.message);
        return;
      }

      setPosts(prevPosts =>
        prevPosts.map(p =>
          p.id === postId ? {
            ...p,
            status: newStatus,
            published_at: newStatus === 'published' ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
          } : p
        )
      );

      router.refresh();
    } catch (error) {
      console.error('Error in handleStatusChange:', error);
    }
  };

  const handleSubmit = async (data: BlogFormData, saveAsDraft: boolean = false) => {
    try {
      const now = new Date().toISOString();
      const postData = {
        title: data.title,
        slug: data.slug,
        content: data.content,
        featured_image_key: data.featuredImageKey || null,
        wedding_date: data.weddingDate,
        location: data.location,
        is_featured_home: data.isFeaturedHome,
        is_featured_blog: data.isFeaturedBlog,
        status: saveAsDraft ? 'draft' : 'published',
        published_at: saveAsDraft ? null : now,
        updated_at: now
      };

      if (editingPost) {
        const { error } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', editingPost.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('blog_posts')
          .insert({
            ...postData,
            created_at: now
          });

        if (error) throw error;
      }

      await fetchPosts();
      setShowForm(false);
      setEditingPost(null);
      router.refresh();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeletingPost(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (deletingPost) {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', deletingPost);

      if (error) {
        console.error('Error deleting post:', error);
        return;
      }

      await fetchPosts();
      setShowDeleteConfirm(false);
      setDeletingPost(null);
      router.refresh();
    }
  };

  const getStatusActions = (post: BlogPost) => {
    return post.status === 'draft' ? (
      <Button
        variant="secondary"
        onClick={() => handleStatusChange(post.id, 'published')}
        className="bg-green-50 text-green-600 hover:bg-green-100"
      >
        Publish
      </Button>
    ) : (
      <Button
        variant="secondary"
        onClick={() => handleStatusChange(post.id, 'draft')}
        className="bg-gray-50 text-gray-600 hover:bg-gray-100"
      >
        Unpublish
      </Button>
    );
  };

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className='min-h-screen max-h-screen flex flex-col p-8 overflow-hidden'>
      <div className="flex-none">
        <PageHeader
          title="Blog Posts"
          description="Manage your blog posts"
          action={
            <Button icon={RiAddLine} onClick={() => setShowForm(true)}>
              Add Post
            </Button>
          }
        />

        <div className="mt-4 relative">
          <div className="relative">
            <input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <RiSearchLine 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
          </div>
        </div>
      </div>

      <div className='flex-1 bg-white rounded-lg shadow mt-4 overflow-hidden flex flex-col min-h-0'>
        <div className='flex-1 overflow-y-auto'>
          <div className='grid grid-cols-1 gap-4 p-6'>
            {filteredPosts.map((post) => (
              <div key={post.id} className='flex flex-col p-6 border rounded-lg hover:bg-gray-50 transition-all duration-200 group'>
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className='text-xl font-medium text-gray-900 truncate'>{post.title}</h3>
                      <span className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium ${
                        post.status === 'published' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {post.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    
                    <div className='flex items-center text-sm text-gray-500 space-x-4 mb-3 flex-wrap'>
                      {post.wedding_date && (
                        <span className="flex items-center flex-shrink-0">
                          <RiCalendarLine className="mr-1" />
                          {new Date(post.wedding_date).toLocaleDateString()}
                        </span>
                      )}
                      {post.location && (
                        <span className="flex items-center flex-shrink-0">
                          <RiMapPinLine className="mr-1" />
                          <span className="truncate max-w-[200px]">{post.location}</span>
                        </span>
                      )}
                      <span className="flex items-center flex-shrink-0">
                        <RiLinkM className="mr-1" />
                        <span className="truncate max-w-[200px]">{post.slug}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    {getStatusActions(post)}
                    <Button 
                      variant='secondary' 
                      icon={RiEditLine}
                      onClick={() => {
                        setEditingPost(post);
                        setShowForm(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant='secondary' 
                      icon={RiDeleteBin6Line}
                      onClick={() => handleDeleteClick(post.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="flex gap-6 mt-4">
                  {post.featured_image_key && (
                    <div className="flex-shrink-0">
                      <img 
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/blog-images/${post.featured_image_key}`}
                        alt={post.title}
                        className="w-48 h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="prose prose-sm max-w-none text-gray-600">
                      <p className="line-clamp-3 break-words">
                        {formatContentPreview(post.content)}
                      </p>
                    </div>
                  </div>
                </div>

                {(post.is_featured_home || post.is_featured_blog) && (
                  <div className="flex gap-2 mt-4 flex-wrap">
                    {post.is_featured_home && (
                      <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full flex-shrink-0">
                        Featured on Home
                      </span>
                    )}
                    {post.is_featured_blog && (
                      <span className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded-full flex-shrink-0">
                        Featured in Blog
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
            {filteredPosts.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <RiArticleLine className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg">No posts found matching your search.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <BlogForm 
          onClose={() => {
            setShowForm(false);
            setEditingPost(null);
          }}
          onSubmit={(data) => handleSubmit(data, false)}
          onSaveAsDraft={(data) => handleSubmit(data, true)}
          initialData={editingPost ? {
            title: editingPost.title,
            slug: editingPost.slug,
            content: editingPost.content,
            featuredImageKey: editingPost.featured_image_key || '',
            galleryImages: [],
            weddingDate: editingPost.wedding_date || '',
            location: editingPost.location || '',
            isFeaturedHome: editingPost.is_featured_home || false,
            isFeaturedBlog: editingPost.is_featured_blog || false
          } : undefined}
        />
      )}

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingPost(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
      />
    </div>
  );
} 