-- =============================================================================
-- CREATE blogs TABLE
-- Based on blog_posts structure. Only differences:
--   - content is NULLABLE (blog_posts has NOT NULL)
--   - no wedding_date column
--   - no location column
--   - no blog_posts_wedding_date_idx (no column to index)
-- =============================================================================

-- Table
CREATE TABLE blogs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text,
  featured_image_key text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_featured_home boolean DEFAULT false,
  is_featured_blog boolean DEFAULT false,
  gallery_images text[],
  video_url text,
  meta_description text,
  featured_image_alt text,
  gallery_image_alts jsonb
);

-- Indexes (same as blog_posts except no wedding_date)
CREATE INDEX blogs_status_idx ON blogs(status);
CREATE INDEX blogs_slug_idx ON blogs(slug);
CREATE INDEX blogs_featured_home_idx ON blogs(is_featured_home) WHERE (is_featured_home = true);
CREATE INDEX blogs_featured_blog_idx ON blogs(is_featured_blog) WHERE (is_featured_blog = true);

-- Trigger
CREATE TRIGGER update_blogs_updated_at
    BEFORE UPDATE ON blogs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- Policies (same pattern as blog_posts)
CREATE POLICY "Allow anonymous operations"
    ON blogs FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated operations"
    ON blogs FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Public read access for published blog posts"
    ON blogs FOR SELECT
    TO public
    USING (status = 'published');
