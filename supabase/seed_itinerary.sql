-- ═══════════════════════════════════════════════════════════════
-- SeoulMate — Itinerary Seed  (Seoul Trip 07-15 May 2026)
-- Paste this in Supabase → SQL Editor → New Query → Run
--
-- TRIP_ID = 'korea-2025'  (must match NEXT_PUBLIC_TRIP_ID env var)
-- If your env var is different, do a Find & Replace on 'korea-2025'
-- ═══════════════════════════════════════════════════════════════

-- ── Extend activities table (safe to re-run) ─────────────────
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS lat       double precision;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS lng       double precision;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS photo_url text;

-- ── Clear old seed data (safe to re-run) ─────────────────────
DELETE FROM public.activities
WHERE trip_id = 'korea-2025' AND created_by = 'seed';

-- ═══════════════════════════════════════════════
-- DAY 0 · 7 May 2026 (Thu) — 出发日
-- ═══════════════════════════════════════════════
INSERT INTO public.activities
  (id, trip_id, title, description, category, activity_date, start_time, place_name, address, lat, lng, photo_url, created_by)
VALUES
('seed-d0-1','korea-2025',
 '✈️ 从KLIA出发 — 红眼航班',
 'AirAsia X KLIA出发。提前3小时到达，行李不超20kg。登机口在KLIA2航站楼',
 'transport','2026-05-07','23:30',
 'KLIA 吉隆坡国际机场','Sepang, Selangor',
 2.7456,101.7099,
 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&auto=format&fit=crop',
 'seed');

-- ═══════════════════════════════════════════════
-- DAY 1 · 8 May 2026 (Fri) — 성수동 · 홍대
-- ═══════════════════════════════════════════════
INSERT INTO public.activities
  (id, trip_id, title, description, category, activity_date, start_time, place_name, address, lat, lng, photo_url, created_by)
VALUES
('seed-d1-1','korea-2025',
 '🛬 抵达仁川国际机场 ICN',
 '入境韩国！办理入境手续，领取行李。乘AREX机场快线前往市区约50分钟。T1/T2注意看好站台',
 'transport','2026-05-08','07:00',
 '인천국제공항 仁川国际机场','Incheon International Airport',
 37.4602,126.4407,
 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=600&auto=format&fit=crop',
 'seed'),

('seed-d1-2','korea-2025',
 '🏠 Check-in Airbnb · 放行李',
 '到达弘大附近Airbnb，放行李简单整理，预订码：HMXKZYT2HC',
 'accommodation','2026-05-08','10:30',
 'Airbnb 홍대','서울 마포구 홍대',
 37.5572,126.9243,
 NULL,
 'seed'),

('seed-d1-3','korea-2025',
 '🏭 성수동 圣水洞探索',
 '首尔最潮艺文区！废弃工厂改造的网红咖啡厅、独立设计品牌。必去：아크앤북、성수연방、대림창고',
 'shopping','2026-05-08','11:00',
 '성수동 카페거리','서울 성동구 성수2가',
 37.5446,127.0568,
 'https://images.unsplash.com/photo-1578637387939-43c525550085?w=600&auto=format&fit=crop',
 'seed'),

('seed-d1-4','korea-2025',
 '🍜 圣水洞午餐',
 '在성수동找好吃的！推荐：오스테리아오르조(意式)、카페아날로그、성수연방美食区。韩国创意料理+咖啡',
 'food','2026-05-08','12:00',
 '성수동 美食区','서울 성동구 성수동',
 37.5446,127.0568,
 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&auto=format&fit=crop',
 'seed'),

('seed-d1-5','korea-2025',
 '🌆 弘대 홍대 夜游',
 '首尔最有活力年轻人聚集地！街头美食、个性小店、Live House现场表演，晚上超精彩',
 'shopping','2026-05-08','18:00',
 '홍대 弘大','서울 마포구 어울마당로',
 37.5572,126.9243,
 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop',
 'seed'),

('seed-d1-6','korea-2025',
 '🏠 回Airbnb休息',
 '第一天结束，好好休息！明天有超多行程 😴',
 'accommodation','2026-05-08','22:00',
 'Airbnb 홍대','서울 마포구',
 37.5572,126.9243,NULL,'seed');

-- ═══════════════════════════════════════════════
-- DAY 2 · 9 May 2026 (Sat) — 망원 · 익선 · 북촌 · 경복궁 · 명동
-- ═══════════════════════════════════════════════
INSERT INTO public.activities
  (id, trip_id, title, description, category, activity_date, start_time, place_name, address, lat, lng, photo_url, created_by)
VALUES
('seed-d2-1','korea-2025',
 '🥬 망원시장 望远市场 早市',
 '首尔最受欢迎传统市场之一，早餐+街头小吃。닭강정炸鸡、鸡蛋糕、韩式煎饼。真实首尔市集体验！',
 'food','2026-05-09','07:00',
 '망원시장 望远市场','서울 마포구 월드컵로25길',
 37.5554,126.9049,
 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=600&auto=format&fit=crop',
 'seed'),

('seed-d2-2','korea-2025',
 '☕ 익선동 益善洞 韩屋街',
 '首尔最古老韩屋街区，窄巷里藏着精致咖啡厅+复古小店。绝佳拍照地！推荐：익선다다、익선스페이스',
 'attraction','2026-05-09','09:00',
 '익선동 益善洞','서울 종로구 익선동',
 37.5746,126.9996,
 'https://images.unsplash.com/photo-1596003906949-67221c37965c?w=600&auto=format&fit=crop',
 'seed'),

('seed-d2-3','korea-2025',
 '🏛️ 안국 / 인사동 文化街',
 '传统文化街区，美术馆、工艺品店、韩屋咖啡厅。买韩国传统纪念品首选！쌈지길购物中心必逛',
 'attraction','2026-05-09','10:00',
 '인사동 仁寺洞','서울 종로구 인사동길',
 37.5737,126.9863,
 'https://images.unsplash.com/photo-1598132655985-41d91aa9bc99?w=600&auto=format&fit=crop',
 'seed'),

('seed-d2-4','korea-2025',
 '🏘️ 북촌 한옥마을 北村韩屋村',
 '首尔最美韩屋村，传统韩式建筑+景福宫山景。拍照圣地，建议上午去避开人潮。居民区请保持安静🤫',
 'attraction','2026-05-09','12:00',
 '북촌 한옥마을','서울 종로구 계동길',
 37.5816,126.9838,
 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=600&auto=format&fit=crop',
 'seed'),

('seed-d2-5','korea-2025',
 '🏯 경복궁 景福宫',
 '朝鲜王朝主要宫殿！可租借韩服(한복)入场，超美！建议下午光线最佳。成人票₩3,000',
 'attraction','2026-05-09','14:00',
 '경복궁 景福宫','서울 종로구 사직로 161',
 37.5796,126.9770,
 'https://images.unsplash.com/photo-1546874177-9e664107314e?w=600&auto=format&fit=crop',
 'seed'),

('seed-d2-6','korea-2025',
 '🍵 삼청동 三清洞 慢逛',
 '景福宫北侧文艺街区，精品画廊、设计小店、闲逛咖啡厅。气氛悠闲最适合下午漫步',
 'shopping','2026-05-09','16:00',
 '삼청동 三清洞','서울 종로구 삼청동',
 37.5898,126.9816,
 'https://images.unsplash.com/photo-1533050487297-09b450131914?w=600&auto=format&fit=crop',
 'seed'),

('seed-d2-7','korea-2025',
 '🌊 청계천 清溪川 傍晚散步',
 '穿越首尔市中心的人工河，傍晚灯光璀璨非常浪漫，两岸有各种花展装置，适合轻松慢走',
 'attraction','2026-05-09','18:00',
 '청계천 清溪川','서울 중구 청계천로',
 37.5694,126.9913,
 'https://images.unsplash.com/photo-1601997986895-84f86d41d5e5?w=600&auto=format&fit=crop',
 'seed'),

('seed-d2-8','korea-2025',
 '🛒 명동 明洞 购物扫货',
 '首尔最繁华购物街！K-beauty护肤品、街头小吃一条街。夜晚最热闹。必买：COSRX、Laneige、Innisfree',
 'shopping','2026-05-09','19:00',
 '명동 明洞','서울 중구 명동길',
 37.5636,126.9851,
 'https://images.unsplash.com/photo-1543168256-418811576931?w=600&auto=format&fit=crop',
 'seed'),

('seed-d2-9','korea-2025',
 '🍺 을지로 3가 大排档夜宵',
 '首尔最有名户外大排档！복고풍工厂酒馆街，맥주啤酒+삼겹살烤肉，超有气氛。打卡：을지로클럽빌딩',
 'food','2026-05-09','21:00',
 '을지로3가 乙支路3街','서울 중구 을지로3가',
 37.5654,126.9895,
 'https://images.unsplash.com/photo-1512054502232-10a0a035d672?w=600&auto=format&fit=crop',
 'seed'),

('seed-d2-10','korea-2025',
 '🎉 홍대 深夜夜生活',
 '随时可以去홍대体验夜生活——街头表演、夜店、24小时咖啡厅，每天都很精彩',
 'other','2026-05-09','21:30',
 '홍대 弘大夜生活','서울 마포구 어울마당로',
 37.5572,126.9243,NULL,'seed');

-- ═══════════════════════════════════════════════
-- DAY 3 · 10 May 2026 (Sun) — 명동 · N서울타워 · 한남 · 이태원
-- ═══════════════════════════════════════════════
INSERT INTO public.activities
  (id, trip_id, title, description, category, activity_date, start_time, place_name, address, lat, lng, photo_url, created_by)
VALUES
('seed-d3-1','korea-2025',
 '📚 명동 만화거리',
 '明洞漫画街！韩国漫画+动漫周边，喜欢韩漫的必去，买独家版本和周边商品',
 'shopping','2026-05-10','10:00',
 '명동 漫画街','서울 중구 명동',
 37.5636,126.9851,
 'https://images.unsplash.com/photo-1543168256-418811576931?w=600&auto=format&fit=crop',
 'seed'),

('seed-d3-2','korea-2025',
 '🗼 남산서울타워 N首尔塔',
 '首尔地标！360°俯瞰首尔全景，情侣锁🔒，观景台+餐厅。缆车上山或步行。建议傍晚去拍夜景！票₩21,000',
 'attraction','2026-05-10','16:00',
 '남산서울타워 N首尔塔','서울 용산구 남산공원길 105',
 37.5512,126.9882,
 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=600&auto=format&fit=crop',
 'seed'),

('seed-d3-3','korea-2025',
 '🥩 한남동 漢南洞 高端餐饮',
 '首尔最高端生活区，高级餐厅、国际品牌旗舰店、画廊、独立咖啡馆。韩星最爱出没地！午餐在这里',
 'food','2026-05-10','12:00',
 '한남동 漢南洞','서울 용산구 한남동',
 37.5349,126.9988,
 'https://images.unsplash.com/photo-1584541710649-eb36d5c45ed4?w=600&auto=format&fit=crop',
 'seed'),

('seed-d3-4','korea-2025',
 '🌍 이태원 梨泰院 国际风情',
 '首尔最国际化街区！多国料理、独立设计品牌、酒吧林立。Antique Furniture街+Itaewon Village',
 'shopping','2026-05-10','19:00',
 '이태원 梨泰院','서울 용산구 이태원동',
 37.5350,126.9946,
 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop',
 'seed');

-- ═══════════════════════════════════════════════
-- DAY 4 · 11 May 2026 (Mon) — Flexible · 한강공원 · 釜山
-- ═══════════════════════════════════════════════
INSERT INTO public.activities
  (id, trip_id, title, description, category, activity_date, start_time, place_name, address, lat, lng, photo_url, created_by)
VALUES
('seed-d4-1','korea-2025',
 '🌸 한강공원 汉江公园 Flexible',
 '自由活动日！汉江公园野餐、便利店美食（CU/GS25）、踩自行车、看汉江夕阳。下午再出发去釜山',
 'attraction','2026-05-11','10:00',
 '한강공원 汉江公园','서울 마포구 한강공원',
 37.5283,126.9341,
 'https://images.unsplash.com/photo-1547143983-c6f81cbaff39?w=600&auto=format&fit=crop',
 'seed'),

('seed-d4-2','korea-2025',
 '🚄 KTX 首尔→釜山 高铁',
 '서울역乘KTX出发前往釜山，约2.5小时。票价约₩59,800/人。提前在Korail或SRT购票',
 'transport','2026-05-11','14:00',
 '서울역 首尔站','서울 용산구 한강대로 405',
 37.5547,126.9707,
 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=600&auto=format&fit=crop',
 'seed'),

('seed-d4-3','korea-2025',
 '🏠 Check-in 釜山 Airbnb',
 '抵达釜山，入住Airbnb，放行李，换衣服出发探索！',
 'accommodation','2026-05-11','17:30',
 'Airbnb 釜山','부산',
 35.1796,129.0756,NULL,'seed'),

('seed-d4-4','korea-2025',
 '🌊 해운대 海云台海滩',
 '釜山最著名白沙滩！蓝色海水、周边餐厅酒吧，5月天气宜人。必去Blueline Park天空步道',
 'attraction','2026-05-11','19:00',
 '해운대 海云台','부산 해운대구 해운대해수욕장',
 35.1587,129.1604,
 'https://images.unsplash.com/photo-1541336032412-2048a678540d?w=600&auto=format&fit=crop',
 'seed');

-- ═══════════════════════════════════════════════
-- DAY 5 · 12 May 2026 (Tue) — 감천 · 광안리
-- ═══════════════════════════════════════════════
INSERT INTO public.activities
  (id, trip_id, title, description, category, activity_date, start_time, place_name, address, lat, lng, photo_url, created_by)
VALUES
('seed-d5-1','korea-2025',
 '🎨 감천문화마을 甘川文化村',
 '韩国版"马丘比丘"！彩色阶梯小屋爬满山坡，超上镜。推荐早上9点前去避开人潮。票₩2,000',
 'attraction','2026-05-12','09:00',
 '감천문화마을 甘川文化村','부산 사하구 감내2로 203',
 35.0977,129.0099,
 'https://images.unsplash.com/photo-1584437567427-44eadb40fe4c?w=600&auto=format&fit=crop',
 'seed'),

('seed-d5-2','korea-2025',
 '🌉 광안대교 广安里大桥 + 夜景',
 '釜山最美夜景！광안대교大桥灯光秀+海边烧烤炸鸡맥주。建议7pm之后来，夜色超美。',
 'attraction','2026-05-12','19:00',
 '광안리 广安里','부산 수영구 광안해변로',
 35.1534,129.1184,
 'https://images.unsplash.com/photo-1600784621673-e9d8ecfa2d0e?w=600&auto=format&fit=crop',
 'seed');

-- ═══════════════════════════════════════════════
-- DAY 6 · 13 May 2026 (Wed) — 釜山→仁川 Check-in机场酒店
-- ═══════════════════════════════════════════════
INSERT INTO public.activities
  (id, trip_id, title, description, category, activity_date, start_time, place_name, address, lat, lng, photo_url, created_by)
VALUES
('seed-d6-1','korea-2025',
 '🚄 KTX 釜山→首尔/仁川',
 '从부산역乘KTX返回，约2.5小时到首尔，再转机场快线前往仁川机场附近酒店入住',
 'transport','2026-05-13','10:00',
 '부산역 釜山站','부산 동구 중앙대로 206',
 35.1142,129.0414,NULL,'seed'),

('seed-d6-2','korea-2025',
 '🏨 Check-in 仁川机场酒店',
 '入住仁川国际机场附近酒店，方便明早出发。好好休息，整理行李！',
 'accommodation','2026-05-13','16:00',
 '仁川机场酒店 Trip.com','Incheon, South Korea',
 37.4590,126.4408,NULL,'seed');

-- ═══════════════════════════════════════════════
-- DAY 7 · 14 May 2026 (Thu) — 最后一天 血拼扫货
-- ═══════════════════════════════════════════════
INSERT INTO public.activities
  (id, trip_id, title, description, category, activity_date, start_time, place_name, address, lat, lng, photo_url, created_by)
VALUES
('seed-d7-1','korea-2025',
 '🛍️ 最后血拼！인천 차이나타운',
 '仁川中国城+开港场（개항장）历史街区逛逛，吃韩式中华料理짜장면+탕수육。最后机会补货！',
 'shopping','2026-05-14','10:00',
 '인천 차이나타운 仁川中国城','인천 중구 차이나타운로',
 37.4744,126.6175,
 'https://images.unsplash.com/photo-1559628376-f3fe4f1fce61?w=600&auto=format&fit=crop',
 'seed'),

('seed-d7-2','korea-2025',
 '🎒 回酒店整理行李',
 '整理行李确认护照、登机牌。行李不超重20kg！设好明早5:15闹钟，不要睡过头！',
 'accommodation','2026-05-14','20:00',
 '仁川机场酒店','Incheon, South Korea',
 37.4590,126.4408,NULL,'seed');

-- ═══════════════════════════════════════════════
-- DAY 8 · 15 May 2026 (Thu) — 回家！
-- ═══════════════════════════════════════════════
INSERT INTO public.activities
  (id, trip_id, title, description, category, activity_date, start_time, place_name, address, lat, lng, photo_url, created_by)
VALUES
('seed-d8-1','korea-2025',
 '🚕 前往仁川机场 T2',
 '乘出租车或机场接驳巴士前往T2。提前3小时(5:15出发)，充裕时间办check-in和托运行李',
 'transport','2026-05-15','05:15',
 '인천국제공항 T2','Incheon International Airport T2',
 37.4602,126.4407,NULL,'seed'),

('seed-d8-2','korea-2025',
 '✈️ D7 505 ICN → KUL 回家咯！',
 '08:15出发，预计13:45抵达KLIA。PNR: KK3YTR。再见韩国，下次再来！🇰🇷❤️',
 'transport','2026-05-15','08:15',
 'ICN T2 出发大厅','Incheon International Airport',
 37.4602,126.4407,
 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&auto=format&fit=crop',
 'seed');

-- ══════════════════════════════════════════════
-- Done! Run this and go check your 行程 tab 🎉
-- ══════════════════════════════════════════════
