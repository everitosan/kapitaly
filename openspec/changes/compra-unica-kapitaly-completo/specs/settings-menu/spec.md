## MODIFIED Requirements

### Requirement: Opciones de Ajustes
La pantalla "Ajustes" SHALL mostrar "Métodos de pago" y "Categorías", cada una con el número de elementos vigentes, y "Notificaciones", con un resumen de cuántos avisos están encendidos ("Apagadas", "1 activa", "N activas"). Cada opción SHALL abrir su pantalla al tocarla. Cuando el candado de Kapitaly completo está encendido (ver `premium-unlock`), SHALL mostrar al inicio, en una sección propia, "Kapitaly completo" con su estado ("Activo", "Pago pendiente", "Prueba: N días" o el precio de la tienda), que abre la pantalla "Kapitaly completo". En Android con soporte para fijar accesos directos SHALL mostrar además "Acceso directo: nuevo gasto". Debajo, en una sección "Beta", SHALL mostrar "Comentarios". Al final, en una sección "Acerca de", SHALL mostrar "Política de privacidad", que abre la URL publicada de la política en el navegador del sistema. Una opción sin funcionalidad disponible no SHALL mostrarse.

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

#### Scenario: Abrir la política de privacidad
- **WHEN** el usuario toca "Política de privacidad" en la sección "Acerca de"
- **THEN** se abre la URL de la política en el navegador del sistema y, al cerrarlo, el usuario vuelve a Ajustes

#### Scenario: Ir a Kapitaly completo
- **WHEN** el candado está encendido y el usuario toca "Kapitaly completo" en Ajustes
- **THEN** se abre la pantalla "Kapitaly completo"

#### Scenario: Estado de Kapitaly completo
- **WHEN** el candado está encendido y el usuario ya compró Kapitaly completo
- **THEN** la opción "Kapitaly completo" de Ajustes muestra "Activo"

#### Scenario: Estado durante la prueba
- **WHEN** el candado está encendido y al usuario le quedan 10 días de prueba
- **THEN** la opción "Kapitaly completo" de Ajustes muestra "Prueba: 10 días"

#### Scenario: Sin candado
- **WHEN** el usuario abre Ajustes en una build sin el cobro activado
- **THEN** no aparece "Kapitaly completo"

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
- **THEN** solo aparecen "Kapitaly completo" si el candado está encendido, "Métodos de pago", "Categorías", "Notificaciones", "Acceso directo: nuevo gasto" si el dispositivo lo admite, "Comentarios" en la sección "Beta" y "Política de privacidad" en la sección "Acerca de"
