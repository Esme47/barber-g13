import { supabase } from "@/lib/supabase";
import type { AuthContext } from "@/lib/auth";
import type { Appointment, Barber, Client, HistoricalAppointment, Service, Transaction } from "./types";
import { dateKey, dbToUiStatus, formatRegisteredDate } from "./utils";

type CustomerProfileRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  visits: number | null;
  last_service: string | null;
  last_visit: string | null;
  next_appointment: string | null;
};

type ServiceRow = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  active: boolean;
};

type BarberRow = {
  id: string;
  name: string;
  active: boolean;
};

type TransactionRow = {
  id: number;
  concept: string;
  category: string;
  amount: number;
  type: Transaction["type"];
  payment_method: Transaction["paymentMethod"];
  transaction_time: string | null;
  transaction_date: string | null;
  appointment_id: string | null;
};

type CustomerReference = { full_name: string | null; phone?: string | null } | Array<{ full_name: string | null; phone?: string | null }> | null;
type ServiceReference = { name: string | null; price?: number | null; duration_minutes?: number | null } | Array<{ name: string | null; price?: number | null; duration_minutes?: number | null }> | null;
type BarberReference = { name: string | null } | Array<{ name: string | null }> | null;

type HistoricalAppointmentRow = {
  id: string;
  starts_at: string;
  customer_id: string;
  service_id: string;
  barber_id: string;
  customers: CustomerReference;
  services: ServiceReference;
  barbers: BarberReference;
};

type AppointmentRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  notes: string | null;
  customer_id: string;
  barber_id: string;
  service_id: string;
  customers: CustomerReference;
  services: ServiceReference;
  barbers: BarberReference;
};

const firstReference = <T,>(value: T | T[] | null): T | null => Array.isArray(value) ? value[0] ?? null : value;

export async function loadBarberG13Data(
  authContext: AuthContext,
  selectedDate: Date,
): Promise<{
  clients: Client[];
  services: Service[];
  barbers: Barber[];
  appointments: Appointment[];
  transactions: Transaction[];
  historicalAppointments: HistoricalAppointment[];
}> {
  const isAdmin = authContext.role === "admin";
  const dayStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0, 0);
  const nextDayStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + 1, 0, 0, 0, 0);
  const day = dateKey(selectedDate);
  const clientsQuery = supabase.from("customer_profiles").select("id,full_name,phone,email,created_at,visits,last_service,last_visit,next_appointment").order("created_at", { ascending: false });
  const historicalQuery = isAdmin ? supabase.from("appointments").select(`id, starts_at, status, customer_id, service_id, barber_id, customers(full_name), services(name,price), barbers(name)`).eq("status", "completed").order("starts_at", { ascending: false }) : null;
  const servicesQuery = supabase.from("services").select("*").order("created_at", { ascending: true });
  const barbersQuery = supabase.from("barbers").select("*").eq("active", true).order("name");
  const appointmentsQuery = supabase.from("appointments").select(`id, starts_at, ends_at, status, notes, customer_id, barber_id, service_id, customers(full_name,phone), services(name,duration_minutes), barbers(name)`).gte("starts_at", dayStart.toISOString()).lt("starts_at", nextDayStart.toISOString()).order("starts_at", { ascending: true });
  const transactionsQuery = isAdmin ? supabase.from("transactions").select("*").order("transaction_date", { ascending: false }).order("transaction_time", { ascending: false }).order("id", { ascending: false }) : null;
  const [clientsRes, historicalRes, servicesRes, barbersRes, appointmentsRes] = await Promise.all([clientsQuery, historicalQuery || Promise.resolve({ data: [], error: null }), servicesQuery, barbersQuery, appointmentsQuery]);
  if (clientsRes.error) throw clientsRes.error;
  if (historicalRes.error) throw historicalRes.error;
  if (servicesRes.error) throw servicesRes.error;
  if (barbersRes.error) throw barbersRes.error;
  if (appointmentsRes.error) throw appointmentsRes.error;

  let transactionsData: TransactionRow[] = [];
  if (transactionsQuery) {
    const transactionsRes = await transactionsQuery;
    if (transactionsRes.error) throw transactionsRes.error;
    transactionsData = (transactionsRes.data || []) as TransactionRow[];
  }

  const clients = (clientsRes.data || []).map((c) => {
    const row = c as unknown as CustomerProfileRow;
    return { id: row.id, name: row.full_name || "", phone: row.phone || "", email: row.email || "", visits: Number(row.visits || 0), lastService: row.last_service || "Sin servicios registrados", lastVisit: row.last_visit || null, nextAppointment: row.next_appointment || null, registeredAt: formatRegisteredDate(row.created_at), createdAt: row.created_at };
  });

  const services = (servicesRes.data || []).map((s) => {
    const row = s as unknown as ServiceRow;
    return { id: row.id, name: row.name, description: row.description || "", duration: Number(row.duration_minutes), price: Number(row.price), active: Boolean(row.active) };
  });

  const transactions = transactionsData.map((t) => ({ id: Number(t.id), concept: t.concept, category: t.category, amount: Number(t.amount), type: t.type, paymentMethod: t.payment_method, time: String(t.transaction_time || "").slice(0, 5), date: String(t.transaction_date || ""), appointmentId: t.appointment_id || null }));

  const historicalAppointments = (historicalRes.data || []).map((value) => {
    const a = value as unknown as HistoricalAppointmentRow;
    const customer = firstReference(a.customers);
    const service = firstReference(a.services);
    const barber = firstReference(a.barbers);
    const starts = new Date(a.starts_at);
    return { id: a.id, date: dateKey(starts), time: starts.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false }), name: customer?.full_name || "Cliente", service: service?.name || "Servicio", serviceId: a.service_id, barber: barber?.name || "Barbero", price: Number(service?.price || 0) };
  });

  const barbers = (barbersRes.data || []).map((b) => {
    const row = b as unknown as BarberRow;
    return { id: row.id, name: row.name, active: row.active };
  });

  const appointments = (appointmentsRes.data || []).map((value) => {
    const a = value as unknown as AppointmentRow;
    const starts = new Date(a.starts_at);
    const ends = new Date(a.ends_at);
    const customer = firstReference(a.customers);
    const service = firstReference(a.services);
    const barber = firstReference(a.barbers);
    return { id: a.id, time: starts.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false }), date: day, name: customer?.full_name || "Cliente", phone: customer?.phone || "", service: service?.name || "Servicio", serviceId: a.service_id, barber: barber?.name || "Barbero", barberId: a.barber_id, customerId: a.customer_id, duration: Math.max(15, Math.round((ends.getTime() - starts.getTime()) / 60000)), status: dbToUiStatus(a.status), notes: a.notes || "" };
  });

  return { clients, services, barbers, appointments, transactions, historicalAppointments };
}
