# quick-add-shortcut Specification

## Purpose

Permite abrir el formulario de nuevo gasto con un solo toque desde la pantalla de inicio de Android, para que registrar un gasto sea lo más rápido posible.

## Requirements

### Requirement: Fijar el acceso directo desde Ajustes
En Android, si el dispositivo y su launcher pueden fijar accesos directos, Ajustes SHALL ofrecer "Acceso directo: nuevo gasto". Al tocarlo, la app SHALL pedir al sistema fijar un acceso directo llamado "Nuevo gasto", y Android SHALL mostrar su propia confirmación. Si el dispositivo no lo admite, la opción no SHALL mostrarse.

#### Scenario: Agregar el acceso directo
- **WHEN** el usuario toca "Acceso directo: nuevo gasto" en Ajustes y confirma el diálogo de Android
- **THEN** aparece el ícono "Nuevo gasto" en la pantalla de inicio

#### Scenario: Dispositivo sin soporte
- **WHEN** el launcher no permite fijar accesos directos, o la app corre en iOS, web o Expo Go
- **THEN** Ajustes no muestra la opción "Acceso directo: nuevo gasto"

### Requirement: Atajo en el ícono de la app
En Android, al mantener presionado el ícono de la app SHALL aparecer el atajo "Nuevo gasto", con el mismo destino que el acceso directo fijado.

#### Scenario: Atajo del ícono
- **WHEN** el usuario mantiene presionado el ícono de Kapitaly y toca "Nuevo gasto"
- **THEN** se abre el formulario de nuevo gasto

### Requirement: Abrir el formulario listo para capturar
Un toque en el acceso directo o en el atajo SHALL abrir el formulario de nuevo gasto en "Único", con el cursor en el monto y el teclado numérico visible, esté la app cerrada o en segundo plano. Al guardar o cancelar SHALL mostrarse el balance.

#### Scenario: App cerrada
- **WHEN** la app está cerrada y el usuario toca el ícono "Nuevo gasto"
- **THEN** se abre el formulario en "Único" con el cursor en el monto, y al guardar se muestra el balance con el gasto nuevo

#### Scenario: App en segundo plano
- **WHEN** la app estaba abierta en Métodos de pago y el usuario toca el ícono "Nuevo gasto"
- **THEN** se abre el formulario de nuevo gasto encima de lo que estaba abierto

### Requirement: Pendientes sin interrumpir la captura
Al abrir la app desde el acceso directo o el atajo, la hoja automática de "Pendientes" no SHALL abrirse encima del formulario. SHALL aparecer, si hay pendientes, cuando el balance quede visible.

#### Scenario: Pendientes después de guardar
- **WHEN** hay un cobro por confirmar, la app estaba cerrada y el usuario entra por "Nuevo gasto" y guarda un gasto
- **THEN** el formulario se abre sin la hoja de Pendientes y, al volver al balance, se muestra la hoja de Pendientes
