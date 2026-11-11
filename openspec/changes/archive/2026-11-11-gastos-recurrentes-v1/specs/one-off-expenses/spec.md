# Spec Delta

## Purpose

Permite registrar rápidamente gastos puntuales del día a día (por ejemplo, una recarga del metro) con una descripción libre, para llevar el control de lo que sale en el mes además de los gastos recurrentes.

## ADDED Requirements

### Requirement: Registrar un gasto único
El sistema SHALL permitir crear un gasto único con descripción libre, monto, fecha y método de pago. La descripción es texto libre, no una selección de un catálogo. La fecha SHALL proponerse como la de hoy. El gasto creado SHALL aparecer de inmediato en el balance del mes de su fecha.

#### Scenario: Alta rápida
- **WHEN** hoy es 11/11/2026 y el usuario registra "Recarga metro" por $100.00 con "Efectivo" sin cambiar la fecha
- **THEN** el gasto queda registrado con fecha 11/11/2026 y aparece en el balance de noviembre 2026

#### Scenario: Fecha pasada
- **WHEN** el usuario registra "Comida con amigos" por $450.00 con fecha 30/10/2026
- **THEN** el gasto aparece en el balance de octubre 2026 y no en el de noviembre

### Requirement: Elegir el tipo al agregar un gasto
Al agregar un gasto, el sistema SHALL permitir elegir entre gasto único y gasto recurrente en el mismo formulario. La opción inicial SHALL ser gasto único.

#### Scenario: Cambio a recurrente
- **WHEN** el usuario abre "Agregar gasto" y cambia el tipo a recurrente
- **THEN** el formulario muestra los campos de frecuencia, fecha de cobro y fecha de fin

### Requirement: Validar los datos del gasto único
El sistema SHALL rechazar el guardado y mostrar un mensaje junto al campo inválido cuando: la descripción esté vacía o solo tenga espacios, el monto no sea mayor que cero o tenga más de dos decimales, falte la fecha, o no haya un método de pago activo seleccionado. Los montos SHALL conservarse sin pérdida de precisión, igual que en los gastos recurrentes.

#### Scenario: Descripción vacía
- **WHEN** el usuario intenta guardar un gasto único sin descripción
- **THEN** el sistema no guarda el gasto y muestra que la descripción es obligatoria

#### Scenario: Monto con más de dos decimales
- **WHEN** el usuario captura $10.555
- **THEN** el sistema no guarda el gasto e indica que el monto admite hasta dos decimales

### Requirement: Editar y eliminar un gasto único
El sistema SHALL permitir modificar cualquier campo de un gasto único, con las mismas validaciones del alta, y eliminarlo previa confirmación. Un gasto eliminado SHALL dejar de mostrarse y de contarse, y el registro SHALL conservarse internamente marcado como eliminado con su fecha de eliminación.

#### Scenario: Cambio de fecha a otro mes
- **WHEN** el usuario cambia la fecha de un gasto único del 02/11/2026 al 28/10/2026
- **THEN** el gasto deja de contarse en noviembre 2026 y pasa a contarse en octubre 2026

#### Scenario: Eliminación confirmada
- **WHEN** el usuario elimina "Recarga metro" y confirma
- **THEN** el gasto deja de aparecer y los totales del mes se recalculan sin él

### Requirement: Metadatos de los gastos únicos
Cada gasto único SHALL tener un identificador único global generado en el dispositivo, una fecha de creación inmutable y una fecha de última actualización que cambia con cada edición o eliminación.

#### Scenario: Edición conserva la identidad
- **WHEN** el usuario edita el monto de un gasto único
- **THEN** su identificador y su fecha de creación no cambian y su fecha de última actualización es posterior a la anterior
