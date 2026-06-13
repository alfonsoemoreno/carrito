# Fase 3 - Modelo de Datos

## Objetivo cumplido

Se implemento el modelo Prisma completo del dominio principal, se genero una migracion SQL inicial desde el schema y se agrego un seed demo coherente con las reglas definidas en Fase 1.

## Entregables implementados

- `prisma/schema.prisma` completo con:
  - enums del dominio
  - personas
  - administradores
  - relaciones
  - zonas
  - plantillas
  - turnos
  - bloqueos
  - indisponibilidades
  - solicitudes
  - asignaciones
  - configuracion singleton
  - auditoria
- `prisma/migrations/202606130001_init/migration.sql` generado desde schema.
- `prisma/migrations/migration_lock.toml`.
- `prisma/seed.mjs` con datos demo.
- script `npm run db:seed`.

## Decisiones tomadas

- Se mantuvo PostgreSQL como provider Prisma y UUID como clave primaria en todas las entidades del dominio.
- `SystemConfig` se modelo como singleton mediante `config_key = "default"` unico.
- `Assignment` permite historial por turno, por eso no se fuerza unicidad sobre `shift_id`.
- `ShiftRequest` no fuerza unicidad parcial para solicitudes activas porque Prisma no modela indices parciales; esa regla se aplicara a nivel de servicio.
- El seed usa hashes demo basados en `scrypt` para no almacenar PIN en texto plano aun en datos ficticios.

## Datos demo incluidos

- 2 administradores
- 10 personas
- relaciones de matrimonio, padre/madre-hijo/hija y excepcion administrativa
- 3 zonas
- 3 plantillas
- turnos pasados y futuros
- bloqueos por turno y por rango de fechas
- indisponibilidades
- solicitudes en estados pendientes, confirmadas, rechazadas y canceladas
- asignaciones confirmadas y reemplazadas
- configuracion general inicial
- registros de auditoria

## Validaciones realizadas

- `npm run db:generate`
- `node --check prisma/seed.mjs`
- generacion de migracion SQL con `prisma migrate diff --from-empty`
- `npm run lint`
- `npm run build`

## Riesgos y observaciones

- La migracion SQL fue generada correctamente, pero no se aplico contra una base real en esta fase porque no se configuro una conexion Neon operativa en el entorno actual.
- Las restricciones de negocio avanzadas, como evitar solicitudes activas duplicadas o impedir ciertas combinaciones de asignacion, siguen perteneciendo a la capa de servicios y no solo al schema.
- El hash de PIN del seed es suficiente para datos demo, pero la validacion operativa real del PIN se implementara cuando se construya el flujo publico.

## Preparado para la Fase 4

La siguiente fase puede enfocarse directamente en los modulos maestros:

- personas
- relaciones
- zonas
- plantillas
- bloqueos
- disponibilidad
