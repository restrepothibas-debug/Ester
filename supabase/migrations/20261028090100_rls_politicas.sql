-- =============================================================================
-- Dayara store — seguridad a nivel de fila (RLS) y Storage
-- §15: mínimo privilegio. El público lee solo lo público; el administrador
-- autenticado hace todo; nada se escribe desde el cliente anónimo.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper: ¿el usuario autenticado es administrador activo?
-- -----------------------------------------------------------------------------
create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.perfiles p
    where p.id = auth.uid()
      and p.rol = 'administrador'
      and p.activo = true
  );
$$;

revoke all on function public.es_admin() from public;
-- anon también puede ejecutarla: devuelve false porque auth.uid() es null.
-- Sin este grant, cualquier política evaluada por anon fallaría por permisos.
grant execute on function public.es_admin() to authenticated, anon;

-- -----------------------------------------------------------------------------
-- Activación de RLS en todas las tablas
-- -----------------------------------------------------------------------------
alter table public.perfiles              enable row level security;
alter table public.marcas                enable row level security;
alter table public.productos             enable row level security;
alter table public.producto_imagenes     enable row level security;
alter table public.producto_tallas       enable row level security;
alter table public.movimientos_inventario enable row level security;
alter table public.historial_precios     enable row level security;
alter table public.promociones           enable row level security;
alter table public.selecciones           enable row level security;
alter table public.solicitudes           enable row level security;
alter table public.notificaciones        enable row level security;
alter table public.auditoria             enable row level security;
alter table public.configuracion         enable row level security;

-- -----------------------------------------------------------------------------
-- perfiles
-- -----------------------------------------------------------------------------
create policy perfiles_admin_select on public.perfiles
  for select to authenticated using (public.es_admin());
create policy perfiles_admin_update on public.perfiles
  for update to authenticated using (public.es_admin()) with check (public.es_admin());

-- -----------------------------------------------------------------------------
-- marcas — el público ve solo las activas
-- -----------------------------------------------------------------------------
create policy marcas_publico_lectura on public.marcas
  for select to anon, authenticated using (activa = true);
create policy marcas_admin on public.marcas
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- -----------------------------------------------------------------------------
-- productos — el público ve solo publicado y agotado
-- -----------------------------------------------------------------------------
create policy productos_publico_lectura on public.productos
  for select to anon, authenticated
  using (estado in ('publicado', 'agotado'));
create policy productos_admin on public.productos
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- -----------------------------------------------------------------------------
-- producto_imagenes
-- -----------------------------------------------------------------------------
create policy imagenes_publico_lectura on public.producto_imagenes
  for select to anon, authenticated
  using (exists (
    select 1 from public.productos p
    where p.id = producto_id and p.estado in ('publicado', 'agotado')
  ));
create policy imagenes_admin on public.producto_imagenes
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- -----------------------------------------------------------------------------
-- producto_tallas — el público ve solo tallas con existencias (§7)
-- -----------------------------------------------------------------------------
create policy tallas_publico_lectura on public.producto_tallas
  for select to anon, authenticated
  using (
    cantidad > 0
    and exists (
      select 1 from public.productos p
      where p.id = producto_id and p.estado in ('publicado', 'agotado')
    )
  );
create policy tallas_admin on public.producto_tallas
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- -----------------------------------------------------------------------------
-- movimientos_inventario — historial inmutable: sin update ni delete
-- -----------------------------------------------------------------------------
create policy movimientos_admin_lectura on public.movimientos_inventario
  for select to authenticated using (public.es_admin());
create policy movimientos_admin_insercion on public.movimientos_inventario
  for insert to authenticated with check (public.es_admin());

-- -----------------------------------------------------------------------------
-- historial_precios — historial inmutable
-- -----------------------------------------------------------------------------
create policy precios_admin_lectura on public.historial_precios
  for select to authenticated using (public.es_admin());
create policy precios_admin_insercion on public.historial_precios
  for insert to authenticated with check (public.es_admin());

-- -----------------------------------------------------------------------------
-- promociones — el público ve solo las vigentes
-- -----------------------------------------------------------------------------
create policy promociones_publico_lectura on public.promociones
  for select to anon, authenticated
  using (
    activa = true
    and inicia_en <= now()
    and (termina_en is null or termina_en > now())
    and exists (
      select 1 from public.productos p
      where p.id = producto_id and p.estado in ('publicado', 'agotado')
    )
  );
create policy promociones_admin on public.promociones
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- -----------------------------------------------------------------------------
-- selecciones
-- -----------------------------------------------------------------------------
create policy selecciones_publico_lectura on public.selecciones
  for select to anon, authenticated
  using (
    activo = true
    and exists (
      select 1 from public.productos p
      where p.id = producto_id and p.estado in ('publicado', 'agotado')
    )
  );
create policy selecciones_admin on public.selecciones
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- -----------------------------------------------------------------------------
-- solicitudes — datos personales: sin acceso público, nunca
-- -----------------------------------------------------------------------------
create policy solicitudes_admin on public.solicitudes
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- -----------------------------------------------------------------------------
-- notificaciones
-- -----------------------------------------------------------------------------
create policy notificaciones_admin on public.notificaciones
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- -----------------------------------------------------------------------------
-- auditoria — solo se añade, no se edita ni se borra
-- -----------------------------------------------------------------------------
create policy auditoria_admin_lectura on public.auditoria
  for select to authenticated using (public.es_admin());
create policy auditoria_admin_insercion on public.auditoria
  for insert to authenticated with check (public.es_admin());

-- -----------------------------------------------------------------------------
-- configuracion
-- -----------------------------------------------------------------------------
create policy configuracion_admin on public.configuracion
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- =============================================================================
-- Storage
-- =============================================================================
insert into storage.buckets (id, name, public)
values
  ('productos', 'productos', true),
  ('marcas',    'marcas',    true),
  ('copias',    'copias',    false)
on conflict (id) do nothing;

-- Lectura pública solo de las imágenes de catálogo
create policy storage_lectura_catalogo on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('productos', 'marcas'));

-- Las copias de seguridad solo las ve el administrador
create policy storage_lectura_copias on storage.objects
  for select to authenticated
  using (bucket_id = 'copias' and public.es_admin());

-- Escritura: solo administrador autenticado
create policy storage_escritura_admin on storage.objects
  for insert to authenticated
  with check (bucket_id in ('productos', 'marcas', 'copias') and public.es_admin());

create policy storage_actualizacion_admin on storage.objects
  for update to authenticated
  using (bucket_id in ('productos', 'marcas', 'copias') and public.es_admin())
  with check (bucket_id in ('productos', 'marcas', 'copias') and public.es_admin());

create policy storage_borrado_admin on storage.objects
  for delete to authenticated
  using (bucket_id in ('productos', 'marcas', 'copias') and public.es_admin());
