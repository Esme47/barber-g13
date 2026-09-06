-- BARBER G13 · Fase 2D.1
-- Normalización canónica de teléfonos de clientes.
-- La identidad sigue viviendo exclusivamente en public.customers.

create or replace function private.normalize_colombian_phone(raw_phone text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when digits ~ '^57[0-9]{10}$' then substr(digits, 3)
    else digits
  end
  from (
    select regexp_replace(coalesce(raw_phone, ''), '[^0-9]', '', 'g') as digits
  ) normalized;
$$;

create or replace function private.normalize_customer_phone_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.phone := private.normalize_colombian_phone(new.phone);
  return new;
end;
$$;

drop trigger if exists customers_normalize_phone on public.customers;
create trigger customers_normalize_phone
before insert or update of phone on public.customers
for each row
execute function private.normalize_customer_phone_before_write();

update public.customers
set phone = private.normalize_colombian_phone(phone)
where phone <> private.normalize_colombian_phone(phone);
