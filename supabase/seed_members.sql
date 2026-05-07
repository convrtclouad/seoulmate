-- ═══════════════════════════════════════════════════════════════
-- SeoulMate — Members Seed  (Bryan, Chang Yao, Mango, Jackson)
-- Paste in Supabase → SQL Editor → New Query → Run
-- Run AFTER seed_itinerary.sql
-- ═══════════════════════════════════════════════════════════════

-- Clear old demo members
DELETE FROM public.members WHERE trip_id = 'korea-2025';

-- Insert real members
INSERT INTO public.members (id, trip_id, name, emoji, color) VALUES
  ('bryan',    'korea-2025', 'Bryan',     '🐻', 'from-emerald-400 to-teal-500'),
  ('changyao', 'korea-2025', 'Chang Yao', '🐼', 'from-violet-400 to-purple-500'),
  ('mango',    'korea-2025', 'Mango',     '🦁', 'from-yellow-400 to-orange-400'),
  ('jackson',  'korea-2025', 'Jackson',   '🦊', 'from-sky-400 to-blue-500')
ON CONFLICT (id) DO UPDATE SET
  name  = EXCLUDED.name,
  emoji = EXCLUDED.emoji,
  color = EXCLUDED.color;
