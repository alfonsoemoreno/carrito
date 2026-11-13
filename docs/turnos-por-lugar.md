# Turnos por lugar

El acceso principal es **Administrador → Lugares y turnos → Gestionar turnos**.
Las rutas antiguas de Plantillas y Bloqueos redirigen a Lugares. Automatización
conserva el recálculo operativo y las alertas; la creación manual se revisa desde
cada lugar.

## Uso

- **Horarios habituales:** elegir varios días, agregar varios bloques de horas,
  indicar un período inclusivo y revisar antes de crear horarios y turnos juntos.
  También permite copiar días y horas de otro lugar con un nuevo período.
- **Editar horario:** cambia las horas desde una fecha. Conserva las fechas
  anteriores, los IDs de los turnos y las excepciones individuales. Las
  solicitudes activas o asignaciones confirmadas deben resolverse primero desde
  el detalle del turno. No borra solicitudes ni asignaciones históricas.
- **Pausar:** detiene la generación. No suspende los turnos existentes. Reanudar
  genera los faltantes de las próximas ocho semanas dentro de la vigencia.
- **Calendario:** navegar por semanas, agregar un turno puntual, cambiar las
  horas de una sola fecha, suspender un turno o un rango y quitar suspensiones.
  Las suspensiones superpuestas se respetan al reabrir.
- Todas las operaciones tienen revisión previa, detección de cruces y registro
  de auditoría. Un cambio concurrente invalida la revisión y pide revisarla otra vez.

## Modelo y despliegue

Antes de ejecutar esta versión contra una base existente, aplicar la migración:

```sh
npm run db:migrate:deploy
```

`202611120001_place_schedules` agrega `valid_from` y `valid_to` a las plantillas.
Las existentes mantienen vigencia sin límites. No elimina turnos ni relaciones.
Los cambios futuros crean una nueva vigencia cuando es necesario, y las
excepciones conservan la pertenencia a su ocurrencia para que no se regeneren.

La generación automática usa las mismas reglas que la revisión manual. Los
bloqueos de un turno se mantienen separados de los bloqueos de todo el lugar,
con el mismo criterio en solicitudes públicas, asignaciones y reportes.
Las escrituras se realizan en transacciones serializables; las solicitudes
públicas y confirmaciones vuelven a comprobar el horario dentro de su transacción.

## Validación

```sh
npm test
npm run check
npx prisma validate
```

Las pruebas cubren períodos, superposiciones, idempotencia, excepciones,
suspensiones, historia, revisión desactualizada y persistencia de las relaciones.
La comprobación visual adicional usa datos de prueba y un transporte de acciones
simulado; no reemplaza una prueba de aceptación con sesión administrativa y la
migración aplicada sobre un entorno de prueba.

## Reactivación individual y carga del formulario

El botón **Volver a activar** está junto a cada turno suspendido. Activa solo esa
ocurrencia, aunque existan varias suspensiones o una suspensión de todo el lugar.
La migración `202611120002_reactivate_single_shift` agrega las excepciones de turno
a cada bloqueo; no borra ni modifica las fechas de las suspensiones generales.
Una nueva suspensión posterior vuelve a aplicar normalmente.

Los formularios de revisión y reactivación muestran su propio estado de carga y
no abren la capa global de «Procesando». La revisión puede terminar sin navegar,
así que esa capa no debe depender de una navegación para cerrarse.
