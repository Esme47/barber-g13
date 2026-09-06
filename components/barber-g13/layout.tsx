import type { ReactNode } from "react";
import { Icon, getInitials } from "./ui";

export type NavigationItem = { name: string; icon: ReactNode };

type SidebarProps = {
  menu: NavigationItem[];
  menuOpen: boolean;
  active: string;
  staffName: string;
  staffRole: string;
  onClose: () => void;
  onNavigate: (name: string) => void;
  onLogout: () => void;
};

export function Sidebar({ menu, menuOpen, active, staffName, staffRole, onClose, onNavigate, onLogout }: SidebarProps) {
  return <aside className={`sidebar ${menuOpen ? "open" : ""}`}><div className="brand">BARBER <strong>G13</strong></div><p className="brand-subtitle">GESTIÓN PROFESIONAL</p><nav className="navigation">{menu.map(item=><button key={item.name} className={active===item.name?"active":""} onClick={()=>{onNavigate(item.name);onClose();}}><span className="nav-icon">{item.icon}</span>{item.name}</button>)}</nav><div className="sidebar-footer"><button className="settings"><Icon.Settings/>Configuración</button><button className="settings" onClick={onLogout}>Cerrar sesión</button><div className="profile"><div className="profile-avatar">{getInitials(staffName)}</div><div><strong>{staffName}</strong><small>{staffRole}</small></div></div></div></aside>;
}

type TopbarProps = { active: string; staffName: string; staffRole: string; onOpenMenu: () => void; };

export function Topbar({ active, staffName, staffRole, onOpenMenu }: TopbarProps) {
  return <header className="topbar"><button className="menu-button" onClick={onOpenMenu}><Icon.Menu/></button><div className="breadcrumb">BARBER G13 <span>/</span> <strong>{active}</strong></div><div className="top-profile"><span>{staffRole}</span><div className="top-avatar">{getInitials(staffName)}</div></div></header>;
}
