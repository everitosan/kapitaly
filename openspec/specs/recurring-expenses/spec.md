# recurring-expenses Specification

## Purpose

Permite registrar y mantener las reglas de gastos recurrentes del usuario (qué se cobra, cuánto, cada cuánto y desde cuándo), guardadas en el dispositivo y disponibles sin conexión.

## Requirements

### Requirement: Registrar un gasto recurrente
El sistema SHALL permitir crear un gasto recurrente con nombre, monto, frecuencia, fecha de cobro (fecha ancla) y método de pago, y opcionalmente una fecha de fin. El gasto creado SHALL aparecer de inmediato en el balance.

#### Scenario: Alta exitosa
- **WHEN** el usuario captura nombre "Netflix", monto $219.00, frecuencia Mensual, fecha de cobro 15/11/2026 y método "BBVA Azul" y guarda
- **THEN** el gasto queda registrado y se muestra en el balance de noviembre 2026 con un cargo el 15 de noviembre por $219.00 pagado con "BBVA Azul"

#### Scenario: Alta con fecha de fin
- **WHEN** el usuario registra un gasto mensual desde 01/01/2026 con fecha de fin 31/03/2026
- **THEN** el gasto genera cargos en enero, febrero y marzo de 2026 y ninguno a partir de abril

### Requirement: Validar los datos del gasto recurrente
El sistema SHALL rechazar el guardado y mostrar un mensaje junto al campo inválido cuando: el nombre esté vacío o solo tenga espacios, el monto no sea mayor que cero o tenga más de dos decimales, falte la fecha de cobro, el intervalo no sea un entero mayor o igual a 1, la fecha de fin sea anterior a la fecha de cobro, o no haya un método de pago activo seleccionado.

#### Scenario: Monto inválido
- **WHEN** el usuario intenta guardar un gasto con monto $0.00
- **THEN** el sistema no guarda el gasto y muestra que el monto debe ser mayor que cero

#### Scenario: Nombre vacío
- **WHEN** el usuario intenta guardar un gasto cuyo nombre solo contiene espacios
- **THEN** el sistema no guarda el gasto y muestra que el nombre es obligatorio

#### Scenario: Fecha de fin anterior a la de cobro
- **WHEN** el usuario captura fecha de cobro 10/05/2026 y fecha de fin 01/05/2026
- **THEN** el sistema no guarda el gasto e indica que la fecha de fin no puede ser anterior a la fecha de cobro

#### Scenario: Sin método de pago
- **WHEN** el usuario intenta guardar un gasto recurrente sin método de pago seleccionado
- **THEN** el sistema no guarda el gasto e indica que el método de pago es obligatorio

### Requirement: Frecuencias basadas en meses
El sistema SHALL ofrecer las frecuencias Mensual (cada 1 mes), Bimestral (cada 2), Trimestral (cada 3), Semestral (cada 6) y Anual (cada 12), y SHALL permitir una frecuencia personalizada "cada N meses" con N entero mayor o igual a 1. No SHALL ofrecer frecuencias basadas en días o semanas.

#### Scenario: Selección de preset
- **WHEN** el usuario elige la frecuencia Semestral para un gasto con fecha de cobro 20/01/2026
- **THEN** el gasto se cobra el 20 de enero y el 20 de julio de cada año

#### Scenario: Frecuencia personalizada
- **WHEN** el usuario elige "cada 4 meses" con fecha de cobro 05/02/2026
- **THEN** el gasto se cobra el 5 de febrero, el 5 de junio y el 5 de octubre de 2026

#### Scenario: Frecuencia mostrada al editar
- **WHEN** el usuario abre para editar un gasto guardado como "cada 12 meses" o como anual
- **THEN** el formulario muestra la frecuencia como Anual

### Requirement: Montos exactos en pesos
El sistema SHALL aceptar montos en pesos mexicanos (MXN) con hasta dos decimales y SHALL conservarlos sin pérdida de precisión, de modo que cualquier suma de montos coincida al centavo con la suma aritmética exacta.

#### Scenario: Suma sin errores de redondeo
- **WHEN** existen tres gastos mensuales de $0.10, $0.20 y $0.30 que caen en el mismo mes
- **THEN** el total del mes se muestra como $0.60 exactamente

### Requirement: Editar un gasto recurrente
El sistema SHALL permitir modificar cualquier campo de un gasto recurrente existente, aplicando las mismas validaciones del alta, y el balance SHALL reflejar los cambios de inmediato.

#### Scenario: Cambio de monto
- **WHEN** el usuario cambia el monto de "Renta" de $1,500.00 a $1,650.00 y guarda
- **THEN** el balance de cualquier mes en que se cobre la renta muestra $1,650.00

### Requirement: Eliminar un gasto recurrente
El sistema SHALL permitir eliminar un gasto recurrente previa confirmación del usuario. Un gasto eliminado SHALL dejar de mostrarse y de contarse en cualquier vista, y el registro SHALL conservarse internamente marcado como eliminado con su fecha de eliminación.

#### Scenario: Eliminación confirmada
- **WHEN** el usuario elimina "Netflix" y confirma
- **THEN** "Netflix" deja de aparecer en el balance de todos los meses y los totales se recalculan sin él

#### Scenario: Eliminación cancelada
- **WHEN** el usuario elige eliminar "Netflix" y cancela la confirmación
- **THEN** el gasto permanece sin cambios

### Requirement: Funcionamiento sin conexión y persistencia local
El sistema SHALL permitir todas las operaciones de la app (métodos de pago, gastos recurrentes, gastos únicos y balance) sin conexión a internet, y los datos SHALL conservarse en el dispositivo al cerrar y volver a abrir la app.

#### Scenario: Uso en modo avión
- **WHEN** el dispositivo no tiene conexión y el usuario registra un gasto
- **THEN** el gasto se guarda y aparece en el balance sin ningún error de red

#### Scenario: Persistencia tras reinicio
- **WHEN** el usuario registra un gasto, cierra la app por completo y la vuelve a abrir
- **THEN** el gasto sigue registrado con los mismos datos

### Requirement: Metadatos listos para sincronización
Cada gasto recurrente SHALL tener un identificador único global generado en el dispositivo al crearlo, una fecha de creación inmutable y una fecha de última actualización que cambia con cada edición o eliminación.

#### Scenario: Actualización de metadatos al editar
- **WHEN** el usuario edita un gasto existente
- **THEN** su identificador y su fecha de creación no cambian y su fecha de última actualización es posterior a la anterior

#### Scenario: Identificadores únicos
- **WHEN** el usuario registra dos gastos con los mismos datos
- **THEN** cada uno tiene un identificador distinto

### Requirement: Cobros por confirmar
Un cobro de un gasto recurrente vigente SHALL estar por confirmar si su fecha es igual o anterior a hoy, igual o posterior a la fecha en que se registró el gasto, y no tiene confirmación. Al abrir la app, si hay cobros por confirmar, el sistema SHALL preguntar por cada uno si ya se efectuó.

#### Scenario: Pregunta al abrir la app
- **WHEN** Netflix se cobra el día 15, se registró el 01/11/2026 y hoy es 16/11/2026
- **THEN** la app pregunta si ya se cobró Netflix del 15/11/2026 por $219.00

#### Scenario: Nada antes del registro
- **WHEN** el 11/11/2026 el usuario registra un gasto mensual con fecha de cobro 15/01/2026
- **THEN** la app no pregunta por los cobros de enero a octubre de 2026

### Requirement: Confirmar o descartar un cobro
Ante un cobro por confirmar, el usuario SHALL poder elegir "Sí, se cobró" (con el monto editable, mayor que cero), "Aún no" o "No se cobró este mes". "Sí, se cobró" SHALL guardar la confirmación con su monto y el método de pago del gasto en ese momento; "No se cobró este mes" SHALL guardarlo como descartado; "Aún no" no SHALL guardar nada y la pregunta SHALL repetirse en la siguiente apertura. Cada cobro SHALL tener a lo sumo una confirmación.

#### Scenario: Confirmar con otro monto
- **WHEN** el usuario confirma el cobro de Netflix del 15/11/2026 con monto $249.00
- **THEN** el cobro deja de estar por confirmar y queda confirmado por $249.00

#### Scenario: Descartar
- **WHEN** el usuario elige "No se cobró este mes" para el cobro de Netflix del 15/11/2026
- **THEN** el cobro deja de estar por confirmar y no se suma a ninguna tarjeta

#### Scenario: Aún no
- **WHEN** el usuario elige "Aún no"
- **THEN** el cobro sigue por confirmar y la app vuelve a preguntar la próxima vez que se abra
