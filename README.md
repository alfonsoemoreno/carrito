# Carrito

Sistema de gestion de turnos para zonas de publicaciones.

Estado actual:

- Fase 1 completada: arquitectura y diseno.
- Fase 2 completada: bootstrap tecnico del proyecto.
- Fase 3 completada: modelo de datos, migracion inicial SQL y seed demo.
- Fase 4 completada: modulos maestros del backoffice.
- Fase 5 completada: flujo publico con PIN, solicitudes y consulta.
- Fase 6 completada: asignacion administrativa inicial.
- Fase 7 completada: automatizacion operativa y alertas.
- Fase 8 completada: estadisticas y exportaciones operativas.

## Stack base

- Next.js 16 con App Router
- TypeScript
- Material UI
- Prisma ORM
- PostgreSQL sobre Neon
- Neon Auth para backoffice
- Vercel como destino de despliegue

## Arranque local

1. Instala dependencias:

```bash
npm install
```

2. Crea tu archivo de entorno:

```bash
cp .env.example .env
```

3. Completa al menos estas variables:

- `DATABASE_URL`
- `DIRECT_URL`
- `NEON_AUTH_BASE_URL`
- `NEON_AUTH_COOKIE_SECRET`

4. Genera Prisma Client:

```bash
npm run db:generate
```

5. Aplica tu estrategia de esquema:

```bash
npm run db:push
```

o ejecuta la migracion SQL inicial ubicada en `prisma/migrations/202606130001_init/migration.sql`.

6. Carga datos demo:

```bash
npm run db:seed
```

7. Inicia el proyecto:

```bash
npm run dev
```

## Scripts utiles

- `npm run dev`
- `npm run lint`
- `npm run build`
- `npm run check`
- `npm run db:generate`
- `npm run db:push`
- `npm run db:migrate:dev`
- `npm run db:seed`
- `npm run db:studio`

## Documentacion de fases

- [Fase 1 - Arquitectura](/Users/alfonsomoreno/Developer/carrito/docs/fase-1-arquitectura.md)
- [Fase 2 - Bootstrap Tecnico](/Users/alfonsomoreno/Developer/carrito/docs/fase-2-bootstrap-tecnico.md)
- [Fase 3 - Modelo de Datos](/Users/alfonsomoreno/Developer/carrito/docs/fase-3-modelo-datos.md)
- [Fase 4 - Modulos Maestros](/Users/alfonsomoreno/Developer/carrito/docs/fase-4-modulos-maestros.md)
- [Fase 5 - Flujo Publico](/Users/alfonsomoreno/Developer/carrito/docs/fase-5-flujo-publico.md)
- [Fase 6 - Asignacion Administrativa](/Users/alfonsomoreno/Developer/carrito/docs/fase-6-asignacion-administrativa.md)
- [Fase 7 - Automatizacion y Reglas](/Users/alfonsomoreno/Developer/carrito/docs/fase-7-automatizacion-y-reglas.md)
- [Fase 8 - Estadisticas y Exportaciones](/Users/alfonsomoreno/Developer/carrito/docs/fase-8-estadisticas-y-exportaciones.md)
