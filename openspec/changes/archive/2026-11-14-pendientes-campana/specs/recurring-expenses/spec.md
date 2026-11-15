# Spec Delta

## MODIFIED Requirements

### Requirement: Confirmar o descartar un cobro
Ante un cobro por confirmar, el usuario SHALL poder elegir "Sí, se cobró" (con el monto editable, mayor que cero), "Posponer" o "No se cobró este mes". "Sí, se cobró" SHALL guardar la confirmación con su monto y el método de pago del gasto en ese momento; "No se cobró este mes" SHALL guardarlo como descartado; "Posponer" no SHALL guardar ninguna confirmación y la pregunta SHALL repetirse pasadas 6 horas (ver `pending-review`). Cada cobro SHALL tener a lo sumo una confirmación.

#### Scenario: Confirmar con otro monto
- **WHEN** el usuario confirma el cobro de Netflix del 15/11/2026 con monto $249.00
- **THEN** el cobro deja de estar por confirmar y queda confirmado por $249.00

#### Scenario: Descartar
- **WHEN** el usuario elige "No se cobró este mes" para el cobro de Netflix del 15/11/2026
- **THEN** el cobro deja de estar por confirmar y no se suma a ninguna tarjeta

#### Scenario: Aún no
- **WHEN** el usuario elige "Posponer"
- **THEN** el cobro sigue por confirmar y la app vuelve a preguntar pasadas 6 horas
