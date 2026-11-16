# Proposal

## Why

Para abrir la beta cerrada, Google Play pide una política de privacidad publicada en una URL pública y el formulario de Seguridad de los datos (solo la pista interna está exenta). La política también tiene que poder abrirse desde la app. Hoy no hay ninguna de las dos cosas. Además, la LFPDPPP vigente (2025) pide un aviso de privacidad con un contenido mínimo.

## What Changes

- Nuevo **sitio estático con Astro** en `site/`, con dependencias propias y separado del proyecto Expo. Se publica en **GitHub Pages**: el repo es público, así que no cuesta.
- Página **"Política de privacidad de KPTLY expenses"**, en español, que cubre los requisitos de Google Play y del artículo 15 de la LFPDPPP:
  - el responsable es Everardo Sánchez Hernández, persona física, en Ciudad de México, México; el contacto de privacidad es eve.san.dev@gmail.com;
  - los datos de la app se guardan solo en el teléfono; no hay servidores, cuentas, analítica, publicidad ni rastreo;
  - la copia de seguridad de Android (Auto Backup) se queda activada y se explica: va al Google Drive del usuario y el desarrollador no tiene acceso;
  - comentarios por correo: qué se incluye, que se envían solo si el usuario quiere, que se usan solo para responder y mejorar la app, que no se comparten, y que se borran a petición o a más tardar **24 meses** después del último intercambio;
  - para qué sirve cada permiso (fotos y notificaciones) y que la consulta de actualizaciones la hace Google Play;
  - cómo borrar los datos y ejercer los derechos ARCO por correo: respuesta en 20 días como máximo y 15 días más para hacerla efectiva (artículo 31);
  - la app es para personas de **13 años en adelante**; si alguien es menor de 18, debe pedir permiso a su madre, padre o tutor antes de mandar comentarios;
  - cómo se avisan los cambios: la fecha de "Última actualización" y las notas de la versión.
- Una portada mínima (`/`) con el nombre de la app y un enlace a la política.
- Un workflow de GitHub Actions que construye y despliega el sitio cuando cambia `site/`.
- La app agrega **"Política de privacidad"** en Ajustes, que abre la URL publicada en el navegador del sistema. Google pide que la política también esté dentro de la app.
- Se llena el formulario de **Seguridad de los datos** en Play Console con "No recopila ni comparte datos" y el enlace a la política.

**Decisiones tomadas:**
- Solo se publican la ciudad y el estado.
- El formulario se llena como "No recopila": los comentarios los envía la app de correo del usuario por decisión suya.
- Auto Backup se queda activado.
- La versión en inglés queda para después de 0.1.0.

**Decisiones tomadas por omisión** (se pueden cambiar):
- Edad mínima de 13 años, y en Play Console los grupos de edad 13-15, 16-17 y 18+. Así no aplica la política de Familias, que es para menores de 13.
- El enlace queda en Ajustes, en la sección "Acerca de".

## Capabilities

### New Capabilities
- `privacy-policy`: la política de privacidad pública (contenido mínimo, URL y publicación) y su relación con el formulario de Seguridad de los datos.

### Modified Capabilities
- `settings-menu`: Ajustes agrega "Política de privacidad".

## Impact

- **Nuevo:** `site/` (Astro 7, con su propio `package.json`) y `.github/workflows/site.yml`.
- **Configuración del repo raíz:** `site/` se excluye de `tsconfig.json`, de ESLint, de Jest y de Prettier si hace falta, para que las revisiones de la app no lo incluyan.
- **App:** la pantalla de Ajustes y una constante con la URL de la política. Usa `expo-web-browser`, que ya está instalado. Sin cambios nativos.
- **Fuera del repo:** activar GitHub Pages (origen "GitHub Actions") y llenar en Play Console la URL de la política, el formulario de Seguridad de los datos y el público objetivo.
- **Maqueta:** `design/propose/politica-privacidad.html`.
