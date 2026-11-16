## MODIFIED Requirements

### Requirement: Detectar una versión nueva al abrir
Al abrir la app, si fue instalada desde Google Play, la app SHALL consultar a Play si hay una versión más nueva disponible para ese usuario. Si la hay, la barra superior del balance SHALL mostrar una píldora amarilla "Actualizar" con un ícono de flecha hacia arriba, a la izquierda de la campana de pendientes. La app SHALL NOT hacer llamadas de red propias para esto.

#### Scenario: Hay una beta nueva
- **WHEN** el usuario tiene instalada la beta 6 desde Play y la beta 7 ya está disponible para él en la pista de prueba interna
- **THEN** al abrir la app aparece la píldora "Actualizar" en la barra superior y no hay ninguna tarjeta de actualización arriba del mes

#### Scenario: Ya está al día
- **WHEN** el usuario tiene instalada la versión más reciente
- **THEN** no aparece ningún aviso de actualización

#### Scenario: Instalada fuera de Play
- **WHEN** la app corre en Expo o en un build instalado por cable
- **THEN** no aparece ningún aviso de actualización y la app funciona normal

### Requirement: Descargar sin salir de la app
Al tocar "Actualizar ahora" en la hoja de actualización, la hoja SHALL cerrarse y la app SHALL iniciar el flujo flexible de Google Play: Play muestra su confirmación y la descarga sigue en segundo plano mientras el usuario usa la app. Durante la descarga, la píldora SHALL mostrar el avance ("45 %"). Si el usuario cancela la confirmación de Google, la píldora SHALL volver a "Actualizar".

#### Scenario: Descarga en curso
- **WHEN** el usuario toca "Actualizar ahora" y acepta la confirmación de Google
- **THEN** la hoja se cierra, la píldora muestra el avance, por ejemplo "45 %", y el usuario puede seguir usando la app

#### Scenario: Cancelar la confirmación de Google
- **WHEN** el usuario toca "Actualizar ahora" y cancela la confirmación de Google
- **THEN** la píldora vuelve a "Actualizar"

### Requirement: Instalar al terminar la descarga
Cuando la descarga termine, la píldora SHALL mostrar "Reiniciar" con un latido suave, y la hoja SHALL ofrecer "Lista para instalar" con "Reiniciar ahora", que instala la versión nueva y vuelve a abrir la app. Si la descarga terminó con la app cerrada o en segundo plano, la píldora SHALL mostrar "Reiniciar" al abrir o volver a la app. La píldora en este estado SHALL NOT poder ocultarse.

#### Scenario: Reiniciar
- **WHEN** la descarga terminó y el usuario toca "Reiniciar ahora" en la hoja
- **THEN** la app se cierra, se instala la versión nueva y vuelve a abrirse actualizada

#### Scenario: Descarga terminada fuera de la app
- **WHEN** el usuario salió de la app durante la descarga y la abre después de que terminó
- **THEN** la barra superior muestra la píldora "Reiniciar"

## ADDED Requirements

### Requirement: Hoja de actualización
Tocar la píldora SHALL abrir una hoja con el estado actual. Disponible: "Nueva versión disponible", el nombre de la versión cuando Play lo informe, "Actualizar ahora" y "Más tarde". Descargando: el avance con una barra y "Seguir usando la app". Lista: "Lista para instalar", "Reiniciar ahora" y "Después". "Más tarde", "Seguir usando la app" y "Después" SHALL cerrar la hoja sin cambiar el estado; la píldora SHALL seguir visible.

#### Scenario: Abrir la hoja con una versión disponible
- **WHEN** la píldora dice "Actualizar" y el usuario la toca
- **THEN** se abre la hoja con "Nueva versión disponible", "0.1.0-beta.9", "Actualizar ahora" y "Más tarde"

#### Scenario: Más tarde
- **WHEN** la hoja muestra "Nueva versión disponible" y el usuario toca "Más tarde"
- **THEN** la hoja se cierra y la píldora "Actualizar" sigue en la barra

#### Scenario: Ver el avance
- **WHEN** la descarga va en 45 % y el usuario toca la píldora
- **THEN** la hoja muestra el avance de 45 % y "Seguir usando la app"

#### Scenario: Píldora accesible
- **WHEN** el lector de pantalla llega a la píldora con una versión disponible
- **THEN** la anuncia como botón "Nueva versión disponible, actualizar"

### Requirement: Abrir la hoja al terminar la descarga
Cuando la descarga termine con la app abierta, la hoja SHALL abrirse sola una vez mostrando "Lista para instalar", salvo que la hoja de Pendientes esté abierta en ese momento. En los demás casos la hoja SHALL abrirse solo al tocar la píldora.

#### Scenario: La descarga termina mientras se usa la app
- **WHEN** el usuario está en el balance y la descarga llega al 100 %
- **THEN** se abre la hoja con "Lista para instalar" y "Reiniciar ahora"

#### Scenario: Después de cerrarla
- **WHEN** la hoja se abrió sola, el usuario tocó "Después" y sigue usando la app
- **THEN** la hoja no vuelve a abrirse sola y la píldora "Reiniciar" sigue en la barra

#### Scenario: Al abrir la app con la descarga ya terminada
- **WHEN** la descarga terminó con la app cerrada y el usuario la abre
- **THEN** la hoja no se abre sola y la barra muestra la píldora "Reiniciar"

#### Scenario: Con Pendientes abierto
- **WHEN** la hoja de Pendientes está abierta y la descarga termina
- **THEN** la hoja de actualización no se abre sola y la píldora muestra "Reiniciar"

## REMOVED Requirements

### Requirement: Ocultar el aviso
**Reason**: El aviso pasa a ser una píldora en la barra superior que no ocupa espacio en el balance; "Más tarde" cierra la hoja sin ocultar la píldora.
**Migration**: Ninguna para el usuario. En el código se quitan `dismissed`, el evento `dismissed` y el botón ✕.
