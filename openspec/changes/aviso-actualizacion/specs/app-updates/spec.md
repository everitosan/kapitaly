# Spec Delta

## Purpose

Que quien usa la app se entere de que hay una versión más nueva en Google Play y pueda instalarla sin salir de la app, sin que la app dependa de un servidor propio.

## ADDED Requirements

### Requirement: Detectar una versión nueva al abrir
Al abrir la app, si fue instalada desde Google Play, la app SHALL consultar a Play si hay una versión más nueva disponible para ese usuario. Si la hay, el balance SHALL mostrar una tarjeta "Nueva versión disponible" con el nombre de la versión cuando Play lo informe y el botón "Actualizar". La app SHALL NOT hacer llamadas de red propias para esto.

#### Scenario: Hay una beta nueva
- **WHEN** el usuario tiene instalada la beta 6 desde Play y la beta 7 ya está disponible para él en la pista de prueba interna
- **THEN** al abrir la app aparece "Nueva versión disponible" con el botón "Actualizar"

#### Scenario: Ya está al día
- **WHEN** el usuario tiene instalada la versión más reciente
- **THEN** no aparece ningún aviso de actualización

#### Scenario: Instalada fuera de Play
- **WHEN** la app corre en Expo o en un build instalado por cable
- **THEN** no aparece ningún aviso de actualización y la app funciona normal

### Requirement: Descargar sin salir de la app
Al tocar "Actualizar", la app SHALL iniciar el flujo flexible de Google Play: Play muestra su confirmación y la descarga sigue en segundo plano mientras el usuario usa la app. Durante la descarga, la tarjeta SHALL mostrar "Descargando la nueva versión… N %". Si el usuario cancela la confirmación de Google, la tarjeta SHALL volver a "Nueva versión disponible".

#### Scenario: Descarga en curso
- **WHEN** el usuario toca "Actualizar" y acepta la confirmación de Google
- **THEN** la tarjeta muestra el avance, por ejemplo "Descargando la nueva versión… 45 %", y el usuario puede seguir usando la app

#### Scenario: Cancelar la confirmación de Google
- **WHEN** el usuario toca "Actualizar" y cancela la confirmación de Google
- **THEN** la tarjeta vuelve a "Nueva versión disponible"

### Requirement: Instalar al terminar la descarga
Cuando la descarga termine, la tarjeta SHALL mostrar "Lista para instalar" con el botón "Reiniciar", que instala la versión nueva y vuelve a abrir la app. Si la descarga terminó con la app cerrada o en segundo plano, la tarjeta SHALL mostrar "Lista para instalar" al abrir o volver a la app. Este estado SHALL NOT poder ocultarse.

#### Scenario: Reiniciar
- **WHEN** la descarga terminó y el usuario toca "Reiniciar"
- **THEN** la app se cierra, se instala la versión nueva y vuelve a abrirse actualizada

#### Scenario: Descarga terminada fuera de la app
- **WHEN** el usuario salió de la app durante la descarga y la abre después de que terminó
- **THEN** aparece "Lista para instalar" con "Reiniciar"

### Requirement: Ocultar el aviso
La tarjeta "Nueva versión disponible" SHALL tener un botón para ocultarla. Al ocultarla, SHALL NOT volver a mostrarse en esa apertura de la app y SHALL volver a mostrarse en la siguiente apertura mientras no se haya actualizado.

#### Scenario: Ocultar y volver a abrir
- **WHEN** el usuario oculta el aviso, cierra la app y la vuelve a abrir sin haber actualizado
- **THEN** el aviso aparece de nuevo

### Requirement: Respaldo con Play Store
Si el flujo de Google Play no se puede iniciar o falla, "Actualizar" SHALL abrir la página de la app en Play Store para que el usuario actualice desde ahí.

#### Scenario: El flujo de Google falla
- **WHEN** el usuario toca "Actualizar" y Play no puede iniciar el flujo flexible
- **THEN** se abre la página de KPTLY expenses en Play Store
