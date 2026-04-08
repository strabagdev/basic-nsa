# Base Next + Supabase Auth

Plantilla reusable para futuros proyectos montados sobre `Next.js + Vercel + Supabase`.

La intención es que esta base resuelva lo transversal:

- autenticación con Supabase
- callback OAuth / magic link
- recuperación de contraseña
- bootstrap inicial de plataforma
- memberships por plataforma
- superadmin base
- área privada mínima
- sincronización de perfil
- documentación y SQL bootstrap

Luego cada nuevo proyecto puede duplicar este repo y montar encima la lógica de negocio específica.

## Qué trae

- landing inicial en `/`
- login en `/login`
- setup inicial en `/setup-platform`
- callback auth en `/auth/callback`
- recuperación de contraseña en `/reset-password`
- selector en `/select-platform`
- dashboard privado en `/dashboard`
- panel en `/super-admin`
- perfil editable en `/profile`
- APIs base:
  - `POST /api/profile/sync`
  - `GET /api/me`
  - `PATCH /api/profile`
  - `GET /api/platform/public-status`
  - `POST /api/platform/super-admin/initialize`
  - `GET /api/app/bootstrap`
  - `GET /api/platforms`
  - `POST /api/platforms/active`
  - `GET/POST /api/platforms/manage`
  - `GET/POST /api/platform/members`

## Variables de entorno

Crea `.env.local` usando `.env.example`.

Variables principales:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PLATFORM_SETUP_KEY=change-me
```

También se mantienen nombres heredados compatibles:

- `NEXT_PUBLIC_SUPABASE_AUTH_URL`
- `NEXT_PUBLIC_SUPABASE_AUTH_ANON_KEY`
- `SUPABASE_DATA_URL`
- `SUPABASE_DATA_SERVICE_ROLE_KEY`

Para redirects públicos:

```env
SITE_URL=https://tu-dominio.com
APP_URL=https://tu-dominio.com
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```

Prioridad práctica:

1. `SITE_URL`
2. `APP_URL`
3. `NEXT_PUBLIC_APP_URL`
4. host inferido del request

## SQL inicial

Ejecuta [`supabase/001_profiles.sql`](/home/dannysilver/dev2026/base-next-supa-auth-app/supabase/001_profiles.sql) en tu proyecto Supabase.
Luego ejecuta [`supabase/002_platform_kernel.sql`](/home/dannysilver/dev2026/base-next-supa-auth-app/supabase/002_platform_kernel.sql).

Eso crea:

- `profiles`
- `platform_settings`
- `platforms`
- `platform_memberships`
- `active_platform_id` en perfiles

## Flujo recomendado para duplicar

1. Duplicar este repo.
2. Configurar variables en Vercel.
3. Ejecutar el SQL bootstrap en Supabase.
4. Configurar en `Supabase Auth` las Redirect URLs:
   - `https://tu-dominio.com/auth/callback`
   - `https://tu-dominio.com/reset-password`
5. Abrir `/setup-platform` y crear la plataforma inicial.
6. Probar login, selección de plataforma y dashboard.
7. Empezar a sumar tablas, rutas y pantallas del negocio.

## Desarrollo

```bash
npm install
npm run dev
```

## Notas de arquitectura

- `lib/supabase/authClient.ts`: cliente auth para browser
- `lib/supabase/dataServer.ts`: cliente server con service role
- `lib/server/requireAuthUser.ts`: validación de bearer token
- `lib/server/publicAppOrigin.ts`: helper de redirects útil en Vercel
- `lib/server/platforms.ts`: memberships, bootstrap y plataforma activa
- `lib/server/authAdmin.ts`: helpers admin sobre Supabase Auth

## Qué no incluye a propósito

No copia la lógica de negocio de `deadline-tracker`:

- organizaciones
- permisos complejos
- módulos del dominio
- dashboards de analytics
- reportes

## Modelo de acceso

- `Supabase Auth`: identidad global
- `profiles`: perfil local sincronizado
- `platform_memberships`: acceso local por plataforma
- `platforms`: instancias/productos gestionados

La misma persona puede existir una sola vez en auth y tener distintos roles en distintas plataformas.

Eso queda para cada producto construido sobre esta base.
