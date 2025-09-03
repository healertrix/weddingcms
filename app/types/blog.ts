export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  featured_image_key?: string;
  featured_image_url?: string;
  featured_image_alt?: string;
  wedding_date: string;
  location: string;
  is_featured_home: boolean;
  is_featured_blog: boolean;
  gallery_images: string[];
  gallery_image_alts?: { [key: string]: string };
  video_url?: string;
  meta_description?: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export interface BlogFormData {
  title: string;
  slug: string;
  content: string;
  featuredImageKey?: string;
  featuredImageUrl?: string;
  featuredImageAlt?: string;
  weddingDate: string;
  location: string;
  isFeaturedHome: boolean;
  isFeaturedBlog: boolean;
  gallery_images: string[];
  galleryImageAlts?: { [key: string]: string };
  video_url?: string | null;
  meta_description?: string;
}
