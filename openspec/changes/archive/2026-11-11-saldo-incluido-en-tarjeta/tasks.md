# Tasks

## 1. Datos y dominio

- [x] 1.1 Agregar `adds_to_card_balance` al esquema con migración 0004 (default `true`) y mapearlo en los repositorios SQLite y en memoria.
- [x] 1.2 Agregar `addsToCardBalance` a gastos únicos y confirmaciones, validar el valor por defecto y excluir los `false` en `usedCents`; cubrir con pruebas.

## 2. Interfaz

- [x] 2.1 Mostrar "Sumar al saldo de la tarjeta" en la confirmación de cobros con tarjeta de crédito; probar que desactivarlo guarda `false`.
- [x] 2.2 Mostrar el mismo interruptor en el formulario de gasto único con tarjeta de crédito, respetando el valor al editar.

## 3. Verificación

- [x] 3.1 Probar en la beta 0.1.0-beta.2 instalada desde Play: registrar un gasto ya incluido en el saldo inicial con el interruptor desactivado y comprobar que el usado no cambia.
