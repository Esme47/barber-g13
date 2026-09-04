"use client";

import { useState } from "react";

const Icon = {
  Grid: () => <span>▦</span>,
  Calendar: () => <span>◫</span>,
  Users: () => <span>♙</span>,
  Scissors: () => <span>✂</span>,
  Wallet: () => <span>◈</span>,
  Settings: () => <span>⚙</span>,
  Menu: () => <span>☰</span>,
  Plus: () => <span>＋</span>,
};

const appointments = [
  {
    time: "09:00",
    name: "Carlos Rodríguez",
    service: "Corte Premium",
    initials: "CR",
    status: "Confirmada",
  },
  {
    time: "10:30",
    name: "Juan Martínez",
    service: "Corte + Barba",
    initials: "JM",
    status: "Confirmada",
  },
  {
    time: "12:00",
    name: "Andrés Gómez",
    service: "Experiencia G13",
    initials: "AG",
    status: "Pendiente",
  },
  {
    time: "15:30",
    name: "Miguel Torres",
    service: "Corte Premium",
    initials: "MT",
    status: "Confirmada",
  },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState("Dashboard");

  const menu = [
    { name: "Dashboard", icon: <Icon.Grid /> },
    { name: "Agenda", icon: <Icon.Calendar /> },
    { name: "Clientes", icon: <Icon.Users /> },
    { name: "Servicios", icon: <Icon.Scissors /> },
    { name: "Finanzas", icon: <Icon.Wallet /> },
  ];

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

          <button className="primary-button">
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
            <h2>8</h2>
            <p>
              <strong>+2</strong> vs. ayer
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

              <button className="text-button">Ver agenda →</button>
            </div>

            <div className="appointments">
              {appointments.map((appointment) => (
                <div
                  className="appointment"
                  key={appointment.time + appointment.name}
                >
                  <div className="appointment-time">
                    {appointment.time}
                  </div>

                  <div className="client-avatar">
                    {appointment.initials}
                  </div>

                  <div className="client-details">
                    <strong>{appointment.name}</strong>
                    <span>{appointment.service}</span>
                  </div>

                  <div
                    className={
                      appointment.status === "Pendiente"
                        ? "status pending"
                        : "status"
                    }
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
              {[42, 65, 48, 82, 58, 91, 74].map((height, index) => (
                <div className="chart-column" key={index}>
                  <div
                    className="chart-bar"
                    style={{ height: `${height}%` }}
                  />
                  <span>
                    {["L", "M", "X", "J", "V", "S", "D"][index]}
                  </span>
                </div>
              ))}
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
            <button>
              <Icon.Calendar />
              <span>Ver agenda completa</span>
              →
            </button>

            <button>
              <Icon.Users />
              <span>Registrar cliente</span>
              →
            </button>

            <button>
              <Icon.Scissors />
              <span>Gestionar servicios</span>
              →
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}