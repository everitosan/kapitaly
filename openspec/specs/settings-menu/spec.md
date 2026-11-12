# settings-menu Specification

## Purpose

Agrupa en una sola pantalla de ajustes la configuración de la app (métodos de pago, categorías y futuras opciones), para que el balance conserve un encabezado limpio.

## Requirements

### Requirement: Abrir Ajustes desde el balance
El encabezado del balance SHALL tener un botón de menú que abre la pantalla "Ajustes". El balance no SHALL tener otro acceso directo a métodos de pago o categorías.

#### Scenario: Abrir el menú
- **WHEN** el usuario toca el botón de menú en el encabezado del balance
- **THEN** se abre la pantalla "Ajustes"

### Requirement: Opciones de Ajustes
La pantalla "Ajustes" SHALL mostrar "Métodos de pago" y "Categorías", cada una con el número de elementos vigentes, y abrir su pantalla al tocarla. Una opción sin funcionalidad disponible, como recordatorios, no SHALL mostrarse.

#### Scenario: Ir a Categorías
- **WHEN** el usuario toca "Categorías" en Ajustes
- **THEN** se abre la pantalla Categorías

#### Scenario: Ir a Métodos de pago
- **WHEN** el usuario toca "Métodos de pago" en Ajustes
- **THEN** se abre la lista de métodos de pago, igual que antes desde el balance

#### Scenario: Sin recordatorios todavía
- **WHEN** el usuario abre Ajustes
- **THEN** no aparece ninguna opción de recordatorios

### Requirement: Sin pantallas de desarrollo en producción
La app de producción no SHALL incluir pantallas ni enlaces de desarrollo, ni SHALL poder abrirlas por enlace profundo. Ajustes solo SHALL mostrar opciones para el usuario.

#### Scenario: Enlace profundo a una pantalla de desarrollo
- **WHEN** se abre `kapitalyexpenses://dev/components` en la app instalada desde Play
- **THEN** la app no muestra ninguna pantalla de desarrollo

#### Scenario: Ajustes solo con opciones del usuario
- **WHEN** el usuario abre Ajustes
- **THEN** solo aparecen "Métodos de pago" y "Categorías"
