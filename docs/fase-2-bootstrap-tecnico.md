# Fase 2 - Bootstrap Tecnico

## Objetivo cumplido

Se deja inicializado el proyecto base con el stack obligatorio y la estructura minima para continuar con las siguientes fases sin rehacer cimientos.

## Entregables implementados

- Proyecto Next.js 16 con App Router y TypeScript.
- Material UI integrado globalmente.
- Tema visual base mobile first.
- Neon Auth preparado para el backoffice:
  - cliente
  - servidor
  - route handler `/api/auth/[...path]`
  - proteccion de rutas mediante `proxy.ts`
- Prisma 6 configurado con datasource PostgreSQL para Neon.
- Archivo `.env.example` con variables requeridas.
- Rutas iniciales:
  - `/`
  - `/solicitar`
  - `/asignaciones`
  - `/admin`
  - `/auth/[path]`
  - `/account/[path]`
  - `/api/health`
- Manifest PWA base.
- Estructura inicial para `features/`, `server/` y `theme/`.

## Decisiones tomadas

- Se uso `@mui/material-nextjs/v16-appRouter` para alinear MUI con Next.js 16.
- Se adopto `@neondatabase/auth` porque la documentacion oficial actual de Neon Auth lo define como SDK vigente para Next.js.
- La proteccion administrativa se limito a `/admin` y `/account` en esta fase.
- Se fijo Prisma en la rama 6.x para evitar complejidad adicional introducida por Prisma 7 durante el bootstrap.
- El schema Prisma queda solo con generator y datasource porque el modelo del dominio corresponde a la Fase 3.

## Riesgos y observaciones

- Neon Auth esta en beta segun la documentacion oficial de Neon; conviene aislar su integracion detras de modulos propios, como ya se empezo a hacer en `src/lib/auth/`.
- La futura subida a Prisma 7 conviene evaluarla recien cuando el modelo de datos ya este estabilizado y exista necesidad real de adoptar su nuevo esquema de configuracion.
- El manifest PWA actual es base; para una instalacion mas pulida haran falta iconos dedicados y verificacion en dispositivos.

## Preparado para la Fase 3

La siguiente fase puede enfocarse directamente en:

- schema Prisma completo
- migraciones iniciales
- seeds demo
- configuracion singleton
- conexion real a Neon
