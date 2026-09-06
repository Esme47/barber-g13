import { supabase } from "@/lib/supabase";
import type { AuthContext } from "@/lib/auth";
import type { Appointment, Barber, Client, HistoricalAppointment, Service, Transaction } from "./types";
import { dateKey, dbToUiStatus, formatRegisteredDate } from "./utils";

export async function loadBarberG13Data(authContext: AuthContext, selectedDate: Date): Promise<{ clients: Client[]; services: Service[]; barbers: Barber[]; appointments: Appointment[]; transactions: Transaction[]; historicalAppointments: HistoricalAppointment[] }> {
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
  let transactionsData: any[] = [];
  if (transactionsQuery) { const transactionsRes = await transactionsQuery; if (transactionsRes.error) throw transactionsRes.error; transactionsData = transactionsRes.data || []; }
  return {
    clients: (clientsRes.data || []).map((c: any) => ({ id: c.id, name: c.full_name || "", phone: c.phone || "", email: c.email || "", visits: Number(c.visits || 0), lastService: c.last_service || "Sin servicios registrados", lastVisit: c.last_visit || null, nextAppointment: c.next_appointment || null, registeredAt: formatRegisteredDate(c.created_at), createdAt: c.created_at })),
    services: (servicesRes.data || []).map((s: any) => ({ id: s.id, name: s.name, description: s.description || "", duration: Number(s.duration_minutes), price: Number(s.price), active: Boolean(s.active) })),
    transactions: transactionsData.map((t: any) => ({ id: Number(t.id), concept: t.concept, category: t.category, amount: Number(t.amount), type: t.type, paymentMethod: t.payment_method, time: String(t.transaction_time || "").slice(0, 5), date: String(t.transaction_date || ""), appointmentId: t.appointment_id || null })),
    historicalAppointments: (historicalRes.data || []).map((a: any) => { const customer = Array.isArray(a.customers) ? a.customers[0] : a.customers, service = Array.isArray(a.services) ? a.services[0] : a.services, barber = Array.isArray(a.barbers) ? a.barbers[0] : a.barbers, starts = new Date(a.starts_at); return { id: a.id, date: dateKey(starts), time: starts.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false }), name: customer?.full_name || "Cliente", service: service?.name || "Servicio", serviceId: a.service_id, barber: barber?.name || "Barbero", price: Number(service?.price || 0) }; }),
    barbers: (barbersRes.data || []).map((b: any) => ({ id: b.id, name: b.name, active: b.active })),
    appointments: (appointmentsRes.data || []).map((a: any) => { const starts = new Date(a.starts_at), ends = new Date(a.ends_at), customer = Array.isArray(a.customers) ? a.customers[0] : a.customers, service = Array.isArray(a.services) ? a.services[0] : a.services, barber = Array.isArray(a.barbers) ? a.barbers[0] : a.barbers; return { id: a.id, time: starts.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false }), date: day, name: customer?.full_name || "Cliente", phone: customer?.phone || "", service: service?.name || "Servicio", serviceId: a.service_id, barber: barber?.name || "Barbero", barberId: a.barber_id, customerId: a.customer_id, duration: Math.max(15, Math.round((ends.getTime() - starts.getTime()) / 60000)), status: dbToUiStatus(a.status), notes: a.notes || "" }; }),
  };
}
