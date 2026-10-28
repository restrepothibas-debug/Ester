-- -----------------------------------------------------------------------------
-- Solicitudes: las escrituras pasan solo por funciones
--
-- La auditoría del 28/10 encontró que, con permisos de tabla, un administrador
-- podía devolver una solicitud confirmada a «pendiente» con un UPDATE directo y
-- volver a confirmarla: se descontaba dos veces la misma unidad. También podía
-- marcar `inventario_descontado` a mano y cancelar después, devolviendo al
-- inventario una unidad que nunca salió.
--
-- Nada del panel escribe la tabla directamente: todo va por estas funciones, que
-- comprueban el estado. Se quitan los permisos de escritura a `authenticated`.
-- -----------------------------------------------------------------------------

set search_path = public, extensions;

-- 1 · Registrar: la referencia y el estado los pone la base, no el cliente.
create or replace function public.registrar_solicitud(
  p_producto_id uuid,
  p_talla text,
  p_precio numeric,
  p_cliente text,
  p_telefono text,
  p_observaciones text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referencia text;
  v_id uuid;
begin
  if not public.es_admin() then
    raise exception 'Solo el administrador puede registrar solicitudes.'
      using errcode = 'insufficient_privilege';
  end if;

  if p_cliente is null or length(trim(p_cliente)) = 0 then
    raise exception 'Hace falta el nombre del cliente.' using errcode = 'check_violation';
  end if;
  if p_telefono is null or length(trim(p_telefono)) = 0 then
    raise exception 'Hace falta el teléfono del cliente.' using errcode = 'check_violation';
  end if;
  if p_talla is null or length(trim(p_talla)) = 0 then
    raise exception 'Hace falta la talla.' using errcode = 'check_violation';
  end if;
  if p_precio is null or p_precio < 0 then
    raise exception 'El precio no es válido.' using errcode = 'check_violation';
  end if;

  select p.codigo_interno into v_referencia
  from public.productos p
  where p.id = p_producto_id;

  if v_referencia is null then
    raise exception 'El producto ya no existe.' using errcode = 'foreign_key_violation';
  end if;

  insert into public.solicitudes
    (producto_id, referencia_snapshot, talla, precio_snapshot,
     cliente_nombre, cliente_telefono, observaciones, estado)
  values
    (p_producto_id, v_referencia, trim(p_talla), p_precio,
     trim(p_cliente), trim(p_telefono), nullif(trim(p_observaciones), ''), 'pendiente')
  returning id into v_id;

  return v_id;
end;
$$;

-- 2 · Eliminar: punto 59, borrado manual, nunca a la ligera desde fuera.
create or replace function public.eliminar_solicitud(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_admin() then
    raise exception 'Solo el administrador puede eliminar solicitudes.'
      using errcode = 'insufficient_privilege';
  end if;

  delete from public.solicitudes where id = p_id;
  if not found then
    raise exception 'La solicitud ya no existe.';
  end if;
end;
$$;

-- 3 · Con los permisos de tabla fuera, cada cambio de estado pasa por su función.
revoke insert, update, delete on public.solicitudes from authenticated;
revoke insert, update, delete on public.solicitudes from anon;

revoke execute on function public.registrar_solicitud(uuid, text, numeric, text, text, text) from public;
revoke execute on function public.eliminar_solicitud(uuid) from public;
grant execute on function public.registrar_solicitud(uuid, text, numeric, text, text, text) to authenticated;
grant execute on function public.eliminar_solicitud(uuid) to authenticated;

comment on table public.solicitudes is
  'Puntos 57–61. Sin permisos de escritura directa: se registra, confirma, cancela y elimina por funciones.';
