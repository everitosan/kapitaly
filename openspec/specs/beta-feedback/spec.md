# beta-feedback Specification

## Purpose
Permite que quien prueba la app le mande comentarios con capturas al desarrollador desde Ajustes, usando la app de correo del propio teléfono, sin servidor.

## Requirements

### Requirement: Escribir un comentario
La pantalla "Comentarios" SHALL tener un campo de texto obligatorio, de hasta 2,000 caracteres, con un contador visible. "Enviar por correo" SHALL estar deshabilitado mientras el texto esté vacío o solo tenga espacios.

#### Scenario: Sin texto
- **WHEN** el usuario abre "Comentarios" sin escribir nada
- **THEN** "Enviar por correo" está deshabilitado y el contador muestra "0 / 2,000"

#### Scenario: Límite de texto
- **WHEN** el usuario intenta escribir más de 2,000 caracteres
- **THEN** el campo no acepta más texto

### Requirement: Adjuntar capturas
El usuario SHALL poder agregar hasta 3 imágenes de su galería con el selector de fotos del sistema, y quitar cualquiera antes de enviar. Al llegar a 3 SHALL dejar de ofrecerse agregar más. Las capturas son opcionales.

#### Scenario: Agregar y quitar
- **WHEN** el usuario agrega dos capturas y quita la primera
- **THEN** queda una captura y sigue disponible el botón para agregar

#### Scenario: Máximo de capturas
- **WHEN** el usuario ya agregó 3 capturas
- **THEN** ya no aparece el botón para agregar otra

#### Scenario: Cancelar el selector
- **WHEN** el usuario abre el selector de fotos y lo cierra sin elegir
- **THEN** las capturas no cambian

### Requirement: Enviar por la app de correo
Al tocar "Enviar por correo", la app SHALL abrir la app de correo del teléfono con un correo listo para `eve.san.dev@gmail.com`, con asunto "Comentarios · KPTLY expenses {versión}", el texto del usuario, al final la versión de la app, el modelo del teléfono y la versión del sistema, y las capturas como adjuntos. La app SHALL NOT enviar el comentario por su cuenta. Después SHALL mostrar "Se abrió tu correo para enviar los comentarios" y conservar lo escrito.

#### Scenario: Correo listo
- **WHEN** el usuario escribe "No se marca la variante digital", agrega una captura y toca "Enviar por correo" en la versión 0.1.0-beta.6
- **THEN** se abre su app de correo con destinatario `eve.san.dev@gmail.com`, asunto "Comentarios · KPTLY expenses 0.1.0-beta.6", el texto, la versión, el modelo y la versión de Android al final, y la captura adjunta

#### Scenario: Volver a la app
- **WHEN** el usuario vuelve de su app de correo
- **THEN** ve "Se abrió tu correo para enviar los comentarios" y su texto y capturas siguen en el formulario

### Requirement: Datos de diagnóstico visibles
La pantalla SHALL indicar, antes de enviar, qué datos de diagnóstico se agregan (versión de la app, modelo del teléfono y versión del sistema), con sus valores.

#### Scenario: Aviso de diagnóstico
- **WHEN** el usuario abre "Comentarios" en un Pixel 7 con Android 15 y la versión 0.1.0-beta.6
- **THEN** la pantalla dice que se agregan "versión 0.1.0-beta.6" y "Pixel 7 · Android 15"

### Requirement: Sin app de correo
Si el teléfono no tiene una app de correo disponible, la pantalla SHALL avisar "No hay una app de correo", explicar que hay que configurar una, deshabilitar "Enviar por correo" y conservar lo escrito.

#### Scenario: Teléfono sin correo
- **WHEN** el usuario abre "Comentarios" en un teléfono sin app de correo configurada
- **THEN** aparece el aviso "No hay una app de correo" y el botón de enviar está deshabilitado aunque haya texto
