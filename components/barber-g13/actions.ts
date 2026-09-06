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

export type CreateBlockedTimeInput = {
  barberId: string;
  time: string;
  durationMinutes: number;
  reason: string;
  selectedDate: Date;
};

function assertValidPaymentMethod(paymentMethod: PaymentMethod) {
  if (!["Efectivo", "Nequi", "Transferencia", "Tarjeta"].includes(paymentMethod)) {
    throw new Error("Método de pago no válido.");
  }
}

// Postgres error codes we want to translate into friendly, actionable
// messages instead of surfacing raw database text to the user.
const PG_EXCLUSION_VIOLATION = "23P01"; // overlapping appointment/block for the same barber
const PG_UNIQUE_VIOLATION = "23505"; // duplicate phone, etc.
const PG_RAISE_EXCEPTION = "P0001"; // custom trigger-raised errors (see migration wire_blocked_times_agenda)

function isRaisedMessage(error: unknown, marker: string): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === PG_RAISE_EXCEPTION &&
      "message" in error &&
      typeof (error as { message?: string }).message === "string" &&
      (error as { message: string }).message.includes(marker)
  );
}

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

  // Finds the customer by phone or creates them, atomically and without
  // depending on the caller's row-level visibility. A barber can only SELECT
  // customers they've already served (private.can_access_customer), so a
  // direct table lookup here would silently miss an existing customer who
  // has only ever been served by a different barber, and the code would try
  // to insert a duplicate phone number and fail. This RPC runs with elevated
  // privileges (like complete_appointment_with_payment) and does the
  // find-or-create server-side instead.
  const { data: customerId, error: customerError } = await supabase.rpc("book_customer_for_appointment", {
    p_phone: normalizedPhone,
    p_full_name: input.name.trim(),
  });
  if (customerError) throw customerError;
  if (!customerId) throw new Error("No fue posible identificar al cliente.");

  const day = dateKey(input.selectedDate);
  const startsAt = new Date(`${day}T${input.time}:00`);
  if (Number.isNaN(startsAt.getTime())) throw new Error("La fecha u hora de la cita no es válida.");
  const endsAt = new Date(startsAt.getTime() + duration * 60000);

  const { error } = await supabase.from("appointments").insert({
    customer_id: customerId as string,
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
    // A trigger blocks booking into a time the barber has manually blocked
    // (lunch, personal appointment, day off) — see the
    // wire_blocked_times_agenda migration.
    if (isRaisedMessage(error, "APPOINTMENT_CONFLICTS_WITH_BLOCKED_TIME")) {
      throw new Error(
        "Ese horario está bloqueado por el barbero (por ejemplo, almuerzo o ausencia). Elige otro horario."
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

export async function createBlockedTime(authContext: AuthContext, input: CreateBlockedTimeInput) {
  const effectiveBarberId = authContext.role === "barber" ? authContext.barberId : input.barberId;
  const duration = Number(input.durationMinutes);

  if (!effectiveBarberId) throw new Error("Selecciona un barbero.");
  if (!Number.isFinite(duration) || duration <= 0) throw new Error("La duración del bloqueo no es válida.");
  if (!/^\d{2}:\d{2}$/.test(input.time)) throw new Error("La hora no es válida.");

  const day = dateKey(input.selectedDate);
  const startsAt = new Date(`${day}T${input.time}:00`);
  if (Number.isNaN(startsAt.getTime())) throw new Error("La fecha u hora no es válida.");
  const endsAt = new Date(startsAt.getTime() + duration * 60000);

  const { error } = await supabase.from("blocked_times").insert({
    barber_id: effectiveBarberId,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    reason: input.reason.trim() || null,
  });

  if (error) {
    if (error.code === PG_EXCLUSION_VIOLATION) {
      throw new Error("Ese horario ya está bloqueado o se cruza con otro bloqueo de este barbero.");
    }
    if (isRaisedMessage(error, "BLOCKED_TIME_CONFLICTS_WITH_APPOINTMENT")) {
      throw new Error("No puedes bloquear ese horario: ya hay una cita agendada en ese rango.");
    }
    throw error;
  }
}

export async function deleteBlockedTime(id: string) {
  if (!id) throw new Error("Bloqueo no válido.");
  const { error } = await supabase.from("blocked_times").delete().eq("id", id);
  if (error) throw error;
}
