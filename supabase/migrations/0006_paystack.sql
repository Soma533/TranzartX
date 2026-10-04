-- 0006: multi-provider payments (Paystack). Existing rows stay FLUTTERWAVE.
alter table transactions add column if not exists provider text not null default 'FLUTTERWAVE';
alter table transactions add column if not exists gateway_ref text;
update transactions set gateway_ref = flutterwave_tx_ref where gateway_ref is null;
drop index if exists transactions_gateway_ref_key;
create unique index transactions_gateway_ref_key on transactions (gateway_ref);
