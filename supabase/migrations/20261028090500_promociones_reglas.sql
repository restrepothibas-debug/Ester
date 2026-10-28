-- -----------------------------------------------------------------------------
-- Promociones: reglas que la tabla no expresaba
--
-- Decisiones del propietario del 28/10/2026:
--   D-31 · Un producto no puede tener dos promociones vigentes a la vez.
--   D-32 · El precio promocional nunca es igual ni superior al precio normal.
--   D-34 · El vencimiento se interpreta en America/Bogota (se guarda en UTC).
--
-- Nada de esto borra registros: una promoción vencida o finalizada sigue en la
-- tabla y en el historial (punto 45, Listón E4).
-- -----------------------------------------------------------------------------

-- Necesario para exigir «=» dentro de una restricción de exclusión.
create extension if not exists btree_gist with schema extensions;

set search_path = public, extensions;

-- -----------------------------------------------------------------------------
-- Una sola vigencia por producto
--
-- Dos promociones del mismo producto no pueden solaparse en el tiempo. Basta con
-- que una esté `activa` para que su rango cuente: si no tiene fecha final, el
-- rango es abierto y bloquea cualquier otra hasta que se termine (Listón E1/E2).
-- -----------------------------------------------------------------------------
alter table public.promociones
  add constraint ex_promocion_sin_solape
  exclude using gist (
    producto_id with =,
    tstzrange(inicia_en, termina_en) with &&
  ) where (activa);

-- -----------------------------------------------------------------------------
-- El precio promocional debe ser menor que el normal
--
-- Un CHECK no puede mirar otra tabla, así que la comparación va en un disparador
-- que lee `productos.precio_normal` en el momento de escribir (D-32).
-- -----------------------------------------------------------------------------
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

create trigger trg_promociones_precio
  before insert or update of producto_id, precio_promocional on public.promociones
  for each row execute function public.validar_precio_promocional();

-- -----------------------------------------------------------------------------
-- Y al revés: no se puede bajar el precio normal por debajo de una promoción
-- vigente, porque dejaría una promoción más cara que el precio de lista (D-32).
-- -----------------------------------------------------------------------------
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
    and p.inicia_en <= now()
    and (p.termina_en is null or p.termina_en > now())
    and p.precio_promocional >= new.precio_normal
  limit 1;

  if promo is not null then
    raise exception
      'Hay una promoción vigente a %, igual o superior al nuevo precio normal. Termínala antes de bajar el precio.',
      promo
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger trg_productos_precio_vs_promocion
  before update of precio_normal on public.productos
  for each row
  when (old.precio_normal is distinct from new.precio_normal)
  execute function public.validar_precio_normal_con_promocion();

comment on constraint ex_promocion_sin_solape on public.promociones is
  'D-31: una sola promoción vigente por producto; las vencidas se conservan.';
