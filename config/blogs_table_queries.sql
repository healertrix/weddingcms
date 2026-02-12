-- =============================================================================
-- PART 1: INSPECT blog_posts TABLE (run these in Supabase SQL Editor)
-- =============================================================================

-- Query 1: All columns and types
SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'blog_posts'
ORDER BY ordinal_position;

-- Query 2: All indexes
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'blog_posts';

-- Query 3: RLS enabled or not
SELECT
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'blog_posts';

-- Query 4: All RLS policies
SELECT
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'blog_posts';

-- Query 5: All triggers
SELECT
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public' AND event_object_table = 'blog_posts';

-- Query 6: Check constraint(s)
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.blog_posts'::regclass
  AND contype = 'c';

-- Query 7: Primary key and unique constraints
SELECT
    conname AS constraint_name,
    contype AS type,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.blog_posts'::regclass
  AND contype IN ('p', 'u');

-- Query 8: Tables that reference blog_posts (foreign keys)
SELECT
    tc.table_name AS from_table,
    kcu.column_name,
    ccu.table_name AS references_table,
    ccu.column_name AS references_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'blog_posts'
  AND tc.table_schema = 'public';

-- Query 9: Trigger function definition (used by blog_posts)
SELECT
    proname AS function_name,
    pg_get_functiondef(oid) AS definition
FROM pg_proc
WHERE proname = 'update_updated_at_column';


-- =============================================================================
-- PART 2: CREATE NEW blogs TABLE (for blogs page, separate from blog_posts)
-- Run these in order. Assumes update_updated_at_column() already exists.
-- =============================================================================

-- Step 1: Create blogs table (same shape as blog_posts but content nullable, no wedding_date/location, + category/tags)
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
  meta_description text,
  category text,
  tags text[]
);

-- Step 2: Indexes
CREATE INDEX blogs_status_idx ON blogs(status);
CREATE INDEX blogs_slug_idx ON blogs(slug);
CREATE INDEX blogs_featured_home_idx ON blogs(is_featured_home) WHERE is_featured_home = true;
CREATE INDEX blogs_featured_blog_idx ON blogs(is_featured_blog) WHERE is_featured_blog = true;
CREATE INDEX blogs_category_idx ON blogs(category);
CREATE INDEX blogs_created_at_idx ON blogs(created_at DESC);

-- Step 3: Trigger for updated_at
CREATE TRIGGER update_blogs_updated_at
    BEFORE UPDATE ON blogs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 4: Enable RLS
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- Step 5: RLS policy – public read published
CREATE POLICY "Public read access for published blogs"
    ON blogs FOR SELECT
    TO public
    USING (status = 'published');

-- Step 6: RLS policy – authenticated full access
CREATE POLICY "Allow authenticated operations"
    ON blogs FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);


-- =============================================================================
-- PART 3: VERIFY blogs TABLE (optional, run after creation)
-- =============================================================================

-- Verify columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'blogs'
ORDER BY ordinal_position;

-- Verify indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'blogs';

-- Verify RLS and policies
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'blogs';
SELECT policyname, cmd, roles FROM pg_policies WHERE schemaname = 'public' AND tablename = 'blogs';

-- Verify trigger
SELECT trigger_name, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public' AND event_object_table = 'blogs';
