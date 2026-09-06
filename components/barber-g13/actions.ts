import { supabase } from "@/lib/supabase";
import type { AuthContext } from "@/lib/auth";
import type { AppointmentStatus, PaymentMethod, TransactionType } from "./types";
import { dateKey, normalizePhone, uiToDbStatus } from "./utils";

export type CreateAppointmentInput = {
  name: string;
  phone: string;
  serviceId: string;
  barberId: string;
  time: string;
  notes: string;
  selectedDate: Date;
  serviceDuration: number;
};

export type SaveClientInput = {
  id?: string;
  name: string;
  phone: string;
  email?: string | null;
};

export type SaveServiceInput = {
  id?: string;
  name: string;
  description: string;
  duration: number;
  price: number;
};

export type SaveTransactionInput = {
  concept: string;
  category: string;
  amount: number;
  type: TransactionType;
  paymentMethod: PaymentMethod;
  date: string;
  time: string;
};

export async function createAppointment(authContext: AuthContext, input: CreateAppointmentInput) {
  const effectiveBarberId = authContext.role === "barber" ? authContext.barberId : input.barberId;
  const normalizedPhone = normalizePhone(input.phone);

  if (!input.name.trim() || !normalizedPhone || !input.serviceId || !effectiveBarberId) {
    throw new Error("Completa cliente, teléfono, servicio y barbero.");
  }

  const { data: existing, error: findError } = await supabase
    .from("customers")
    .select("id")
    .eq("phone", normalizedPhone)
    .maybeSingle();

  if (findError) throw findError;

  let customerId: string;
  if (existing) {
    customerId = existing.id;
    const { error } = await supabase
      .from("customers")
      .update({ full_name: input.name.trim() })
      .eq("id", customerId);
    if (error) throw error;
  } else {
    const { data: newCustomer, error } = await supabase
      .from("customers")
      .insert({ full_name: input.name.trim(), phone: normalizedPhone })
      .select("id")
      .single();
    if (error) throw error;
    customerId = newCustomer.id;
  }

  const day = dateKey(input.selectedDate);
  const startsAt = new Date(`${day}T${input.time}:00`);
  const endsAt = new Date(startsAt.getTime() + input.serviceDuration * 60000);

  const { error } = await supabase.from("appointments").insert({
    customer_id: customerId,
    barber_id: effectiveBarberId,
    service_id: input.serviceId,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    status: "confirmed",
    notes: input.notes.trim() || null,
  });

  if (error) throw error;
}

export async function saveClient(input: SaveClientInput) {
  const name = input.name.trim();
  const phone = normalizePhone(input.phone);
  const email = input.email?.trim() || null;

  if (!name || !phone) throw new Error("Nombre y teléfono son obligatorios.");

  if (input.id) {
    const { data: duplicate, error: duplicateError } = await supabase
      .from("customers")
      .select("id")
      .eq("phone", phone)
      .neq("id", input.id)
      .maybeSingle();
    if (duplicateError) throw duplicateError;
    if (duplicate) throw new Error("Ya existe otro cliente con ese teléfono.");

    const { error } = await supabase
      .from("customers")
      .update({ full_name: name, phone, email })
      .eq("id", input.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("customers").insert({ full_name: name, phone, email });
  if (error) throw error;
}

export async function saveService(input: SaveServiceInput) {
  const name = input.name.trim();
  const description = input.description.trim();

  if (!name || !input.duration || input.price < 0) {
    throw new Error("Completa nombre, duración y precio.");
  }

  if (input.id) {
    const { error } = await supabase
      .from("services")
      .update({ name, description, duration_minutes: input.duration, price: input.price })
      .eq("id", input.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("services").insert({
    name,
    description,
    duration_minutes: input.duration,
    price: input.price,
    active: true,
  });
  if (error) throw error;
}

export async function toggleService(id: string, active: boolean) {
  const { error } = await supabase.from("services").update({ active: !active }).eq("id", id);
  if (error) throw error;
}

export async function saveTransaction(input: SaveTransactionInput) {
  if (!input.concept.trim() || !input.category.trim() || !input.amount || input.amount < 0) {
    throw new Error("Completa concepto, categoría y monto.");
  }

  const { error } = await supabase.from("transactions").insert({
    concept: input.concept.trim(),
    category: input.category.trim(),
    amount: input.amount,
    type: input.type,
    payment_method: input.paymentMethod,
    transaction_date: input.date,
    transaction_time: input.time,
  });
  if (error) throw error;
}

export async function updateAppointmentStatus(appointmentId: string, status: AppointmentStatus) {
  const dbStatus = uiToDbStatus(status);
  if (!dbStatus) throw new Error("Estado de cita no válido.");

  const { error } = await supabase
    .from("appointments")
    .update({ status: dbStatus })
    .eq("id", appointmentId);
  if (error) throw error;
}

export async function completeAppointmentWithPayment(appointmentId: string, paymentMethod: PaymentMethod) {
  const { error } = await supabase.rpc("complete_appointment_with_payment", {
    p_appointment_id: appointmentId,
    p_payment_method: paymentMethod,
  });
  if (error) throw error;
}

export async function linkHistoricalIncomeToAppointment(
  appointmentId: string,
  amount: number,
  paymentMethod: PaymentMethod,
) {
  if (!amount || amount <= 0) throw new Error("Ingresa un monto válido.");

  const { error } = await supabase.rpc("link_historical_income_to_appointment", {
    p_appointment_id: appointmentId,
    p_amount: amount,
    p_payment_method: paymentMethod,
  });
  if (error) throw error;
}
