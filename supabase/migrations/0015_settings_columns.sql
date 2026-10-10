-- 0015: portfolio + inquiry settings columns (Settings page, PRD §7/§25).
-- All additive with defaults so existing profiles are unaffected.

-- PORTFOLIO SETTINGS
alter table profiles add column if not exists portfolio_public boolean default true;
alter table profiles add column if not exists show_prices boolean default true;
alter table profiles add column if not exists default_currency text default 'NGN';
alter table profiles add column if not exists default_availability text default 'AVAILABLE';

-- INQUIRY SETTINGS
alter table profiles add column if not exists inquiries_open boolean default true;
alter table profiles add column if not exists inquiry_auto_reply text;
alter table profiles add column if not exists inquiry_response_time text default '1-2 days';

-- Sellers hide prices when show_prices is off: row-level security for artworks
-- is unchanged; the catalogue simply omits the price fields at read time.