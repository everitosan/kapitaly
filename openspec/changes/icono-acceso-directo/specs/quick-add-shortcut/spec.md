# Spec Delta

## ADDED Requirements

### Requirement: Ícono de marca del acceso directo
El acceso directo "Nuevo gasto" fijado en la pantalla de inicio y el atajo que aparece al mantener presionado el ícono de la app SHALL mostrar el ícono de `design/acceso directo expenses.png`: los círculos verdes con degradado y una cartera en verde oscuro, sobre fondo `#020903`. En Android 8 o superior SHALL ser un ícono adaptativo, para que el launcher le aplique su forma sin recortar la cartera ni los círculos interiores. En Android 7 SHALL mostrarse el mismo dibujo, sin capas.

#### Scenario: Launcher con forma circular
- **WHEN** el usuario fija "Nuevo gasto" en un launcher que recorta los íconos en círculo
- **THEN** el acceso directo se ve como un círculo verde con la cartera al centro, y no como un ícono negro ni con un "+" lima

#### Scenario: Launcher con otra forma
- **WHEN** el launcher usa íconos con forma de squircle o cuadrado redondeado
- **THEN** el ícono toma esa forma, con el fondo oscuro en las orillas y la cartera completa al centro

#### Scenario: Atajo del ícono de la app
- **WHEN** el usuario mantiene presionado el ícono de la app
- **THEN** el atajo "Nuevo gasto" muestra el mismo ícono que el acceso directo fijado

#### Scenario: Android 7
- **WHEN** la app corre en Android 7 y el usuario ve el atajo "Nuevo gasto"
- **THEN** el ícono muestra los círculos y la cartera sobre el fondo oscuro

### Requirement: Ícono en Ajustes
La opción "Acceso directo: nuevo gasto" de Ajustes SHALL mostrar el mismo ícono que el acceso directo, para que el usuario reconozca lo que va a agregar a su pantalla de inicio.

#### Scenario: Fila de Ajustes
- **WHEN** el usuario abre Ajustes en un Android que puede fijar accesos directos
- **THEN** "Acceso directo: nuevo gasto" se ve con los círculos verdes y la cartera
