# Migraciones de base de datos

Proyecto Supabase: **`pklqdjixkhpkmtrhtzsm`** · `https://pklqdjixkhpkmtrhtzsm.supabase.co`
Conexión directa: pooler **`aws-0-us-east-2.pooler.supabase.com:5432`** (usuario `postgres.<ref>`)

## Estado — aplicadas y verificadas

| Migración | Qué hace | Estado |
|---|---|---|
| `20261028090000_esquema_inicial.sql` | Tipos, 13 tablas, índices, restricciones, configuración | ✅ Aplicada 28/10/2026 |
| `20261028090100_rls_politicas.sql` | RLS en 13 tablas, 23 políticas, 3 buckets de Storage | ✅ Aplicada 28/10/2026 |
| `20261028090200_control_migraciones.sql` | Tabla `migraciones_aplicadas` para ejecución idempotente | ✅ Aplicada 28/10/2026 |
| `20261028090300_slugs_automaticos.sql` | Normalización de texto y slugs deterministas de marca y producto | ✅ Aplicada 28/10/2026 |
| `20261028090400_perfil_automatico.sql` | Trigger en `auth.users` que crea el perfil de administrador | ✅ Aplicada 28/10/2026 |

### Verificación posterior a la aplicación

| Comprobación | Resultado |
|---|---|
| Tablas en `public` | 13 |
| Tablas con RLS activo | 13 de 13 |
| Políticas creadas | 23 |
| Buckets | `productos` (público), `marcas` (público), `copias` (privado) |
| `anon` lee catálogo | 200, `[]` |
| `anon` intenta insertar una solicitud | **rechazado** — `42501`, violación de RLS |
| `anon` lee `solicitudes` | `[]`, sin filas visibles |
| Clave de servidor lee `configuracion` | 200, 5 filas |
| Imagen principal duplicada | rechazada por `uq_imagen_principal` |
| Cantidad negativa | rechazada por `check` |
| Promoción «programada» sin fecha final | rechazada por `check` |
| Solicitud «cancelada» sin motivo | rechazada por `check` |
| Ajuste de inventario sin motivo | rechazada por `check` |
| Código interno duplicado | rechazado por índice único |

Las pruebas de restricciones se ejecutaron dentro de una transacción con `rollback`: **la base quedó sin datos de prueba** (`select count(*) from productos` → 0).

## Cómo se aplican las migraciones nuevas

```bash
python3 -m pip install --target .venv-libs 'psycopg[binary]'
PYTHONPATH=.venv-libs python3 scripts/aplicar-migraciones.py
```

La cadena de conexión se lee de `SUPABASE_DB_URL` (entorno o `.env.local`). El script consulta `migraciones_aplicadas` y solo ejecuta lo pendiente.

Alternativa con token `sbp_` de la Management API:

```bash
export SUPABASE_ACCESS_TOKEN=sbp_...
./scripts/aplicar-migraciones.sh
```

## Reglas

1. **Nunca** aplicar en producción sin respaldo previo (§19).
2. Una migración aplicada **no se edita**: se añade otra que la corrija.
3. `productos`, `marcas` e imágenes comienzan vacíos a propósito: no se inventan datos de catálogo.
4. La cuenta administradora **la crea el propietario a mano** en Authentication → Users. Al insertarse el usuario, el trigger `trg_perfil_al_crear_usuario` crea su fila en `perfiles` con rol `administrador`; sin esa fila `es_admin()` devuelve false y todas las políticas niegan el acceso.
5. El correo administrativo queda pendiente por decisión del propietario (D-22).
6. Tras aplicar, repetir la verificación de la tabla de arriba antes de dar por bueno el entorno.
