-- -----------------------------------------------------------------------------
-- Promociones: cerrar los huecos que encontró la auditoría del 28/10/2026
--
-- 1. El precio normal se podía bajar por debajo de una promoción **programada**
--    (el disparador solo miraba las vigentes en ese instante). Al llegar la
--    fecha quedaba una promoción más cara que el precio de lista.
-- 2. Una promoción apagada con precio viejo se podía reactivar sin revisar el
--    precio de lista actual.
-- 3. La base aceptaba un precio promocional de 0.
-- -----------------------------------------------------------------------------

set search_path = public, extensions;

-- 1 y 2 · El precio se revisa en toda escritura, no solo al crearla.
create or replace function public.validar_precio_promocional()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normal numeric(12, 2);
begin
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

drop trigger if exists trg_promociones_precio on public.promociones;

-- Sin lista de columnas: cualquier cambio (fechas, tipo, reactivación) vuelve a
-- comparar contra el precio de lista del momento.
create trigger trg_promociones_precio
  before insert or update on public.promociones
  for each row execute function public.validar_precio_promocional();

-- El producto, en cambio, se vigila contra cualquier promoción que no haya
-- terminado: también las programadas que aún no han empezado.
create or replace function public.validar_precio_normal_con_promocion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  promo numeric(12, 2);
begin
  select p.precio_promocional into promo
  from public.promociones p
  where p.producto_id = new.id
    and p.activa
    and (p.termina_en is null or p.termina_en > now())
    and p.precio_promocional >= new.precio_normal
  limit 1;

  if promo is not null then
    raise exception
      'Hay una promoción activa o programada a %, igual o superior al nuevo precio normal. Termínala antes de bajar el precio.',
      promo
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

-- 3 · Un precio promocional de cero no es una promoción.
alter table public.promociones
  drop constraint if exists promociones_precio_promocional_check;

alter table public.promociones
  add constraint promociones_precio_promocional_check
  check (precio_promocional > 0);

comment on constraint promociones_precio_promocional_check on public.promociones is
  'D-32: el precio promocional es positivo y siempre menor que el precio de lista.';
