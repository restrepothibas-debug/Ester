-- =============================================================================
-- Slugs deterministas para marcas y productos.
--
-- Motivo: el slug de marca se usa en la URL pública (`/marca/:slug`) y el de
-- producto en la ficha. Si los escribe una persona, tarde o temprano no
-- coinciden con lo que espera la ruta. Aquí se calculan en la base, con una
-- sola regla, para que la URL y la fila nunca se contradigan.
-- =============================================================================

create extension if not exists unaccent;

-- Orden importante: `normalizar_texto` usa `sin_tildes`, así que esta se define
-- primero. PostgreSQL valida el cuerpo de las funciones SQL al crearlas.
create or replace function public.sin_tildes(texto text)
returns text
language sql
stable
as $$
  select translate(
    texto,
    'áàäâãéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ',
    'aaaaaeeeeiiiiooooouuuuncAAAAAEEEEIIIIOOOOOUUUUNC'
  );
$$;

-- Minúsculas, sin tildes, sin espacios repetidos. Misma regla que usa la interfaz.
create or replace function public.normalizar_texto(texto text)
returns text
language sql
stable
as $$
  select regexp_replace(lower(trim(public.sin_tildes(texto))), '\s+', ' ', 'g');
$$;

-- -----------------------------------------------------------------------------
-- marcas.nombre_normalizado
-- -----------------------------------------------------------------------------
create or replace function public.marcas_normalizar()
returns trigger
language plpgsql
as $$
begin
  new.nombre_normalizado := public.normalizar_texto(new.nombre);
  return new;
end;
$$;

drop trigger if exists trg_marcas_normalizar on public.marcas;
create trigger trg_marcas_normalizar
  before insert or update of nombre on public.marcas
  for each row execute function public.marcas_normalizar();

-- -----------------------------------------------------------------------------
-- productos.slug
-- Determinista: modelo + código interno (que ya es único).
-- -----------------------------------------------------------------------------
create or replace function public.productos_slug()
returns trigger
language plpgsql
as $$
begin
  if new.slug is null or trim(new.slug) = '' then
    new.slug := public.normalizar_texto(new.modelo) || '-' ||
                public.normalizar_texto(new.codigo_interno);
    new.slug := replace(replace(new.slug, ' ', '-'), '/', '-');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_productos_slug on public.productos;
create trigger trg_productos_slug
  before insert or update of modelo, codigo_interno on public.productos
  for each row execute function public.productos_slug();
