# Carrito

Sistema de gestion de turnos para zonas de publicaciones.

Estado actual:

- Fase 1 completada: arquitectura y diseno.
- Fase 2 completada: bootstrap tecnico del proyecto.
- El dominio funcional completo, migraciones definitivas y seeds demo se implementaran en fases posteriores.

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

5. Inicia el proyecto:

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
- `npm run db:studio`

## Documentacion de fases

- [Fase 1 - Arquitectura](/Users/alfonsomoreno/Developer/carrito/docs/fase-1-arquitectura.md)
- [Fase 2 - Bootstrap Tecnico](/Users/alfonsomoreno/Developer/carrito/docs/fase-2-bootstrap-tecnico.md)
