# Spec Delta

## MODIFIED Requirements

### Requirement: Opciones de Ajustes
La pantalla "Ajustes" SHALL mostrar "Métodos de pago" y "Categorías", cada una con el número de elementos vigentes, y "Notificaciones", con un resumen de cuántos avisos están encendidos ("Apagadas", "1 activa", "N activas"). Cada opción SHALL abrir su pantalla al tocarla. En Android con soporte para fijar accesos directos SHALL mostrar además "Acceso directo: nuevo gasto". Debajo, en una sección "Beta", SHALL mostrar "Comentarios". Una opción sin funcionalidad disponible no SHALL mostrarse.

#### Scenario: Ir a Categorías
- **WHEN** el usuario toca "Categorías" en Ajustes
- **THEN** se abre la pantalla Categorías

#### Scenario: Ir a Métodos de pago
- **WHEN** el usuario toca "Métodos de pago" en Ajustes
- **THEN** se abre la lista de métodos de pago, igual que antes desde el balance

#### Scenario: Ir a Notificaciones
- **WHEN** el usuario toca "Notificaciones" en Ajustes
- **THEN** se abre la pantalla Notificaciones con sus tres avisos

#### Scenario: Resumen de notificaciones
- **WHEN** el recordatorio diario y el aviso por desuso están encendidos y el de cobros apagado
- **THEN** "Notificaciones" muestra "2 activas"

#### Scenario: Ir a Comentarios
- **WHEN** el usuario toca "Comentarios" en la sección "Beta" de Ajustes
- **THEN** se abre la pantalla Comentarios

#### Scenario: Sin recordatorios todavía
- **WHEN** el usuario abre Ajustes
- **THEN** los recordatorios solo aparecen dentro de "Notificaciones", sin otra opción aparte en Ajustes

#### Scenario: Acceso directo disponible
- **WHEN** el usuario abre Ajustes en un Android que puede fijar accesos directos
- **THEN** aparece "Acceso directo: nuevo gasto" debajo de "Notificaciones"

### Requirement: Sin pantallas de desarrollo en producción
La app de producción no SHALL incluir pantallas ni enlaces de desarrollo, ni SHALL poder abrirlas por enlace profundo. Ajustes solo SHALL mostrar opciones para el usuario.

#### Scenario: Enlace profundo a una pantalla de desarrollo
- **WHEN** se abre `kapitalyexpenses://dev/components` en la app instalada desde Play
- **THEN** la app no muestra ninguna pantalla de desarrollo

#### Scenario: Ajustes solo con opciones del usuario
- **WHEN** el usuario abre Ajustes
- **THEN** solo aparecen "Métodos de pago", "Categorías", "Notificaciones", "Acceso directo: nuevo gasto" si el dispositivo lo admite, y "Comentarios" en la sección "Beta"
