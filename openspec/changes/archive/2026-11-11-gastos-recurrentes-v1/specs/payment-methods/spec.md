# Spec Delta

## Purpose

Mantiene el catálogo de métodos de pago del usuario (tarjetas, efectivo, transferencias) con el que se indica de dónde sale cada gasto. Está pensado para compartirse con otras apps de la suite Kapitaly.

## ADDED Requirements

### Requirement: Método inicial "Efectivo"
Al abrir la app por primera vez, el sistema SHALL tener creado un método de pago "Efectivo" de tipo efectivo, de modo que sea posible registrar un gasto sin configurar nada antes.

#### Scenario: Primera apertura
- **WHEN** el usuario abre la app recién instalada
- **THEN** la lista de métodos de pago contiene "Efectivo" y puede registrar un gasto con ese método

#### Scenario: No se duplica
- **WHEN** el usuario cierra y vuelve a abrir la app varias veces
- **THEN** sigue existiendo un único método "Efectivo" creado por el sistema

### Requirement: Registrar un método de pago
El sistema SHALL permitir crear un método de pago con nombre (obligatorio), tipo (crédito, débito, efectivo o transferencia), institución del catálogo (opcional, no aplica al tipo efectivo) y últimos 4 dígitos (opcional). SHALL rechazar el guardado si el nombre está vacío o si los últimos dígitos no son exactamente 4 números. Al elegir una institución con el nombre vacío, SHALL proponer el nombre de la institución.

#### Scenario: Alta de tarjeta con institución
- **WHEN** el usuario registra "BBVA Azul", tipo crédito, institución BBVA y últimos dígitos 4521
- **THEN** el método aparece en la lista con la identidad visual de BBVA y, al registrar gastos, como "BBVA Azul ••4521"

#### Scenario: Alta sin institución
- **WHEN** el usuario registra "Tarjeta de la tienda", tipo crédito, sin institución
- **THEN** el método se guarda y se muestra con el color de la paleta que el usuario eligió

#### Scenario: Nombre propuesto
- **WHEN** el usuario, con el nombre vacío, elige la institución Nu
- **THEN** el campo de nombre se llena con "Nu" y el usuario puede cambiarlo

#### Scenario: Dígitos inválidos
- **WHEN** el usuario captura "45A" como últimos dígitos
- **THEN** el sistema no guarda el método e indica que deben ser 4 números

### Requirement: Color del método de pago
Un método con institución SHALL usar por defecto el color base de esa institución. El usuario SHALL poder sustituirlo por un color de la paleta de la app y SHALL poder volver al color de la institución. Un método sin institución SHALL usar un color de la paleta.

#### Scenario: Color de la institución por defecto
- **WHEN** el usuario registra un método con institución Santander sin elegir color
- **THEN** el método se muestra con el color base de Santander

#### Scenario: Sustituir y restablecer el color
- **WHEN** el usuario cambia el color de un método de Nu a "Lima" y después elige "Usar el color de la institución"
- **THEN** el método se muestra primero en lima y después con el color base de Nu

### Requirement: Crear un método desde el formulario de gasto
El selector de método del formulario de gasto SHALL ofrecer la opción "Nuevo", que permite crear un método de pago sin salir del gasto. Al guardarlo, el nuevo método SHALL quedar seleccionado en el gasto, y los datos ya capturados del gasto SHALL conservarse.

#### Scenario: Nuevo método al registrar un gasto
- **WHEN** el usuario, con la descripción "Farmacia" ya capturada, elige "Nuevo", registra "Klar Débito" y guarda
- **THEN** vuelve al formulario del gasto con "Farmacia" intacto y "Klar Débito" seleccionado

### Requirement: Mostrar el uso de cada método
La lista de métodos de pago SHALL mostrar, para cada método, cuántos gastos no eliminados (recurrentes y únicos) lo usan.

#### Scenario: Conteo de uso
- **WHEN** "Nu Débito" lo usan dos gastos recurrentes y un gasto único
- **THEN** la lista muestra "3 gastos" en "Nu Débito"

### Requirement: Editar un método de pago
El sistema SHALL permitir modificar el nombre, el tipo, la institución, los últimos dígitos y el color de un método existente. Los gastos que lo usan SHALL mostrar los datos actualizados.

#### Scenario: Cambio de nombre
- **WHEN** el usuario renombra "BBVA Azul" a "BBVA Oro"
- **THEN** todos los gastos que usaban ese método lo muestran como "BBVA Oro"

### Requirement: Archivar o eliminar un método de pago
Un método usado por algún gasto (recurrente o único, no eliminado) no SHALL poder eliminarse, solo archivarse. Un método archivado SHALL dejar de ofrecerse al registrar o editar gastos, pero los gastos existentes SHALL conservarlo. Un método sin gastos SHALL poder eliminarse con confirmación. El sistema SHALL impedir archivar o eliminar el último método activo.

#### Scenario: Archivar un método en uso
- **WHEN** el usuario archiva "BBVA Azul", que usa el gasto recurrente "Netflix"
- **THEN** "BBVA Azul" ya no aparece como opción al registrar un gasto nuevo, y "Netflix" sigue mostrando "BBVA Azul"

#### Scenario: Eliminar un método sin uso
- **WHEN** el usuario elimina un método que ningún gasto usa y confirma
- **THEN** el método desaparece de la lista de métodos

#### Scenario: Intento de eliminar un método en uso
- **WHEN** el usuario intenta eliminar un método que usa algún gasto
- **THEN** el sistema no lo elimina y le ofrece archivarlo

#### Scenario: Último método activo
- **WHEN** solo queda un método activo y el usuario intenta archivarlo o eliminarlo
- **THEN** el sistema lo impide e indica que debe existir al menos un método activo

#### Scenario: Reactivar un método archivado
- **WHEN** el usuario reactiva un método archivado
- **THEN** el método vuelve a ofrecerse al registrar gastos

### Requirement: Sugerir el último método usado
Al registrar un gasto nuevo, recurrente o único, el sistema SHALL preseleccionar el método de pago activo usado en el último gasto registrado o, si no hay ninguno, "Efectivo" o el primer método activo.

#### Scenario: Preselección
- **WHEN** el último gasto registrado se pagó con "Nu Débito" y el usuario abre el formulario de un gasto nuevo
- **THEN** el método de pago aparece preseleccionado como "Nu Débito"

### Requirement: Metadatos listos para compartir y sincronizar
Cada método de pago SHALL tener un identificador único global, una fecha de creación inmutable y una fecha de última actualización. Los gastos SHALL referirse al método por su identificador y no por su nombre. El método inicial "Efectivo" SHALL usar un identificador fijo, igual en todas las instalaciones.

#### Scenario: Identificador fijo del método inicial
- **WHEN** la app se instala en dos dispositivos distintos
- **THEN** el método "Efectivo" creado por el sistema tiene el mismo identificador en ambos

### Requirement: Tarjeta digital
Al registrar o editar un método de tipo crédito o débito, el sistema SHALL permitir indicar que tiene una versión digital y, opcionalmente, los últimos 4 dígitos de la tarjeta digital (exactamente 4 números). La física y la digital son el mismo método de pago y comparten su saldo. Efectivo y transferencia no SHALL ofrecer esta opción.

#### Scenario: Registrar la versión digital
- **WHEN** el usuario edita "BBVA Azul ••4521", activa "Tiene tarjeta digital" y captura 7788
- **THEN** el método queda con tarjeta física ••4521 y digital ••7788

#### Scenario: Dígitos de la digital inválidos
- **WHEN** el usuario captura "77A" como dígitos de la tarjeta digital
- **THEN** el sistema no guarda el método e indica que deben ser 4 números

### Requirement: Elegir tarjeta física o digital en un gasto
Al registrar o editar un gasto (único o recurrente) con un método que tiene versión digital, el sistema SHALL permitir elegir "Física" o "Digital", preseleccionando la que se usó en el último gasto registrado con ese método o, si no hay, "Física". Con métodos sin versión digital no SHALL mostrarse la opción. Los gastos SHALL mostrar con cuál se pagaron.

#### Scenario: Gasto con la digital
- **WHEN** el usuario registra "Netflix" con "BBVA Azul" y elige "Digital"
- **THEN** la fila del gasto muestra "BBVA Azul ••7788 · digital"

#### Scenario: Preselección de la última usada
- **WHEN** el último gasto con "BBVA Azul" se pagó con la digital y el usuario registra otro gasto con "BBVA Azul"
- **THEN** "Digital" aparece preseleccionada

#### Scenario: Método sin versión digital
- **WHEN** el usuario elige "Nu Débito", que no tiene versión digital registrada
- **THEN** el formulario no muestra la opción Física | Digital
