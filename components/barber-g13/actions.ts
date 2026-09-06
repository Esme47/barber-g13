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

function assertValidPaymentMethod(paymentMethod: PaymentMethod) {
  if (!["Efectivo", "Nequi", "Transferencia", "Tarjeta"].includes(paymentMethod)) {
    throw new Error("Método de pago no válido.");
  }
}

// Postgres error codes we want to translate into friendly, actionable
// messages instead of surfacing raw database text to the user.
const PG_EXCLUSION_VIOLATION = "23P01"; // overlapping appointment for the same barber
const PG_UNIQUE_VIOLATION = "23505"; // duplicate phone, etc.

export async function createAppointment(authContext: AuthContext, input: CreateAppointmentInput) {
  const effectiveBarberId = authContext.role === "barber" ? authContext.barberId : input.barberId;
  const normalizedPhone = normalizePhone(input.phone);
  const duration = Number(input.serviceDuration);

  if (!input.name.trim() || !normalizedPhone || !input.serviceId || !effectiveBarberId) {
    throw new Error("Completa cliente, teléfono, servicio y barbero.");
  }
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error("La duración del servicio no es válida.");
  }
  if (!/^\d{2}:\d{2}$/.test(input.time)) {
    throw new Error("La hora de la cita no es válida.");
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
  if (Number.isNaN(startsAt.getTime())) throw new Error("La fecha u hora de la cita no es válida.");
  const endsAt = new Date(startsAt.getTime() + duration * 60000);

  const { error } = await supabase.from("appointments").insert({
    customer_id: customerId,
    barber_id: effectiveBarberId,
    service_id: input.serviceId,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    status: "confirmed",
    notes: input.notes.trim() || null,
  });

  if (error) {
    // The database itself is the source of truth for overlap prevention
    // (a GIST exclusion constraint on barber_id + time range). Two people
    // booking the same slot at the same time will race here — this turns
    // that database rejection into a message the user can act on.
    if (error.code === PG_EXCLUSION_VIOLATION) {
      throw new Error(
        "Ese horario ya no está disponible: se cruza con otra cita de este barbero. Elige otra hora o actualiza la agenda."
      );
    }
    throw error;
  }
}

export async function saveClient(input: SaveClientInput) {
  const name = input.name.trim();
  const phone = normalizePhone(input.phone);
  const email = input.email?.trim() || null;

  if (!name || !phone) throw new Error("Nombre y teléfono son obligatorios.");

  const duplicateQuery = supabase.from("customers").select("id").eq("phone", phone);
  const { data: duplicate, error: duplicateError } = input.id
    ? await duplicateQuery.neq("id", input.id).maybeSingle()
    : await duplicateQuery.maybeSingle();
  if (duplicateError) throw duplicateError;
  if (duplicate) throw new Error("Ya existe otro cliente con ese teléfono.");

  if (input.id) {
    const { error } = await supabase
      .from("customers")
      .update({ full_name: name, phone, email })
      .eq("id", input.id);
    if (error) {
      if (error.code === PG_UNIQUE_VIOLATION) throw new Error("Ya existe otro cliente con ese teléfono.");
      throw error;
    }
    return;
  }

  const { error } = await supabase.from("customers").insert({ full_name: name, phone, email });
  if (error) {
    if (error.code === PG_UNIQUE_VIOLATION) throw new Error("Ya existe otro cliente con ese teléfono.");
    throw error;
  }
}

export async function saveService(input: SaveServiceInput) {
  const name = input.name.trim();
  const description = input.description.trim();
  const duration = Number(input.duration);
  const price = Number(input.price);

  if (!name || !Number.isFinite(duration) || duration <= 0 || !Number.isFinite(price) || price < 0) {
    throw new Error("Completa nombre, duración y precio válidos.");
  }

  if (input.id) {
    const { error } = await supabase
      .from("services")
      .update({ name, description, duration_minutes: duration, price })
      .eq("id", input.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("services").insert({
    name,
    description,
    duration_minutes: duration,
    price,
    active: true,
  });
  if (error) throw error;
}

export async function toggleService(id: string, active: boolean) {
  if (!id) throw new Error("Servicio no válido.");
  const { error } = await supabase
    .from("services")
    .update({ active: !active, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function saveTransaction(input: SaveTransactionInput) {
  const amount = Number(input.amount);
  if (!input.concept.trim() || !input.category.trim() || !Number.isFinite(amount) || amount <= 0) {
    throw new Error("Completa concepto, categoría y un monto mayor que cero.");
  }
  if (!input.date || !input.time || !/^\d{2}:\d{2}$/.test(input.time)) {
    throw new Error("Fecha y hora son obligatorias y deben ser válidas.");
  }
  if (!["Ingreso", "Gasto"].includes(input.type)) throw new Error("Tipo de movimiento no válido.");
  assertValidPaymentMethod(input.paymentMethod);

  const { error } = await supabase.from("transactions").insert({
    concept: input.concept.trim(),
    category: input.category.trim(),
    amount,
    type: input.type,
    payment_method: input.paymentMethod,
    transaction_date: input.date,
    transaction_time: input.time,
  });
  if (error) throw error;
}

export async function updateAppointmentStatus(appointmentId: string, status: AppointmentStatus) {
  const dbStatus = uiToDbStatus(status);
  if (!appointmentId || !dbStatus) throw new Error("Estado de cita no válido.");
  if (status === "Finalizada") {
    throw new Error("Las citas finalizadas deben completarse junto con el registro del pago.");
  }

  const { error } = await supabase
    .from("appointments")
    .update({ status: dbStatus })
    .eq("id", appointmentId);
  if (error) throw error;
}

export async function completeAppointmentWithPayment(appointmentId: string, paymentMethod: PaymentMethod) {
  if (!appointmentId) throw new Error("Cita no válida.");
  assertValidPaymentMethod(paymentMethod);
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
  if (!appointmentId || !Number.isFinite(amount) || amount <= 0) {
    throw new Error("Ingresa un monto válido.");
  }
  assertValidPaymentMethod(paymentMethod);
  const { error } = await supabase.rpc("link_historical_income_to_appointment", {
    p_appointment_id: appointmentId,
    p_amount: amount,
    p_payment_method: paymentMethod,
  });
  if (error) throw error;
}
