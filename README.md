# Dayara store

Catálogo digital de calzado. Catálogo público + panel privado de administración. Sin pago en línea: las solicitudes se cierran por WhatsApp y el administrador las registra a mano.

**Antes de tocar nada, lee [`AGENTS.md`](AGENTS.md).** Es el punto de entrada del proyecto: qué es, en qué fase está, qué reglas no se negocian y dónde se guarda cada dato.

## Stack

React 19 + Vite 8 + TypeScript · Supabase (Postgres, Auth, Storage) · Vercel · GitHub

## Comandos

```bash
npm install
npm run dev       # desarrollo
npm run build     # compilación con verificación de tipos
npm run lint
```

## Base de datos

Migraciones versionadas en [`supabase/migrations/`](supabase/migrations). Ver [`supabase/README.md`](supabase/README.md) para el procedimiento y el estado de aplicación.

## Documentación

| Carpeta | Contenido |
|---|---|
| `00-docs/00-contexto/` | Qué se construye y con qué alcance |
| `00-docs/01-decisiones/` | Decisiones tomadas y pendientes |
| `00-docs/02-estado/` | Fase actual, bloqueos y bitácora |
| `00-docs/03-tecnico/` | Entorno y variables de entorno |
| `00-docs/04-informes/` | Auditorías y comparaciones |
| `00-docs/05-diseno/` | Esquema de datos y mapa de páginas |
| `Especificacion_Proyecto_Catalogo_Zapatos.pdf` | Especificación original del propietario |

## Seguridad

Las credenciales **no** viven en este repositorio. Se cargan en `.env.local` (ignorado por git) y en Vercel. Ver [`00-docs/03-tecnico/variables-entorno.md`](00-docs/03-tecnico/variables-entorno.md).
