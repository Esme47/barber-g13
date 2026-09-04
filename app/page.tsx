 "use client";

import { useMemo, useState } from "react";

type AppointmentStatus = "Confirmada" | "Pendiente" | "En proceso" | "Finalizada" | "Cancelada";
type Appointment = { id:number; time:string; name:string; phone:string; service:string; barber:string; duration:number; status:AppointmentStatus; notes?:string; };
type Client = { id:number; name:string; phone:string; email?:string; visits:number; lastService:string; registeredAt:string; };
type Service = { id:number; name:string; description:string; duration:number; price:number; active:boolean; };
type PaymentMethod = "Efectivo" | "Nequi" | "Transferencia" | "Tarjeta";
type TransactionType = "Ingreso" | "Gasto";
type Transaction = { id:number; concept:string; category:string; amount:number; type:TransactionType; paymentMethod:PaymentMethod; time:string; date:string; };

const Icon = {
  Grid: () => <span>▦</span>, Calendar: () => <span>◫</span>, Users: () => <span>♙</span>,
  Scissors: () => <span>✂</span>, Wallet: () => <span>◈</span>, Settings: () => <span>⚙</span>,
  Menu: () => <span>☰</span>, Plus: () => <span>＋</span>, ArrowLeft: () => <span>‹</span>,
  ArrowRight: () => <span>›</span>, Close: () => <span>×</span>, Phone: () => <span>☎</span>,
  Search: () => <span>⌕</span>, Edit: () => <span>✎</span>, Trash: () => <span>⌫</span>,
};

const initialAppointments: Appointment[] = [
  { id:1,time:"09:00",name:"Carlos Rodríguez",phone:"+57 300 000 0001",service:"Corte Premium",barber:"Barbero G13",duration:45,status:"Confirmada" },
  { id:2,time:"10:30",name:"Juan Martínez",phone:"+57 300 000 0002",service:"Corte + Barba",barber:"Barbero G13",duration:60,status:"Confirmada" },
  { id:3,time:"12:00",name:"Andrés Gómez",phone:"+57 300 000 0003",service:"Experiencia G13",barber:"Barbero G13",duration:60,status:"Pendiente" },
  { id:4,time:"15:30",name:"Miguel Torres",phone:"+57 300 000 0004",service:"Corte Premium",barber:"Barbero G13",duration:45,status:"Confirmada" },
];

const initialClients: Client[] = [
  {id:1,name:"Carlos Rodríguez",phone:"+57 300 000 0001",email:"",visits:8,lastService:"Corte Premium",registeredAt:"15 ago 2026"},
  {id:2,name:"Juan Martínez",phone:"+57 300 000 0002",email:"",visits:5,lastService:"Corte + Barba",registeredAt:"02 ago 2026"},
  {id:3,name:"Andrés Gómez",phone:"+57 300 000 0003",email:"",visits:3,lastService:"Experiencia G13",registeredAt:"28 ago 2026"},
  {id:4,name:"Miguel Torres",phone:"+57 300 000 0004",email:"",visits:12,lastService:"Corte Premium",registeredAt:"10 jul 2026"},
];

const initialServices: Service[] = [
  {id:1,name:"Corte Clásico",description:"Corte profesional con acabado limpio y preciso.",duration:30,price:25000,active:true},
  {id:2,name:"Corte Premium",description:"Experiencia completa con asesoría y acabado profesional.",duration:45,price:35000,active:true},
  {id:3,name:"Corte + Barba",description:"Servicio integral de corte y diseño de barba.",duration:60,price:50000,active:true},
  {id:4,name:"Barba Premium",description:"Perfilado, diseño y acabado profesional de barba.",duration:30,price:25000,active:true},
  {id:5,name:"Experiencia G13",description:"Servicio premium completo BARBER G13.",duration:60,price:60000,active:true},
];

const initialTransactions: Transaction[] = [
  {id:1,concept:"Corte Premium",category:"Servicio",amount:35000,type:"Ingreso",paymentMethod:"Efectivo",time:"09:30",date:"Hoy"},
  {id:2,concept:"Corte + Barba",category:"Servicio",amount:50000,type:"Ingreso",paymentMethod:"Nequi",time:"10:45",date:"Hoy"},
  {id:3,concept:"Compra de insumos",category:"Insumos",amount:45000,type:"Gasto",paymentMethod:"Transferencia",time:"11:20",date:"Hoy"},
  {id:4,concept:"Experiencia G13",category:"Servicio Premium",amount:60000,type:"Ingreso",paymentMethod:"Nequi",time:"12:30",date:"Hoy"},
  {id:5,concept:"Corte Clásico",category:"Servicio",amount:25000,type:"Ingreso",paymentMethod:"Efectivo",time:"14:15",date:"Hoy"},
];

const hours = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00"];

export default function Home() {
  const [menuOpen,setMenuOpen]=useState(false);
  const [active,setActive]=useState("Dashboard");
  const [appointments,setAppointments]=useState<Appointment[]>(initialAppointments);
  const [clients,setClients]=useState<Client[]>(initialClients);
  const [services,setServices]=useState<Service[]>(initialServices);
  const [transactions,setTransactions]=useState<Transaction[]>(initialTransactions);
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

  const [appointmentForm,setAppointmentForm]=useState({name:"",phone:"",service:"Corte Clásico",barber:"Barbero G13",time:"09:00",duration:"30",notes:""});
  const [clientForm,setClientForm]=useState({name:"",phone:"",email:""});
  const [serviceForm,setServiceForm]=useState({name:"",description:"",duration:"30",price:""});
  const [transactionForm,setTransactionForm]=useState<{concept:string;category:string;amount:string;type:TransactionType;paymentMethod:PaymentMethod}>({concept:"",category:"Servicio",amount:"",type:"Ingreso",paymentMethod:"Efectivo"});

  const menu=[{name:"Dashboard",icon:<Icon.Grid/>},{name:"Agenda",icon:<Icon.Calendar/>},{name:"Clientes",icon:<Icon.Users/>},{name:"Servicios",icon:<Icon.Scissors/>},{name:"Finanzas",icon:<Icon.Wallet/>}];

  const formatCurrency=(value:number)=>new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(value);
  const formatDate=(date:Date)=>date.toLocaleDateString("es-CO",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  const getInitials=(name:string)=>name.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase();

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
  const getAppointmentsByHour=(hour:string)=>appointments.filter(a=>a.time.startsWith(hour));

  const openAppointmentModal=(time?:string,client?:Client)=>{
    setAppointmentForm(c=>({...c,time:time||c.time,name:client?.name||c.name,phone:client?.phone||c.phone}));
    setShowAppointmentModal(true);
  };

  const handleCreateAppointment=(e:React.FormEvent)=>{e.preventDefault();
    if(!appointmentForm.name.trim()) return alert("Ingresa el nombre del cliente.");
    const selected=services.find(s=>s.name===appointmentForm.service);
    const item:Appointment={id:Date.now(),time:appointmentForm.time,name:appointmentForm.name,phone:appointmentForm.phone,service:appointmentForm.service,barber:appointmentForm.barber,duration:selected?.duration||Number(appointmentForm.duration),status:"Confirmada",notes:appointmentForm.notes};
    setAppointments(c=>[...c,item].sort((a,b)=>a.time.localeCompare(b.time)));
    if(!clients.some(c=>c.phone===item.phone||c.name.toLowerCase()===item.name.toLowerCase())) setClients(c=>[{id:Date.now()+1,name:item.name,phone:item.phone,visits:1,lastService:item.service,registeredAt:"Hoy"},...c]);
    setShowAppointmentModal(false);
  };

  const handleCreateClient=(e:React.FormEvent)=>{e.preventDefault();if(!clientForm.name.trim()||!clientForm.phone.trim())return alert("Nombre y teléfono son obligatorios.");
    setClients(c=>[{id:Date.now(),...clientForm,visits:0,lastService:"Sin servicios registrados",registeredAt:"Hoy"},...c]);setClientForm({name:"",phone:"",email:""});setShowClientModal(false);};

  const handleSaveService=(e:React.FormEvent)=>{e.preventDefault();if(!serviceForm.name.trim()||!serviceForm.price)return alert("Completa el nombre y precio.");
    if(editingService) setServices(c=>c.map(s=>s.id===editingService.id?{...s,name:serviceForm.name,description:serviceForm.description,duration:Number(serviceForm.duration),price:Number(serviceForm.price)}:s));
    else setServices(c=>[...c,{id:Date.now(),name:serviceForm.name,description:serviceForm.description,duration:Number(serviceForm.duration),price:Number(serviceForm.price),active:true}]);
    setShowServiceModal(false);setEditingService(null);setServiceForm({name:"",description:"",duration:"30",price:""});};

  const handleCreateTransaction=(e:React.FormEvent)=>{e.preventDefault();if(!transactionForm.concept.trim()||!transactionForm.amount)return alert("Completa concepto y valor.");
    const now=new Date();
    setTransactions(c=>[{id:Date.now(),concept:transactionForm.concept,category:transactionForm.category,amount:Number(transactionForm.amount),type:transactionForm.type,paymentMethod:transactionForm.paymentMethod,time:now.toLocaleTimeString("es-CO",{hour:"2-digit",minute:"2-digit",hour12:false}),date:"Hoy"},...c]);
    setTransactionForm({concept:"",category:"Servicio",amount:"",type:"Ingreso",paymentMethod:"Efectivo"});setShowTransactionModal(false);};

  const updateStatus=(id:number,status:AppointmentStatus)=>setAppointments(c=>c.map(a=>a.id===id?{...a,status}:a));
  const toggleService=(id:number)=>setServices(c=>c.map(s=>s.id===id?{...s,active:!s.active}:s));
  const deleteService=(id:number)=>{if(window.confirm("¿Deseas eliminar este servicio?"))setServices(c=>c.filter(s=>s.id!==id));};
  const deleteTransaction=(id:number)=>{if(window.confirm("¿Eliminar este movimiento financiero?"))setTransactions(c=>c.filter(t=>t.id!==id));};
  const openEditService=(s:Service)=>{setEditingService(s);setServiceForm({name:s.name,description:s.description,duration:String(s.duration),price:String(s.price)});setShowServiceModal(true);};

  const renderDashboard=()=>(
    <>
      <section className="welcome"><div><p className="section-label">PANEL DE CONTROL</p><h1>Buenos días, <em>G13.</em> 👋</h1><p className="welcome-text">Aquí tienes el resumen de tu barbería para hoy.</p></div>
      <button className="primary-button" onClick={()=>{setActive("Agenda");setShowAppointmentModal(true)}}><Icon.Plus/>Nueva reserva</button></section>
      <section className="stats-grid">
        <article className="stat-card"><div className="stat-header"><span>CITAS DE HOY</span><Icon.Calendar/></div><h2>{appointments.length}</h2><p><strong>Agenda activa</strong></p></article>
        <article className="stat-card"><div className="stat-header"><span>INGRESOS</span><Icon.Wallet/></div><h2>{formatCurrency(financialSummary.sales)}</h2><p><strong>Ingresos registrados</strong></p></article>
        <article className="stat-card"><div className="stat-header"><span>CLIENTES</span><Icon.Users/></div><h2>{clients.length}</h2><p><strong>Base de clientes</strong></p></article>
        <article className="stat-card gold-card"><div className="stat-header"><span>SERVICIOS</span><Icon.Scissors/></div><h2>{services.filter(s=>s.active).length}</h2><p>Servicios activos</p></article>
      </section>
      <section className="dashboard-grid">
        <article className="panel appointments-panel"><div className="panel-header"><div><p className="section-label">AGENDA</p><h2>Próximas citas</h2></div><button className="text-button" onClick={()=>setActive("Agenda")}>Ver agenda →</button></div>
        <div className="appointments">{appointments.slice(0,4).map(a=><div className="appointment" key={a.id}><div className="appointment-time">{a.time}</div><div className="client-avatar">{getInitials(a.name)}</div><div className="client-details"><strong>{a.name}</strong><span>{a.service}</span></div><div className={`status status-${a.status.toLowerCase().replace(" ","-")}`}>{a.status}</div></div>)}</div></article>
        <article className="panel performance-panel"><div className="panel-header"><div><p className="section-label">FINANZAS</p><h2>Resumen actual</h2></div><span className="month-pill">Hoy</span></div>
          <div className="chart-total"><span>Ingresos</span><strong>{formatCurrency(financialSummary.sales)}</strong></div>
          <div className="chart-total"><span>Gastos</span><strong>{formatCurrency(financialSummary.expenses)}</strong></div>
          <div className="chart-total"><span>Utilidad neta</span><strong>{formatCurrency(financialSummary.profit)}</strong></div>
        </article>
      </section>
    </>
  );

  const renderAgenda=()=>(
    <section className="agenda-page"><div className="agenda-heading"><div><p className="section-label">GESTIÓN DE RESERVAS</p><h1>Agenda <em>Profesional</em></h1><p className="welcome-text">Administra las citas y disponibilidad de BARBER G13.</p></div><button className="primary-button" onClick={()=>setShowAppointmentModal(true)}><Icon.Plus/>Nueva reserva</button></div>
      <div className="agenda-toolbar"><div className="date-navigation"><button onClick={()=>changeDay(-1)}><Icon.ArrowLeft/></button><div><span className="date-label">AGENDA DEL DÍA</span><strong>{formatDate(selectedDate)}</strong></div><button onClick={()=>changeDay(1)}><Icon.ArrowRight/></button></div><button className="today-button" onClick={()=>setSelectedDate(new Date())}>Hoy</button></div>
      <div className="agenda-summary"><div><span>RESERVAS</span><strong>{appointments.length}</strong></div><div><span>CONFIRMADAS</span><strong>{appointments.filter(a=>a.status==="Confirmada").length}</strong></div><div><span>PENDIENTES</span><strong>{appointments.filter(a=>a.status==="Pendiente").length}</strong></div><div><span>DISPONIBILIDAD</span><strong className="gold-text">Disponible</strong></div></div>
      <div className="agenda-layout"><article className="agenda-timeline panel"><div className="timeline-header"><span>HORA</span><span>RESERVAS PROGRAMADAS</span></div>{hours.map(hour=>{const list=getAppointmentsByHour(hour);return <div className="timeline-row" key={hour}><div className="timeline-time">{hour}</div><div className="timeline-content">{list.length===0?<button className="available-slot" onClick={()=>openAppointmentModal(hour)}>+ Horario disponible</button>:list.map(a=><div className="agenda-appointment" key={a.id}><div className="agenda-client-avatar">{getInitials(a.name)}</div><div className="agenda-client-info"><strong>{a.name}</strong><span>{a.service} · {a.duration} min</span><small><Icon.Phone/> {a.phone}</small></div><select value={a.status} onChange={e=>updateStatus(a.id,e.target.value as AppointmentStatus)} className={`status-select status-${a.status.toLowerCase().replace(" ","-")}`}><option>Confirmada</option><option>Pendiente</option><option>En proceso</option><option>Finalizada</option><option>Cancelada</option></select></div>)}</div></div>})}</article>
      <aside className="agenda-sidebar"><article className="panel"><p className="section-label">RESUMEN DEL DÍA</p><h2>Tu jornada</h2><div className="day-progress"><div className="progress-circle"><strong>{Math.round((appointments.length/hours.length)*100)}%</strong><span>ocupación</span></div><div className="progress-info"><p><strong>{appointments.length}</strong> citas programadas</p><p><strong>{Math.max(0,hours.length-appointments.length)}</strong> espacios disponibles</p></div></div></article></aside></div>
    </section>
  );

  const renderClients=()=>(
    <section className="module-page"><div className="module-heading"><div><p className="section-label">BASE DE DATOS LOCAL</p><h1>Clientes <em>G13</em></h1><p className="welcome-text">Gestiona y consulta la información de tus clientes.</p></div><button className="primary-button" onClick={()=>setShowClientModal(true)}><Icon.Plus/>Nuevo cliente</button></div>
      <div className="module-stats"><div className="mini-stat"><span>CLIENTES REGISTRADOS</span><strong>{clients.length}</strong></div><div className="mini-stat"><span>CLIENTES FRECUENTES</span><strong>{clients.filter(c=>c.visits>=5).length}</strong></div><div className="mini-stat"><span>NUEVOS</span><strong>{clients.filter(c=>c.registeredAt==="Hoy").length}</strong></div></div>
      <div className="search-bar"><Icon.Search/><input placeholder="Buscar por nombre o teléfono..." value={clientSearch} onChange={e=>setClientSearch(e.target.value)}/></div>
      <div className="clients-list">{filteredClients.length===0?<div className="empty-state"><Icon.Users/><h3>No encontramos clientes</h3><p>Prueba con otra búsqueda o registra un nuevo cliente.</p></div>:filteredClients.map(c=><article className="client-card" key={c.id}><div className="large-avatar">{getInitials(c.name)}</div><div className="client-main"><h3>{c.name}</h3><span>{c.phone}</span>{c.email&&<small>{c.email}</small>}</div><div className="client-metric"><span>VISITAS</span><strong>{c.visits}</strong></div><div className="client-service"><span>ÚLTIMO SERVICIO</span><strong>{c.lastService}</strong></div><button className="client-action" onClick={()=>{setActive("Agenda");openAppointmentModal(undefined,c)}}><Icon.Calendar/>Nueva cita</button></article>)}</div>
    </section>
  );

  const renderServices=()=>(
    <section className="module-page"><div className="module-heading"><div><p className="section-label">CATÁLOGO COMERCIAL</p><h1>Servicios <em>G13</em></h1><p className="welcome-text">Configura los servicios disponibles en tu barbería.</p></div><button className="primary-button" onClick={()=>{setEditingService(null);setServiceForm({name:"",description:"",duration:"30",price:""});setShowServiceModal(true)}}><Icon.Plus/>Nuevo servicio</button></div>
      <div className="search-bar"><Icon.Search/><input placeholder="Buscar servicio..." value={serviceSearch} onChange={e=>setServiceSearch(e.target.value)}/></div>
      <div className="services-grid">{filteredServices.map(s=><article className={`service-card ${!s.active?"service-inactive":""}`} key={s.id}><div className="service-top"><div className="service-icon"><Icon.Scissors/></div><label className="switch"><input type="checkbox" checked={s.active} onChange={()=>toggleService(s.id)}/><span/></label></div><h3>{s.name}</h3><p>{s.description}</p><div className="service-details"><div><span>DURACIÓN</span><strong>{s.duration} min</strong></div><div><span>PRECIO</span><strong>{formatCurrency(s.price)}</strong></div></div><div className="service-actions"><button onClick={()=>openEditService(s)}><Icon.Edit/>Editar</button><button className="delete-button" onClick={()=>deleteService(s.id)}><Icon.Trash/></button></div></article>)}</div>
    </section>
  );

  const renderFinances=()=>(
    <section className="module-page">
      <div className="module-heading"><div><p className="section-label">CONTROL FINANCIERO</p><h1>Finanzas <em>G13</em></h1><p className="welcome-text">Registra ingresos, gastos y controla la rentabilidad de tu negocio.</p></div><button className="primary-button" onClick={()=>setShowTransactionModal(true)}><Icon.Plus/>Nuevo movimiento</button></div>
      <div className="stats-grid">
        <article className="stat-card"><div className="stat-header"><span>INGRESOS</span><Icon.Wallet/></div><h2>{formatCurrency(financialSummary.sales)}</h2><p>Ventas y servicios</p></article>
        <article className="stat-card"><div className="stat-header"><span>GASTOS</span><Icon.Wallet/></div><h2>{formatCurrency(financialSummary.expenses)}</h2><p>Costos registrados</p></article>
        <article className="stat-card gold-card"><div className="stat-header"><span>UTILIDAD NETA</span><Icon.Grid/></div><h2>{formatCurrency(financialSummary.profit)}</h2><p>Resultado actual</p></article>
        <article className="stat-card"><div className="stat-header"><span>SERVICIOS COBRADOS</span><Icon.Scissors/></div><h2>{financialSummary.servicesCompleted}</h2><p>Movimientos de ingreso</p></article>
      </div>
      <section className="dashboard-grid">
        <article className="panel"><div className="panel-header"><div><p className="section-label">MÉTODOS DE PAGO</p><h2>Ingresos por canal</h2></div></div>
          <div className="appointments">{paymentSummary.map(p=><div className="appointment" key={p.method}><div className="client-avatar">{p.method.charAt(0)}</div><div className="client-details"><strong>{p.method}</strong><span>Ingresos registrados</span></div><div className="appointment-time">{formatCurrency(p.amount)}</div></div>)}</div>
        </article>
        <article className="panel performance-panel"><div className="panel-header"><div><p className="section-label">RENTABILIDAD</p><h2>Balance general</h2></div></div>
          <div className="chart-total"><span>Total ingresos</span><strong>{formatCurrency(financialSummary.sales)}</strong></div>
          <div className="chart-total"><span>Total gastos</span><strong>{formatCurrency(financialSummary.expenses)}</strong></div>
          <div className="chart-total"><span>Disponible / utilidad</span><strong>{formatCurrency(financialSummary.profit)}</strong></div>
        </article>
      </section>
      <div className="panel" style={{marginTop:24}}>
        <div className="panel-header"><div><p className="section-label">MOVIMIENTOS</p><h2>Historial financiero</h2></div></div>
        <div className="search-bar"><Icon.Search/><input placeholder="Buscar concepto, categoría o método..." value={transactionSearch} onChange={e=>setTransactionSearch(e.target.value)}/></div>
        <div className="service-actions" style={{margin:"12px 0 18px"}}><button onClick={()=>setTransactionFilter("Todos")} className={transactionFilter==="Todos"?"primary-button":""}>Todos</button><button onClick={()=>setTransactionFilter("Ingreso")}>Ingresos</button><button onClick={()=>setTransactionFilter("Gasto")}>Gastos</button></div>
        <div className="appointments">{filteredTransactions.length===0?<div className="empty-state"><Icon.Wallet/><h3>No hay movimientos</h3><p>Registra tu primer ingreso o gasto.</p></div>:filteredTransactions.map(t=><div className="appointment" key={t.id}><div className="client-avatar">{t.type==="Ingreso"?"+":"−"}</div><div className="client-details"><strong>{t.concept}</strong><span>{t.category} · {t.paymentMethod} · {t.time}</span></div><div className={`status ${t.type==="Ingreso"?"status-confirmada":"status-cancelada"}`}>{t.type}</div><div className="appointment-time">{t.type==="Ingreso"?"+":"-"}{formatCurrency(t.amount)}</div><button className="delete-button" onClick={()=>deleteTransaction(t.id)}><Icon.Trash/></button></div>)}</div>
      </div>
    </section>
  );

  const renderPlaceholder=()=> <section className="placeholder-page"><p className="section-label">PRÓXIMO MÓDULO</p><h1>{active} <em>BARBER G13</em></h1><p>Este módulo será desarrollado próximamente.</p></section>;

  return <div className="app-shell">
    {menuOpen&&<div className="mobile-overlay" onClick={()=>setMenuOpen(false)}/>}
    <aside className={`sidebar ${menuOpen?"open":""}`}><div className="brand">BARBER <strong>G13</strong></div><p className="brand-subtitle">GESTIÓN PROFESIONAL</p><nav className="navigation">{menu.map(item=><button key={item.name} className={active===item.name?"active":""} onClick={()=>{setActive(item.name);setMenuOpen(false)}}><span className="nav-icon">{item.icon}</span>{item.name}</button>)}</nav><div className="sidebar-footer"><button className="settings"><Icon.Settings/>Configuración</button><div className="profile"><div className="profile-avatar">G13</div><div><strong>Administrador</strong><small>BARBER G13</small></div></div></div></aside>
    <main className="main-content"><header className="topbar"><button className="menu-button" onClick={()=>setMenuOpen(true)}><Icon.Menu/></button><div className="breadcrumb">BARBER G13 <span>/</span> <strong>{active}</strong></div><div className="top-profile"><span>GESTIÓN PROFESIONAL</span><div className="top-avatar">A</div></div></header>
      {active==="Dashboard"&&renderDashboard()}{active==="Agenda"&&renderAgenda()}{active==="Clientes"&&renderClients()}{active==="Servicios"&&renderServices()}{active==="Finanzas"&&renderFinances()}
      {!["Dashboard","Agenda","Clientes","Servicios","Finanzas"].includes(active)&&renderPlaceholder()}
    </main>

    {showAppointmentModal&&<div className="modal-overlay"><div className="reservation-modal"><div className="modal-header"><div><p className="section-label">NUEVA RESERVA</p><h2>Registrar cita</h2></div><button className="close-button" onClick={()=>setShowAppointmentModal(false)}><Icon.Close/></button></div><form onSubmit={handleCreateAppointment}><div className="form-grid">
      <label className="full-width">Nombre del cliente<input value={appointmentForm.name} onChange={e=>setAppointmentForm(c=>({...c,name:e.target.value}))} placeholder="Ej: Juan Pérez"/></label>
      <label>Teléfono<input type="tel" value={appointmentForm.phone} onChange={e=>setAppointmentForm(c=>({...c,phone:e.target.value}))} placeholder="+57 300 0000000"/></label>
      <label>Servicio<select value={appointmentForm.service} onChange={e=>{const s=services.find(x=>x.name===e.target.value);setAppointmentForm(c=>({...c,service:e.target.value,duration:String(s?.duration||45)}))}}>{services.filter(s=>s.active).map(s=><option key={s.id}>{s.name}</option>)}</select></label>
      <label>Hora<select value={appointmentForm.time} onChange={e=>setAppointmentForm(c=>({...c,time:e.target.value}))}>{hours.map(h=><option key={h}>{h}</option>)}</select></label>
      <label>Duración<input readOnly value={`${appointmentForm.duration} minutos`}/></label>
      <label className="full-width">Notas<textarea rows={3} value={appointmentForm.notes} onChange={e=>setAppointmentForm(c=>({...c,notes:e.target.value}))} placeholder="Información adicional..."/></label>
    </div><div className="modal-actions"><button type="button" className="cancel-button" onClick={()=>setShowAppointmentModal(false)}>Cancelar</button><button type="submit" className="primary-button"><Icon.Calendar/>Confirmar reserva</button></div></form></div></div>}

    {showClientModal&&<div className="modal-overlay"><div className="reservation-modal small-modal"><div className="modal-header"><div><p className="section-label">NUEVO CLIENTE</p><h2>Registrar cliente</h2></div><button className="close-button" onClick={()=>setShowClientModal(false)}><Icon.Close/></button></div><form onSubmit={handleCreateClient}><div className="form-grid"><label className="full-width">Nombre completo<input value={clientForm.name} onChange={e=>setClientForm(c=>({...c,name:e.target.value}))}/></label><label>Teléfono<input value={clientForm.phone} onChange={e=>setClientForm(c=>({...c,phone:e.target.value}))}/></label><label>Email<input type="email" value={clientForm.email} onChange={e=>setClientForm(c=>({...c,email:e.target.value}))}/></label></div><div className="modal-actions"><button type="button" className="cancel-button" onClick={()=>setShowClientModal(false)}>Cancelar</button><button type="submit" className="primary-button">Guardar cliente</button></div></form></div></div>}

    {showServiceModal&&<div className="modal-overlay"><div className="reservation-modal"><div className="modal-header"><div><p className="section-label">{editingService?"EDITAR SERVICIO":"NUEVO SERVICIO"}</p><h2>{editingService?"Actualizar servicio":"Crear servicio"}</h2></div><button className="close-button" onClick={()=>{setShowServiceModal(false);setEditingService(null)}}><Icon.Close/></button></div><form onSubmit={handleSaveService}><div className="form-grid"><label className="full-width">Nombre del servicio<input value={serviceForm.name} onChange={e=>setServiceForm(c=>({...c,name:e.target.value}))}/></label><label className="full-width">Descripción<textarea rows={3} value={serviceForm.description} onChange={e=>setServiceForm(c=>({...c,description:e.target.value}))}/></label><label>Duración<select value={serviceForm.duration} onChange={e=>setServiceForm(c=>({...c,duration:e.target.value}))}><option value="15">15 minutos</option><option value="30">30 minutos</option><option value="45">45 minutos</option><option value="60">60 minutos</option><option value="90">90 minutos</option></select></label><label>Precio COP<input type="number" min="0" value={serviceForm.price} onChange={e=>setServiceForm(c=>({...c,price:e.target.value}))}/></label></div><div className="modal-actions"><button type="button" className="cancel-button" onClick={()=>{setShowServiceModal(false);setEditingService(null)}}>Cancelar</button><button type="submit" className="primary-button">{editingService?"Guardar cambios":"Crear servicio"}</button></div></form></div></div>}

    {showTransactionModal&&<div className="modal-overlay"><div className="reservation-modal small-modal"><div className="modal-header"><div><p className="section-label">NUEVO MOVIMIENTO</p><h2>Registrar ingreso o gasto</h2></div><button className="close-button" onClick={()=>setShowTransactionModal(false)}><Icon.Close/></button></div><form onSubmit={handleCreateTransaction}><div className="form-grid">
      <label className="full-width">Concepto<input value={transactionForm.concept} onChange={e=>setTransactionForm(c=>({...c,concept:e.target.value}))} placeholder="Ej: Corte Premium o compra de insumos"/></label>
      <label>Tipo<select value={transactionForm.type} onChange={e=>setTransactionForm(c=>({...c,type:e.target.value as TransactionType,category:e.target.value==="Ingreso"?"Servicio":"Insumos"}))}><option>Ingreso</option><option>Gasto</option></select></label>
      <label>Categoría<input value={transactionForm.category} onChange={e=>setTransactionForm(c=>({...c,category:e.target.value}))}/></label>
      <label>Valor COP<input type="number" min="0" value={transactionForm.amount} onChange={e=>setTransactionForm(c=>({...c,amount:e.target.value}))} placeholder="Ej: 50000"/></label>
      <label>Método de pago<select value={transactionForm.paymentMethod} onChange={e=>setTransactionForm(c=>({...c,paymentMethod:e.target.value as PaymentMethod}))}><option>Efectivo</option><option>Nequi</option><option>Transferencia</option><option>Tarjeta</option></select></label>
    </div><div className="modal-actions"><button type="button" className="cancel-button" onClick={()=>setShowTransactionModal(false)}>Cancelar</button><button type="submit" className="primary-button">Guardar movimiento</button></div></form></div></div>}
  </div>;
}
