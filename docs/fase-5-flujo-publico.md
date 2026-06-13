# Fase 5 - Flujo Publico

## Objetivo cumplido

Se implemento el flujo publico inicial sobre datos reales de Neon:

- busqueda de persona activa
- validacion de PIN con bloqueo por intentos
- sesion publica temporal por cookie firmada
- solicitud multiple de turnos abiertos
- cancelacion de solicitudes pendientes propias
- consulta publica y personal de asignaciones y solicitudes

## Entregables implementados

- Pantalla publica funcional en `/solicitar`.
- Pantalla de consulta en `/asignaciones`.
- Sesion publica temporal en servidor, sin cuentas para usuarios finales.
- Validacion de PIN usando hash existente y politicas de `system_configs`.
- Restricciones iniciales al solicitar turnos:
  - no duplicar solicitudes activas
  - no solicitar turnos bloqueados o no publicos
  - respetar indisponibilidad personal
  - respetar maximo semanal de solicitudes
  - respetar reglas configuradas de mismo dia, dias consecutivos y superposicion
- Sugerencia opcional de pareja compatible para solicitudes multiples.
- Auditoria base para autenticacion publica, alta y cancelacion de solicitudes.

## Archivos principales

- `src/features/public/session.ts`
- `src/features/public/utils.ts`
- `src/features/public/queries.ts`
- `src/features/public/actions.ts`
- `src/app/solicitar/page.tsx`
- `src/app/asignaciones/page.tsx`

## Decisiones tomadas

- Se uso una cookie HTTP-only firmada con `NEON_AUTH_COOKIE_SECRET` para evitar exponer el estado de sesion publica en cliente.
- El flujo se resolvio con Server Components y Server Actions, priorizando simplicidad operativa y menos estado cliente.
- La seleccion de persona se implemento como busqueda server-side, evitando depender de un autocomplete cliente para la autenticacion publica.
- La sugerencia de pareja se aplica como opcion comun a una solicitud multiple; el emparejamiento definitivo sigue siendo responsabilidad administrativa de fases posteriores.
- La vista publica de asignaciones respeta configuraciones de visibilidad para no exponer nombres cuando `showParticipantsPublicly` esta desactivado.

## Validaciones realizadas

- `npm run lint`
- `npm run build`
- Prueba manual local del flujo:
  - busqueda de persona
  - validacion de PIN
  - apertura de sesion publica
  - render de turnos y solicitudes personales

## Riesgos y observaciones

- La sesion publica hoy depende solo de cookie firmada y vigencia temporal; aun no existe rotacion explicita ni revocacion centralizada.
- La sugerencia de pareja es util para la intencion del usuario, pero la resolucion real de parejas y excepciones sigue quedando para Fase 6.
- Las restricciones publicas implementadas cubren lo esencial, pero aun no consideran todos los escenarios avanzados de equidad o limites por mes confirmados.
- La pagina publica muestra datos reales del dominio; si la congregacion desea mayor reserva, conviene revisar `showParticipantsPublicly`, `showPendingRequestsPublicly` y `showHistoryPublicly`.

## Preparado para la Fase 6

La siguiente fase puede enfocarse en la operacion administrativa sobre solicitudes:

- bandeja de solicitudes
- vista centrada en turno
- validaciones de pareja para confirmacion
- confirmacion, rechazo, reemplazo y excepciones
