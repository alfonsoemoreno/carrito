# Recuperación de Mirador del Remo — 26 de octubre de 2026

## Resultado

Se restauró en producción únicamente el lugar `8278d200-c430-43e2-b22c-6127d533c76d`, con sus identificadores originales:

- 21 plantillas y 21 turnos.
- 63 solicitudes con sus estados originales.
- 18 asignaciones confirmadas.
- 90 entradas originales de auditoría.
- Una entrada nueva `ZONE_RECOVERED_FROM_HISTORY` que documenta la recuperación.

No se revirtió la rama de producción ni se actualizaron los registros de otros lugares. La restauración fue una transacción serializable; se comprobaron referencias de personas y administradores, ausencia de un lugar ya recreado y ausencia de superposiciones con asignaciones actuales. La comparación SHA-256 posterior verificó igualdad de lugar, plantillas, turnos, solicitudes, asignaciones y auditoría original frente a la copia.

## Evidencia y límites

La consulta histórica de Neon muestra el lugar presente a las 10:45 y ausente a las 10:47, hora de Chile. No se puede atribuir el borrado a una persona: la función antigua de eliminación borraba tanto los datos asociados como las entradas de auditoría y no registraba la operación de borrado.

Se crearon ramas aisladas con expiración automática de un día:

- `recovery-mirador-2026-10-26-0900`: copia de seguridad inicial.
- `recovery-mirador-2026-10-26-1044`: fuente definitiva de las 10:44:21.988, hora de Chile, con las dos asignaciones agregadas después de las 09:00.

Las copias JSON completas están en `.recovery/`, excluidas de Git y guardadas con permisos privados. Contienen datos personales; no deben publicarse. El script `scripts/recover-mirador.mjs` requiere `RECOVERY_SOURCE_HOST` y `RECOVERY_SOURCE_BRANCH`; por defecto solo comprueba y respalda. Se utilizó `--apply` una única vez para la restauración; rechaza sobrescribir un lugar existente o crear conflictos de asignación.

## Protección preparada en el código

- La acción anterior de eliminación ahora archiva (inactivo y oculto), sin borrar turnos ni historial.
- Se retiró el botón de eliminación irreversible de la página de lugares.
- Creación, edición y cambios de visibilidad registran el administrador y los valores anteriores/nuevos en auditoría.
- Validación: 35 pruebas, lint, TypeScript y compilación satisfactoria.

Esta protección requiere desplegar la nueva versión; la recuperación de los datos ya se aplicó y se comprobó visualmente en la aplicación desplegada.
