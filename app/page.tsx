"use client";

import { useState } from "react";

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
  Clock: () => <span>◷</span>,
  Phone: () => <span>☎</span>,
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

const services = [
  "Corte Clásico",
  "Corte Premium",
  "Corte + Barba",
  "Barba Premium",
  "Experiencia G13",
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

  const [showModal, setShowModal] = useState(false);

  const [selectedDate, setSelectedDate] = useState(new Date());

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    service: "Corte Clásico",
    barber: "Barbero G13",
    time: "09:00",
    duration: "45",
    notes: "",
  });

  const menu = [
    { name: "Dashboard", icon: <Icon.Grid /> },
    { name: "Agenda", icon: <Icon.Calendar /> },
    { name: "Clientes", icon: <Icon.Users /> },
    { name: "Servicios", icon: <Icon.Scissors /> },
    { name: "Finanzas", icon: <Icon.Wallet /> },
  ];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const changeDay = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const handleCreateAppointment = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      alert("Por favor ingresa el nombre del cliente.");
      return;
    }

    const newAppointment: Appointment = {
      id: Date.now(),
      time: formData.time,
      name: formData.name,
      phone: formData.phone,
      service: formData.service,
      barber: formData.barber,
      duration: Number(formData.duration),
      status: "Confirmada",
      notes: formData.notes,
    };

    setAppointments((current) =>
      [...current, newAppointment].sort((a, b) =>
        a.time.localeCompare(b.time)
      )
    );

    setShowModal(false);

    setFormData({
      name: "",
      phone: "",
      service: "Corte Clásico",
      barber: "Barbero G13",
      time: "09:00",
      duration: "45",
      notes: "",
    });
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

  const getAppointmentsByHour = (hour: string) => {
    return appointments.filter((appointment) =>
      appointment.time.startsWith(hour)
    );
  };

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
            setShowModal(true);
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

          <p>
            <strong>Agenda activa</strong>
          </p>
        </article>

        <article className="stat-card">
          <div className="stat-header">
            <span>INGRESOS HOY</span>
            <Icon.Wallet />
          </div>

          <h2>$285K</h2>

          <p>
            <strong>+18%</strong> vs. ayer
          </p>
        </article>

        <article className="stat-card">
          <div className="stat-header">
            <span>CLIENTES</span>
            <Icon.Users />
          </div>

          <h2>248</h2>

          <p>
            <strong>+12</strong> este mes
          </p>
        </article>

        <article className="stat-card gold-card">
          <div className="stat-header">
            <span>OCUPACIÓN</span>
            <Icon.Scissors />
          </div>

          <h2>78%</h2>

          <p>Disponibilidad saludable</p>
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
              <div
                className="appointment"
                key={appointment.id}
              >
                <div className="appointment-time">
                  {appointment.time}
                </div>

                <div className="client-avatar">
                  {appointment.name
                    .split(" ")
                    .slice(0, 2)
                    .map((word) => word[0])
                    .join("")}
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
                <div
                  className="chart-column"
                  key={index}
                >
                  <div
                    className="chart-bar"
                    style={{ height: `${height}%` }}
                  />

                  <span>
                    {["L", "M", "X", "J", "V", "S", "D"][
                      index
                    ]}
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

      <section className="quick-section">
        <p className="section-label">ACCESOS RÁPIDOS</p>

        <div className="quick-grid">
          <button onClick={() => setActive("Agenda")}>
            <Icon.Calendar />
            <span>Ver agenda completa</span>
            →
          </button>

          <button onClick={() => setActive("Clientes")}>
            <Icon.Users />
            <span>Registrar cliente</span>
            →
          </button>

          <button onClick={() => setActive("Servicios")}>
            <Icon.Scissors />
            <span>Gestionar servicios</span>
            →
          </button>
        </div>
      </section>
    </>
  );

  const renderAgenda = () => (
    <section className="agenda-page">
      <div className="agenda-heading">
        <div>
          <p className="section-label">GESTIÓN DE RESERVAS</p>

          <h1>
            Agenda <em>Profesional</em>
          </h1>

          <p className="welcome-text">
            Administra las citas y disponibilidad de BARBER G13.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowModal(true)}
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
            {
              appointments.filter(
                (appointment) =>
                  appointment.status === "Confirmada"
              ).length
            }
          </strong>
        </div>

        <div>
          <span>PENDIENTES</span>
          <strong>
            {
              appointments.filter(
                (appointment) =>
                  appointment.status === "Pendiente"
              ).length
            }
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
              <div
                className="timeline-row"
                key={hour}
              >
                <div className="timeline-time">{hour}</div>

                <div className="timeline-content">
                  {hourAppointments.length === 0 ? (
                    <button
                      className="available-slot"
                      onClick={() => {
                        setFormData((current) => ({
                          ...current,
                          time: hour,
                        }));

                        setShowModal(true);
                      }}
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
                          {appointment.name
                            .split(" ")
                            .slice(0, 2)
                            .map((word) => word[0])
                            .join("")}
                        </div>

                        <div className="agenda-client-info">
                          <strong>{appointment.name}</strong>

                          <span>
                            {appointment.service} ·{" "}
                            {appointment.duration} min
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
                  <strong>4</strong>
                  espacios disponibles
                </p>
              </div>
            </div>
          </article>

          <article className="panel next-appointment">
            <p className="section-label">PRÓXIMA CITA</p>

            {appointments.length > 0 ? (
              <>
                <div className="next-time">
                  {appointments[0].time}
                </div>

                <h3>{appointments[0].name}</h3>

                <p>{appointments[0].service}</p>

                <button
                  className="secondary-button"
                  onClick={() =>
                    updateStatus(
                      appointments[0].id,
                      "En proceso"
                    )
                  }
                >
                  Iniciar servicio
                </button>
              </>
            ) : (
              <p className="empty-text">
                No hay citas programadas.
              </p>
            )}
          </article>
        </aside>
      </div>
    </section>
  );

  const renderPlaceholder = () => (
    <section className="placeholder-page">
      <p className="section-label">MÓDULO EN CONSTRUCCIÓN</p>

      <h1>
        {active} <em>BARBER G13</em>
      </h1>

      <p>
        Este módulo será desarrollado en los próximos
        bloques del sistema.
      </p>
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

      <aside
        className={`sidebar ${
          menuOpen ? "open" : ""
        }`}
      >
        <div className="brand">
          BARBER <strong>G13</strong>
        </div>

        <p className="brand-subtitle">
          GESTIÓN PROFESIONAL
        </p>

        <nav className="navigation">
          {menu.map((item) => (
            <button
              key={item.name}
              className={
                active === item.name ? "active" : ""
              }
              onClick={() => {
                setActive(item.name);
                setMenuOpen(false);
              }}
            >
              <span className="nav-icon">
                {item.icon}
              </span>

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
            BARBER G13 <span>/</span>{" "}
            <strong>{active}</strong>
          </div>

          <div className="top-profile">
            <span>GESTIÓN PROFESIONAL</span>
            <div className="top-avatar">A</div>
          </div>
        </header>

        {active === "Dashboard" && renderDashboard()}

        {active === "Agenda" && renderAgenda()}

        {active !== "Dashboard" &&
          active !== "Agenda" &&
          renderPlaceholder()}
      </main>

      {showModal && (
        <div className="modal-overlay">
          <div className="reservation-modal">
            <div className="modal-header">
              <div>
                <p className="section-label">
                  NUEVA RESERVA
                </p>

                <h2>Registrar cita</h2>
              </div>

              <button
                className="close-button"
                onClick={() => setShowModal(false)}
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
                    value={formData.name}
                    onChange={(event) =>
                      setFormData((current) => ({
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
                    value={formData.phone}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Servicio
                  <select
                    value={formData.service}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        service: event.target.value,
                      }))
                    }
                  >
                    {services.map((service) => (
                      <option key={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Barbero
                  <select
                    value={formData.barber}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        barber: event.target.value,
                      }))
                    }
                  >
                    <option>Barbero G13</option>
                  </select>
                </label>

                <label>
                  Hora
                  <select
                    value={formData.time}
                    onChange={(event) =>
                      setFormData((current) => ({
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
                  <select
                    value={formData.duration}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        duration: event.target.value,
                      }))
                    }
                  >
                    <option value="30">30 minutos</option>
                    <option value="45">45 minutos</option>
                    <option value="60">60 minutos</option>
                    <option value="90">90 minutos</option>
                  </select>
                </label>

                <label className="full-width">
                  Notas
                  <textarea
                    rows={3}
                    placeholder="Información adicional..."
                    value={formData.notes}
                    onChange={(event) =>
                      setFormData((current) => ({
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
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="primary-button"
                >
                  <Icon.Calendar />
                  Confirmar reserva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}