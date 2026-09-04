"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

/* ==========================================================================
   BARBER G13 — FASE 1
   Persistencia real con Supabase. Sustituye completamente app/page.tsx
   Requiere:
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   ========================================================================== */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type AppointmentStatus = "Confirmada" | "Pendiente" | "En proceso" | "Finalizada" | "Cancelada";
type DbAppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
type PaymentMethod = "Efectivo" | "Nequi" | "Transferencia" | "Tarjeta";
type TransactionType = "Ingreso" | "Gasto";

type Client = { id:number; name:string; phone:string; email?:string; visits:number; lastService:string; registeredAt:string; };
type Service = { id:string; name:string; description:string; duration:number; price:number; active:boolean; };
type Transaction = { id:number; concept:string; category:string; amount:number; type:TransactionType; paymentMethod:PaymentMethod; time:string; date:string; };
type Barber = { id:string; name:string; active:boolean; };
type Appointment = {
  id:string; time:string; date:string; name:string; phone:string; service:string;
  serviceId:string; barber:string; barberId:string; customerId:string;
  duration:number; status:AppointmentStatus; notes?:string;
};

const Icon = {
  Grid: () => <span>▦</span>, Calendar: () => <span>◫</span>, Users: () => <span>♙</span>,
  Scissors: () => <span>✂</span>, Wallet: () => <span>◈</span>, Settings: () => <span>⚙</span>,
  Menu: () => <span>☰</span>, Plus: () => <span>＋</span>, ArrowLeft: () => <span>‹</span>,
  ArrowRight: () => <span>›</span>, Close: () => <span>×</span>, Phone: () => <span>☎</span>,
  Search: () => <span>⌕</span>, Edit: () => <span>✎</span>, Trash: () => <span>⌫</span>,
};

const hours = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00"];

const dbToUiStatus = (s:string):AppointmentStatus => ({
  pending:"Pendiente", confirmed:"Confirmada", completed:"Finalizada",
  cancelled:"Cancelada", no_show:"Cancelada"
}[s] as AppointmentStatus) || "Pendiente";

const uiToDbStatus = (s:AppointmentStatus):DbAppointmentStatus => ({
  "Pendiente":"pending", "Confirmada":"confirmed", "En proceso":"confirmed",
  "Finalizada":"completed", "Cancelada":"cancelled"
}[s]);

const dateKey = (d:Date) => {
  const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,"0"), day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
};
const formatRegisteredDate=(value:string)=>{
  if(!value) return "";
  const d=new Date(value);
  return d.toLocaleDateString("es-CO",{day:"2-digit",month:"short",year:"numeric"});
};

export default function Home() {
  const [menuOpen,setMenuOpen]=useState(false);
  const [active,setActive]=useState("Dashboard");
  const [appointments,setAppointments]=useState<Appointment[]>([]);
  const [clients,setClients]=useState<Client[]>([]);
  const [services,setServices]=useState<Service[]>([]);
  const [transactions,setTransactions]=useState<Transaction[]>([]);
  const [barbers,setBarbers]=useState<Barber[]>([]);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState<string>("");
  const [showAppointmentModal,setShowAppointmentModal]=useState(false);
  const [showClientModal,setShowClientModal]=useState(false);
  const [showServiceModal,setShowServiceModal]=useState(false);
  const [showTransactionModal,setShowTransactionModal]=useState(false);
  const [editingService,setEditingService]=useState<Service|null>(null);
  const [clientSearch,setClientSearch]=useState("");
  const [serviceSearch,setServiceSearch]=useState("");
  const [transactionSearch,setTransactionSearch]=useState("");
  const [transactionFilter,setTransactionFilter]=useState<"Todos"|TransactionType>("Todos");
  const [selectedDate,setSelectedDate]=useState(new Date());

  const [appointmentForm,setAppointmentForm]=useState({name:"",phone:"",serviceId:"",barberId:"",time:"09:00",notes:""});
  const [clientForm,setClientForm]=useState({name:"",phone:"",email:""});
  const [serviceForm,setServiceForm]=useState({name:"",description:"",duration:"30",price:""});
  const [transactionForm,setTransactionForm]=useState<{concept:string;category:string;amount:string;type:TransactionType;paymentMethod:PaymentMethod}>({concept:"",category:"Servicio",amount:"",type:"Ingreso",paymentMethod:"Efectivo"});

  const menu=[{name:"Dashboard",icon:<Icon.Grid/>},{name:"Agenda",icon:<Icon.Calendar/>},{name:"Clientes",icon:<Icon.Users/>},{name:"Servicios",icon:<Icon.Scissors/>},{name:"Finanzas",icon:<Icon.Wallet/>}];
  const formatCurrency=(value:number)=>new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(value);
  const formatDate=(date:Date)=>date.toLocaleDateString("es-CO",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  const getInitials=(name:string)=>name.split(" ").filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase();

  const loadData = useCallback(async ()=>{
    setLoading(true); setError("");
    try {
      const day=dateKey(selectedDate);
      const start=`${day}T00:00:00`;
      const end=`${day}T23:59:59.999`;
      const [clientsRes,servicesRes,transactionsRes,barbersRes,appointmentsRes] = await Promise.all([
        supabase.from("clients").select("*").order("created_at",{ascending:false}),
        supabase.from("services").select("*").order("created_at",{ascending:true}),
        supabase.from("transactions").select("*").order("created_at",{ascending:false}),
        supabase.from("barbers").select("*").eq("active",true).order("name"),
        supabase.from("appointments").select(`
          id, starts_at, ends_at, status, notes, customer_id, barber_id, service_id,
          customers(full_name,phone), services(name,duration_minutes), barbers(name)
        `).gte("starts_at",start).lte("starts_at",end).order("starts_at",{ascending:true})
      ]);
      const errors=[clientsRes.error,servicesRes.error,transactionsRes.error,barbersRes.error,appointmentsRes.error].filter(Boolean);
      if(errors.length) throw errors[0];

      setClients((clientsRes.data||[]).map((c:any)=>({
        id:Number(c.id), name:c.name, phone:c.phone, email:c.email||"",
        visits:Number(c.visits||0), lastService:c.last_service||"Sin servicios registrados",
        registeredAt:formatRegisteredDate(c.registered_at)
      })));
      setServices((servicesRes.data||[]).map((s:any)=>({
        id:s.id, name:s.name, description:s.description||"", duration:Number(s.duration_minutes),
        price:Number(s.price), active:Boolean(s.active)
      })));
      setTransactions((transactionsRes.data||[]).map((t:any)=>({
        id:Number(t.id), concept:t.concept, category:t.category, amount:Number(t.amount),
        type:t.type, paymentMethod:t.payment_method,
        time:String(t.transaction_time||"").slice(0,5),
        date:t.transaction_date===day?"Hoy":String(t.transaction_date)
      })));
      setBarbers((barbersRes.data||[]).map((b:any)=>({id:b.id,name:b.name,active:b.active})));
      setAppointments((appointmentsRes.data||[]).map((a:any)=>{
        const starts=new Date(a.starts_at), ends=new Date(a.ends_at);
        const duration=Math.max(15,Math.round((ends.getTime()-starts.getTime())/60000));
        const customer=Array.isArray(a.customers)?a.customers[0]:a.customers;
        const service=Array.isArray(a.services)?a.services[0]:a.services;
        const barber=Array.isArray(a.barbers)?a.barbers[0]:a.barbers;
        return {
          id:a.id, time:starts.toLocaleTimeString("es-CO",{hour:"2-digit",minute:"2-digit",hour12:false}),
          date:day, name:customer?.full_name||"Cliente", phone:customer?.phone||"",
          service:service?.name||"Servicio", serviceId:a.service_id,
          barber:barber?.name||"Barbero", barberId:a.barber_id, customerId:a.customer_id,
          duration, status:dbToUiStatus(a.status), notes:a.notes||""
        };
      }));
    } catch(err:any) {
      console.error("Error cargando Supabase:",err);
      setError(err?.message || "No fue posible cargar los datos desde Supabase.");
    } finally { setLoading(false); }
  },[selectedDate]);

  useEffect(()=>{ loadData(); },[loadData]);

  const financialSummary=useMemo(()=>{
    const sales=transactions.filter(t=>t.type==="Ingreso").reduce((a,t)=>a+t.amount,0);
    const expenses=transactions.filter(t=>t.type==="Gasto").reduce((a,t)=>a+t.amount,0);
    return {sales,expenses,profit:sales-expenses,servicesCompleted:transactions.filter(t=>t.type==="Ingreso").length};
  },[transactions]);

  const paymentSummary=useMemo(()=>{
    const methods:PaymentMethod[]=["Efectivo","Nequi","Transferencia","Tarjeta"];
    return methods.map(method=>({method,amount:transactions.filter(t=>t.type==="Ingreso"&&t.paymentMethod===method).reduce((a,t)=>a+t.amount,0)}));
  },[transactions]);

  const filteredClients=useMemo(()=>clients.filter(c=>c.name.toLowerCase().includes(clientSearch.toLowerCase())||c.phone.includes(clientSearch)),[clients,clientSearch]);
  const filteredServices=useMemo(()=>services.filter(s=>s.name.toLowerCase().includes(serviceSearch.toLowerCase())),[services,serviceSearch]);
  const filteredTransactions=useMemo(()=>transactions.filter(t=>{
    const matchType=transactionFilter==="Todos"||t.type===transactionFilter;
    const q=transactionSearch.toLowerCase();
    return matchType&&(t.concept.toLowerCase().includes(q)||t.category.toLowerCase().includes(q)||t.paymentMethod.toLowerCase().includes(q));
  }),[transactions,transactionSearch,transactionFilter]);

  const changeDay=(days:number)=>{const d=new Date(selectedDate);d.setDate(d.getDate()+days);setSelectedDate(d);};
  const getAppointmentsByHour=(hour:string)=>appointments.filter(a=>a.time.slice(0,2)===hour.slice(0,2));

  const openAppointmentModal=(time?:string,client?:Client)=>{
    const firstService=services.find(s=>s.active);
    const firstBarber=barbers[0];
    setAppointmentForm({
      name:client?.name||"", phone:client?.phone||"", serviceId:firstService?.id||"",
      barberId:firstBarber?.id||"", time:time||"09:00", notes:""
    });
    setShowAppointmentModal(true);
  };

  const handleCreateAppointment=async(e:React.FormEvent)=>{
    e.preventDefault();
    if(!appointmentForm.name.trim()||!appointmentForm.phone.trim()||!appointmentForm.serviceId||!appointmentForm.barberId) {
      alert("Completa cliente, teléfono, servicio y barbero."); return;
    }
    setSaving(true); setError("");
    try {
      // customers es la tabla relacional oficial de appointments
      let customerId:string;
      const {data:existing,error:findError}=await supabase.from("customers").select("id").eq("phone",appointmentForm.phone.trim()).maybeSingle();
      if(findError) throw findError;
      if(existing) {
        customerId=existing.id;
        const {error:updateCustomerError}=await supabase.from("customers").update({full_name:appointmentForm.name.trim()}).eq("id",customerId);
        if(updateCustomerError) throw updateCustomerError;
      } else {
        const {data:newCustomer,error:newCustomerError}=await supabase.from("customers")
          .insert({full_name:appointmentForm.name.trim(),phone:appointmentForm.phone.trim()}).select("id").single();
        if(newCustomerError) throw newCustomerError;
        customerId=newCustomer.id;
      }

      // Sincroniza también el módulo clients, sin duplicar por teléfono
      const {data:panelClient,error:panelFindError}=await supabase.from("clients").select("id").eq("phone",appointmentForm.phone.trim()).maybeSingle();
      if(panelFindError) throw panelFindError;
      if(panelClient) {
        await supabase.from("clients").update({visits:(clients.find(c=>c.phone===appointmentForm.phone.trim())?.visits||0)+1,last_service:services.find(s=>s.id===appointmentForm.serviceId)?.name||""}).eq("id",panelClient.id);
      } else {
        await supabase.from("clients").insert({name:appointmentForm.name.trim(),phone:appointmentForm.phone.trim(),visits:1,last_service:services.find(s=>s.id===appointmentForm.serviceId)?.name||"Sin servicios registrados"});
      }

      const service=services.find(s=>s.id===appointmentForm.serviceId)!;
      const day=dateKey(selectedDate);
      const startsAt=new Date(`${day}T${appointmentForm.time}:00`);
      const endsAt=new Date(startsAt.getTime()+service.duration*60000);
      const {error:appointmentError}=await supabase.from("appointments").insert({
        customer_id:customerId, barber_id:appointmentForm.barberId, service_id:appointmentForm.serviceId,
        starts_at:startsAt.toISOString(), ends_at:endsAt.toISOString(),
        status:"confirmed", notes:appointmentForm.notes.trim()||null
      });
      if(appointmentError) throw appointmentError;
      setShowAppointmentModal(false);
      await loadData();
    } catch(err:any) { console.error(err); setError(err?.message||"No fue posible guardar la cita."); alert("Error guardando la cita: "+(err?.message||"Error desconocido")); }
    finally { setSaving(false); }
  };

  const handleCreateClient=async(e:React.FormEvent)=>{
    e.preventDefault();
    if(!clientForm.name.trim()||!clientForm.phone.trim()) return alert("Nombre y teléfono son obligatorios.");
    setSaving(true);
    try {
      const {error}=await supabase.from("clients").insert({name:clientForm.name.trim(),phone:clientForm.phone.trim(),email:clientForm.email.trim()||null,visits:0,last_service:"Sin servicios registrados"});
      if(error) throw error;
      setClientForm({name:"",phone:"",email:""}); setShowClientModal(false); await loadData();
    } catch(err:any){ alert("Error guardando cliente: "+err.message); } finally {setSaving(false);}
  };

  const handleSaveService=async(e:React.FormEvent)=>{
    e.preventDefault();
    if(!serviceForm.name.trim()||!serviceForm.price)return alert("Completa nombre y precio.");
    setSaving(true);
    try {
      const payload={name:serviceForm.name.trim(),description:serviceForm.description.trim(),duration_minutes:Number(serviceForm.duration),price:Number(serviceForm.price),updated_at:new Date().toISOString()};
      const result=editingService
        ? await supabase.from("services").update(payload).eq("id",editingService.id)
        : await supabase.from("services").insert({...payload,active:true});
      if(result.error) throw result.error;
      setShowServiceModal(false);setEditingService(null);setServiceForm({name:"",description:"",duration:"30",price:""});await loadData();
    } catch(err:any){alert("Error guardando servicio: "+err.message);} finally{setSaving(false);}
  };

  const handleCreateTransaction=async(e:React.FormEvent)=>{
    e.preventDefault();
    if(!transactionForm.concept.trim()||!transactionForm.amount)return alert("Completa concepto y valor.");
    setSaving(true);
    try {
      const {error}=await supabase.from("transactions").insert({
        concept:transactionForm.concept.trim(),category:transactionForm.category.trim(),
        amount:Number(transactionForm.amount),type:transactionForm.type,payment_method:transactionForm.paymentMethod,
        transaction_date:dateKey(new Date())
      });
      if(error) throw error;
      setTransactionForm({concept:"",category:"Servicio",amount:"",type:"Ingreso",paymentMethod:"Efectivo"});setShowTransactionModal(false);await loadData();
    } catch(err:any){alert("Error guardando movimiento: "+err.message);} finally{setSaving(false);}
  };

  const updateStatus=async(id:string,status:AppointmentStatus)=>{
    const {error}=await supabase.from("appointments").update({status:uiToDbStatus(status)}).eq("id",id);
    if(error){alert("No fue posible actualizar el estado: "+error.message);return;}
    setAppointments(c=>c.map(a=>a.id===id?{...a,status}:a));
  };
  const toggleService=async(id:string)=>{
    const current=services.find(s=>s.id===id); if(!current)return;
    const {error}=await supabase.from("services").update({active:!current.active,updated_at:new Date().toISOString()}).eq("id",id);
    if(error){alert(error.message);return;} setServices(c=>c.map(s=>s.id===id?{...s,active:!s.active}:s));
  };
  const deleteService=async(id:string)=>{
    if(!window.confirm("¿Deseas eliminar este servicio?"))return;
    const {error}=await supabase.from("services").delete().eq("id",id);
    if(error){alert("No se puede eliminar: "+error.message);return;} await loadData();
  };
  const deleteTransaction=async(id:number)=>{
    if(!window.confirm("¿Eliminar este movimiento financiero?"))return;
    const {error}=await supabase.from("transactions").delete().eq("id",id);
    if(error){alert(error.message);return;} await loadData();
  };
  const openEditService=(s:Service)=>{setEditingService(s);setServiceForm({name:s.name,description:s.description,duration:String(s.duration),price:String(s.price)});setShowServiceModal(true);};

  const renderDashboard=()=>(
    <>
      <section className="welcome"><div><p className="section-label">PANEL DE CONTROL</p><h1>Buenos días, <em>G13.</em> 👋</h1><p className="welcome-text">Aquí tienes el resumen de tu barbería.</p></div><button className="primary-button" onClick={()=>{setActive("Agenda");openAppointmentModal()}}><Icon.Plus/>Nueva reserva</button></section>
      <section className="stats-grid">
        <article className="stat-card"><div className="stat-header"><span>CITAS DEL DÍA</span><Icon.Calendar/></div><h2>{appointments.length}</h2><p><strong>Agenda activa</strong></p></article>
        <article className="stat-card"><div className="stat-header"><span>INGRESOS</span><Icon.Wallet/></div><h2>{formatCurrency(financialSummary.sales)}</h2><p><strong>Ingresos registrados</strong></p></article>
        <article className="stat-card"><div className="stat-header"><span>CLIENTES</span><Icon.Users/></div><h2>{clients.length}</h2><p><strong>Base de clientes</strong></p></article>
        <article className="stat-card gold-card"><div className="stat-header"><span>SERVICIOS</span><Icon.Scissors/></div><h2>{services.filter(s=>s.active).length}</h2><p>Servicios activos</p></article>
      </section>
      <section className="dashboard-grid">
        <article className="panel appointments-panel"><div className="panel-header"><div><p className="section-label">AGENDA</p><h2>Próximas citas</h2></div><button className="text-button" onClick={()=>setActive("Agenda")}>Ver agenda →</button></div>
        <div className="appointments">{appointments.length===0?<div className="empty-state"><h3>Sin citas para este día</h3></div>:appointments.slice(0,4).map(a=><div className="appointment" key={a.id}><div className="appointment-time">{a.time}</div><div className="client-avatar">{getInitials(a.name)}</div><div className="client-details"><strong>{a.name}</strong><span>{a.service}</span></div><div className={`status status-${a.status.toLowerCase().replace(" ","-")}`}>{a.status}</div></div>)}</div></article>
        <article className="panel performance-panel"><div className="panel-header"><div><p className="section-label">FINANZAS</p><h2>Resumen actual</h2></div><span className="month-pill">Total</span></div><div className="chart-total"><span>Ingresos</span><strong>{formatCurrency(financialSummary.sales)}</strong></div><div className="chart-total"><span>Gastos</span><strong>{formatCurrency(financialSummary.expenses)}</strong></div><div className="chart-total"><span>Utilidad neta</span><strong>{formatCurrency(financialSummary.profit)}</strong></div></article>
      </section>
    </>
  );

  const renderAgenda=()=>(
    <section className="agenda-page"><div className="agenda-heading"><div><p className="section-label">GESTIÓN DE RESERVAS</p><h1>Agenda <em>Profesional</em></h1><p className="welcome-text">Administra las citas y disponibilidad de BARBER G13.</p></div><button className="primary-button" onClick={()=>openAppointmentModal()}><Icon.Plus/>Nueva reserva</button></div>
    <div className="agenda-toolbar"><div className="date-navigation"><button onClick={()=>changeDay(-1)}><Icon.ArrowLeft/></button><div><span className="date-label">AGENDA DEL DÍA</span><strong>{formatDate(selectedDate)}</strong></div><button onClick={()=>changeDay(1)}><Icon.ArrowRight/></button></div><button className="today-button" onClick={()=>setSelectedDate(new Date())}>Hoy</button></div>
    <div className="agenda-summary"><div><span>RESERVAS</span><strong>{appointments.length}</strong></div><div><span>CONFIRMADAS</span><strong>{appointments.filter(a=>a.status==="Confirmada").length}</strong></div><div><span>PENDIENTES</span><strong>{appointments.filter(a=>a.status==="Pendiente").length}</strong></div><div><span>DISPONIBILIDAD</span><strong className="gold-text">Disponible</strong></div></div>
    <div className="agenda-layout"><article className="agenda-timeline panel"><div className="timeline-header"><span>HORA</span><span>RESERVAS PROGRAMADAS</span></div>{hours.map(hour=>{const list=getAppointmentsByHour(hour);return <div className="timeline-row" key={hour}><div className="timeline-time">{hour}</div><div className="timeline-content">{list.length===0?<button className="available-slot" onClick={()=>openAppointmentModal(hour)}>+ Horario disponible</button>:list.map(a=><div className="agenda-appointment" key={a.id}><div className="agenda-client-avatar">{getInitials(a.name)}</div><div className="agenda-client-info"><strong>{a.name}</strong><span>{a.service} · {a.duration} min</span><small><Icon.Phone/> {a.phone}</small></div><select value={a.status} onChange={e=>updateStatus(a.id,e.target.value as AppointmentStatus)} className={`status-select status-${a.status.toLowerCase().replace(" ","-")}`}><option>Confirmada</option><option>Pendiente</option><option>En proceso</option><option>Finalizada</option><option>Cancelada</option></select></div>)}</div></div>})}</article>
    <aside className="agenda-sidebar"><article className="panel"><p className="section-label">RESUMEN DEL DÍA</p><h2>Tu jornada</h2><div className="day-progress"><div className="progress-circle"><strong>{Math.round((appointments.length/hours.length)*100)}%</strong><span>ocupación</span></div><div className="progress-info"><p><strong>{appointments.length}</strong> citas programadas</p><p><strong>{Math.max(0,hours.length-appointments.length)}</strong> espacios disponibles</p></div></div></article></aside></div></section>
  );

  const renderClients=()=>(
    <section className="module-page"><div className="module-heading"><div><p className="section-label">BASE DE DATOS</p><h1>Clientes <em>G13</em></h1><p className="welcome-text">Gestiona y consulta la información de tus clientes.</p></div><button className="primary-button" onClick={()=>setShowClientModal(true)}><Icon.Plus/>Nuevo cliente</button></div>
    <div className="module-stats"><div className="mini-stat"><span>CLIENTES REGISTRADOS</span><strong>{clients.length}</strong></div><div className="mini-stat"><span>CLIENTES FRECUENTES</span><strong>{clients.filter(c=>c.visits>=5).length}</strong></div><div className="mini-stat"><span>NUEVOS</span><strong>{clients.filter(c=>c.registeredAt.includes(new Date().getFullYear().toString())).length}</strong></div></div>
    <div className="search-bar"><Icon.Search/><input placeholder="Buscar por nombre o teléfono..." value={clientSearch} onChange={e=>setClientSearch(e.target.value)}/></div>
    <div className="clients-list">{filteredClients.length===0?<div className="empty-state"><Icon.Users/><h3>No encontramos clientes</h3><p>Registra tu primer cliente.</p></div>:filteredClients.map(c=><article className="client-card" key={c.id}><div className="large-avatar">{getInitials(c.name)}</div><div className="client-main"><h3>{c.name}</h3><span>{c.phone}</span>{c.email&&<small>{c.email}</small>}</div><div className="client-metric"><span>VISITAS</span><strong>{c.visits}</strong></div><div className="client-service"><span>ÚLTIMO SERVICIO</span><strong>{c.lastService}</strong></div><button className="client-action" onClick={()=>{setActive("Agenda");openAppointmentModal(undefined,c)}}><Icon.Calendar/>Nueva cita</button></article>)}</div></section>
  );

  const renderServices=()=>(
    <section className="module-page"><div className="module-heading"><div><p className="section-label">CATÁLOGO COMERCIAL</p><h1>Servicios <em>G13</em></h1><p className="welcome-text">Configura los servicios disponibles en tu barbería.</p></div><button className="primary-button" onClick={()=>{setEditingService(null);setServiceForm({name:"",description:"",duration:"30",price:""});setShowServiceModal(true)}}><Icon.Plus/>Nuevo servicio</button></div>
    <div className="search-bar"><Icon.Search/><input placeholder="Buscar servicio..." value={serviceSearch} onChange={e=>setServiceSearch(e.target.value)}/></div>
    <div className="services-grid">{filteredServices.map(s=><article className={`service-card ${!s.active?"service-inactive":""}`} key={s.id}><div className="service-top"><div className="service-icon"><Icon.Scissors/></div><label className="switch"><input type="checkbox" checked={s.active} onChange={()=>toggleService(s.id)}/><span/></label></div><h3>{s.name}</h3><p>{s.description}</p><div className="service-details"><div><span>DURACIÓN</span><strong>{s.duration} min</strong></div><div><span>PRECIO</span><strong>{formatCurrency(s.price)}</strong></div></div><div className="service-actions"><button onClick={()=>openEditService(s)}><Icon.Edit/>Editar</button><button className="delete-button" onClick={()=>deleteService(s.id)}><Icon.Trash/></button></div></article>)}</div></section>
  );

  const renderFinances=()=>(
    <section className="module-page"><div className="module-heading"><div><p className="section-label">CONTROL FINANCIERO</p><h1>Finanzas <em>G13</em></h1><p className="welcome-text">Registra ingresos, gastos y controla la rentabilidad.</p></div><button className="primary-button" onClick={()=>setShowTransactionModal(true)}><Icon.Plus/>Nuevo movimiento</button></div>
    <div className="stats-grid"><article className="stat-card"><div className="stat-header"><span>INGRESOS</span><Icon.Wallet/></div><h2>{formatCurrency(financialSummary.sales)}</h2><p>Ventas y servicios</p></article><article className="stat-card"><div className="stat-header"><span>GASTOS</span><Icon.Wallet/></div><h2>{formatCurrency(financialSummary.expenses)}</h2><p>Costos registrados</p></article><article className="stat-card gold-card"><div className="stat-header"><span>UTILIDAD NETA</span><Icon.Grid/></div><h2>{formatCurrency(financialSummary.profit)}</h2><p>Resultado actual</p></article><article className="stat-card"><div className="stat-header"><span>SERVICIOS COBRADOS</span><Icon.Scissors/></div><h2>{financialSummary.servicesCompleted}</h2><p>Movimientos de ingreso</p></article></div>
    <section className="dashboard-grid"><article className="panel"><div className="panel-header"><div><p className="section-label">MÉTODOS DE PAGO</p><h2>Ingresos por canal</h2></div></div><div className="appointments">{paymentSummary.map(p=><div className="appointment" key={p.method}><div className="client-avatar">{p.method.charAt(0)}</div><div className="client-details"><strong>{p.method}</strong><span>Ingresos registrados</span></div><div className="appointment-time">{formatCurrency(p.amount)}</div></div>)}</div></article><article className="panel performance-panel"><div className="panel-header"><div><p className="section-label">RENTABILIDAD</p><h2>Balance general</h2></div></div><div className="chart-total"><span>Total ingresos</span><strong>{formatCurrency(financialSummary.sales)}</strong></div><div className="chart-total"><span>Total gastos</span><strong>{formatCurrency(financialSummary.expenses)}</strong></div><div className="chart-total"><span>Disponible / utilidad</span><strong>{formatCurrency(financialSummary.profit)}</strong></div></article></section>
    <div className="panel" style={{marginTop:24}}><div className="panel-header"><div><p className="section-label">MOVIMIENTOS</p><h2>Historial financiero</h2></div></div><div className="search-bar"><Icon.Search/><input placeholder="Buscar concepto, categoría o método..." value={transactionSearch} onChange={e=>setTransactionSearch(e.target.value)}/></div><div className="service-actions" style={{margin:"12px 0 18px"}}><button onClick={()=>setTransactionFilter("Todos")} className={transactionFilter==="Todos"?"primary-button":""}>Todos</button><button onClick={()=>setTransactionFilter("Ingreso")}>Ingresos</button><button onClick={()=>setTransactionFilter("Gasto")}>Gastos</button></div><div className="appointments">{filteredTransactions.length===0?<div className="empty-state"><Icon.Wallet/><h3>No hay movimientos</h3></div>:filteredTransactions.map(t=><div className="appointment" key={t.id}><div className="client-avatar">{t.type==="Ingreso"?"+":"−"}</div><div className="client-details"><strong>{t.concept}</strong><span>{t.category} · {t.paymentMethod} · {t.time}</span></div><div className={`status ${t.type==="Ingreso"?"status-confirmada":"status-cancelada"}`}>{t.type}</div><div className="appointment-time">{t.type==="Ingreso"?"+":"-"}{formatCurrency(t.amount)}</div><button className="delete-button" onClick={()=>deleteTransaction(t.id)}><Icon.Trash/></button></div>)}</div></div></section>
  );

  return <div className="app-shell">
    {menuOpen&&<div className="mobile-overlay" onClick={()=>setMenuOpen(false)}/>}
    <aside className={`sidebar ${menuOpen?"open":""}`}><div className="brand">BARBER <strong>G13</strong></div><p className="brand-subtitle">GESTIÓN PROFESIONAL</p><nav className="navigation">{menu.map(item=><button key={item.name} className={active===item.name?"active":""} onClick={()=>{setActive(item.name);setMenuOpen(false)}}><span className="nav-icon">{item.icon}</span>{item.name}</button>)}</nav><div className="sidebar-footer"><button className="settings"><Icon.Settings/>Configuración</button><div className="profile"><div className="profile-avatar">G13</div><div><strong>Administrador</strong><small>BARBER G13</small></div></div></div></aside>
    <main className="main-content"><header className="topbar"><button className="menu-button" onClick={()=>setMenuOpen(true)}><Icon.Menu/></button><div className="breadcrumb">BARBER G13 <span>/</span> <strong>{active}</strong></div><div className="top-profile"><span>GESTIÓN PROFESIONAL</span><div className="top-avatar">A</div></div></header>
      {error&&<div className="error-banner">⚠ {error}<button onClick={()=>loadData()}>Reintentar</button></div>}
      {loading?<div className="loading-state"><div className="loading-spinner"/><p>Sincronizando datos...</p></div>:<>{active==="Dashboard"&&renderDashboard()}{active==="Agenda"&&renderAgenda()}{active==="Clientes"&&renderClients()}{active==="Servicios"&&renderServices()}{active==="Finanzas"&&renderFinances()}</>}
    </main>

    {showAppointmentModal&&<div className="modal-overlay"><div className="reservation-modal"><div className="modal-header"><div><p className="section-label">NUEVA RESERVA</p><h2>Registrar cita</h2></div><button className="close-button" onClick={()=>setShowAppointmentModal(false)}><Icon.Close/></button></div><form onSubmit={handleCreateAppointment}><div className="form-grid"><label className="full-width">Nombre del cliente<input value={appointmentForm.name} onChange={e=>setAppointmentForm(c=>({...c,name:e.target.value}))} placeholder="Ej: Juan Pérez"/></label><label>Teléfono<input type="tel" value={appointmentForm.phone} onChange={e=>setAppointmentForm(c=>({...c,phone:e.target.value}))} placeholder="+57 300 0000000"/></label><label>Servicio<select value={appointmentForm.serviceId} onChange={e=>setAppointmentForm(c=>({...c,serviceId:e.target.value}))}><option value="">Selecciona...</option>{services.filter(s=>s.active).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label>Barbero<select value={appointmentForm.barberId} onChange={e=>setAppointmentForm(c=>({...c,barberId:e.target.value}))}><option value="">Selecciona...</option>{barbers.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label><label>Hora<select value={appointmentForm.time} onChange={e=>setAppointmentForm(c=>({...c,time:e.target.value}))}>{hours.map(h=><option key={h}>{h}</option>)}</select></label><label className="full-width">Notas<textarea rows={3} value={appointmentForm.notes} onChange={e=>setAppointmentForm(c=>({...c,notes:e.target.value}))}/></label></div><div className="modal-actions"><button type="button" className="cancel-button" onClick={()=>setShowAppointmentModal(false)}>Cancelar</button><button type="submit" className="primary-button" disabled={saving}>{saving?"Guardando...":"Confirmar reserva"}</button></div></form></div></div>}

    {showClientModal&&<div className="modal-overlay"><div className="reservation-modal small-modal"><div className="modal-header"><div><p className="section-label">NUEVO CLIENTE</p><h2>Registrar cliente</h2></div><button className="close-button" onClick={()=>setShowClientModal(false)}><Icon.Close/></button></div><form onSubmit={handleCreateClient}><div className="form-grid"><label className="full-width">Nombre completo<input value={clientForm.name} onChange={e=>setClientForm(c=>({...c,name:e.target.value}))}/></label><label>Teléfono<input value={clientForm.phone} onChange={e=>setClientForm(c=>({...c,phone:e.target.value}))}/></label><label>Email<input type="email" value={clientForm.email} onChange={e=>setClientForm(c=>({...c,email:e.target.value}))}/></label></div><div className="modal-actions"><button type="button" className="cancel-button" onClick={()=>setShowClientModal(false)}>Cancelar</button><button type="submit" className="primary-button" disabled={saving}>{saving?"Guardando...":"Guardar cliente"}</button></div></form></div></div>}

    {showServiceModal&&<div className="modal-overlay"><div className="reservation-modal"><div className="modal-header"><div><p className="section-label">{editingService?"EDITAR SERVICIO":"NUEVO SERVICIO"}</p><h2>{editingService?"Actualizar servicio":"Crear servicio"}</h2></div><button className="close-button" onClick={()=>{setShowServiceModal(false);setEditingService(null)}}><Icon.Close/></button></div><form onSubmit={handleSaveService}><div className="form-grid"><label className="full-width">Nombre del servicio<input value={serviceForm.name} onChange={e=>setServiceForm(c=>({...c,name:e.target.value}))}/></label><label className="full-width">Descripción<textarea rows={3} value={serviceForm.description} onChange={e=>setServiceForm(c=>({...c,description:e.target.value}))}/></label><label>Duración<select value={serviceForm.duration} onChange={e=>setServiceForm(c=>({...c,duration:e.target.value}))}><option value="15">15 minutos</option><option value="30">30 minutos</option><option value="45">45 minutos</option><option value="60">60 minutos</option><option value="90">90 minutos</option></select></label><label>Precio COP<input type="number" min="0" value={serviceForm.price} onChange={e=>setServiceForm(c=>({...c,price:e.target.value}))}/></label></div><div className="modal-actions"><button type="button" className="cancel-button" onClick={()=>{setShowServiceModal(false);setEditingService(null)}}>Cancelar</button><button type="submit" className="primary-button" disabled={saving}>{saving?"Guardando...":editingService?"Guardar cambios":"Crear servicio"}</button></div></form></div></div>}

    {showTransactionModal&&<div className="modal-overlay"><div className="reservation-modal small-modal"><div className="modal-header"><div><p className="section-label">NUEVO MOVIMIENTO</p><h2>Registrar ingreso o gasto</h2></div><button className="close-button" onClick={()=>setShowTransactionModal(false)}><Icon.Close/></button></div><form onSubmit={handleCreateTransaction}><div className="form-grid"><label className="full-width">Concepto<input value={transactionForm.concept} onChange={e=>setTransactionForm(c=>({...c,concept:e.target.value}))}/></label><label>Tipo<select value={transactionForm.type} onChange={e=>setTransactionForm(c=>({...c,type:e.target.value as TransactionType,category:e.target.value==="Ingreso"?"Servicio":"Insumos"}))}><option>Ingreso</option><option>Gasto</option></select></label><label>Categoría<input value={transactionForm.category} onChange={e=>setTransactionForm(c=>({...c,category:e.target.value}))}/></label><label>Valor COP<input type="number" min="0" value={transactionForm.amount} onChange={e=>setTransactionForm(c=>({...c,amount:e.target.value}))}/></label><label>Método de pago<select value={transactionForm.paymentMethod} onChange={e=>setTransactionForm(c=>({...c,paymentMethod:e.target.value as PaymentMethod}))}><option>Efectivo</option><option>Nequi</option><option>Transferencia</option><option>Tarjeta</option></select></label></div><div className="modal-actions"><button type="button" className="cancel-button" onClick={()=>setShowTransactionModal(false)}>Cancelar</button><button type="submit" className="primary-button" disabled={saving}>{saving?"Guardando...":"Guardar movimiento"}</button></div></form></div></div>}
  </div>;
}
