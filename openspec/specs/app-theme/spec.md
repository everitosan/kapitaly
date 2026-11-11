# app-theme Specification

## Purpose

Define cómo se adapta la apariencia de la app a la preferencia de tema claro u oscuro del sistema, manteniendo los textos legibles en ambos.

## Requirements

### Requirement: Seguir el tema del sistema
La app SHALL mostrarse en tema claro cuando el sistema esté en modo claro y en tema oscuro cuando esté en modo oscuro, y SHALL cambiar de tema sin reiniciarse cuando el usuario cambie esa preferencia del sistema.

#### Scenario: Sistema en modo oscuro
- **WHEN** el sistema está en modo oscuro y el usuario abre la app
- **THEN** todas las pantallas se muestran en tema oscuro

#### Scenario: Cambio en caliente
- **WHEN** la app está abierta en tema claro y el usuario cambia el sistema a modo oscuro
- **THEN** la app pasa a tema oscuro sin perder la pantalla ni los datos capturados

### Requirement: Legibilidad en ambos temas
En ambos temas, todo texto SHALL tener un contraste de al menos 4.5:1 con el fondo sobre el que se muestra, incluidos los textos sobre bloques de color con degradado, medidos contra cada extremo del degradado. La barra de estado del sistema SHALL ser legible sobre el fondo de la app.

#### Scenario: Texto sobre un bloque de color en tema oscuro
- **WHEN** en tema oscuro se muestra un gasto anual en su bloque de color
- **THEN** su nombre y monto cumplen el contraste mínimo contra ambos extremos del degradado del bloque
