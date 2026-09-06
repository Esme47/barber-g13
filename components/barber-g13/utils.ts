import type { AppointmentStatus, DbAppointmentStatus } from "./types";

export const dbToUiStatus = (s:string):AppointmentStatus => ({pending:"Pendiente",confirmed:"Confirmada",completed:"Finalizada",cancelled:"Cancelada",no_show:"Cancelada"}[s] as AppointmentStatus) || "Pendiente";

export const uiToDbStatus = (s:AppointmentStatus):DbAppointmentStatus => ({"Pendiente":"pending","Confirmada":"confirmed","En proceso":"confirmed","Finalizada":"completed","Cancelada":"cancelled"}[s] as DbAppointmentStatus);

export const dateKey = (d:Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

export const normalizePhone = (value:string) => { const digits = value.replace(/\D/g,""); return /^57\d{10}$/.test(digits) ? digits.slice(2) : digits; };

export const formatRegisteredDate = (value:string) => !value ? "" : new Date(value).toLocaleDateString("es-CO",{day:"2-digit",month:"short",year:"numeric"});

export const formatTransactionDate = (value:string) => { if(!value) return ""; const [y,m,d]=value.split("-").map(Number); return new Date(y,m-1,d).toLocaleDateString("es-CO",{day:"2-digit",month:"short",year:"numeric"}); };
