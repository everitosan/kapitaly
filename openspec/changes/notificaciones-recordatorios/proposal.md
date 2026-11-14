# Proposal

## Why

La app solo pregunta por cobros pendientes cuando el usuario la abre, y nada le recuerda anotar sus gastos. Si no la abre, los cobros quedan sin confirmar y los gastos del día se olvidan. Notificaciones configurables lo ayudan a mantener el registro al día, sin servidor: la app las agenda en el propio teléfono.

## What Changes

- **Nueva sección "Notificaciones" en Ajustes**, con tres avisos. Todos vienen apagados; al encender el primero se pide el permiso del sistema.
  - **Avisar el día del cobro:** "Te avisaré en base a tus gastos recurrentes y vencimientos de tarjetas". El día de cada cobro recurrente o vencimiento de tarjeta, a la hora elegida (10:00 por omisión), avisa lo que hay que confirmar. Si ese día hay varios, sale una sola notificación. Lo que ya se confirmó antes de la hora no avisa. Al tocarla se abre la hoja "Pendientes".
  - **Recordatorio diario:** "Configúralo para que no se te pase ningún gasto del día". Avisa todos los días a la hora elegida (21:00 por omisión). Al tocarla se abre "Nuevo gasto".
  - **Desuso:** "Te recordaré después de varios días en que no registres nada". Tras *n* días sin registrar un gasto (3 por omisión, de 1 a 14), avisa; repite a los 2*n* y 3*n* días y luego se calla hasta que haya un registro nuevo. Usa por omisión la hora del recordatorio diario, con la opción de elegir una propia.
- **Permiso negado:** los interruptores no se encienden y la pantalla explica cómo habilitar las notificaciones en el sistema.
- **Sin servidor:** son notificaciones locales programadas, que siguen funcionando con la app cerrada y después de reiniciar el teléfono. En Android la hora es aproximada; no se pide el permiso de alarmas exactas.

Maqueta: `design/propose/notificaciones.html`.

**Fuera de alcance:** push remotas, avisos de otros tipos (presupuestos, resúmenes), sonidos personalizados y configuración por gasto.

## Capabilities

### New Capabilities
- `reminders`: notificaciones locales configurables de cobros pendientes, recordatorio diario y desuso. Incluye sus preferencias, el permiso del sistema, cuándo se agendan y qué abren al tocarlas.

### Modified Capabilities
- `settings-menu`: Ajustes agrega la opción "Notificaciones" y deja de prohibir las opciones de recordatorios.

## Impact

- **Dependencias:** `expo-notifications` (módulo nativo; requiere un build nuevo, que ya se hace por CI) con su config plugin en `app.json`.
- **Datos:** una tabla de preferencias en SQLite con su migración de Drizzle, y un repositorio con su contrato y su versión en memoria.
- **Código:** dominio puro para calcular qué agendar, un servicio que sincroniza lo agendado con el sistema, la pantalla `settings/notifications`, y el manejo del toque en la notificación (Pendientes o Nuevo gasto).
- **Android:** canal de notificaciones y el permiso de notificaciones de Android 13+.
