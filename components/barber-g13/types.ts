export type AppointmentStatus = "Confirmada" | "Pendiente" | "En proceso" | "Finalizada" | "Cancelada";
export type DbAppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
export type PaymentMethod = "Efectivo" | "Nequi" | "Transferencia" | "Tarjeta";
export type TransactionType = "Ingreso" | "Gasto";
// Fase 7 (CRM de clientes): completedVisits cuenta solo citas ya finalizadas
// (a diferencia de "visits", que incluye pendientes/confirmadas a futuro);
// totalSpent es la suma de ingresos vinculados a las citas de este cliente —
// siempre 0 para un barbero, ya que Finanzas es solo de admin (RLS).
export type Client = { id:string; name:string; phone:string; email?:string; visits:number; completedVisits:number; totalSpent:number; lastService:string; lastVisit?:string|null; nextAppointment?:string|null; registeredAt:string; createdAt:string; };
export type Service = { id:string; name:string; description:string; duration:number; price:number; active:boolean; };
export type Transaction = { id:number; concept:string; category:string; amount:number; type:TransactionType; paymentMethod:PaymentMethod; time:string; date:string; appointmentId?:string|null; };
export type HistoricalAppointment = { id:string; date:string; time:string; name:string; service:string; serviceId:string; barber:string; price:number; };
export type Barber = { id:string; name:string; active:boolean; };
export type Appointment = { id:string; time:string; date:string; name:string; phone:string; service:string; serviceId:string; barber:string; barberId:string; customerId:string; duration:number; status:AppointmentStatus; notes?:string; };
// weekday follows JS Date.getDay(): 0 = Sunday ... 6 = Saturday, matching the
// public.business_hours check constraint (weekday between 0 and 6).
export type BusinessHours = { weekday:number; opensAt:string; closesAt:string; active:boolean; };
// Agenda 2.0: manual time block (lunch, personal appointment, day off) for a
// barber. Mirrors Appointment's time/duration shape so it can reuse the same
// hour-bucket logic in the agenda timeline.
export type BlockedTime = { id:string; barberId:string; barber:string; time:string; date:string; duration:number; reason:string; };
// Fase 7 (CRM de clientes): historial completo de citas de un cliente
// (cualquier estado, no solo las finalizadas), usado en el perfil detallado.
export type ClientAppointmentHistoryEntry = { id:string; date:string; time:string; service:string; barber:string; price:number; status:AppointmentStatus; };
