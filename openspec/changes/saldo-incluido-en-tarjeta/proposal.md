# Proposal

## Why

Al empezar a usar la app, el usuario registra primero su tarjeta con la deuda actual como saldo inicial y después da de alta sus gastos. Si un cobro recurrente o un gasto único ya venía incluido en esa deuda, al confirmarlo o registrarlo la app lo suma otra vez y el usado queda duplicado.

## What Changes

- Al confirmar un cobro recurrente con tarjeta de crédito ("Sí, se cobró") y al registrar o editar un gasto único con tarjeta de crédito, se muestra el interruptor **"Sumar al saldo de la tarjeta"**, activo por defecto.
- Si se desactiva, el cobro o gasto se guarda igual (cuenta en el balance del mes) pero no se suma al usado de la tarjeta.
- Migración 0004: columna `adds_to_card_balance` (boolean, default `true`) en `one_off_expenses` y `recurring_charge_confirmations`; los registros existentes siguen sumando.

**Fuera de alcance:** cambiar la fecha del saldo inicial y editar confirmaciones ya guardadas.

## Capabilities

### Modified Capabilities
- `credit-cards`: el cálculo del usado excluye lo marcado como ya incluido en el saldo inicial.
