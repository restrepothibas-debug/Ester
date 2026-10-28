-- -----------------------------------------------------------------------------
-- Solicitudes de WhatsApp: confirmar y cancelar sin dejar el inventario a medias
--
-- Puntos 57–61. La solicitud se registra a mano; abrir WhatsApp no crea nada.
-- Confirmar y descontar son una sola operación: si el descuento falla, la
-- solicitud no queda confirmada. Y si las existencias no alcanzan, la base lo
-- dice con el número real para que el administrador decida (punto 61).
-- -----------------------------------------------------------------------------

set search_path = public, extensions;

create or replace function public.confirmar_solicitud(
  p_id uuid,
  p_descontar boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_solicitud record;
  v_stock integer;
  v_actor uuid := auth.uid();
begin
  if not public.es_admin() then
    raise exception 'Solo el administrador puede confirmar solicitudes.'
      using errcode = 'insufficient_privilege';
  end if;

  select * into v_solicitud from public.solicitudes where id = p_id for update;
  if not found then
    raise exception 'La solicitud ya no existe.';
  end if;
  if v_solicitud.estado <> 'pendiente' then
    raise exception 'Solo se puede confirmar una solicitud pendiente.';
  end if;

  if p_descontar then
    if v_solicitud.producto_id is null then
      raise exception 'El producto de esta solicitud ya no existe: confírmala sin descontar.';
    end if;

    select cantidad into v_stock
    from public.producto_tallas
    where producto_id = v_solicitud.producto_id and talla = v_solicitud.talla
    for update;

    if coalesce(v_stock, 0) < 1 then
      raise exception
        'No quedan unidades de la talla %. La solicitud se puede confirmar sin descontar.',
        v_solicitud.talla
        using errcode = 'check_violation';
    end if;

    update public.producto_tallas
       set cantidad = v_stock - 1
     where producto_id = v_solicitud.producto_id and talla = v_solicitud.talla;

    insert into public.movimientos_inventario
      (producto_id, talla, cantidad_anterior, cantidad_nueva, tipo, motivo, responsable_id)
    values
      (v_solicitud.producto_id, v_solicitud.talla, v_stock, v_stock - 1, 'venta',
       'Solicitud de WhatsApp confirmada', v_actor);
  end if;

  update public.solicitudes
     set estado = 'confirmada',
         confirmada_en = now(),
         inventario_descontado = p_descontar,
         actualizado_en = now()
   where id = p_id;
end;
$$;

create or replace function public.cancelar_solicitud(
  p_id uuid,
  p_motivo text,
  p_devolver boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_solicitud record;
  v_stock integer;
  v_actor uuid := auth.uid();
begin
  if not public.es_admin() then
    raise exception 'Solo el administrador puede cancelar solicitudes.'
      using errcode = 'insufficient_privilege';
  end if;

  if p_motivo is null or length(trim(p_motivo)) = 0 then
    raise exception 'La cancelación necesita un motivo.' using errcode = 'check_violation';
  end if;

  select * into v_solicitud from public.solicitudes where id = p_id for update;
  if not found then
    raise exception 'La solicitud ya no existe.';
  end if;
  if v_solicitud.estado = 'cancelada' then
    raise exception 'Esa solicitud ya está cancelada.';
  end if;

  if p_devolver and v_solicitud.inventario_descontado and v_solicitud.producto_id is not null then
    select cantidad into v_stock
    from public.producto_tallas
    where producto_id = v_solicitud.producto_id and talla = v_solicitud.talla
    for update;

    v_stock := coalesce(v_stock, 0);

    insert into public.producto_tallas (producto_id, talla, cantidad)
    values (v_solicitud.producto_id, v_solicitud.talla, v_stock + 1)
    on conflict (producto_id, talla) do update set cantidad = excluded.cantidad;

    insert into public.movimientos_inventario
      (producto_id, talla, cantidad_anterior, cantidad_nueva, tipo, motivo, responsable_id)
    values
      (v_solicitud.producto_id, v_solicitud.talla, v_stock, v_stock + 1, 'devolucion',
       'Cancelación de solicitud: se devuelve la unidad', v_actor);
  end if;

  update public.solicitudes
     set estado = 'cancelada',
         motivo_cancelacion = trim(p_motivo),
         inventario_descontado = case
           when p_devolver then false
           else inventario_descontado
         end,
         actualizado_en = now()
   where id = p_id;
end;
$$;

revoke execute on function public.confirmar_solicitud(uuid, boolean) from public;
revoke execute on function public.cancelar_solicitud(uuid, text, boolean) from public;
grant execute on function public.confirmar_solicitud(uuid, boolean) to authenticated;
grant execute on function public.cancelar_solicitud(uuid, text, boolean) to authenticated;

-- anon no escribe solicitudes nunca: son datos personales.
revoke insert, update, delete on public.solicitudes from anon;
