"use client";

import { useMemo, useState } from "react";

type AppointmentStatus =
  | "Confirmada"
  | "Pendiente"
  | "En proceso"
  | "Finalizada"
  | "Cancelada";

type Appointment = {
  id: number;
  time: string;
  name: string;
  phone: string;
  service: string;
  barber: string;
  duration: number;
  status: AppointmentStatus;
  notes?: string;
};

type Client = {
  id: number;
  name: string;
  phone: string;
  email?: string;
  visits: number;
  lastService: string;
  registeredAt: string;
};

type Service = {
  id: number;
  name: string;
  description: string;
  duration: number;
  price: number;
  active: boolean;
};

type PaymentMethod =
  | "Efectivo"
  | "Nequi"
  | "Transferencia"
  | "Tarjeta";

type TransactionType = "Ingreso" | "Gasto";

type Transaction = {
  id: number;
  concept: string;
  category: string;
  amount: number;
  type: TransactionType;
  paymentMethod: PaymentMethod;
  time: string;
  date: string;
};

const Icon = {
  Grid: () => <span>▦</span>,
  Calendar: () => <span>◫</span>,
  Users: () => <span>♙</span>,
  Scissors: () => <span>✂</span>,
  Wallet: () => <span>◈</span>,
  Settings: () => <span>⚙</span>,
  Menu: () => <span>☰</span>,
  Plus: () => <span>＋</span>,
  ArrowLeft: () => <span>‹</span>,
  ArrowRight: () => <span>›</span>,
  Close: () => <span>×</span>,
  Phone: () => <span>☎</span>,
  Search: () => <span>⌕</span>,
  Edit: () => <span>✎</span>,
  Trash: () => <span>⌫</span>,
};

const initialAppointments: Appointment[] = [
  {
    id: 1,
    time: "09:00",
    name: "Carlos Rodríguez",
    phone: "+57 300 000 0001",
    service: "Corte Premium",
    barber: "Barbero G13",
    duration: 45,
    status: "Confirmada",
  },
  {
    id: 2,
    time: "10:30",
    name: "Juan Martínez",
    phone: "+57 300 000 0002",
    service: "Corte + Barba",
    barber: "Barbero G13",
    duration: 60,
    status: "Confirmada",
  },
  {
    id: 3,
    time: "12:00",
    name: "Andrés Gómez",
    phone: "+57 300 000 0003",
    service: "Experiencia G13",
    barber: "Barbero G13",
    duration: 60,
    status: "Pendiente",
  },
  {
    id: 4,
    time: "15:30",
    name: "Miguel Torres",
    phone: "+57 300 000 0004",
    service: "Corte Premium",
    barber: "Barbero G13",
    duration: 45,
    status: "Confirmada",
  },
];

const initialClients: Client[] = [
  {
    id: 1,
    name: "Carlos Rodríguez",
    phone: "+57 300 000 0001",
    email: "",
    visits: 8,
    lastService: "Corte Premium",
    registeredAt: "15 ago 2026",
  },
  {
    id: 2,
    name: "Juan Martínez",
    phone: "+57 300 000 0002",
    email: "",
    visits: 5,
    lastService: "Corte + Barba",
    registeredAt: "02 ago 2026",
  },
  {
    id: 3,
    name: "Andrés Gómez",
    phone: "+57 300 000 0003",
    email: "",
    visits: 3,
    lastService: "Experiencia G13",
    registeredAt: "28 ago 2026",
  },
  {
    id: 4,
    name: "Miguel Torres",
    phone: "+57 300 000 0004",
    email: "",
    visits: 12,
    lastService: "Corte Premium",
    registeredAt: "10 jul 2026",
  },
];

const initialServices: Service[] = [
  {
    id: 1,
    name: "Corte Clásico",
    description: "Corte profesional con acabado limpio y preciso.",
    duration: 30,
    price: 25000,
    active: true,
  },
  {
    id: 2,
    name: "Corte Premium",
    description: "Experiencia completa con asesoría y acabado profesional.",
    duration: 45,
    price: 35000,
    active: true,
  },
  {
    id: 3,
    name: "Corte + Barba",
    description: "Servicio integral de corte y diseño de barba.",
    duration: 60,
    price: 50000,
    active: true,
  },
  {
    id: 4,
    name: "Barba Premium",
    description: "Perfilado, diseño y acabado profesional de barba.",
    duration: 30,
    price: 25000,
    active: true,
  },
  {
    id: 5,
    name: "Experiencia G13",
    description: "Servicio premium completo BARBER G13.",
    duration: 60,
    price: 60000,
    active: true,
  },
];

const initialTransactions: Transaction[] = [
  {
    id: 1,
    concept: "Corte Premium",
    category: "Servicio",
    amount: 35000,
    type: "Ingreso",
    paymentMethod: "Efectivo",
    time: "09:30",
    date: "Hoy",
  },
  {
    id: 2,
    concept: "Corte + Barba",
    category: "Servicio",
    amount: 50000,
    type: "Ingreso",
    paymentMethod: "Nequi",
    time: "10:45",
    date: "Hoy",
  },
  {
    id: 3,
    concept: "Compra de insumos",
    category: "Insumos",
    amount: 45000,
    type: "Gasto",
    paymentMethod: "Transferencia",
    time: "11:20",
    date: "Hoy",
  },
  {
    id: 4,
    concept: "Experiencia G13",
    category: "Servicio Premium",
    amount: 60000,
    type: "Ingreso",
    paymentMethod: "Nequi",
    time: "12:30",
    date: "Hoy",
  },
  {
    id: 5,
    concept: "Corte Clásico",
    category: "Servicio",
    amount: 25000,
    type: "Ingreso",
    paymentMethod: "Efectivo",
    time: "14:15",
    date: "Hoy",
  },
];

const hours = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState("Dashboard");

  const [appointments, setAppointments] =
    useState<Appointment[]>(initialAppointments);

  const [clients, setClients] =
    useState<Client[]>(initialClients);

  const [services, setServices] =
    useState<Service[]>(initialServices);

  const [showAppointmentModal, setShowAppointmentModal] =
    useState(false);

  const [showClientModal, setShowClientModal] =
    useState(false);

  const [showServiceModal, setShowServiceModal] =
    useState(false);

  const [editingService, setEditingService] =
    useState<Service | null>(null);

  const [clientSearch, setClientSearch] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");

  const [selectedDate, setSelectedDate] =
    useState(new Date());

  const [appointmentForm, setAppointmentForm] = useState({
    name: "",
    phone: "",
    service: "Corte Clásico",
    barber: "Barbero G13",
    time: "09:00",
    duration: "45",
    notes: "",
  });

  const [clientForm, setClientForm] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    duration: "30",
    price: "",
  });

  const menu = [
    { name: "Dashboard", icon: <Icon.Grid /> },
    { name: "Agenda", icon: <Icon.Calendar /> },
    { name: "Clientes", icon: <Icon.Users /> },
    { name: "Servicios", icon: <Icon.Scissors /> },
    { name: "Finanzas", icon: <Icon.Wallet /> },
  ];

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(value);

  const formatDate = (date: Date) =>
    date.toLocaleDateString("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const getInitials = (name: string) =>
    name
      .split(" ")
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();

  const changeDay = (days: number) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + days);
    setSelectedDate(next);
  };

  const openAppointmentModal = (
    time?: string,
    client?: Client
  ) => {
    setAppointmentForm((current) => ({
      ...current,
      time: time || current.time,
      name: client?.name || current.name,
      phone: client?.phone || current.phone,
    }));

    setShowAppointmentModal(true);
  };

  const handleCreateAppointment = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!appointmentForm.name.trim()) {
      alert("Ingresa el nombre del cliente.");
      return;
    }

    const selectedService = services.find(
      (service) =>
        service.name === appointmentForm.service
    );

    const newAppointment: Appointment = {
      id: Date.now(),
      time: appointmentForm.time,
      name: appointmentForm.name,
      phone: appointmentForm.phone,
      service: appointmentForm.service,
      barber: appointmentForm.barber,
      duration: selectedService?.duration ||
        Number(appointmentForm.duration),
      status: "Confirmada",
      notes: appointmentForm.notes,
    };

    setAppointments((current) =>
      [...current, newAppointment].sort((a, b) =>
        a.time.localeCompare(b.time)
      )
    );

    const existingClient = clients.find(
      (client) =>
        client.phone === appointmentForm.phone ||
        client.name.toLowerCase() ===
          appointmentForm.name.toLowerCase()
    );

    if (!existingClient) {
      setClients((current) => [
        {
          id: Date.now() + 1,
          name: appointmentForm.name,
          phone: appointmentForm.phone,
          visits: 1,
          lastService: appointmentForm.service,
          registeredAt: "Hoy",
        },
        ...current,
      ]);
    }

    setShowAppointmentModal(false);

    setAppointmentForm({
      name: "",
      phone: "",
      service: services[0]?.name || "",
      barber: "Barbero G13",
      time: "09:00",
      duration: "45",
      notes: "",
    });
  };

  const handleCreateClient = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!clientForm.name.trim() || !clientForm.phone.trim()) {
      alert("Nombre y teléfono son obligatorios.");
      return;
    }

    setClients((current) => [
      {
        id: Date.now(),
        name: clientForm.name,
        phone: clientForm.phone,
        email: clientForm.email,
        visits: 0,
        lastService: "Sin servicios registrados",
        registeredAt: "Hoy",
      },
      ...current,
    ]);

    setClientForm({
      name: "",
      phone: "",
      email: "",
    });

    setShowClientModal(false);
  };

  const handleSaveService = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      !serviceForm.name.trim() ||
      !serviceForm.price
    ) {
      alert("Completa el nombre y precio.");
      return;
    }

    if (editingService) {
      setServices((current) =>
        current.map((service) =>
          service.id === editingService.id
            ? {
                ...service,
                name: serviceForm.name,
                description: serviceForm.description,
                duration: Number(serviceForm.duration),
                price: Number(serviceForm.price),
              }
            : service
        )
      );
    } else {
      setServices((current) => [
        ...current,
        {
          id: Date.now(),
          name: serviceForm.name,
          description: serviceForm.description,
          duration: Number(serviceForm.duration),
          price: Number(serviceForm.price),
          active: true,
        },
      ]);
    }

    setShowServiceModal(false);
    setEditingService(null);

    setServiceForm({
      name: "",
      description: "",
      duration: "30",
      price: "",
    });
  };

  const openEditService = (service: Service) => {
    setEditingService(service);

    setServiceForm({
      name: service.name,
      description: service.description,
      duration: String(service.duration),
      price: String(service.price),
    });

    setShowServiceModal(true);
  };

  const toggleService = (id: number) => {
    setServices((current) =>
      current.map((service) =>
        service.id === id
          ? { ...service, active: !service.active }
          : service
      )
    );
  };

  const deleteService = (id: number) => {
    const confirmDelete = window.confirm(
      "¿Deseas eliminar este servicio?"
    );

    if (!confirmDelete) return;

    setServices((current) =>
      current.filter((service) => service.id !== id)
    );
  };

  const updateStatus = (
    id: number,
    status: AppointmentStatus
  ) => {
    setAppointments((current) =>
      current.map((appointment) =>
        appointment.id === id
          ? { ...appointment, status }
          : appointment
      )
    );
  };

  const filteredClients = useMemo(
    () =>
      clients.filter((client) => {
        const search = clientSearch.toLowerCase();

        return (
          client.name.toLowerCase().includes(search) ||
          client.phone.toLowerCase().includes(search)
        );
      }),
    [clients, clientSearch]
  );

  const filteredServices = useMemo(
    () =>
      services.filter((service) =>
        service.name
          .toLowerCase()
          .includes(serviceSearch.toLowerCase())
      ),
    [services, serviceSearch]
  );

  const getAppointmentsByHour = (hour: string) =>
    appointments.filter((appointment) =>
      appointment.time.startsWith(hour)
    );

  const renderDashboard = () => (
    <>
      <section className="welcome">
        <div>
          <p className="section-label">PANEL DE CONTROL</p>

          <h1>
            Buenos días, <em>G13.</em> 👋
          </h1>

          <p className="welcome-text">
            Aquí tienes el resumen de tu barbería para hoy.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => {
            setActive("Agenda");
            setShowAppointmentModal(true);
          }}
        >
          <Icon.Plus />
          Nueva reserva
        </button>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-header">
            <span>CITAS DE HOY</span>
            <Icon.Calendar />
          </div>
          <h2>{appointments.length}</h2>
          <p><strong>Agenda activa</strong></p>
        </article>

        <article className="stat-card">
          <div className="stat-header">
            <span>INGRESOS HOY</span>
            <Icon.Wallet />
          </div>
          <h2>$285K</h2>
          <p><strong>+18%</strong> vs. ayer</p>
        </article>

        <article className="stat-card">
          <div className="stat-header">
            <span>CLIENTES</span>
            <Icon.Users />
          </div>
          <h2>{clients.length}</h2>
          <p><strong>Base de clientes</strong></p>
        </article>

        <article className="stat-card gold-card">
          <div className="stat-header">
            <span>SERVICIOS</span>
            <Icon.Scissors />
          </div>
          <h2>
            {services.filter((service) => service.active).length}
          </h2>
          <p>Servicios activos</p>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel appointments-panel">
          <div className="panel-header">
            <div>
              <p className="section-label">AGENDA</p>
              <h2>Próximas citas</h2>
            </div>

            <button
              className="text-button"
              onClick={() => setActive("Agenda")}
            >
              Ver agenda →
            </button>
          </div>

          <div className="appointments">
            {appointments.slice(0, 4).map((appointment) => (
              <div className="appointment" key={appointment.id}>
                <div className="appointment-time">
                  {appointment.time}
                </div>

                <div className="client-avatar">
                  {getInitials(appointment.name)}
                </div>

                <div className="client-details">
                  <strong>{appointment.name}</strong>
                  <span>{appointment.service}</span>
                </div>

                <div
                  className={`status status-${appointment.status
                    .toLowerCase()
                    .replace(" ", "-")}`}
                >
                  {appointment.status}
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel performance-panel">
          <div className="panel-header">
            <div>
              <p className="section-label">RENDIMIENTO</p>
              <h2>Esta semana</h2>
            </div>

            <span className="month-pill">Septiembre</span>
          </div>

          <div className="chart">
            {[42, 65, 48, 82, 58, 91, 74].map(
              (height, index) => (
                <div className="chart-column" key={index}>
                  <div
                    className="chart-bar"
                    style={{ height: `${height}%` }}
                  />
                  <span>
                    {["L", "M", "X", "J", "V", "S", "D"][index]}
                  </span>
                </div>
              )
            )}
          </div>

          <div className="chart-total">
            <span>Ingresos estimados</span>
            <strong>$1.840.000</strong>
          </div>
        </article>
      </section>
    </>
  );

  const renderAgenda = () => (
    <section className="agenda-page">
      <div className="agenda-heading">
        <div>
          <p className="section-label">GESTIÓN DE RESERVAS</p>
          <h1>Agenda <em>Profesional</em></h1>
          <p className="welcome-text">
            Administra las citas y disponibilidad de BARBER G13.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowAppointmentModal(true)}
        >
          <Icon.Plus />
          Nueva reserva
        </button>
      </div>

      <div className="agenda-toolbar">
        <div className="date-navigation">
          <button onClick={() => changeDay(-1)}>
            <Icon.ArrowLeft />
          </button>

          <div>
            <span className="date-label">AGENDA DEL DÍA</span>
            <strong>{formatDate(selectedDate)}</strong>
          </div>

          <button onClick={() => changeDay(1)}>
            <Icon.ArrowRight />
          </button>
        </div>

        <button
          className="today-button"
          onClick={() => setSelectedDate(new Date())}
        >
          Hoy
        </button>
      </div>

      <div className="agenda-summary">
        <div>
          <span>RESERVAS</span>
          <strong>{appointments.length}</strong>
        </div>
        <div>
          <span>CONFIRMADAS</span>
          <strong>
            {appointments.filter(
              (item) => item.status === "Confirmada"
            ).length}
          </strong>
        </div>
        <div>
          <span>PENDIENTES</span>
          <strong>
            {appointments.filter(
              (item) => item.status === "Pendiente"
            ).length}
          </strong>
        </div>
        <div>
          <span>DISPONIBILIDAD</span>
          <strong className="gold-text">Disponible</strong>
        </div>
      </div>

      <div className="agenda-layout">
        <article className="agenda-timeline panel">
          <div className="timeline-header">
            <span>HORA</span>
            <span>RESERVAS PROGRAMADAS</span>
          </div>

          {hours.map((hour) => {
            const hourAppointments =
              getAppointmentsByHour(hour);

            return (
              <div className="timeline-row" key={hour}>
                <div className="timeline-time">{hour}</div>

                <div className="timeline-content">
                  {hourAppointments.length === 0 ? (
                    <button
                      className="available-slot"
                      onClick={() => openAppointmentModal(hour)}
                    >
                      + Horario disponible
                    </button>
                  ) : (
                    hourAppointments.map((appointment) => (
                      <div
                        className="agenda-appointment"
                        key={appointment.id}
                      >
                        <div className="agenda-client-avatar">
                          {getInitials(appointment.name)}
                        </div>

                        <div className="agenda-client-info">
                          <strong>{appointment.name}</strong>
                          <span>
                            {appointment.service} · {appointment.duration} min
                          </span>
                          <small>
                            <Icon.Phone /> {appointment.phone}
                          </small>
                        </div>

                        <select
                          value={appointment.status}
                          onChange={(event) =>
                            updateStatus(
                              appointment.id,
                              event.target
                                .value as AppointmentStatus
                            )
                          }
                          className={`status-select status-${appointment.status
                            .toLowerCase()
                            .replace(" ", "-")}`}
                        >
                          <option>Confirmada</option>
                          <option>Pendiente</option>
                          <option>En proceso</option>
                          <option>Finalizada</option>
                          <option>Cancelada</option>
                        </select>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </article>

        <aside className="agenda-sidebar">
          <article className="panel">
            <p className="section-label">RESUMEN DEL DÍA</p>
            <h2>Tu jornada</h2>

            <div className="day-progress">
              <div className="progress-circle">
                <strong>78%</strong>
                <span>ocupación</span>
              </div>

              <div className="progress-info">
                <p>
                  <strong>{appointments.length}</strong>
                  citas programadas
                </p>
                <p>
                  <strong>{hours.length - appointments.length}</strong>
                  espacios disponibles
                </p>
              </div>
            </div>
          </article>
        </aside>
      </div>
    </section>
  );

  const renderClients = () => (
    <section className="module-page">
      <div className="module-heading">
        <div>
          <p className="section-label">BASE DE DATOS LOCAL</p>
          <h1>Clientes <em>G13</em></h1>
          <p className="welcome-text">
            Gestiona y consulta la información de tus clientes.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowClientModal(true)}
        >
          <Icon.Plus />
          Nuevo cliente
        </button>
      </div>

      <div className="module-stats">
        <div className="mini-stat">
          <span>CLIENTES REGISTRADOS</span>
          <strong>{clients.length}</strong>
        </div>

        <div className="mini-stat">
          <span>CLIENTES FRECUENTES</span>
          <strong>
            {clients.filter((client) => client.visits >= 5).length}
          </strong>
        </div>

        <div className="mini-stat">
          <span>NUEVOS</span>
          <strong>
            {clients.filter(
              (client) => client.registeredAt === "Hoy"
            ).length}
          </strong>
        </div>
      </div>

      <div className="search-bar">
        <Icon.Search />
        <input
          type="text"
          placeholder="Buscar por nombre o teléfono..."
          value={clientSearch}
          onChange={(event) =>
            setClientSearch(event.target.value)
          }
        />
      </div>

      <div className="clients-list">
        {filteredClients.length === 0 ? (
          <div className="empty-state">
            <Icon.Users />
            <h3>No encontramos clientes</h3>
            <p>Prueba con otra búsqueda o registra un nuevo cliente.</p>
          </div>
        ) : (
          filteredClients.map((client) => (
            <article className="client-card" key={client.id}>
              <div className="large-avatar">
                {getInitials(client.name)}
              </div>

              <div className="client-main">
                <h3>{client.name}</h3>
                <span>{client.phone}</span>
                {client.email && <small>{client.email}</small>}
              </div>

              <div className="client-metric">
                <span>VISITAS</span>
                <strong>{client.visits}</strong>
              </div>

              <div className="client-service">
                <span>ÚLTIMO SERVICIO</span>
                <strong>{client.lastService}</strong>
              </div>

              <button
                className="client-action"
                onClick={() => {
                  setActive("Agenda");
                  openAppointmentModal(undefined, client);
                }}
              >
                <Icon.Calendar />
                Nueva cita
              </button>
            </article>
          ))
        )}
      </div>
    </section>
  );

  const renderServices = () => (
    <section className="module-page">
      <div className="module-heading">
        <div>
          <p className="section-label">CATÁLOGO COMERCIAL</p>
          <h1>Servicios <em>G13</em></h1>
          <p className="welcome-text">
            Configura los servicios disponibles en tu barbería.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => {
            setEditingService(null);
            setServiceForm({
              name: "",
              description: "",
              duration: "30",
              price: "",
            });
            setShowServiceModal(true);
          }}
        >
          <Icon.Plus />
          Nuevo servicio
        </button>
      </div>

      <div className="search-bar">
        <Icon.Search />
        <input
          type="text"
          placeholder="Buscar servicio..."
          value={serviceSearch}
          onChange={(event) =>
            setServiceSearch(event.target.value)
          }
        />
      </div>

      <div className="services-grid">
        {filteredServices.map((service) => (
          <article
            className={`service-card ${
              !service.active ? "service-inactive" : ""
            }`}
            key={service.id}
          >
            <div className="service-top">
              <div className="service-icon">
                <Icon.Scissors />
              </div>

              <label className="switch">
                <input
                  type="checkbox"
                  checked={service.active}
                  onChange={() => toggleService(service.id)}
                />
                <span />
              </label>
            </div>

            <h3>{service.name}</h3>
            <p>{service.description}</p>

            <div className="service-details">
              <div>
                <span>DURACIÓN</span>
                <strong>{service.duration} min</strong>
              </div>

              <div>
                <span>PRECIO</span>
                <strong>{formatCurrency(service.price)}</strong>
              </div>
            </div>

            <div className="service-actions">
              <button onClick={() => openEditService(service)}>
                <Icon.Edit />
                Editar
              </button>

              <button
                className="delete-button"
                onClick={() => deleteService(service.id)}
              >
                <Icon.Trash />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );

  const renderPlaceholder = () => (
    <section className="placeholder-page">
      <p className="section-label">PRÓXIMO MÓDULO</p>
      <h1>{active} <em>BARBER G13</em></h1>
      <p>Este módulo será desarrollado en el siguiente bloque.</p>
    </section>
  );

  return (
    <div className="app-shell">
      {menuOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="brand">
          BARBER <strong>G13</strong>
        </div>

        <p className="brand-subtitle">GESTIÓN PROFESIONAL</p>

        <nav className="navigation">
          {menu.map((item) => (
            <button
              key={item.name}
              className={active === item.name ? "active" : ""}
              onClick={() => {
                setActive(item.name);
                setMenuOpen(false);
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="settings">
            <Icon.Settings />
            Configuración
          </button>

          <div className="profile">
            <div className="profile-avatar">G13</div>
            <div>
              <strong>Administrador</strong>
              <small>BARBER G13</small>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button
            className="menu-button"
            onClick={() => setMenuOpen(true)}
          >
            <Icon.Menu />
          </button>

          <div className="breadcrumb">
            BARBER G13 <span>/</span> <strong>{active}</strong>
          </div>

          <div className="top-profile">
            <span>GESTIÓN PROFESIONAL</span>
            <div className="top-avatar">A</div>
          </div>
        </header>

        {active === "Dashboard" && renderDashboard()}
        {active === "Agenda" && renderAgenda()}
        {active === "Clientes" && renderClients()}
        {active === "Servicios" && renderServices()}

        {active !== "Dashboard" &&
          active !== "Agenda" &&
          active !== "Clientes" &&
          active !== "Servicios" &&
          renderPlaceholder()}
      </main>

      {showAppointmentModal && (
        <div className="modal-overlay">
          <div className="reservation-modal">
            <div className="modal-header">
              <div>
                <p className="section-label">NUEVA RESERVA</p>
                <h2>Registrar cita</h2>
              </div>

              <button
                className="close-button"
                onClick={() => setShowAppointmentModal(false)}
              >
                <Icon.Close />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment}>
              <div className="form-grid">
                <label className="full-width">
                  Nombre del cliente
                  <input
                    type="text"
                    placeholder="Ej: Juan Pérez"
                    value={appointmentForm.name}
                    onChange={(event) =>
                      setAppointmentForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Teléfono
                  <input
                    type="tel"
                    placeholder="+57 300 0000000"
                    value={appointmentForm.phone}
                    onChange={(event) =>
                      setAppointmentForm((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Servicio
                  <select
                    value={appointmentForm.service}
                    onChange={(event) => {
                      const service = services.find(
                        (item) => item.name === event.target.value
                      );

                      setAppointmentForm((current) => ({
                        ...current,
                        service: event.target.value,
                        duration: String(service?.duration || 45),
                      }));
                    }}
                  >
                    {services
                      .filter((service) => service.active)
                      .map((service) => (
                        <option key={service.id}>
                          {service.name}
                        </option>
                      ))}
                  </select>
                </label>

                <label>
                  Hora
                  <select
                    value={appointmentForm.time}
                    onChange={(event) =>
                      setAppointmentForm((current) => ({
                        ...current,
                        time: event.target.value,
                      }))
                    }
                  >
                    {hours.map((hour) => (
                      <option key={hour}>{hour}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Duración
                  <input
                    type="text"
                    readOnly
                    value={`${appointmentForm.duration} minutos`}
                  />
                </label>

                <label className="full-width">
                  Notas
                  <textarea
                    rows={3}
                    placeholder="Información adicional..."
                    value={appointmentForm.notes}
                    onChange={(event) =>
                      setAppointmentForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowAppointmentModal(false)}
                >
                  Cancelar
                </button>

                <button type="submit" className="primary-button">
                  <Icon.Calendar />
                  Confirmar reserva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showClientModal && (
        <div className="modal-overlay">
          <div className="reservation-modal small-modal">
            <div className="modal-header">
              <div>
                <p className="section-label">NUEVO CLIENTE</p>
                <h2>Registrar cliente</h2>
              </div>

              <button
                className="close-button"
                onClick={() => setShowClientModal(false)}
              >
                <Icon.Close />
              </button>
            </div>

            <form onSubmit={handleCreateClient}>
              <div className="form-grid">
                <label className="full-width">
                  Nombre completo
                  <input
                    value={clientForm.name}
                    onChange={(event) =>
                      setClientForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Nombre del cliente"
                  />
                </label>

                <label>
                  Teléfono
                  <input
                    value={clientForm.phone}
                    onChange={(event) =>
                      setClientForm((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    placeholder="+57..."
                  />
                </label>

                <label>
                  Email
                  <input
                    type="email"
                    value={clientForm.email}
                    onChange={(event) =>
                      setClientForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder="Opcional"
                  />
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowClientModal(false)}
                >
                  Cancelar
                </button>

                <button type="submit" className="primary-button">
                  Guardar cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showServiceModal && (
        <div className="modal-overlay">
          <div className="reservation-modal">
            <div className="modal-header">
              <div>
                <p className="section-label">
                  {editingService
                    ? "EDITAR SERVICIO"
                    : "NUEVO SERVICIO"}
                </p>

                <h2>
                  {editingService
                    ? "Actualizar servicio"
                    : "Crear servicio"}
                </h2>
              </div>

              <button
                className="close-button"
                onClick={() => {
                  setShowServiceModal(false);
                  setEditingService(null);
                }}
              >
                <Icon.Close />
              </button>
            </div>

            <form onSubmit={handleSaveService}>
              <div className="form-grid">
                <label className="full-width">
                  Nombre del servicio
                  <input
                    value={serviceForm.name}
                    onChange={(event) =>
                      setServiceForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Ej: Corte Ejecutivo"
                  />
                </label>

                <label className="full-width">
                  Descripción
                  <textarea
                    rows={3}
                    value={serviceForm.description}
                    onChange={(event) =>
                      setServiceForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Duración
                  <select
                    value={serviceForm.duration}
                    onChange={(event) =>
                      setServiceForm((current) => ({
                        ...current,
                        duration: event.target.value,
                      }))
                    }
                  >
                    <option value="15">15 minutos</option>
                    <option value="30">30 minutos</option>
                    <option value="45">45 minutos</option>
                    <option value="60">60 minutos</option>
                    <option value="90">90 minutos</option>
                  </select>
                </label>

                <label>
                  Precio COP
                  <input
                    type="number"
                    min="0"
                    value={serviceForm.price}
                    onChange={(event) =>
                      setServiceForm((current) => ({
                        ...current,
                        price: event.target.value,
                      }))
                    }
                    placeholder="Ej: 35000"
                  />
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setShowServiceModal(false);
                    setEditingService(null);
                  }}
                >
                  Cancelar
                </button>

                <button type="submit" className="primary-button">
                  {editingService
                    ? "Guardar cambios"
                    : "Crear servicio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
