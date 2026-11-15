# Spec Delta

## ADDED Requirements

### Requirement: Ícono de marca del acceso directo
El acceso directo "Nuevo gasto" y el atajo del ícono de la app SHALL mostrar el ícono de `design/link-expeneses.svg` (campo verde, esquina oscura `#020903` arriba a la izquierda y cartera). En Android 8+ SHALL ser adaptativo: el launcher le pone su forma sin recortar la cartera, y la esquina oscura SHALL verse en cualquier forma. En Android 7, el mismo dibujo sin capas.

#### Scenario: Launcher con forma circular
- **WHEN** el usuario fija "Nuevo gasto" en un launcher que recorta los íconos en círculo
- **THEN** el acceso directo se ve verde, con la esquina oscura arriba a la izquierda y la cartera completa al centro, y no como un ícono negro ni con un "+" lima

#### Scenario: Launcher con otra forma
- **WHEN** el launcher usa íconos con forma de squircle o cuadrado redondeado
- **THEN** el ícono toma esa forma, con la esquina oscura arriba a la izquierda y la cartera completa al centro

#### Scenario: Atajo del ícono de la app
- **WHEN** el usuario mantiene presionado el ícono de la app
- **THEN** el atajo "Nuevo gasto" muestra el mismo ícono que el acceso directo fijado

#### Scenario: Android 7
- **WHEN** la app corre en Android 7 y el usuario ve el atajo "Nuevo gasto"
- **THEN** el ícono muestra el campo verde, la esquina oscura y la cartera en un cuadro redondeado

### Requirement: Ícono en Ajustes
La opción "Acceso directo: nuevo gasto" de Ajustes SHALL mostrar el mismo ícono que el acceso directo, para que el usuario reconozca lo que va a agregar a su pantalla de inicio.

#### Scenario: Fila de Ajustes
- **WHEN** el usuario abre Ajustes en un Android que puede fijar accesos directos
- **THEN** "Acceso directo: nuevo gasto" se ve con el campo verde, la esquina oscura y la cartera
