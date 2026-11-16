# Spec Delta

## Purpose

Permite desbloquear las funciones premium de Kapitaly con una compra única "Kapitaly completo" en la tienda, sin cuentas ni servidores, y define cómo se ven esas funciones mientras están bloqueadas.

## ADDED Requirements

### Requirement: Kapitaly completo es un pago único
"Kapitaly completo" SHALL ser un producto de pago único (no consumible ni suscripción) de la tienda del dispositivo. Una vez comprado SHALL desbloquear todas las funciones premium, presentes y futuras, sin otro pago. Registrar gastos, "Tus gastos" y las cifras de Análisis no SHALL requerirlo.

#### Scenario: Funciones gratis sin compra
- **WHEN** el usuario no tiene Kapitaly completo
- **THEN** puede registrar gastos sin límite y ver "Tus gastos" y las cifras, la dona y las barras de Análisis

#### Scenario: Una sola compra
- **WHEN** el usuario compró Kapitaly completo
- **THEN** todas las funciones premium quedan desbloqueadas y la app no vuelve a pedirle un pago por ellas

### Requirement: Candado solo en builds con cobro
El candado SHALL estar encendido solo en las builds compiladas con el cobro activado. En cualquier otra build, incluidas las betas cerradas, todas las funciones premium SHALL estar desbloqueadas y la app no SHALL mostrar el aviso de candado, la pantalla "Kapitaly completo" ni su opción en Ajustes.

#### Scenario: Beta cerrada
- **WHEN** un tester abre una beta compilada sin el cobro activado
- **THEN** ve el detalle por categoría y por método sin candado y Ajustes no muestra "Kapitaly completo"

#### Scenario: Build con cobro
- **WHEN** un usuario sin compra abre una build con el cobro activado
- **THEN** las funciones premium muestran el aviso de candado

### Requirement: Prueba gratis de 14 días
La primera vez que se abre una build con el cobro activado, la app SHALL guardar ese día como inicio de la prueba y desbloquear las funciones premium durante 14 días naturales, del día de inicio hasta 13 días después, inclusive. Al terminar SHALL volver el candado, salvo que el usuario tenga Kapitaly completo. La prueba no SHALL reiniciarse mientras la app siga instalada.

#### Scenario: Durante la prueba
- **WHEN** la prueba empezó el 16/11/2026 y hoy es 29/11/2026
- **THEN** el detalle por categoría se ve sin candado

#### Scenario: Fin de la prueba
- **WHEN** la prueba empezó el 16/11/2026, hoy es 30/11/2026 y el usuario no compró
- **THEN** las funciones premium muestran el aviso de candado

#### Scenario: Compra durante la prueba
- **WHEN** el usuario compra Kapitaly completo el día 5 de su prueba
- **THEN** queda activo de forma permanente y la app deja de mostrar los días de prueba

#### Scenario: Sin prueba en beta
- **WHEN** un tester abre una beta compilada sin el cobro activado
- **THEN** no empieza ninguna prueba y no se muestran días de prueba

### Requirement: Días de prueba visibles
Durante la prueba, la pantalla "Kapitaly completo" SHALL indicar cuántos días quedan ("Te quedan N días de prueba", o "Último día de prueba" el día 14) y seguir ofreciendo "Comprar". Al terminar, el aviso de candado SHALL indicar que la prueba terminó.

#### Scenario: Días restantes
- **WHEN** la prueba empezó el 16/11/2026 y hoy es 20/11/2026
- **THEN** la pantalla muestra "Te quedan 10 días de prueba" y el botón "Comprar"

#### Scenario: Último día
- **WHEN** la prueba empezó el 16/11/2026 y hoy es 29/11/2026
- **THEN** la pantalla muestra "Último día de prueba"

#### Scenario: Prueba terminada
- **WHEN** la prueba ya terminó y el usuario toca "Transporte" en Por categoría
- **THEN** el aviso de candado indica que su prueba terminó y ofrece "Desbloquear"

### Requirement: Aviso de candado
Cuando el candado está encendido, el usuario no tiene Kapitaly completo y no está en su prueba, una función premium SHALL mostrar en su lugar un aviso con el texto que explica qué desbloquea y un botón "Desbloquear" que abre la pantalla "Kapitaly completo". El aviso no SHALL mostrar datos de la función bloqueada.

#### Scenario: Desbloquear desde el aviso
- **WHEN** el usuario toca "Desbloquear" en un aviso de candado
- **THEN** se abre la pantalla "Kapitaly completo"

#### Scenario: Sin datos detrás del candado
- **WHEN** se muestra el aviso de candado del detalle de "Transporte"
- **THEN** no aparece ningún concepto, fecha ni monto de los gastos de Transporte

### Requirement: Pantalla Kapitaly completo
La pantalla "Kapitaly completo" SHALL listar lo que incluye, indicar que es un pago único que incluye las funciones futuras, mostrar el precio tal como lo da la tienda y ofrecer "Comprar" y "Restaurar compras". Si el usuario ya lo tiene, SHALL indicar que está activo en lugar de "Comprar".

#### Scenario: Precio de la tienda
- **WHEN** la tienda reporta el producto a $29.00 MXN y el usuario abre la pantalla
- **THEN** el botón dice "Comprar por $29.00"

#### Scenario: Ya comprado
- **WHEN** el usuario con Kapitaly completo abre la pantalla
- **THEN** ve que Kapitaly completo está activo y no aparece "Comprar"

#### Scenario: Tienda no disponible
- **WHEN** la tienda no responde o el dispositivo no tiene Google Play
- **THEN** la pantalla no muestra precio, "Comprar" queda deshabilitado y un texto indica que la tienda no está disponible por ahora

### Requirement: Comprar Kapitaly completo
Al tocar "Comprar", la app SHALL abrir el flujo de pago de la tienda. Al completarse el pago SHALL desbloquear las funciones premium de inmediato y confirmar la compra con la tienda para que no se reembolse automáticamente. Si el usuario cancela, SHALL volver a la pantalla sin mensaje de error; si falla, SHALL mostrar un mensaje con la opción de reintentar.

#### Scenario: Compra exitosa
- **WHEN** el usuario completa el pago en la tienda
- **THEN** la pantalla muestra que Kapitaly completo está activo y el detalle por categoría ya se ve sin candado

#### Scenario: Compra cancelada
- **WHEN** el usuario cierra la hoja de pago sin pagar
- **THEN** vuelve a la pantalla "Kapitaly completo" sin mensaje de error y las funciones siguen bloqueadas

#### Scenario: Error de la tienda
- **WHEN** la tienda devuelve un error al comprar
- **THEN** la app muestra un mensaje de que no se pudo completar la compra y "Comprar" sigue disponible

### Requirement: Pago pendiente
Si la tienda reporta la compra como pendiente, como un pago en efectivo aún no realizado, la app SHALL mostrar "Pago pendiente" en la pantalla y en Ajustes, sin desbloquear las funciones. Cuando la tienda confirme el pago SHALL desbloquearlas y confirmar la compra.

#### Scenario: Pago en efectivo pendiente
- **WHEN** el usuario elige pagar en efectivo y todavía no paga
- **THEN** la pantalla muestra "Pago pendiente" y el detalle por categoría sigue con candado

#### Scenario: Pago confirmado después
- **WHEN** el usuario paga en la tienda física y después vuelve a abrir la app
- **THEN** Kapitaly completo queda activo

### Requirement: Reconocer compras hechas fuera de la app
Al abrir la app y al volver a ella desde segundo plano, la app SHALL consultar las compras del usuario en la tienda. Una compra de Kapitaly completo hecha fuera de la app, como un código promocional canjeado o una recompensa de pre-registro, SHALL desbloquear las funciones y confirmarse con la tienda.

#### Scenario: Código promocional canjeado
- **WHEN** un tester fundador canjea su código en Play Store y después abre la app
- **THEN** Kapitaly completo está activo sin pasar por "Comprar"

#### Scenario: Recompensa de pre-registro
- **WHEN** un usuario pre-registrado instala la app y la abre por primera vez
- **THEN** Kapitaly completo está activo

#### Scenario: Canje con la app en segundo plano
- **WHEN** el usuario deja la app abierta, canjea un código en Play Store y vuelve a la app
- **THEN** Kapitaly completo está activo sin cerrar la app

### Requirement: Restaurar compras
"Restaurar compras" SHALL volver a consultar las compras en la tienda y desbloquear si encuentra Kapitaly completo. Si no la encuentra, SHALL indicar que no hay compras que restaurar.

#### Scenario: Teléfono nuevo
- **WHEN** el usuario compró en otro teléfono con la misma cuenta de Google y toca "Restaurar compras"
- **THEN** Kapitaly completo queda activo

#### Scenario: Nada que restaurar
- **WHEN** la cuenta no tiene Kapitaly completo y el usuario toca "Restaurar compras"
- **THEN** la app indica que no encontró compras que restaurar

### Requirement: Recordar el desbloqueo en el teléfono
La app SHALL recordar en el teléfono que Kapitaly completo está activo y usarlo al abrir, sin esperar a la tienda ni requerir conexión. Si la tienda responde con éxito y la compra ya no existe, como tras un reembolso, SHALL volver a bloquear. Si la tienda no responde, SHALL conservar lo recordado.

#### Scenario: Sin conexión
- **WHEN** el usuario con Kapitaly completo abre la app sin internet
- **THEN** el detalle por categoría se ve sin candado

#### Scenario: Compra reembolsada
- **WHEN** la compra fue reembolsada y la tienda ya no la reporta al abrir la app
- **THEN** las funciones premium vuelven a mostrar el aviso de candado
