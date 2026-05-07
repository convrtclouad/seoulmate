-- ═══════════════════════════════════════════════════════════════
-- SeoulMate — Full Setup SQL
-- Run this ONCE in Supabase → SQL Editor → New Query → Run
-- Creates all tables + seeds all data for korea-2025
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Add missing columns to existing tables ─────────────────

ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS lat       DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng       DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- ── 2. Create activity_done table (real-time completion sync) ──

CREATE TABLE IF NOT EXISTS public.activity_done (
  activity_id TEXT        NOT NULL,
  trip_id     TEXT        NOT NULL,
  member_id   TEXT        NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (activity_id, member_id)
);
ALTER TABLE public.activity_done ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public rw" ON public.activity_done;
CREATE POLICY "public rw" ON public.activity_done FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'activity_done'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_done;
  END IF;
END $$;

-- ── 3. Seed members ───────────────────────────────────────────

DELETE FROM public.members WHERE trip_id = 'korea-2025';
INSERT INTO public.members (id, trip_id, name, emoji, color) VALUES
  ('bryan',    'korea-2025', 'Bryan',     '🐻', 'from-emerald-400 to-teal-500'),
  ('changyao', 'korea-2025', 'Chang Yao', '🐼', 'from-violet-400 to-purple-500'),
  ('mango',    'korea-2025', 'Mango',     '🦁', 'from-yellow-400 to-orange-400'),
  ('jackson',  'korea-2025', 'Jackson',   '🦊', 'from-sky-400 to-blue-500')
ON CONFLICT (id) DO UPDATE SET
  name  = EXCLUDED.name,
  emoji = EXCLUDED.emoji,
  color = EXCLUDED.color;

-- ── 4. Seed prepare items (todo + packing, all 4 members) ─────

DELETE FROM public.prepare_items WHERE trip_id = 'korea-2025' AND created_by = 'template';

INSERT INTO public.prepare_items (id, trip_id, category, text, done, assignees, created_by) VALUES
-- ── TODO items ────────────────────────────────────────────────
-- K-ETA
('ptpl-todo-0-0-申请KETA',  'korea-2025', 'todo', '🛂 申请 K-ETA 电子旅行许可',             false, ARRAY['bryan'],    'template'),
('ptpl-todo-0-1-申请KETA',  'korea-2025', 'todo', '🛂 申请 K-ETA 电子旅行许可',             false, ARRAY['changyao'], 'template'),
('ptpl-todo-0-2-申请KETA',  'korea-2025', 'todo', '🛂 申请 K-ETA 电子旅行许可',             false, ARRAY['mango'],    'template'),
('ptpl-todo-0-3-申请KETA',  'korea-2025', 'todo', '🛂 申请 K-ETA 电子旅行许可',             false, ARRAY['jackson'],  'template'),
-- Passport
('ptpl-todo-1-0-护照',       'korea-2025', 'todo', '📗 护照 Passport 有效期检查（6个月以上）', false, ARRAY['bryan'],    'template'),
('ptpl-todo-1-1-护照',       'korea-2025', 'todo', '📗 护照 Passport 有效期检查（6个月以上）', false, ARRAY['changyao'], 'template'),
('ptpl-todo-1-2-护照',       'korea-2025', 'todo', '📗 护照 Passport 有效期检查（6个月以上）', false, ARRAY['mango'],    'template'),
('ptpl-todo-1-3-护照',       'korea-2025', 'todo', '📗 护照 Passport 有效期检查（6个月以上）', false, ARRAY['jackson'],  'template'),
-- 换现钱
('ptpl-todo-2-0-换现钱',     'korea-2025', 'todo', '💴 换韩元现钱 KRW',                      false, ARRAY['bryan'],    'template'),
('ptpl-todo-2-1-换现钱',     'korea-2025', 'todo', '💴 换韩元现钱 KRW',                      false, ARRAY['changyao'], 'template'),
('ptpl-todo-2-2-换现钱',     'korea-2025', 'todo', '💴 换韩元现钱 KRW',                      false, ARRAY['mango'],    'template'),
('ptpl-todo-2-3-换现钱',     'korea-2025', 'todo', '💴 换韩元现钱 KRW',                      false, ARRAY['jackson'],  'template'),
-- Travel Insurance
('ptpl-todo-3-0-保险',       'korea-2025', 'todo', '🛡️ 买 Travel Insurance 旅游保险',         false, ARRAY['bryan'],    'template'),
('ptpl-todo-3-1-保险',       'korea-2025', 'todo', '🛡️ 买 Travel Insurance 旅游保险',         false, ARRAY['changyao'], 'template'),
('ptpl-todo-3-2-保险',       'korea-2025', 'todo', '🛡️ 买 Travel Insurance 旅游保险',         false, ARRAY['mango'],    'template'),
('ptpl-todo-3-3-保险',       'korea-2025', 'todo', '🛡️ 买 Travel Insurance 旅游保险',         false, ARRAY['jackson'],  'template'),
-- Data Roaming
('ptpl-todo-4-0-漫游',       'korea-2025', 'todo', '📡 开通 Data Roaming 数据漫游',           false, ARRAY['bryan'],    'template'),
('ptpl-todo-4-1-漫游',       'korea-2025', 'todo', '📡 开通 Data Roaming 数据漫游',           false, ARRAY['changyao'], 'template'),
('ptpl-todo-4-2-漫游',       'korea-2025', 'todo', '📡 开通 Data Roaming 数据漫游',           false, ARRAY['mango'],    'template'),
('ptpl-todo-4-3-漫游',       'korea-2025', 'todo', '📡 开通 Data Roaming 数据漫游',           false, ARRAY['jackson'],  'template'),
-- Naver Map
('ptpl-todo-5-0-导航',       'korea-2025', 'todo', '📱 下载 Naver Map 导航 App',              false, ARRAY['bryan'],    'template'),
('ptpl-todo-5-1-导航',       'korea-2025', 'todo', '📱 下载 Naver Map 导航 App',              false, ARRAY['changyao'], 'template'),
('ptpl-todo-5-2-导航',       'korea-2025', 'todo', '📱 下载 Naver Map 导航 App',              false, ARRAY['mango'],    'template'),
('ptpl-todo-5-3-导航',       'korea-2025', 'todo', '📱 下载 Naver Map 导航 App',              false, ARRAY['jackson'],  'template'),
-- Kakao T
('ptpl-todo-6-0-打车',       'korea-2025', 'todo', '🚕 下载 Kakao T 打车 App（首选！）',       false, ARRAY['bryan'],    'template'),
('ptpl-todo-6-1-打车',       'korea-2025', 'todo', '🚕 下载 Kakao T 打车 App（首选！）',       false, ARRAY['changyao'], 'template'),
('ptpl-todo-6-2-打车',       'korea-2025', 'todo', '🚕 下载 Kakao T 打车 App（首选！）',       false, ARRAY['mango'],    'template'),
('ptpl-todo-6-3-打车',       'korea-2025', 'todo', '🚕 下载 Kakao T 打车 App（首选！）',       false, ARRAY['jackson'],  'template'),
-- Check-in
('ptpl-todo-7-0-登机',       'korea-2025', 'todo', '✈️ 机场 Check-in 打印 Boarding Pass',     false, ARRAY['bryan'],    'template'),
('ptpl-todo-7-1-登机',       'korea-2025', 'todo', '✈️ 机场 Check-in 打印 Boarding Pass',     false, ARRAY['changyao'], 'template'),
('ptpl-todo-7-2-登机',       'korea-2025', 'todo', '✈️ 机场 Check-in 打印 Boarding Pass',     false, ARRAY['mango'],    'template'),
('ptpl-todo-7-3-登机',       'korea-2025', 'todo', '✈️ 机场 Check-in 打印 Boarding Pass',     false, ARRAY['jackson'],  'template'),

-- ── PACKING items ─────────────────────────────────────────────
-- Powerbank
('ptpl-packing-0-0-充电宝',  'korea-2025', 'packing', '🔋 Powerbank 充电宝',              false, ARRAY['bryan'],    'template'),
('ptpl-packing-0-1-充电宝',  'korea-2025', 'packing', '🔋 Powerbank 充电宝',              false, ARRAY['changyao'], 'template'),
('ptpl-packing-0-2-充电宝',  'korea-2025', 'packing', '🔋 Powerbank 充电宝',              false, ARRAY['mango'],    'template'),
('ptpl-packing-0-3-充电宝',  'korea-2025', 'packing', '🔋 Powerbank 充电宝',              false, ARRAY['jackson'],  'template'),
-- 转插头
('ptpl-packing-1-0-转插头',  'korea-2025', 'packing', '🔌 转插头（韩国 C 型 两圆脚）',     false, ARRAY['bryan'],    'template'),
('ptpl-packing-1-1-转插头',  'korea-2025', 'packing', '🔌 转插头（韩国 C 型 两圆脚）',     false, ARRAY['changyao'], 'template'),
('ptpl-packing-1-2-转插头',  'korea-2025', 'packing', '🔌 转插头（韩国 C 型 两圆脚）',     false, ARRAY['mango'],    'template'),
('ptpl-packing-1-3-转插头',  'korea-2025', 'packing', '🔌 转插头（韩国 C 型 两圆脚）',     false, ARRAY['jackson'],  'template'),
-- 雨衣
('ptpl-packing-2-0-雨衣',    'korea-2025', 'packing', '🌂 雨衣 / 折叠伞',                 false, ARRAY['bryan'],    'template'),
('ptpl-packing-2-1-雨衣',    'korea-2025', 'packing', '🌂 雨衣 / 折叠伞',                 false, ARRAY['changyao'], 'template'),
('ptpl-packing-2-2-雨衣',    'korea-2025', 'packing', '🌂 雨衣 / 折叠伞',                 false, ARRAY['mango'],    'template'),
('ptpl-packing-2-3-雨衣',    'korea-2025', 'packing', '🌂 雨衣 / 折叠伞',                 false, ARRAY['jackson'],  'template'),
-- 洗漱
('ptpl-packing-3-0-洗漱',    'korea-2025', 'packing', '🧴 洗漱用品',                      false, ARRAY['bryan'],    'template'),
('ptpl-packing-3-1-洗漱',    'korea-2025', 'packing', '🧴 洗漱用品',                      false, ARRAY['changyao'], 'template'),
('ptpl-packing-3-2-洗漱',    'korea-2025', 'packing', '🧴 洗漱用品',                      false, ARRAY['mango'],    'template'),
('ptpl-packing-3-3-洗漱',    'korea-2025', 'packing', '🧴 洗漱用品',                      false, ARRAY['jackson'],  'template'),
-- 药物
('ptpl-packing-4-0-药物',    'korea-2025', 'packing', '💊 常备药物',                      false, ARRAY['bryan'],    'template'),
('ptpl-packing-4-1-药物',    'korea-2025', 'packing', '💊 常备药物',                      false, ARRAY['changyao'], 'template'),
('ptpl-packing-4-2-药物',    'korea-2025', 'packing', '💊 常备药物',                      false, ARRAY['mango'],    'template'),
('ptpl-packing-4-3-药物',    'korea-2025', 'packing', '💊 常备药物',                      false, ARRAY['jackson'],  'template'),
-- 衣物
('ptpl-packing-5-0-衣物',    'korea-2025', 'packing', '👕 换洗衣物（5天份）',              false, ARRAY['bryan'],    'template'),
('ptpl-packing-5-1-衣物',    'korea-2025', 'packing', '👕 换洗衣物（5天份）',              false, ARRAY['changyao'], 'template'),
('ptpl-packing-5-2-衣物',    'korea-2025', 'packing', '👕 换洗衣物（5天份）',              false, ARRAY['mango'],    'template'),
('ptpl-packing-5-3-衣物',    'korea-2025', 'packing', '👕 换洗衣物（5天份）',              false, ARRAY['jackson'],  'template'),
-- 鞋
('ptpl-packing-6-0-鞋',      'korea-2025', 'packing', '👟 舒适走路鞋',                    false, ARRAY['bryan'],    'template'),
('ptpl-packing-6-1-鞋',      'korea-2025', 'packing', '👟 舒适走路鞋',                    false, ARRAY['changyao'], 'template'),
('ptpl-packing-6-2-鞋',      'korea-2025', 'packing', '👟 舒适走路鞋',                    false, ARRAY['mango'],    'template'),
('ptpl-packing-6-3-鞋',      'korea-2025', 'packing', '👟 舒适走路鞋',                    false, ARRAY['jackson'],  'template'),
-- 信用卡
('ptpl-packing-7-0-信用卡',  'korea-2025', 'packing', '💳 信用卡 / 备用现金',             false, ARRAY['bryan'],    'template'),
('ptpl-packing-7-1-信用卡',  'korea-2025', 'packing', '💳 信用卡 / 备用现金',             false, ARRAY['changyao'], 'template'),
('ptpl-packing-7-2-信用卡',  'korea-2025', 'packing', '💳 信用卡 / 备用现金',             false, ARRAY['mango'],    'template'),
('ptpl-packing-7-3-信用卡',  'korea-2025', 'packing', '💳 信用卡 / 备用现金',             false, ARRAY['jackson'],  'template')

ON CONFLICT (id) DO NOTHING;

-- ── 5. Seed itinerary (activities) ───────────────────────────
-- (keep your existing seed_itinerary.sql for this — run it separately)
-- This file handles members + prepare items + schema setup.
