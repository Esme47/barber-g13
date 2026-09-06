-- Phase 2E.11: fix historical income regularization row locking
-- The previous implementation attempted FOR UPDATE on a query with nullable-side joins.
-- Lock the appointment row first, then read related service/customer data.

create or replace function public.link_historical_income_to_appointment(p_appointment_id uuid, p_amount numeric, p_payment_method text)
returns table(appointment_id uuid, transaction_id bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_appointment public.appointments%rowtype;
  v_service_name text;
  v_customer_name text;
  v_transaction_id bigint;
begin
  if not (select private.is_admin()) then
    raise exception 'Only an administrator can regularize historical income';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be greater than zero';
  end if;

  if p_payment_method not in ('Efectivo', 'Nequi', 'Transferencia', 'Tarjeta') then
    raise exception 'Invalid payment method';
  end if;

  select *
  into v_appointment
  from public.appointments
  where id = p_appointment_id
    and status = 'completed'
  for update;

  if not found then
    raise exception 'Appointment does not exist or is not completed';
  end if;

  if exists (
    select 1
    from public.transactions t
    where t.appointment_id = p_appointment_id
      and t.type = 'Ingreso'
  ) then
    raise exception 'This appointment already has a linked income';
  end if;

  select s.name
  into v_service_name
  from public.services s
  where s.id = v_appointment.service_id;

  select c.full_name
  into v_customer_name
  from public.customers c
  where c.id = v_appointment.customer_id;

  insert into public.transactions (
    concept,
    category,
    amount,
    type,
    payment_method,
    transaction_date,
    transaction_time,
    appointment_id
  )
  values (
    'Servicio: ' || coalesce(v_service_name, 'Servicio') || ' - ' || coalesce(v_customer_name, 'Cliente'),
    'Servicio',
    p_amount,
    'Ingreso',
    p_payment_method,
    current_date,
    current_time,
    p_appointment_id
  )
  returning id into v_transaction_id;

  return query
  select p_appointment_id, v_transaction_id;
end;
$$;

revoke all on function public.link_historical_income_to_appointment(uuid,numeric,text) from public;
revoke all on function public.link_historical_income_to_appointment(uuid,numeric,text) from anon;
grant execute on function public.link_historical_income_to_appointment(uuid,numeric,text) to authenticated;
