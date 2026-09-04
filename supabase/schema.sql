
-- =====================================================
-- BARBER G13
-- Estructura inicial de base de datos para Supabase
-- =====================================================

-- CLIENTES
create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text,
  email text,
  created_at timestamptz default now()
);

-- BARBEROS
create table if not exists barberos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text,
  activo boolean default true,
  created_at timestamptz default now()
);

-- SERVICIOS
create table if not exists servicios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  precio numeric(10,2) not null,
  duracion_minutos integer not null,
  activo boolean default true,
  created_at timestamptz default now()
);

-- CITAS
create table if not exists citas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id) on delete cascade,
  barbero_id uuid references barberos(id) on delete set null,
  servicio_id uuid references servicios(id) on delete set null,
  fecha date not null,
  hora time not null,
  estado text default 'pendiente',
  notas text,
  created_at timestamptz default now()
);

-- VENTAS
create table if not exists ventas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id) on delete set null,
  barbero_id uuid references barberos(id) on delete set null,
  total numeric(10,2) not null,
  metodo_pago text,
  estado text default 'pagada',
  created_at timestamptz default now()
);

-- COMISIONES
create table if not exists comisiones (
  id uuid primary key default gen_random_uuid(),
  barbero_id uuid references barberos(id) on delete cascade,
  venta_id uuid references ventas(id) on delete cascade,
  porcentaje numeric(5,2),
  valor numeric(10,2),
  created_at timestamptz default now()
);
