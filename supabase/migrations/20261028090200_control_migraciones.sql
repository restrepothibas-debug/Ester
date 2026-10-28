-- =============================================================================
-- Control de migraciones aplicadas.
-- Permite que scripts/aplicar-migraciones.py sea idempotente: no vuelve a
-- ejecutar un archivo que ya consta aquí.
-- =============================================================================

create table if not exists public.migraciones_aplicadas (
  nombre     text primary key,
  aplicada_en timestamptz not null default now()
);

comment on table public.migraciones_aplicadas is
  'Registro de migraciones ya ejecutadas. Sin políticas RLS: solo accesible con la clave de servidor o como postgres.';

alter table public.migraciones_aplicadas enable row level security;

-- Las dos migraciones anteriores ya se aplicaron el 28/10/2026.
insert into public.migraciones_aplicadas (nombre) values
  ('20261028090000_esquema_inicial.sql'),
  ('20261028090100_rls_politicas.sql')
on conflict (nombre) do nothing;
