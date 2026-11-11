# Spec Delta

## Purpose

Catálogo de instituciones financieras (bancos, fintechs y plataformas de inversión) compartido por la suite Kapitaly. Permite reconocer de qué institución es cada método de pago y que cada app ofrezca solo las instituciones que sirven para su propósito.

## ADDED Requirements

### Requirement: Catálogo inicial disponible sin conexión
La app SHALL incluir un catálogo de instituciones disponible sin conexión desde la primera apertura, con al menos: BBVA, Santander, Banamex, Nu, Mercado Pago, Klar, Stori, Cetesdirecto, Dinn, Openbank, Mifel, Invex, Kubo, Bitso y Finsus. Cada institución SHALL tener nombre, tipo (banco, fintech o inversión), color base y sus usos.

#### Scenario: Catálogo en modo avión
- **WHEN** el usuario abre la app recién instalada sin conexión y empieza a agregar un método de pago
- **THEN** puede elegir una institución del catálogo

### Requirement: Usos de una institución
Cada institución SHALL declarar uno o más usos: pagar gastos, recibir ingresos o invertir. Al agregar o editar un método de pago, esta app SHALL ofrecer solo las instituciones con el uso "pagar gastos".

#### Scenario: Institución solo de inversión
- **WHEN** el usuario elige la institución de un método de pago nuevo
- **THEN** Cetesdirecto no aparece entre las opciones

#### Scenario: Institución para pagar
- **WHEN** el usuario elige la institución de un método de pago nuevo
- **THEN** Nu aparece entre las opciones

### Requirement: Identidad visual de la institución
Una institución SHALL mostrarse con su logo cuando el catálogo lo incluya y, si no, con un monograma de sus iniciales sobre su color base. El texto del monograma SHALL cumplir contraste de al menos 4.5:1 con ese color.

#### Scenario: Institución sin logo
- **WHEN** se muestra un método de pago de Mercado Pago y el catálogo no incluye su logo
- **THEN** se muestra el monograma "MP" sobre el color base de Mercado Pago

### Requirement: Identificadores estables y catálogo de solo lectura
Cada institución SHALL tener un identificador estable, el mismo en todas las instalaciones y apps de la suite. El usuario no SHALL poder modificar el catálogo desde la app. Una institución retirada del catálogo SHALL seguir resolviéndose para los métodos que ya la usan, y no SHALL ofrecerse para métodos nuevos.

#### Scenario: Institución retirada
- **WHEN** una actualización del catálogo retira una institución que usa un método existente
- **THEN** el método sigue mostrando esa institución, y la institución ya no aparece al crear un método nuevo
