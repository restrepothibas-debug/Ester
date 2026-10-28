# Migraciones de base de datos

Proyecto Supabase: **`pklqdjixkhpkmtrhtzsm`** · `https://pklqdjixkhpkmtrhtzsm.supabase.co`

## Estado

| Migración | Qué hace | Aplicada |
|---|---|---|
| `20261028090000_esquema_inicial.sql` | Tipos, 13 tablas, índices, restricciones, valores de configuración | ❌ Pendiente |
| `20261028090100_rls_politicas.sql` | RLS en todas las tablas, políticas por rol, buckets de Storage | ❌ Pendiente |

**Pendiente porque** este entorno no puede ejecutar DDL: no hay `psql`, no hay Docker, y el host directo `db.<ref>.supabase.co` no resuelve (Supabase exige el pooler para conexiones externas). La API REST del proyecto sirve para datos, no para `CREATE TABLE`.

## Cómo se aplican

### Opción A — token de acceso (recomendado)

Requiere un token `sbp_…` de **Account → Access Tokens**.

```bash
export SUPABASE_ACCESS_TOKEN=sbp_...
./scripts/aplicar-migraciones.sh
```

El script envía cada archivo, en orden, al endpoint de consulta de la Management API. Es idempotente respecto al orden: si una migración falla, se detiene y no continúa.

### Opción B — conexión directa

Requiere la cadena de conexión del pooler (**Connect → Session pooler**), que incluye la región y la contraseña:

```bash
export SUPABASE_DB_URL='postgresql://postgres.pklqdjixkhpkmtrhtzsm:...@aws-0-<region>.pooler.supabase.com:5432/postgres'
```

## Reglas

1. **Nunca** aplicar en producción sin respaldo previo (§19).
2. Las migraciones no se editan después de aplicadas: se añade una nueva.
3. Antes de crear la cuenta administradora hacen falta el correo administrativo y el número de WhatsApp, que aún no están definidos.
4. Después de aplicar, verificar: `select count(*) from productos;` debe fallar con RLS si se consulta como `anon`, y devolver 0 si se consulta como administrador.
