# Spec Delta

## MODIFIED Requirements

### Requirement: Verificaciones antes de publicar
Antes de firmar y publicar, el sistema SHALL ejecutar las pruebas, el typecheck y el lint del proyecto, y SHALL comprobar que la versión `X.Y.Z` del tag coincide con la versión de la app. Las verificaciones MAY correr al mismo tiempo que la compilación. Si alguna falla, no SHALL firmar ni publicar.

#### Scenario: Pruebas en rojo
- **WHEN** una prueba falla durante el workflow
- **THEN** el workflow termina con error y no se sube ninguna versión a Play

#### Scenario: Compilación lista con verificaciones en rojo
- **WHEN** la compilación del `.aab` termina bien pero el lint falla
- **THEN** el `.aab` no se firma ni se publica

#### Scenario: Versión del tag distinta a la de la app
- **WHEN** la app está en versión `0.1.0` y se hace push del tag `v0.2.0-beta.1`
- **THEN** el workflow falla antes de compilar e indica que la versión del tag no coincide

### Requirement: Secretos fuera del repositorio
La llave de subida, sus contraseñas y la cuenta de servicio de Google SHALL guardarse solo como secretos de GitHub. No SHALL aparecer en el repositorio, en los registros del workflow ni en cachés. El `.aab` y la llave descifrada no SHALL quedar versionados. La compilación SHALL correr sin acceso a esos secretos; solo el paso de firma y publicación SHALL recibirlos.

#### Scenario: Secretos ausentes
- **WHEN** el workflow corre sin alguno de los secretos requeridos
- **THEN** falla antes de firmar e indica cuál falta, sin mostrar el valor de ningún secreto

#### Scenario: Compilación sin secretos
- **WHEN** se compila el `.aab` de una beta
- **THEN** la compilación no recibe la llave de subida, sus contraseñas ni la cuenta de servicio, y lo que guarda en cachés o entrega al paso de firma no contiene ninguno de ellos

## ADDED Requirements

### Requirement: Firma verificada antes de publicar
El sistema SHALL firmar el `.aab` compilado con la llave de subida en un paso separado de la compilación. Antes de entregarlo o publicarlo, SHALL verificar que está firmado con el certificado de la llave de subida. No SHALL entregar ni publicar un `.aab` sin firma, con firma debug o con otro certificado.

#### Scenario: Firma correcta
- **WHEN** el `.aab` se firma con la llave de subida registrada en Play
- **THEN** la verificación pasa y el `.aab` firmado se entrega o publica

#### Scenario: Llave debug
- **WHEN** el alias configurado es la llave debug
- **THEN** el workflow falla sin entregar ni publicar el `.aab`

#### Scenario: Certificado distinto
- **WHEN** el `.aab` queda firmado con un certificado diferente al de la llave de subida
- **THEN** el workflow falla en la verificación y no publica nada

### Requirement: Arquitecturas soportadas
Cada beta SHALL entregarse como un solo `.aab` que incluya las arquitecturas `arm64-v8a` y `armeabi-v7a`, para llegar a celulares de 64 y de 32 bits.

#### Scenario: Celular de 32 bits
- **WHEN** un tester con un celular `armeabi-v7a` abre la beta en Play Store
- **THEN** Play le ofrece instalarla

#### Scenario: Contenido del bundle
- **WHEN** se inspecciona el `.aab` de una beta
- **THEN** contiene librerías nativas para `arm64-v8a` y `armeabi-v7a`

### Requirement: Reutilizar compilaciones entre betas
El sistema SHALL reutilizar entre betas de una misma rama `release/*` las dependencias descargadas y lo ya compilado, aunque cada beta venga de un tag distinto. Si no hay nada reutilizable (por ejemplo, en la primera beta de una serie), SHALL compilar desde cero con el mismo resultado.

#### Scenario: Segunda beta sin cambios de dependencias
- **WHEN** se publica `v0.1.0-beta.7` con el mismo lockfile que `v0.1.0-beta.6`
- **THEN** la compilación reutiliza lo guardado y tarda menos que una compilación desde cero

#### Scenario: Sin caché disponible
- **WHEN** se publica `v0.2.0-beta.1`, la primera beta de `release/0.2.0`, y no hay nada guardado para esa rama
- **THEN** el workflow compila desde cero y publica la beta normalmente
