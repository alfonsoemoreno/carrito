# Carrito

Sistema de gestion de turnos para zonas de publicaciones. El proyecto combina un flujo publico para personas asignables y un backoffice administrativo con autenticacion, reglas operativas, automatizaciones, exportaciones y estadisticas.

## Estado actual

- Fase 1 completada: arquitectura y diseno.
- Fase 2 completada: bootstrap tecnico del proyecto.
- Fase 3 completada: modelo de datos, migracion inicial SQL y seed demo.
- Fase 4 completada: modulos maestros del backoffice.
- Fase 5 completada: flujo publico con PIN, solicitudes y consulta.
- Fase 6 completada: asignacion administrativa inicial.
- Fase 7 completada: automatizacion operativa y alertas.
- Fase 8 completada: estadisticas y exportaciones operativas.
- Fase 9 completada: hardening tecnico, pruebas base y documentacion operativa.

## Stack

- Next.js 16 con App Router
- React 19
- TypeScript
- Material UI 9
- Prisma ORM
- PostgreSQL sobre Neon
- Neon Auth para acceso administrativo
- Vercel como destino de despliegue

## Capacidades principales

- Catalogos maestros para personas, zonas, plantillas, relaciones, indisponibilidades y bloqueos.
- Flujo publico para consultar turnos, enviar solicitudes y revisar historial con PIN.
- Backoffice para revisar solicitudes, asignar parejas y operar el calendario.
- Reglas de negocio para detectar conflictos por disponibilidad, solapamiento, dias consecutivos y limites semanales o mensuales.
- Automatizacion para sugerencias operativas y alertas administrativas.
- Exportaciones CSV y vistas de estadisticas por rango de fechas.
- Endpoints de salud y protecciones basicas para despliegue.

## Estructura general

- `src/app`: rutas App Router, paginas publicas, backoffice y APIs.
- `src/features`: logica de dominio por modulo.
- `src/lib`: utilidades compartidas, Prisma y seguridad.
- `prisma`: esquema, migraciones y seed.
- `docs`: documentacion por fase.
- `tests`: pruebas automatizadas sobre utilidades criticas.

## Configuracion local

1. Instala dependencias:

```bash
npm install
```

2. Crea tu archivo de entorno:

```bash
cp .env.example .env
```

3. Completa al menos estas variables:

- `DATABASE_URL`: cadena principal usada por Prisma y la aplicacion.
- `DIRECT_URL`: conexion directa para operaciones administrativas de Prisma.
- `NEON_AUTH_BASE_URL`: base URL del stack de Neon Auth para `sign-in` y sesion.
- `NEON_AUTH_COOKIE_SECRET`: secreto usado para firmar la cookie de sesion.
- `NEXT_PUBLIC_APP_NAME`: nombre visible de la aplicacion.

4. Genera Prisma Client:

```bash
npm run db:generate
```

5. Sincroniza el esquema:

```bash
npm run db:push
```

Tambien puedes aplicar la migracion SQL inicial ubicada en `prisma/migrations/202606130001_init/migration.sql`.

6. Carga datos demo:

```bash
npm run db:seed
```

7. Inicia el entorno local:

```bash
npm run dev
```

## Scripts

- `npm run dev`: entorno local de desarrollo.
- `npm run build`: compilacion de produccion.
- `npm run start`: levanta el build compilado.
- `npm run lint`: validacion estandar con ESLint.
- `npm run test`: pruebas unitarias base sobre utilidades puras.
- `npm run check`: corre `lint` y `build`.
- `npm run db:generate`: regenera Prisma Client.
- `npm run db:push`: sincroniza el esquema con la base.
- `npm run db:migrate:dev`: crea/aplica migraciones en desarrollo.
- `npm run db:seed`: carga datos demo.
- `npm run db:studio`: abre Prisma Studio.

## Flujo funcional

### Publico

- Consulta de asignaciones por persona y PIN.
- Solicitud de cambios o disponibilidad segun el periodo visible.
- Historial visible segun configuracion.

### Administrativo

- Inicio de sesion mediante Neon Auth.
- Vinculacion del usuario autenticado con una persona administrativa activa.
- Acceso a maestros, solicitudes, asignacion, automatizacion, estadisticas y exportaciones.
- Resguardo server-side para paginas administrativas y APIs de exportacion.

## Seguridad y hardening

- Validacion de acceso administrativo directamente en paginas server-side.
- APIs de exportacion protegidas contra acceso anonimo.
- Cabeceras HTTP base en `next.config.ts`:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- Politicas `no-store` en salud y exportaciones.
- `robots.ts` bloquea indexacion de `/admin/`, `/api/` y `/account/`.
- `sitemap.ts` publica solo rutas relevantes del flujo visible.
- Mejora de accesibilidad con skip link, foco visible y soporte `prefers-reduced-motion`.

## Pruebas

La suite actual cubre utilidades que sostienen reglas del negocio y formatos operativos:

- hashing y verificacion de PIN.
- fechas y solapamientos en UTC.
- normalizacion de rangos de estadisticas.
- escape y construccion de CSV.
- advertencias de asignacion y notas administrativas.

Ejecuta:

```bash
npm run test
```

## Despliegue

- Destino previsto: Vercel.
- Base de datos: Neon PostgreSQL.
- Autenticacion administrativa: Neon Auth.
- Antes de desplegar, valida:
  - variables de entorno correctas en el entorno remoto.
  - `npm run build` sin errores.
  - esquema Prisma aplicado a la base objetivo.
  - existencia de al menos una persona administrativa activa vinculable.

## Riesgos conocidos

- No hay aun auditoria persistente de descargas CSV.
- No hay pruebas de integracion o end-to-end para el flujo administrativo completo.
- Falta endurecer observabilidad operativa con trazas, metricas o alertas de errores.

## Documentacion por fases

- [Fase 1 - Arquitectura](/Users/alfonsomoreno/Developer/carrito/docs/fase-1-arquitectura.md)
- [Fase 2 - Bootstrap Tecnico](/Users/alfonsomoreno/Developer/carrito/docs/fase-2-bootstrap-tecnico.md)
- [Fase 3 - Modelo de Datos](/Users/alfonsomoreno/Developer/carrito/docs/fase-3-modelo-datos.md)
- [Fase 4 - Modulos Maestros](/Users/alfonsomoreno/Developer/carrito/docs/fase-4-modulos-maestros.md)
- [Fase 5 - Flujo Publico](/Users/alfonsomoreno/Developer/carrito/docs/fase-5-flujo-publico.md)
- [Fase 6 - Asignacion Administrativa](/Users/alfonsomoreno/Developer/carrito/docs/fase-6-asignacion-administrativa.md)
- [Fase 7 - Automatizacion y Reglas](/Users/alfonsomoreno/Developer/carrito/docs/fase-7-automatizacion-y-reglas.md)
- [Fase 8 - Estadisticas y Exportaciones](/Users/alfonsomoreno/Developer/carrito/docs/fase-8-estadisticas-y-exportaciones.md)
- [Fase 9 - Hardening y Documentacion](/Users/alfonsomoreno/Developer/carrito/docs/fase-9-hardening-y-documentacion.md)
