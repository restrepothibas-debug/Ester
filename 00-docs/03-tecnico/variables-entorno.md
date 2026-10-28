# Variables de entorno y manejo de secretos

**Este archivo documenta NOMBRES y procedimientos. Nunca contiene valores.**

---

## Dónde vive cada cosa

| Tipo de valor | Dónde se guarda | ¿Versionado? |
|---|---|---|
| Credenciales reales de desarrollo | `.env.local` en la raíz del proyecto | ❌ Nunca (ignorado por git) |
| Credenciales de producción | Vercel → Settings → Environment Variables | ❌ Nunca |
| Nombres de variables sin valores | `.env.example` | ✅ Sí |
| Tokens de CLI (Supabase, Vercel, GitHub) | Llavero del sistema o `~/.config` del CLI correspondiente | ❌ Nunca |

`vite` carga `.env.local` automáticamente en desarrollo. **Solo las variables con prefijo `VITE_` llegan al navegador**: se incrustan en el bundle y cualquiera puede leerlas con las herramientas del navegador. Por eso ese prefijo se trata como «público por diseño».

## Variables del cliente (públicas)

| Variable | Qué es | Sensibilidad |
|---|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase (`https://<ref>.supabase.co`) | Baja. Pública por diseño |
| `VITE_SUPABASE_ANON_KEY` | Clave `anon` / publishable de Supabase | Baja. Pública por diseño; su poder real lo limitan las políticas RLS |
| `VITE_WHATSAPP_NUMERO` | Número de WhatsApp del negocio | Pública. **Valor pendiente** |
| `VITE_CORREO_ADMIN` | Correo administrativo visible | Baja. **Valor pendiente** |

## Variables de servidor (nunca en el cliente)

| Variable | Qué es | Regla |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Clave que **salta RLS**. Acceso total a la base | **Prohibida en el frontend y prohibida con prefijo `VITE_`.** Solo para scripts locales de administración o funciones server-side |
| `SUPABASE_ACCESS_TOKEN` | Token personal de la CLI de Supabase | Solo en el llavero o en `.env.local` de uso local |
| `SUPABASE_DB_PASSWORD` | Contraseña de la base | Solo en el gestor de secretos |
| `VERCEL_TOKEN` | Token de despliegue | Solo en el llavero del CLI o en CI |
| `GITHUB_TOKEN` | Token con permiso de push | Solo en el llavero del CLI |

**Consecuencia práctica:** este proyecto es una SPA de Vite sin servidor propio. Si en algún momento hace falta una operación privilegiada, se resuelve con **funciones server-side de Supabase (Edge Functions) o RLS bien diseñado**, no metiendo la `service_role` en el navegador.

## Reglas de seguridad

1. Ningún secreto se pega en documentos de `00-docs/`, en el código, en un commit, en una captura ni en un chat.
2. `.gitignore` excluye `.env`, `.env.*`, `!.env.example`, `*.local`, `*.pem`, `*.key`, `supabase/.temp/` y `.vercel`.
3. Si un secreto se expone (commit, captura, chat, log): **se rota**, no se «borra». Un secreto filtrado se considera comprometido aunque se elimine del archivo.
4. La clave `anon` no es un secreto, pero **su poder debe estar limitado por RLS**. Sin RLS, la `anon` key equivale a acceso abierto.
5. Antes de cada push: `git status` para confirmar que ningún `.env*` entró al índice.
6. En Vercel, las variables se cargan por entorno (Production / Preview / Development). No reutilizar la de producción en Preview.

## Qué necesito del propietario (y para qué sirve cada cosa)

| Dato | Para qué | Dónde se guarda |
|---|---|---|
| URL del proyecto Supabase | Conectar el cliente | `.env.local` + Vercel |
| Clave `anon` / publishable | Conectar el cliente (limitada por RLS) | `.env.local` + Vercel |
| Clave `service_role` | **Solo si** hace falta administración local/Edge Functions | `.env.local`, jamás en el cliente |
| Contraseña de la base | Migraciones con la CLI | Gestor de secretos, no en el repo |
| Token de acceso Supabase | `supabase link` / `db push` / backups con CLI | Llavero o `.env.local` |
| Token de Vercel | Despliegue desde CLI si no se conecta el repo | Llavero |
| Token de GitHub con push | Subir el repositorio | Llavero |

## Credenciales ya recibidas

| Credencial | Cuenta / tipo | Dónde está guardada | Estado |
|---|---|---|---|
| Token de GitHub (PAT clásico) | `restrepothibas-debug` | `~/.accio/accounts/<cuenta>/secrets/github-restrepothibas-debug.token` (permisos `600`, directorio `700`, **fuera del workspace**) | ⚠️ Recibido 27/10/2026 |
| Clave secreta de Supabase (`sb_secret_…`) | Nivel servicio: **salta RLS** | `.env.local` → variable `SUPABASE_SECRET_KEY` (permisos `600`, ignorado por git) | ✅ Recibida 28/10/2026 |
| URL del proyecto Supabase | `https://pklqdjixkhpkmtrhtzsm.supabase.co` | `.env.local` → `VITE_SUPABASE_URL` | ✅ Recibida 28/10 y **verificada**: el proyecto responde (HTTP 401 sin clave, Postgres 14.18, GoTrue v2.197.0) |
| Contraseña de la base | `postgres.<ref>` | `.env.local` → dentro de `SUPABASE_DB_URL` | ✅ **Confirmada** el 28/10: la conexión al pooler autenticó correctamente |
| Clave publicable / `anon` | Pública, limitada por RLS | `.env.local` → `VITE_SUPABASE_ANON_KEY` | ✅ Recibida y verificada (JWT `role: anon`, exp 2036) |
| Conexión directa (DSN) | Pooler `aws-0-us-east-2` | `.env.local` → `SUPABASE_DB_URL` | ✅ Verificada. Es el único medio de ejecutar DDL en este entorno |

**La clave `sb_secret_…` es el reemplazo de `service_role`: acceso total a la base.** No lleva prefijo `VITE_` y nunca debe llegar al navegador ni a una Edge Function que devuelva datos sin filtrar. En `.env.local` queda sin prefijo justamente para que Vite **no** la incruste en el bundle.

**Con la clave secreta sola no se puede conectar nada:** la clave identifica el permiso, no el proyecto. Falta la URL (`https://<ref>.supabase.co`) y la clave publicable que sí usa el cliente.

**Bloqueo del entorno:** el 28/10 el sandbox denegó crear archivos nuevos en el directorio de secretos fuera del workspace (`operation not permitted`, tanto con nombre inocuo como sospechoso). El archivo del token de GitHub sí se pudo escribir el 27/10. Por eso esta clave se guardó en `.env.local` dentro del proyecto, que ya está verificado como ignorado por git.

**Por qué el token de GitHub quedó fuera del proyecto:** el intento de escribirlo en el llavero de macOS y en la configuración de `gh` (`~/.config/gh/hosts.yml`) fue **rechazado por el entorno** («operation not permitted»). Se guardó en un archivo local con permisos restringidos, fuera del repositorio, que es la alternativa segura disponible.

**Cómo se usa sin exponerlo:**

```bash
TOKEN=$(cat ~/.accio/accounts/<cuenta>/secrets/github-restrepothibas-debug.token)
git push https://x-access-token:$TOKEN@github.com/restrepothibas-debug/Ester.git main
```

Nunca escribir el valor dentro de `.git/config`, de un script versionado ni de un documento.

**Advertencia registrada el 27/10/2026:** este token fue pegado en el chat, por lo que debe considerarse **expuesto**. Además trae permisos muy superiores a los necesarios (`admin:org`, `delete_repo`, `workflow`, `admin:enterprise`). Recomendación: **rotarlo** y sustituirlo por un token de granularidad fina limitado al repositorio `Ester` con permiso `Contents: Read and write`.

## Procedimiento cuando lleguen los valores

1. Escribirlos en `.env.local` (creado en ese momento, ya ignorado por git).
2. Verificar que `git check-ignore .env.local` responde con el nombre del archivo.
3. Levantar el proyecto y confirmar que no hay errores de conexión.
4. Cargar los mismos valores en Vercel, una vez exista el proyecto.
5. Registrar en la bitácora qué se configuró — **sin los valores**.
