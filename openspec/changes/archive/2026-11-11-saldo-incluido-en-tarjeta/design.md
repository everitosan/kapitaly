# Design

- Campo `addsToCardBalance` en `OneOffExpense` y `ChargeConfirmation` (opcional en los inputs; por defecto `true`). `usedCents` ignora los registros con `false`.
- El interruptor reutiliza `FieldRow` + `Switch` del sistema de diseño (mismo control que "Fecha de fin"), con etiqueta en tono atenuado. Solo aparece cuando el método es tarjeta de crédito; con otros métodos se guarda `true`.
- El balance del mes no cambia: el gasto sí ocurrió en el mes; solo la deuda de la tarjeta lo ignora.
