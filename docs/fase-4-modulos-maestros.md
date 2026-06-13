# Fase 4 - Modulos Maestros

## Objetivo cumplido

Se implemento la primera capa funcional del backoffice sobre Neon para administrar los recursos maestros del sistema:

- personas
- relaciones
- zonas
- plantillas
- bloqueos
- indisponibilidad

## Entregables implementados

- Dashboard administrativo conectado a datos reales.
- Navegacion de backoffice hacia modulos maestros.
- Consultas server-side para resumenes y catálogos base.
- Server Actions para alta y administracion inicial de:
  - personas
  - estado de personas
  - reseteo de PIN
  - relaciones
  - zonas
  - plantillas
  - bloqueos
  - indisponibilidad
- Utilidad de hash de PIN reutilizable en servidor.

## Archivos principales

- `src/features/admin/master-data/actions.ts`
- `src/features/admin/master-data/queries.ts`
- `src/features/admin/master-data/validations.ts`
- `src/features/admin/master-data/utils.ts`
- `src/lib/pin.ts`
- `src/app/(admin)/admin/page.tsx`
- `src/app/(admin)/admin/personas/page.tsx`
- `src/app/(admin)/admin/relaciones/page.tsx`
- `src/app/(admin)/admin/zonas/page.tsx`
- `src/app/(admin)/admin/plantillas/page.tsx`
- `src/app/(admin)/admin/bloqueos/page.tsx`
- `src/app/(admin)/admin/disponibilidad/page.tsx`

## Decisiones tomadas

- Se uso server-side rendering dinamico para el segmento administrativo, evitando depender de prerender estatico sobre datos de Neon.
- Las mutaciones se implementaron con Server Actions para mantener validacion y escritura exclusivamente en servidor.
- El reseteo de PIN reutiliza el mismo criterio de hash del dominio, sin persistir valores en texto plano.
- Las restricciones complejas de negocio siguen fuera de esta fase; aqui se habilito la administracion base de los recursos maestros.

## Validaciones realizadas

- `npm run db:generate`
- `npm run lint`
- `npm run build`

## Riesgos y observaciones

- Las pantallas actuales cubren alta y administracion inicial, pero aun no incluyen edicion completa campo por campo ni borrado controlado.
- Algunas reglas de negocio siguen siendo responsabilidad de fases posteriores, por ejemplo deduplicacion avanzada o advertencias contextuales.
- El actor administrativo real aun no se extrae de la sesion Neon Auth para auditoria fina; mientras tanto se resuelve un administrador activo por defecto cuando hace falta asociar creador.

## Preparado para la Fase 5

La siguiente fase puede enfocarse en el flujo publico:

- busqueda de persona
- validacion de PIN
- sesion publica temporal
- solicitud multiple de turnos
- cancelacion de solicitudes pendientes
- consulta personal y publica de asignaciones
