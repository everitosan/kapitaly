# Spec Delta

## MODIFIED Requirements

### Requirement: Abrir Ajustes desde el balance
El encabezado del balance SHALL tener, en una fila propia arriba del nombre del mes y separados de las flechas para cambiar de mes, dos botones: uno con ícono de engrane que abre la pantalla "Ajustes" y otro con ícono de tarjeta que abre la lista de métodos de pago. El balance no SHALL tener otro acceso directo a categorías.

#### Scenario: Abrir el menú
- **WHEN** el usuario toca el botón de engrane en el encabezado del balance
- **THEN** se abre la pantalla "Ajustes"

#### Scenario: Abrir Métodos de pago desde el balance
- **WHEN** el usuario toca el botón de tarjeta en el encabezado del balance
- **THEN** se abre la lista de métodos de pago

#### Scenario: Botones separados de las flechas
- **WHEN** el usuario ve el encabezado del balance
- **THEN** los botones de tarjeta y engrane están en una fila arriba del mes y junto al mes solo están las flechas "Mes anterior" y "Mes siguiente"

#### Scenario: Etiquetas accesibles
- **WHEN** un lector de pantalla recorre el encabezado del balance
- **THEN** anuncia los botones como "Métodos de pago" y "Ajustes"
