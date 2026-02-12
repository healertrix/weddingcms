-- =============================================================================
-- PART 1: SEE STRUCTURE OF blog_posts TABLE
-- Run each query in Supabase SQL Editor and note the results.
-- =============================================================================

-- 1. Columns (name, type, nullable, default)
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'blog_posts'
ORDER BY ordinal_position;


-- 2. Indexes
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'blog_posts';


-- 3. RLS on/off
SELECT
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'blog_posts';


-- 4. RLS policies
SELECT
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'blog_posts';


-- 5. Triggers
SELECT
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public' AND event_object_table = 'blog_posts';


-- 6. Check constraints
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.blog_posts'::regclass
  AND contype = 'c';


-- 7. Primary key and unique constraints
SELECT
    conname AS constraint_name,
    contype AS type,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.blog_posts'::regclass
  AND contype IN ('p', 'u');


-- =============================================================================
-- PART 2: NEW TABLE "blogs" BASED ON blog_posts
-- Only differences: content is nullable, no wedding_date, no location.
-- Run this AFTER you have run Part 1 and confirmed the blog_posts structure.
-- =============================================================================

-- Create blogs table (same structure as blog_posts except content nullable, no wedding_date, no location)
CREATE TABLE blogs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text,
  featured_image_key text,
  featured_image_alt text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_featured_home boolean DEFAULT false,
  is_featured_blog boolean DEFAULT false,
  gallery_images text[],
  gallery_image_alts jsonb,
  video_url text,
  meta_description text
);

-- Indexes (same pattern as blog_posts)
CREATE INDEX blogs_status_idx ON blogs(status);
CREATE INDEX blogs_slug_idx ON blogs(slug);
CREATE INDEX blogs_featured_home_idx ON blogs(is_featured_home) WHERE is_featured_home = true;
CREATE INDEX blogs_featured_blog_idx ON blogs(is_featured_blog) WHERE is_featured_blog = true;

-- Trigger (uses same function as blog_posts)
CREATE TRIGGER update_blogs_updated_at
    BEFORE UPDATE ON blogs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for published blogs"
    ON blogs FOR SELECT
    TO public
    USING (status = 'published');

CREATE POLICY "Allow authenticated operations"
    ON blogs FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
