-- =============================================================================
-- 12 · Fotografías de producto
--
-- Qué resuelve:
--   · Las fotos llegan del equipo del propietario (procesador local) o se suben
--     desde el panel. Antes de asignarlas viven en `fotos_sin_asignar`.
--   · Una foto no puede repetirse en el mismo producto (sha256).
--   · Un producto tiene como máximo una foto principal y, si tiene fotos,
--     exactamente una (§6, punto 52).
--   · El orden se mueve en una sola transacción: dos UPDATE desde el cliente no
--     son atómicos y con órdenes empatados «Subir» no hacía nada (lección R-008).
--   · Igual que en solicitudes (D-40), las tablas no aceptan escrituras directas:
--     se escribe solo por funciones que comprueban el administrador.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Columnas nuevas en producto_imagenes
-- -----------------------------------------------------------------------------

alter table public.producto_imagenes
  add column if not exists sha256   text,
  add column if not exists ruta_min text,
  add column if not exists ancho    integer,
  add column if not exists alto     integer,
  add column if not exists bytes    integer;

comment on column public.producto_imagenes.sha256 is
  'Huella del archivo original. Evita subir dos veces la misma foto al mismo producto.';
comment on column public.producto_imagenes.ruta_min is
  'Versión reducida para las tarjetas del catálogo. Sin transformaciones de imagen en el plan gratuito, la genera el cliente.';

-- La misma foto no se repite dentro de un producto.
create unique index if not exists uq_imagen_sha_por_producto
  on public.producto_imagenes (producto_id, sha256)
  where sha256 is not null;

-- Orden único por producto, diferible para poder intercambiar dos posiciones
-- dentro de la misma transacción.
do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.producto_imagenes'::regclass
       and conname  = 'uq_imagen_orden'
  ) then
    alter table public.producto_imagenes
      add constraint uq_imagen_orden unique (producto_id, orden) deferrable initially deferred;
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 2. Bandeja de entrada: fotos que todavía no tienen producto
-- -----------------------------------------------------------------------------

create table if not exists public.fotos_sin_asignar (
  id        uuid primary key default gen_random_uuid(),
  sha256    text not null unique,
  ruta      text not null,
  ruta_min  text,
  ancho     integer,
  alto      integer,
  bytes     integer,
  creado_en timestamptz not null default now()
);

comment on table public.fotos_sin_asignar is
  'Fotos procesadas que aún no pertenecen a un producto. Al asignarlas pasan a producto_imagenes.';

alter table public.fotos_sin_asignar enable row level security;

drop policy if exists fotos_sin_asignar_lectura_admin on public.fotos_sin_asignar;
create policy fotos_sin_asignar_lectura_admin on public.fotos_sin_asignar
  for select to authenticated
  using (public.es_admin());

-- Sin políticas de escritura: se escribe solo por funciones.
revoke insert, update, delete on public.fotos_sin_asignar from anon, authenticated;
grant select on public.fotos_sin_asignar to authenticated;

-- Las imágenes de producto tampoco se escriben a mano.
revoke insert, update, delete on public.producto_imagenes from anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. Funciones
-- -----------------------------------------------------------------------------

-- 3.1 Registrar una foto subida a Storage. Devuelve si era nueva o ya existía.
create or replace function public.registrar_foto(
  p_sha256   text,
  p_ruta     text,
  p_ruta_min text default null,
  p_ancho    integer default null,
  p_alto     integer default null,
  p_bytes    integer default null
)
returns table (id uuid, nueva boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.es_admin() then
    raise exception 'Solo un administrador puede registrar fotos.' using errcode = '42501';
  end if;

  if p_sha256 is null or length(p_sha256) <> 64 then
    raise exception 'La huella de la foto debe ser un SHA-256 hexadecimal.' using errcode = '22023';
  end if;

  insert into public.fotos_sin_asignar (sha256, ruta, ruta_min, ancho, alto, bytes)
  values (p_sha256, p_ruta, p_ruta_min, p_ancho, p_alto, p_bytes)
  on conflict (sha256) do nothing
  returning fotos_sin_asignar.id into v_id;

  if v_id is null then
    select f.id into v_id from public.fotos_sin_asignar f where f.sha256 = p_sha256;
    return query select v_id, false;
  end if;

  return query select v_id, true;
end;
$$;

-- 3.2 Asignar una foto de la bandeja a un producto. La primera queda principal.
create or replace function public.asignar_foto(
  p_foto_id     uuid,
  p_producto_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_foto     public.fotos_sin_asignar;
  v_orden    integer;
  v_hay_algo boolean;
  v_id       uuid;
begin
  if not public.es_admin() then
    raise exception 'Solo un administrador puede asignar fotos.' using errcode = '42501';
  end if;

  select * into v_foto from public.fotos_sin_asignar where id = p_foto_id;
  if v_foto.id is null then
    raise exception 'La foto ya no está en la bandeja.' using errcode = 'P0002';
  end if;

  if not exists (select 1 from public.productos p where p.id = p_producto_id) then
    raise exception 'El producto no existe.' using errcode = '23503';
  end if;

  -- Serializa las asignaciones del mismo producto: sin esto, dos pestañas
  -- abiertas podrían calcular el mismo `orden`.
  perform pg_advisory_xact_lock(hashtext('imagenes:' || p_producto_id::text));

  select exists (select 1 from public.producto_imagenes i where i.producto_id = p_producto_id)
    into v_hay_algo;

  select coalesce(max(i.orden) + 1, 0) into v_orden
    from public.producto_imagenes i where i.producto_id = p_producto_id;

  insert into public.producto_imagenes
    (producto_id, ruta, ruta_min, sha256, ancho, alto, bytes, principal, orden)
  values
    (p_producto_id, v_foto.ruta, v_foto.ruta_min, v_foto.sha256,
     v_foto.ancho, v_foto.alto, v_foto.bytes, not v_hay_algo, v_orden)
  returning producto_imagenes.id into v_id;

  delete from public.fotos_sin_asignar where id = p_foto_id;

  return v_id;
end;
$$;

-- 3.3 Elegir la foto principal. Dos pasos, una transacción: el índice único
--     parcial no es diferible y marcar antes de desmarcar chocaría.
create or replace function public.marcar_principal(p_imagen_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_producto uuid;
begin
  if not public.es_admin() then
    raise exception 'Solo un administrador puede cambiar la foto principal.' using errcode = '42501';
  end if;

  select producto_id into v_producto from public.producto_imagenes where id = p_imagen_id;
  if v_producto is null then
    raise exception 'La foto no existe.' using errcode = 'P0002';
  end if;

  perform pg_advisory_xact_lock(hashtext('imagenes:' || v_producto::text));

  update public.producto_imagenes
     set principal = false
   where producto_id = v_producto and principal;

  update public.producto_imagenes
     set principal = true
   where id = p_imagen_id;
end;
$$;

-- 3.4 Mover una foto arriba o abajo. Intercambia posiciones en una transacción.
create or replace function public.mover_imagen(p_imagen_id uuid, p_direccion integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_producto uuid;
  v_orden    integer;
  v_vecino   uuid;
  v_orden_v  integer;
begin
  if not public.es_admin() then
    raise exception 'Solo un administrador puede ordenar fotos.' using errcode = '42501';
  end if;

  if p_direccion not in (-1, 1) then
    raise exception 'La dirección debe ser -1 (subir) o 1 (bajar).' using errcode = '22023';
  end if;

  select producto_id, orden into v_producto, v_orden
    from public.producto_imagenes where id = p_imagen_id;
  if v_producto is null then
    raise exception 'La foto no existe.' using errcode = 'P0002';
  end if;

  perform pg_advisory_xact_lock(hashtext('imagenes:' || v_producto::text));

  if p_direccion < 0 then
    select id, orden into v_vecino, v_orden_v
      from public.producto_imagenes
     where producto_id = v_producto and orden < v_orden
     order by orden desc limit 1;
  else
    select id, orden into v_vecino, v_orden_v
      from public.producto_imagenes
     where producto_id = v_producto and orden > v_orden
     order by orden asc limit 1;
  end if;

  if v_vecino is null then
    return;  -- ya está en el extremo
  end if;

  update public.producto_imagenes set orden = v_orden_v where id = p_imagen_id;
  update public.producto_imagenes set orden = v_orden   where id = v_vecino;
end;
$$;

-- 3.5 Quitar una foto de un producto. Si era la principal, asciende la siguiente.
--     Devuelve las rutas para que el cliente borre los archivos de Storage.
create or replace function public.eliminar_imagen(p_imagen_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_producto uuid;
  v_ruta     text;
  v_ruta_min text;
  v_era      boolean;
  v_siguiente uuid;
begin
  if not public.es_admin() then
    raise exception 'Solo un administrador puede quitar fotos.' using errcode = '42501';
  end if;

  select producto_id, ruta, ruta_min, principal
    into v_producto, v_ruta, v_ruta_min, v_era
    from public.producto_imagenes where id = p_imagen_id;

  if v_producto is null then
    raise exception 'La foto no existe.' using errcode = 'P0002';
  end if;

  perform pg_advisory_xact_lock(hashtext('imagenes:' || v_producto::text));

  delete from public.producto_imagenes where id = p_imagen_id;

  if v_era then
    select id into v_siguiente
      from public.producto_imagenes
     where producto_id = v_producto
     order by orden asc limit 1;
    if v_siguiente is not null then
      update public.producto_imagenes set principal = true where id = v_siguiente;
    end if;
  end if;

  return jsonb_build_object('ruta', v_ruta, 'ruta_min', v_ruta_min);
end;
$$;

-- 3.6 Descartar una foto de la bandeja sin asignarla.
create or replace function public.descartar_foto(p_foto_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ruta     text;
  v_ruta_min text;
begin
  if not public.es_admin() then
    raise exception 'Solo un administrador puede descartar fotos.' using errcode = '42501';
  end if;

  delete from public.fotos_sin_asignar
   where id = p_foto_id
  returning ruta, ruta_min into v_ruta, v_ruta_min;

  if v_ruta is null then
    raise exception 'La foto no está en la bandeja.' using errcode = 'P0002';
  end if;

  return jsonb_build_object('ruta', v_ruta, 'ruta_min', v_ruta_min);
end;
$$;

-- -----------------------------------------------------------------------------
-- 4. Permisos de ejecución
-- -----------------------------------------------------------------------------

revoke all on function public.registrar_foto(text, text, text, integer, integer, integer) from public, anon;
revoke all on function public.asignar_foto(uuid, uuid) from public, anon;
revoke all on function public.marcar_principal(uuid) from public, anon;
revoke all on function public.mover_imagen(uuid, integer) from public, anon;
revoke all on function public.eliminar_imagen(uuid) from public, anon;
revoke all on function public.descartar_foto(uuid) from public, anon;

grant execute on function public.registrar_foto(text, text, text, integer, integer, integer) to authenticated;
grant execute on function public.asignar_foto(uuid, uuid) to authenticated;
grant execute on function public.marcar_principal(uuid) to authenticated;
grant execute on function public.mover_imagen(uuid, integer) to authenticated;
grant execute on function public.eliminar_imagen(uuid) to authenticated;
grant execute on function public.descartar_foto(uuid) to authenticated;
