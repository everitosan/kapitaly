## ADDED Requirements

### Requirement: Política de privacidad pública
La política de privacidad de KPTLY expenses SHALL estar publicada como página web en una URL pública y estable, servida por HTTPS. La página SHALL abrirse sin iniciar sesión, sin restricción por país y como HTML (no PDF). Su título SHALL ser "Política de privacidad de KPTLY expenses". Esa URL SHALL ser la registrada en Play Console.

#### Scenario: Abrir la política sin cuenta
- **WHEN** cualquier persona abre la URL de la política en un navegador, sin sesión iniciada
- **THEN** ve la página completa con el título "Política de privacidad de KPTLY expenses"

#### Scenario: Formato de la página
- **WHEN** se descarga la URL de la política
- **THEN** la respuesta es una página HTML servida por HTTPS, no un PDF ni un documento editable

### Requirement: Contenido mínimo de la política
La política SHALL estar en español y SHALL incluir, cada uno con su propio encabezado:
- la fecha de "Última actualización";
- el responsable: Everardo Sánchez Hernández, persona física, Ciudad de México, México;
- el contacto de privacidad: eve.san.dev@gmail.com;
- qué datos guarda la app y que se quedan solo en el teléfono, sin servidores, cuentas, analítica, publicidad ni rastreo;
- la copia de seguridad de Android: va a la cuenta de Google del usuario, la administra Google y el responsable no tiene acceso a ella;
- los comentarios por correo: el texto, las capturas elegidas, la versión de la app, el modelo del teléfono, la versión de Android y la dirección de correo de quien escribe. Los envía la app de correo del usuario solo si él lo decide; se usan solo para responder y mejorar la app; no se comparten con terceros; y se conservan como máximo 24 meses después del último intercambio, o menos si el usuario pide borrarlos;
- para qué sirve cada permiso: fotos, solo para adjuntar capturas a los comentarios; notificaciones, para los recordatorios que se generan en el teléfono;
- que la consulta de nuevas versiones la hace Google Play bajo su propia política;
- cómo borrar los datos de la app (desinstalarla o borrar sus datos en Android) y cómo pedir el borrado de los correos o ejercer los derechos de acceso, rectificación, cancelación y oposición: por correo, con respuesta en 20 días como máximo y 15 días más para hacerla efectiva si procede;
- la edad: la app es para personas de 13 años en adelante, y quien sea menor de 18 debe pedir permiso a su madre, padre o tutor antes de mandar comentarios;
- cómo se avisan los cambios: se actualiza la fecha de "Última actualización" y se menciona en las notas de la versión.

La política no SHALL afirmar que se recopilan, comparten o venden datos que la app no maneja.

#### Scenario: Responsable y contacto visibles
- **WHEN** alguien lee la política
- **THEN** encuentra el nombre del responsable, "Ciudad de México, México" y la dirección eve.san.dev@gmail.com

#### Scenario: Plazo de los comentarios
- **WHEN** alguien lee la sección de comentarios
- **THEN** la política dice que los correos se conservan como máximo 24 meses después del último intercambio y que se pueden borrar antes a petición

#### Scenario: Derechos ARCO
- **WHEN** alguien busca cómo ejercer sus derechos
- **THEN** la política indica el correo, el plazo de respuesta de 20 días y los 15 días para hacerla efectiva

### Requirement: Coherencia con el formulario de Seguridad de los datos
El formulario de Seguridad de los datos en Play Console SHALL declarar que la app no recopila ni comparte datos y SHALL enlazar la URL de la política. Si una versión de la app empieza a enviar datos fuera del teléfono por su cuenta, el formulario y la política SHALL actualizarse antes de publicar esa versión fuera de la pista interna.

#### Scenario: Declaración en Play Console
- **WHEN** se revisa la ficha de la app en Play Console
- **THEN** Seguridad de los datos dice "No recopila ni comparte datos" y la política de privacidad apunta a la URL publicada

### Requirement: Publicación del sitio
Cada cambio al sitio que llegue a la rama de release activa o a `main` SHALL publicarse automáticamente en la URL de la política, sin pasos manuales. Si la construcción falla, la versión publicada anterior SHALL seguir disponible.

#### Scenario: Cambio en el texto
- **WHEN** se sube a la rama de release un cambio en el texto de la política
- **THEN** después de que termina el workflow, la URL muestra el texto nuevo con su fecha

#### Scenario: Construcción fallida
- **WHEN** la construcción del sitio falla
- **THEN** la URL sigue mostrando la última versión publicada
