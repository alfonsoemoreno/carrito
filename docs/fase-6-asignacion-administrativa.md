# Fase 6 - Asignacion Administrativa

## Objetivo cumplido

Se implemento la primera capa operativa del despacho administrativo:

- bandeja de solicitudes por turno
- vista centrada en resolver un turno
- rechazo individual de solicitudes pendientes
- confirmacion de pareja para un turno
- reemplazo de asignaciones ya confirmadas
- excepciones administrativas con motivo obligatorio cuando corresponde

## Entregables implementados

- Nueva bandeja administrativa en `/admin/solicitudes`.
- Nueva vista de resolucion por turno en `/admin/turnos/[shiftId]`.
- Navegacion del backoffice actualizada para exponer el flujo operativo.
- Server Actions para:
  - rechazar solicitudes pendientes
  - confirmar una pareja para un turno
  - reemplazar una asignacion confirmada existente
- Validaciones administrativas para:
  - pareja no valida segun reglas configuradas
  - persona inactiva
  - indisponibilidad personal
  - maximos semanales y mensuales de confirmaciones
  - dias consecutivos
  - multiples turnos en el mismo dia
  - superposiciones horarias
  - turnos bloqueados o cerrados
- Auditoria base de decisiones administrativas sobre solicitudes y asignaciones.

## Archivos principales

- `src/features/admin/assignment/queries.ts`
- `src/features/admin/assignment/actions.ts`
- `src/features/admin/assignment/utils.ts`
- `src/features/admin/assignment/validations.ts`
- `src/app/(admin)/admin/solicitudes/page.tsx`
- `src/app/(admin)/admin/turnos/[shiftId]/page.tsx`

## Decisiones tomadas

- Se concentro la operacion en dos superficies claras: una bandeja de turnos con pendientes y una pantalla orientada a resolver un solo turno.
- Las advertencias de reglas no bloquean definitivamente al administrador; exigen motivo de excepcion cuando la decision rompe una restriccion.
- Si un turno ya tenia asignacion confirmada, el reemplazo no pisa el registro anterior: lo marca como `REPLACED` y crea una nueva asignacion `CONFIRMED`.
- Al confirmar una pareja, las solicitudes pendientes restantes del turno se marcan como rechazadas para cerrar el ciclo operativo.
- La seleccion de personas permite usar solicitantes pendientes o elegir manualmente desde personas activas, lo que habilita reemplazos sin depender de una solicitud previa.

## Validaciones realizadas

- `npm run lint`
- `npm run build`

## Riesgos y observaciones

- La vista actual ya decide y reemplaza, pero aun no ofrece una matriz visual de compatibilidad o simulacion previa de advertencias antes de enviar el formulario.
- Las solicitudes historicas previamente confirmadas pueden coexistir con una nueva asignacion reemplazante en el mismo turno; esto preserva trazabilidad, pero requerira criterio de lectura en fases posteriores.
- No se implemento todavia un modulo completo de edicion/cancelacion de asignaciones ya historizadas fuera de la vista puntual de turno.
- La capa de auditoria ya registra decisiones clave, pero aun no existe una pantalla dedicada para consultarla.

## Preparado para la Fase 7

La siguiente fase puede enfocarse en automatizacion y reglas:

- generacion automatica de turnos faltantes
- mantenimiento del horizonte configurable
- aplicacion de restricciones operativas de forma mas transversal
- alertas de cobertura y monitoreo
