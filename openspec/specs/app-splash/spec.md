# app-splash Specification

## Purpose
Define lo que el usuario ve mientras KPTLY expenses arranca en frío: el splash de marca animado, cuándo se omite y cuándo da paso a la app.

## Requirements

### Requirement: Splash de marca
Al abrir la app en frío, SHALL mostrarse el diseño de `design/splash-expenses.svg`: el logo de cuatro círculos con degradado recortado en un cuadro de esquinas redondeadas y, debajo, el texto "KPTLY expenses". El splash SHALL seguir el tema del sistema: en modo oscuro, fondo `#020903` y texto blanco; en modo claro, fondo `#F4F1EA` y texto `#141414`. Los círculos SHALL ser iguales en los dos temas.

#### Scenario: Modo claro
- **WHEN** el sistema está en modo claro y el usuario abre la app en frío
- **THEN** el splash se ve con fondo `#F4F1EA`, los círculos verdes y el texto "KPTLY expenses" oscuro

#### Scenario: Modo oscuro
- **WHEN** el sistema está en modo oscuro y el usuario abre la app en frío
- **THEN** el splash se ve con fondo `#020903`, los círculos verdes y el texto blanco

#### Scenario: Volver de segundo plano
- **WHEN** la app estaba en segundo plano y el usuario vuelve a ella
- **THEN** no aparece el splash

### Requirement: Sin salto entre el splash del sistema y el animado
El splash del sistema SHALL mostrar solo el fondo del tema (`#F4F1EA` en claro, `#020903` en oscuro), sin logo ni ícono. El splash animado SHALL empezar sobre ese mismo fondo, para que el cambio entre los dos no se note.

#### Scenario: Arranque en Android 12 o superior
- **WHEN** el usuario abre la app en frío en un Android 12+
- **THEN** primero ve la pantalla del color de fondo del tema, sin ícono, y después, sobre el mismo fondo, empieza la animación

### Requirement: Animación de los círculos
Los cuatro círculos SHALL aparecer uno tras otro, del menor al mayor, y crecer desde la esquina inferior derecha del cuadro del logo hasta su tamaño final. Cada círculo nuevo SHALL quedar detrás de los anteriores. Después de los círculos SHALL aparecer el texto. La animación completa SHALL durar 1.5 s o menos.

#### Scenario: Orden de aparición
- **WHEN** empieza la animación
- **THEN** aparece primero el círculo más pequeño y al final el más grande, que queda al fondo

#### Scenario: Estado final
- **WHEN** termina la animación
- **THEN** el logo y el texto se ven idénticos a `design/splash-expenses.svg`

### Requirement: Ocultar cuando la app está lista
El splash SHALL permanecer hasta que terminen tanto la animación como la preparación de la base de datos, y entonces SHALL desaparecer con un fundido. Si la preparación de la base de datos falla, el splash SHALL dar paso a la pantalla de error.

#### Scenario: Base de datos lenta
- **WHEN** la animación termina antes de que acaben las migraciones
- **THEN** el splash se queda en su estado final hasta que acaben, y luego se desvanece y aparece el balance

#### Scenario: Base de datos rápida
- **WHEN** las migraciones acaban antes que la animación
- **THEN** la animación se completa y luego el splash se desvanece

#### Scenario: Error de migración
- **WHEN** la preparación de la base de datos falla
- **THEN** el splash desaparece y se muestra el mensaje de error

### Requirement: Sin animación desde el acceso directo
Al abrir la app desde el acceso directo o el atajo "Nuevo gasto", la app SHALL NOT reproducir la animación. El formulario de nuevo gasto SHALL mostrarse en cuanto la base de datos esté lista.

#### Scenario: Atajo con la app cerrada
- **WHEN** la app está cerrada y el usuario toca el atajo "Nuevo gasto"
- **THEN** no se ve la animación y el formulario aparece en cuanto la app está lista, con el cursor en el monto

### Requirement: Movimiento reducido
Si el sistema tiene activada la opción de reducir el movimiento, el splash SHALL mostrarse en su estado final, sin animación, y SHALL ocultarse en cuanto la app esté lista.

#### Scenario: Reducir movimiento activado
- **WHEN** el usuario abre la app en frío con reducir movimiento activado
- **THEN** ve el logo y el texto completos desde el inicio, sin círculos apareciendo, y el splash se va en cuanto la base de datos está lista

### Requirement: Sin splash al entrar por el atajo con la app abierta
Si la app ya está abierta, en primer o segundo plano, tocar el atajo "Nuevo gasto" o el acceso directo fijado SHALL abrir el formulario de nuevo gasto sin mostrar el splash del sistema ni el de marca, y sin perder la pantalla en la que estaba el usuario. El splash de marca SHALL mostrarse a lo sumo una vez por arranque de la app.

#### Scenario: Atajo con la app en segundo plano
- **WHEN** la app estaba abierta en Métodos de pago, el usuario sale y toca el acceso directo "Nuevo gasto"
- **THEN** se abre el formulario de nuevo gasto sin ningún splash y, al guardar o cancelar, vuelve a Métodos de pago

#### Scenario: Atajo desde el menú del ícono
- **WHEN** la app está en segundo plano y el usuario mantiene presionado su ícono y toca "Nuevo gasto"
- **THEN** se abre el formulario sin ningún splash
