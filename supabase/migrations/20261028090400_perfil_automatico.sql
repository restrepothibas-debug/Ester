-- =============================================================================
-- Perfil automático al crear un usuario de Auth.
--
-- El propietario crea el administrador a mano desde el panel de Supabase
-- (Authentication → Users). Esa acción solo crea `auth.users`; sin fila en
-- `public.perfiles`, `es_admin()` devuelve false y todas las políticas RLS
-- niegan el acceso. Este trigger cierra esa brecha: quien exista en Auth es
-- administrador.
--
-- Es seguro porque el registro público está desactivado: nadie se puede crear
-- una cuenta por su cuenta (§10, una sola cuenta administradora).
-- =============================================================================

create or replace function public.perfil_al_crear_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre, rol, activo)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'nombre', ''),
      split_part(coalesce(new.email, 'administrador'), '@', 1)
    ),
    'administrador',
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_perfil_al_crear_usuario on auth.users;
create trigger trg_perfil_al_crear_usuario
  after insert on auth.users
  for each row execute function public.perfil_al_crear_usuario();

-- Relleno para usuarios que ya existieran sin perfil.
insert into public.perfiles (id, nombre, rol, activo)
select
  u.id,
  split_part(coalesce(u.email, 'administrador'), '@', 1),
  'administrador',
  true
from auth.users u
left join public.perfiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;
