-- =====================================================
-- FIX: Add status column for ORA compatibility
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add status column
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

-- Add constraint
ALTER TABLE blog_posts 
ADD CONSTRAINT blog_posts_status_check 
CHECK (status IN ('draft', 'published', 'archived'));

-- Backfill existing data based on published boolean
UPDATE blog_posts 
SET status = CASE 
    WHEN published = true THEN 'published' 
    ELSE 'draft' 
END
WHERE status IS NULL OR status = 'draft';

-- Create index for status queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);

-- Comment
COMMENT ON COLUMN blog_posts.status IS 'Post status: draft, published, archived. Used by ORA.';
