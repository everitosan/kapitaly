# android-beta-release Specification

## Purpose

Lleva cada beta de kapitaly-expenses de un tag de git a la pista de prueba interna de Google Play de forma automática, verificada y reproducible, sin servicios de pago y sin exponer llaves.

## Requirements

### Requirement: Identidad de la app en Android
La app SHALL compilarse para Android con el nombre de paquete `com.kapitaly.expenses`, el mismo registrado en Play Console.

#### Scenario: Paquete del build
- **WHEN** se genera un `.aab` de la app
- **THEN** su nombre de paquete es `com.kapitaly.expenses`

### Requirement: Publicar una beta desde un tag
Al hacer push de un tag con formato `vX.Y.Z-beta.N` cuyo commit pertenece a una rama `release/*`, el sistema SHALL compilar el `.aab` de Android, firmarlo con la llave de subida y publicarlo en la pista de prueba interna de Google Play, sin pasos manuales.

#### Scenario: Beta publicada
- **WHEN** el usuario hace push del tag `v0.1.0-beta.2` sobre un commit de `release/0.1.0`
- **THEN** la versión `0.1.0-beta.2` aparece en la pista de prueba interna de Play Console y los testers pueden instalarla desde Play Store

#### Scenario: Tag fuera de una rama release
- **WHEN** se hace push de un tag `v0.1.0-beta.3` sobre un commit que no pertenece a ninguna rama `release/*`
- **THEN** el workflow falla antes de compilar y no publica nada

#### Scenario: Otros tags no publican betas
- **WHEN** se hace push de un tag estable `v0.1.0` o de un tag con otro formato
- **THEN** el workflow de betas no se ejecuta

### Requirement: Verificaciones antes de publicar
Antes de compilar, el sistema SHALL ejecutar las pruebas, el typecheck y el lint del proyecto, y SHALL comprobar que la versión `X.Y.Z` del tag coincide con la versión de la app. Si algo falla, no SHALL publicar.

#### Scenario: Pruebas en rojo
- **WHEN** una prueba falla durante el workflow
- **THEN** el workflow termina con error y no se sube ninguna versión a Play

#### Scenario: Versión del tag distinta a la de la app
- **WHEN** la app está en versión `0.1.0` y se hace push del tag `v0.2.0-beta.1`
- **THEN** el workflow falla e indica que la versión del tag no coincide

### Requirement: Versionado creciente
Cada build SHALL usar como `versionName` la versión del tag sin la `v` (por ejemplo `0.1.0-beta.2`) y como `versionCode` un entero calculado del tag que crece con cada beta y con cada versión: `X × 1,000,000 + Y × 10,000 + Z × 100 + N`, con N entre 1 y 98. El valor 99 de los dos últimos dígitos queda reservado para la versión estable `vX.Y.Z`, de modo que una estable siempre supere a sus betas.

#### Scenario: Cálculo del código
- **WHEN** el tag es `v0.1.0-beta.2`
- **THEN** el build usa `versionName` `0.1.0-beta.2` y `versionCode` 10002

#### Scenario: Orden entre versiones
- **WHEN** se comparan los códigos de `v0.1.0-beta.9`, `v0.1.1-beta.1` y `v1.0.0-beta.1`
- **THEN** cada uno es mayor que el anterior (10009 < 10101 < 1000001)

#### Scenario: Número de beta fuera de rango
- **WHEN** el tag es `v0.1.0-beta.99` o `v0.1.0-beta.0`
- **THEN** el workflow falla e indica que N debe estar entre 1 y 98

### Requirement: Generar el primer `.aab` sin publicarlo
El sistema SHALL ofrecer una ejecución manual del workflow que compile y firme el `.aab` a partir de una rama `release/*` con la versión y el código indicados, y lo entregue como archivo descargable sin subirlo a Play, para la primera subida manual que exige Google.

#### Scenario: Ejecución manual
- **WHEN** el usuario ejecuta el workflow manualmente sobre `release/0.1.0` con la versión `0.1.0-beta.1`
- **THEN** obtiene un `.aab` firmado descargable desde la ejecución y no se publica nada en Play

### Requirement: Secretos fuera del repositorio
La llave de subida, sus contraseñas y la cuenta de servicio de Google SHALL guardarse solo como secretos de GitHub y no SHALL aparecer en el repositorio ni en los registros del workflow. El `.aab` y la llave descifrada no SHALL quedar versionados.

#### Scenario: Secretos ausentes
- **WHEN** el workflow corre sin alguno de los secretos requeridos
- **THEN** falla antes de compilar e indica cuál falta, sin mostrar el valor de ningún secreto
