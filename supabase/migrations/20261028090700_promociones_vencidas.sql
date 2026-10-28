-- -----------------------------------------------------------------------------
-- Promociones: una fila vencida se debe poder apagar
--
-- El disparador de la migración 7 revisaba el precio en toda escritura. Eso
-- dejaba atascada una promoción ya vencida: si después se bajaba el precio de
-- lista por debajo de su precio, ni siquiera se podía poner `activa = false`.
--
-- La regla solo tiene sentido para una promoción que puede llegar a estar
-- vigente: activa y con su ventana sin terminar. Una fila apagada o vencida es
-- historial (punto 45).
-- -----------------------------------------------------------------------------

set search_path = public, extensions;

create or replace function public.validar_precio_promocional()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normal numeric(12, 2);
begin
  -- Apagada o ya vencida: es historial, no se le exige nada.
  if not new.activa or (new.termina_en is not null and new.termina_en <= now()) then
    return new;
  end if;

  select p.precio_normal into normal
  from public.productos p
  where p.id = new.producto_id;

  if normal is null then
    raise exception 'El producto de la promoción no existe.'
      using errcode = 'foreign_key_violation';
  end if;

  if new.precio_promocional >= normal then
    raise exception
      'El precio promocional (%) debe ser menor que el precio normal (%).',
      new.precio_promocional, normal
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;
