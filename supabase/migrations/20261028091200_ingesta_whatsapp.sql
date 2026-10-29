-- =============================================================================
-- 13 · Bandeja de entrada de WhatsApp
--
-- El webhook de la Cloud API entrega un mensaje (texto y/o imagen). Antes de
-- ser un producto, ese mensaje es una fila aquí. La tabla es el contrato entre
-- la puerta de entrada y el catálogo, y sirve igual si el mensaje llega por
-- webhook o si viene de una exportación procesada en local.
--
-- Reglas:
--   · Un mismo mensaje no entra dos veces (`wa_message_id`).
--   · Nada se crea publicado: la conversión produce un producto en
--     `pendiente_revision`.
--   · La tabla solo se escribe por funciones (misma lección que solicitudes y
--     fotografías).
-- =============================================================================

create table if not exists public.ingesta_whatsapp (
  id               uuid primary key default gen_random_uuid(),
  wa_message_id    text not null unique,
  remitente        text,
  nombre_remitente text,
  texto            text,
  tipo             text not null default 'text',
  media_id         text,
  ruta             text,
  ruta_min         text,
  estado           text not null default 'pendiente'
                   check (estado in ('pendiente', 'convertida', 'descartada')),
  producto_id      uuid references public.productos (id) on delete set null,
  notas            text,
  creado_en        timestamptz not null default now(),
  resuelto_en      timestamptz
);

create index if not exists ix_ingesta_estado on public.ingesta_whatsapp (estado, creado_en desc);

comment on table public.ingesta_whatsapp is
  'Mensajes de WhatsApp recibidos y aún no convertidos en producto (punto 48).';

alter table public.ingesta_whatsapp enable row level security;

drop policy if exists ingesta_leer_admin on public.ingesta_whatsapp;
create policy ingesta_leer_admin on public.ingesta_whatsapp
  for select to authenticated using (public.es_admin());

-- Sin políticas de escritura a propósito: escribe solo la puerta de entrada
-- (service role) y el panel a través de las funciones de abajo.
revoke insert, update, delete on public.ingesta_whatsapp from anon, authenticated;
grant select on public.ingesta_whatsapp to authenticated;

-- ---------------------------------------------------------------------------
-- Registrar un mensaje. Idempotente: el mismo wa_message_id no crea dos filas.
-- ---------------------------------------------------------------------------
create or replace function public.registrar_ingesta(
  p_wa_message_id text,
  p_remitente text default null,
  p_nombre_remitente text default null,
  p_texto text default null,
  p_tipo text default 'text',
  p_media_id text default null,
  p_ruta text default null,
  p_ruta_min text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_nueva boolean := false;
begin
  if p_wa_message_id is null or length(trim(p_wa_message_id)) = 0 then
    raise exception 'El mensaje necesita identificador' using errcode = '22023';
  end if;

  insert into public.ingesta_whatsapp
    (wa_message_id, remitente, nombre_remitente, texto, tipo, media_id, ruta, ruta_min)
  values
    (p_wa_message_id, p_remitente, p_nombre_remitente, p_texto, coalesce(p_tipo, 'text'), p_media_id, p_ruta, p_ruta_min)
  on conflict (wa_message_id) do nothing
  returning id into v_id;

  if v_id is not null then
    v_nueva := true;
  else
    select id into v_id from public.ingesta_whatsapp where wa_message_id = p_wa_message_id;
  end if;

  return jsonb_build_object('id', v_id, 'nueva', v_nueva);
end;
$$;

-- ---------------------------------------------------------------------------
-- Cerrar una entrada: convertida (con su producto) o descartada (con motivo).
-- ---------------------------------------------------------------------------
create or replace function public.cerrar_ingesta(
  p_id uuid,
  p_estado text,
  p_producto_id uuid default null,
  p_notas text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_admin() then
    raise exception 'Solo un administrador puede cerrar la bandeja' using errcode = '42501';
  end if;

  if p_estado not in ('convertida', 'descartada') then
    raise exception 'Estado no válido: %', p_estado using errcode = '22023';
  end if;

  if p_estado = 'convertida' and p_producto_id is null then
    raise exception 'Una entrada convertida necesita producto' using errcode = '22023';
  end if;

  update public.ingesta_whatsapp
     set estado = p_estado,
         producto_id = p_producto_id,
         notas = coalesce(p_notas, notas),
         resuelto_en = now()
   where id = p_id;

  if not found then
    raise exception 'La entrada no existe' using errcode = '02000';
  end if;
end;
$$;

revoke all on function public.registrar_ingesta(text, text, text, text, text, text, text, text) from anon, authenticated;
grant execute on function public.cerrar_ingesta(uuid, text, uuid, text) to authenticated;
