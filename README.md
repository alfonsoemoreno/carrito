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
npm ci
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
- `NEXT_PUBLIC_SITE_URL`: URL pública de la aplicación; en desarrollo usa `http://localhost:3000`.

4. Genera Prisma Client:

```bash
npm run db:generate
```

5. Sincroniza el esquema:

```bash
npm run db:push
```

Para desarrollo local puedes aplicar las migraciones con `npm run db:migrate:dev`.

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
- `npm run db:migrate:deploy`: aplica migraciones existentes en un entorno remoto.
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

### Mapa de lugares

- El mapa público está en `/mapa`; muestra únicamente lugares activos y visibles.
- En Administración → Más → Lugares se pueden crear o editar dirección, coordenadas y color.
- Para ubicar un lugar, pincha el minimapa, arrastra el pin o pega `latitud, longitud`. Las coordenadas son opcionales, pero deben ingresarse juntas.
- Administración → Más → Mapa de lugares incluye también lugares ocultos e inactivos.
- El mapa usa MapLibre y OpenFreeMap, sin clave API. Requiere acceso del navegador a `tiles.openfreemap.org`; la atribución del proveedor permanece visible. Si falla la carga, el listado sigue disponible.
- El worker de MapLibre se publica como un recurso del propio sitio durante la compilación.
- Antes de desplegar esta versión en otra base, ejecuta `npm run db:migrate:deploy` y `npm run db:generate`. La migración `202610120001_zone_map` agrega campos opcionales y conserva los lugares existentes.

### Publicación

- Sube este repositorio a GitHub e impórtalo como un proyecto nuevo en Vercel.
- Desde la integración Neon del Marketplace de Vercel, crea y conecta una base nueva. Usa la conexión pooled como `DATABASE_URL` y la conexión directa/unpooled como `DIRECT_URL`.
- Habilita Neon Auth para la rama de producción. Configura `NEON_AUTH_BASE_URL` con la URL que entrega Neon y crea `NEON_AUTH_COOKIE_SECRET` con `openssl rand -base64 32`.
- Añade `NEXT_PUBLIC_SITE_URL` con el dominio `https://...vercel.app` que Vercel asigna al proyecto. Si cambias el dominio después, actualiza la variable y vuelve a desplegar.
- Define estas variables para **Production** en Vercel; agrega también valores separados para Preview si vas a probar ahí.
- Antes del primer uso, aplica las migraciones contra la base nueva con `npm run db:migrate:deploy` usando las variables de producción.
- No ejecutes `npm run db:seed` en producción: ese script borra las tablas operativas y carga personas y administradores de demostración.
- Abre `/auth/sign-up` para crear tu usuario administrativo, inicia sesión y visita `/admin/cuenta` para reclamarlo como superadministrador inicial.
- En Neon Auth, verifica que el dominio de producción figure entre los orígenes permitidos. Después carga participantes, lugares y horarios desde el backoffice.

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

## Temas y ediciones de eventos

La identidad activa es `ironman-valdivia`. Se puede elegir globalmente con
`NEXT_PUBLIC_EVENT_THEME=ironman-valdivia` o `NEXT_PUBLIC_EVENT_THEME=tour-de-france`
en el entorno. Reinicia `npm run dev` después del cambio; en producción genera
un nuevo build. El servidor y el navegador usan la misma configuración, por lo
que el nombre, las fechas, los metadatos, los iconos y los estilos coinciden.
El modo claro/oscuro sigue siendo una preferencia independiente de cada usuario.

- `src/theme/events/tour-de-france.css` y `.ts`: identidad original, con sus fuentes Galibier y amarillo.
- `src/theme/events/ironman-valdivia.css` y `.ts`: identidad inspirada en la página de IRONMAN Valdivia, con azules de río, fondos oscuros y títulos condensados.
- `src/theme/event-theme.ts`: registro de marcas y selección del tema.
- `src/lib/event-editions.ts`: nombres y fechas de cada edición. Actualiza aquí la edición anual sin modificar los temas. Las fechas también determinan el rango público de turnos y el cierre de solicitudes.
- `public/icons/<tema>/`: iconos independientes. Los originales se conservan bajo `tour-de-france`; la identidad activa muestra únicamente «IRONMAN 2026» en mayúsculas sobre una franja del color del símbolo. El encabezado combina un símbolo vectorial que fusiona la M con punto de IRONMAN y un carrito de publicaciones, acompañado del rótulo HTML legible; usa Manrope local y los colores de la aplicación. `logo-light.svg` y `logo-dark.svg` son versiones completas para exportación; `mark-light.svg` y `mark-dark.svg` se usan en el encabezado. Los iconos usan el mismo carrito. El archivo original `official-logo.png` se conserva únicamente como referencia.

La coordinación de IRONMAN 2026 abarca del **23 al 29 de noviembre de 2026**, ambos incluidos. La carrera se celebra el 29 de noviembre según [la página oficial](https://www.ironman.com/races/im-valdivia).

En esta edición cada persona puede tener hasta **5 turnos confirmados**. Este límite se comprueba dentro de la transacción de asignación y no admite excepción administrativa. Las solicitudes pendientes no cuentan como asignaciones. Reemplazar una pareja en el mismo turno no duplica su cómputo; las asignaciones canceladas o reemplazadas no cuentan.

Si las mismas dos personas tienen otro turno confirmado durante la semana de lunes a domingo, el formulario muestra una advertencia, independientemente del orden de las personas o del lugar y horario. Para continuar, el administrador debe ingresar un motivo de excepción, que queda en la auditoría. El servidor vuelve a comprobar la pareja al guardar para detectar cambios hechos por otros administradores.

Cambiar de tema no migra ni separa personas, solicitudes, zonas o asignaciones de
la base de datos y no crea nuevos turnos.
