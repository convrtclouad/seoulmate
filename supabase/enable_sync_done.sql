-- ═══════════════════════════════════════════════════════════════
-- SeoulMate — Enable Synced Activity Completion
-- Run this ONCE in Supabase → SQL Editor → New Query → Run
-- This enables real-time cross-device "完成" sync for activities
-- ═══════════════════════════════════════════════════════════════

-- 1. Add lat/lng/photo_url to activities table (needed for navigation)
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS lat       DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng       DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 2. Create activity_done table for per-member completion tracking
CREATE TABLE IF NOT EXISTS public.activity_done (
  activity_id TEXT        NOT NULL,
  trip_id     TEXT        NOT NULL,
  member_id   TEXT        NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (activity_id, member_id)
);

-- 3. Disable RLS (simple friends-only app)
ALTER TABLE public.activity_done DISABLE ROW LEVEL SECURITY;

-- 4. Enable realtime
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'activity_done'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_done;
  END IF;
END $$;

-- Done! Activity completion will now sync across all 4 members in real-time 🎉
