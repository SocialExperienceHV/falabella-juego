-- Ejecutar en Supabase SQL Editor

create table participantes (
  cedula        text primary key,
  puntos_total  integer default 0,
  estacion_1    integer default 0,
  estacion_2    integer default 0,
  estacion_3    integer default 0,
  estacion_4    integer default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Habilitar tiempo real
alter publication supabase_realtime add table participantes;

-- Acceso público (sin autenticación para el evento)
alter table participantes enable row level security;

create policy "Lectura pública"
  on participantes for select
  using (true);

create policy "Inserción pública"
  on participantes for insert
  with check (true);

create policy "Actualización pública"
  on participantes for update
  using (true);
