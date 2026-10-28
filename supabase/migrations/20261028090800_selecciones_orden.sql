-- -----------------------------------------------------------------------------
-- Destacados y oferta de la semana: el orden pasa a estar garantizado
--
-- La auditoría del 28/10 encontró que «Subir/Bajar» se hacía en dos peticiones
-- HTTP: con dos filas empatadas el intercambio no cambiaba nada, y si fallaba
-- la segunda quedaba un empate permanente.
--
-- Ahora el orden es único por tipo y se mueve en una sola transacción, desde la
-- base. Las funciones comprueban que quien llama es administrador.
-- -----------------------------------------------------------------------------

set search_path = public, extensions;

-- 1 · Nadie sin rol administrador escribe directamente en la tabla: el GRANT
--     acompañaba a la política y no hacía falta para nada.
revoke insert, update, delete on public.selecciones from anon;

-- 2 · Un orden por posición y tipo, sin huecos duplicados.
with ordenados as (
  select id, row_number() over (partition by tipo order by orden, creado_en, id) as posicion
  from public.selecciones
)
update public.selecciones s
   set orden = o.posicion
  from ordenados o
 where o.id = s.id;

alter table public.selecciones
  drop constraint if exists selecciones_tipo_orden_key;

-- Diferible: dentro de una transacción se permiten valores repetidos de forma
-- pasajera mientras se renumera; al confirmar se exige que sean únicos.
alter table public.selecciones
  add constraint selecciones_tipo_orden_key unique (tipo, orden) deferrable initially deferred;

-- 3 · Añadir al final, sin carreras entre dos pestañas.
create or replace function public.agregar_seleccion(
  p_producto_id uuid,
  p_tipo public.tipo_seleccion
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_orden integer;
  v_id uuid;
begin
  if not public.es_admin() then
    raise exception 'Solo el administrador puede cambiar las selecciones.'
      using errcode = 'insufficient_privilege';
  end if;

  perform pg_advisory_xact_lock(hashtext('selecciones:' || p_tipo::text));

  select coalesce(max(orden), 0) + 1 into v_orden
  from public.selecciones
  where tipo = p_tipo;

  insert into public.selecciones (producto_id, tipo, orden, activo)
  values (p_producto_id, p_tipo, v_orden, true)
  returning id into v_id;

  return v_id;
end;
$$;

-- 4 · Mover una fila un puesto, renumerando 1..n de una vez.
create or replace function public.mover_seleccion(
  p_tipo public.tipo_seleccion,
  p_id uuid,
  p_direccion integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ids uuid[];
  v_posicion integer;
  v_limite integer;
  v_aux uuid;
  i integer;
begin
  if not public.es_admin() then
    raise exception 'Solo el administrador puede cambiar las selecciones.'
      using errcode = 'insufficient_privilege';
  end if;

  if p_direccion not in (-1, 1) then
    raise exception 'La dirección solo puede ser -1 o 1.';
  end if;

  perform pg_advisory_xact_lock(hashtext('selecciones:' || p_tipo::text));

  select array_agg(id order by orden, creado_en, id) into v_ids
  from public.selecciones
  where tipo = p_tipo and activo;

  v_limite := coalesce(array_length(v_ids, 1), 0);
  v_posicion := array_position(v_ids, p_id);

  if v_posicion is null or v_posicion + p_direccion not between 1 and v_limite then
    return;
  end if;

  v_aux := v_ids[v_posicion];
  v_ids[v_posicion] := v_ids[v_posicion + p_direccion];
  v_ids[v_posicion + p_direccion] := v_aux;

  for i in 1 .. v_limite loop
    update public.selecciones set orden = i where id = v_ids[i] and orden <> i;
  end loop;
end;
$$;

revoke execute on function public.agregar_seleccion(uuid, public.tipo_seleccion) from public;
revoke execute on function public.mover_seleccion(public.tipo_seleccion, uuid, integer) from public;
grant execute on function public.agregar_seleccion(uuid, public.tipo_seleccion) to authenticated;
grant execute on function public.mover_seleccion(public.tipo_seleccion, uuid, integer) to authenticated;

comment on constraint selecciones_tipo_orden_key on public.selecciones is
  'El orden es una posición única por tipo; se mueve con mover_seleccion().';
