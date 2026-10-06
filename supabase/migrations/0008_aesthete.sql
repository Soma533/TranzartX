-- 0008: add AESTHETE role (art lovers). Run this statement ALONE — Postgres
-- forbids ADD VALUE inside a multi-statement transaction.
alter type user_role add value if not exists 'AESTHETE';
