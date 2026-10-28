-- =============================================================================
-- Dayara store — esquema inicial
-- Basado en la especificación §6, §7, §8, §9, §14 y los puntos 43–67.
-- Autor: Accio · 28/10/2026
--
-- NO EJECUTAR a mano en producción sin respaldo.
-- Aplicar con: scripts/aplicar-migraciones.sh  (ver supabase/README.md)
-- =============================================================================

create extension if not exists pg_trgm;

-- -----------------------------------------------------------------------------
-- Tipos enumerados
-- -----------------------------------------------------------------------------
create type estado_producto as enum
  ('pendiente_revision', 'borrador', 'publicado', 'agotado', 'archivado');

create type tipo_movimiento as enum
  ('entrada', 'venta', 'ajuste', 'devolucion');

create type tipo_precio as enum
  ('normal', 'promocional');

create type tipo_promocion as enum
  ('manual', 'programada');

create type estado_solicitud as enum
  ('pendiente', 'confirmada', 'cancelada');

create type tipo_seleccion as enum
  ('destacado', 'oferta_semana');

create type rol_usuario as enum
  ('administrador');

-- -----------------------------------------------------------------------------
-- Utilidad: mantener actualizado_en
-- -----------------------------------------------------------------------------
create or replace function public.tocar_actualizado_en()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- perfiles — cuenta administradora (apoyada en auth.users)
-- -----------------------------------------------------------------------------
create table public.perfiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  nombre      text not null,
  rol         rol_usuario not null default 'administrador',
  activo      boolean not null default true,
  creado_en   timestamptz not null default now()
);

comment on table public.perfiles is
  'Perfil de la cuenta administradora. Las contraseñas las gestiona Supabase Auth.';

-- -----------------------------------------------------------------------------
-- marcas
-- -----------------------------------------------------------------------------
create table public.marcas (
  id                 uuid primary key default gen_random_uuid(),
  nombre             text not null,
  nombre_normalizado text not null unique,
  logo_ruta          text,
  activa             boolean not null default true,
  creado_en          timestamptz not null default now(),
  actualizado_en     timestamptz not null default now()
);

comment on column public.marcas.nombre_normalizado is
  'Nombre en minúsculas, sin tildes ni espacios dobles: evita duplicados por variaciones de escritura (§11).';

create trigger trg_marcas_actualizado
  before update on public.marcas
  for each row execute function public.tocar_actualizado_en();

-- -----------------------------------------------------------------------------
-- productos
-- -----------------------------------------------------------------------------
create table public.productos (
  id             uuid primary key default gen_random_uuid(),
  codigo_interno text not null unique,
  marca_id       uuid not null references public.marcas (id) on delete restrict,
  modelo         text not null,
  referencia     text,
  color          text,
  precio_normal  numeric(12, 2) not null check (precio_normal >= 0),
  estado         estado_producto not null default 'pendiente_revision',
  slug           text not null unique,
  publicado_en   timestamptz,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

comment on table public.productos is
  'El precio promocional NO vive aquí: es un registro de promociones con vigencia (§9).';
comment on column public.productos.estado is
  'Por defecto pendiente_revision: nada se publica solo (§6).';

create trigger trg_productos_actualizado
  before update on public.productos
  for each row execute function public.tocar_actualizado_en();

create index idx_productos_estado on public.productos (estado);
create index idx_productos_marca_estado on public.productos (marca_id, estado);
create index idx_productos_modelo_trgm on public.productos using gin (modelo gin_trgm_ops);
create index idx_productos_referencia_trgm on public.productos using gin (referencia gin_trgm_ops);
create index idx_productos_color_trgm on public.productos using gin (color gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- producto_imagenes
-- -----------------------------------------------------------------------------
create table public.producto_imagenes (
  id          uuid primary key default gen_random_uuid(),
  producto_id uuid not null references public.productos (id) on delete cascade,
  ruta        text not null,
  principal   boolean not null default false,
  orden       integer not null default 0 check (orden >= 0),
  creado_en   timestamptz not null default now()
);

-- Una sola imagen principal por producto (§6, punto 52)
create unique index uq_imagen_principal
  on public.producto_imagenes (producto_id)
  where principal;

create index idx_imagenes_producto on public.producto_imagenes (producto_id, orden);

-- -----------------------------------------------------------------------------
-- producto_tallas — inventario por talla
-- -----------------------------------------------------------------------------
create table public.producto_tallas (
  id             uuid primary key default gen_random_uuid(),
  producto_id    uuid not null references public.productos (id) on delete cascade,
  talla          text not null,
  cantidad       integer not null default 0 check (cantidad >= 0),
  actualizado_en timestamptz not null default now(),
  unique (producto_id, talla)
);

create index idx_tallas_disponibles
  on public.producto_tallas (producto_id)
  where cantidad > 0;

create trigger trg_tallas_actualizado
  before update on public.producto_tallas
  for each row execute function public.tocar_actualizado_en();

-- -----------------------------------------------------------------------------
-- movimientos_inventario — historial inmutable (§7, punto 56)
-- -----------------------------------------------------------------------------
create table public.movimientos_inventario (
  id               uuid primary key default gen_random_uuid(),
  producto_id      uuid not null references public.productos (id) on delete restrict,
  talla            text not null,
  cantidad_anterior integer not null check (cantidad_anterior >= 0),
  cantidad_nueva   integer not null check (cantidad_nueva >= 0),
  tipo             tipo_movimiento not null,
  motivo           text,
  responsable_id   uuid references public.perfiles (id) on delete set null,
  creado_en        timestamptz not null default now(),
  constraint motivo_obligatorio_en_ajuste
    check (tipo <> 'ajuste' or (motivo is not null and length(trim(motivo)) > 0))
);

create index idx_movimientos_producto
  on public.movimientos_inventario (producto_id, creado_en desc);

-- -----------------------------------------------------------------------------
-- historial_precios — historial inmutable (§9, punto 65)
-- -----------------------------------------------------------------------------
create table public.historial_precios (
  id              uuid primary key default gen_random_uuid(),
  producto_id     uuid not null references public.productos (id) on delete restrict,
  campo           tipo_precio not null,
  valor_anterior  numeric(12, 2),
  valor_nuevo     numeric(12, 2) not null,
  responsable_id  uuid references public.perfiles (id) on delete set null,
  creado_en       timestamptz not null default now()
);

create index idx_precios_producto
  on public.historial_precios (producto_id, creado_en desc);

-- -----------------------------------------------------------------------------
-- promociones — el vencimiento no borra nada (§9, punto 45)
-- -----------------------------------------------------------------------------
create table public.promociones (
  id                 uuid primary key default gen_random_uuid(),
  producto_id        uuid not null references public.productos (id) on delete cascade,
  precio_promocional numeric(12, 2) not null check (precio_promocional >= 0),
  tipo               tipo_promocion not null,
  inicia_en          timestamptz not null default now(),
  termina_en         timestamptz,
  activa             boolean not null default true,
  creado_por         uuid references public.perfiles (id) on delete set null,
  creado_en          timestamptz not null default now(),
  constraint programada_exige_fin
    check (tipo <> 'programada' or termina_en is not null),
  constraint fin_posterior_a_inicio
    check (termina_en is null or termina_en > inicia_en)
);

create index idx_promociones_vigentes
  on public.promociones (producto_id)
  where activa;

-- -----------------------------------------------------------------------------
-- selecciones — destacados y ofertas de la semana (punto 54)
-- -----------------------------------------------------------------------------
create table public.selecciones (
  id          uuid primary key default gen_random_uuid(),
  producto_id uuid not null references public.productos (id) on delete cascade,
  tipo        tipo_seleccion not null,
  orden       integer not null default 0,
  activo      boolean not null default true,
  creado_en   timestamptz not null default now(),
  unique (producto_id, tipo)
);

-- -----------------------------------------------------------------------------
-- solicitudes — registro manual de WhatsApp (§8, puntos 57–60)
-- -----------------------------------------------------------------------------
create table public.solicitudes (
  id                  uuid primary key default gen_random_uuid(),
  producto_id         uuid references public.productos (id) on delete set null,
  referencia_snapshot text not null,
  talla               text not null,
  precio_snapshot     numeric(12, 2) not null check (precio_snapshot >= 0),
  estado              estado_solicitud not null default 'pendiente',
  cliente_nombre      text not null,
  cliente_telefono    text not null,
  observaciones       text,
  motivo_cancelacion  text,
  inventario_descontado boolean not null default false,
  confirmada_en       timestamptz,
  creado_en           timestamptz not null default now(),
  actualizado_en      timestamptz not null default now(),
  constraint motivo_obligatorio_al_cancelar
    check (estado <> 'cancelada' or (motivo_cancelacion is not null and length(trim(motivo_cancelacion)) > 0))
);

comment on column public.solicitudes.precio_snapshot is
  'Precio cotizado al momento del registro. No cambia si el producto cambia de precio.';
comment on column public.solicitudes.inventario_descontado is
  'Solo pasa a true si el administrador confirma el descuento (punto 60).';

create trigger trg_solicitudes_actualizado
  before update on public.solicitudes
  for each row execute function public.tocar_actualizado_en();

create index idx_solicitudes_estado
  on public.solicitudes (estado, creado_en desc);

-- -----------------------------------------------------------------------------
-- notificaciones (puntos 63 y 64)
-- -----------------------------------------------------------------------------
create table public.notificaciones (
  id               uuid primary key default gen_random_uuid(),
  tipo             text not null,
  severidad        text not null default 'info'
                   check (severidad in ('info', 'aviso', 'critico')),
  titulo           text not null,
  cuerpo           text,
  producto_id      uuid references public.productos (id) on delete cascade,
  leida            boolean not null default false,
  enviada_correo_en timestamptz,
  creado_en        timestamptz not null default now()
);

create index idx_notificaciones_no_leidas
  on public.notificaciones (creado_en desc)
  where leida = false;

-- -----------------------------------------------------------------------------
-- auditoria (§15)
-- -----------------------------------------------------------------------------
create table public.auditoria (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.perfiles (id) on delete set null,
  accion      text not null,
  entidad     text not null,
  entidad_id  uuid,
  datos       jsonb,
  creado_en   timestamptz not null default now()
);

comment on column public.auditoria.datos is
  'Solo lo necesario. Nunca datos personales ni secretos (§15).';

create index idx_auditoria_fecha on public.auditoria (creado_en desc);

-- -----------------------------------------------------------------------------
-- configuracion — valores operativos que el PDF deja pendientes
-- -----------------------------------------------------------------------------
create table public.configuracion (
  clave       text primary key,
  valor       text not null,
  descripcion text,
  actualizado_en timestamptz not null default now()
);

insert into public.configuracion (clave, valor, descripcion) values
  ('zona_horaria', 'America/Bogota',
   'Zona de referencia para vencimiento de promociones y ofertas de la semana. PROVISIONAL: pendiente de confirmación del propietario (§16).'),
  ('moneda', 'COP',
   'Moneda de presentación de precios. PROVISIONAL: pendiente de confirmación (§16).'),
  ('umbral_stock_bajo', '2',
   'Cantidad por talla a partir de la cual se genera alerta de stock bajo. PROVISIONAL (§16).'),
  ('orden_tallas', 'numerico',
   'Orden de presentación de tallas: numerico o alfabetico. PROVISIONAL (§16).'),
  ('retencion_auditoria_dias', '365',
   'Días de conservación de la auditoría administrativa. PROVISIONAL (§16).');
