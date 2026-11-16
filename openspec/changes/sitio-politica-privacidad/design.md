# Design

## Context

- La app guarda todo en el teléfono (SQLite). No tiene analítica, reportes de fallos ni llamadas de red propias.
- Los comentarios (`src/features/feedback/`) abren la app de correo del usuario con el texto, las capturas y los datos de diagnóstico (`diagnostics.ts`: versión de la app, modelo y versión del sistema).
- `AndroidManifest.xml` tiene `android:allowBackup="true"`. Como se decidió dejar Auto Backup activado, no hay cambio nativo.
- Permisos: fotos (`expo-image-picker`, con cámara y micrófono quitados) y notificaciones locales.
- El repo es público. El único workflow que hay es `android-beta.yml`. La configuración raíz (`tsconfig.json` con `**/*.ts`, ESLint, Jest y Prettier) revisaría cualquier archivo nuevo que no se excluya.
- `expo-web-browser` ya es dependencia y Ajustes (`src/features/settings/SettingsScreen.tsx`) ya agrupa opciones en secciones con `SectionLabel`.

## Goals / Non-Goals

**Goals:**
- Tener una URL pública con la política para la beta cerrada, desplegada sola y sin costo.
- Un texto que cumpla lo que piden Google Play y el artículo 15 de la LFPDPPP, y que diga lo mismo que el formulario de Seguridad de los datos.
- Un acceso a la política desde la app.

**Non-Goals:**
- La versión en inglés (después de 0.1.0).
- Un dominio propio, la portada de la suite o páginas de soporte.
- Cambiar qué datos maneja la app.

## Decisions

### 1. Astro en `site/` como proyecto aparte
`site/` tiene su propio `package.json` y su `package-lock.json`, con Astro 7 (la versión estable más reciente al implementar), y sin workspaces. Así las dependencias de Expo y Metro no se mezclan con las de Astro, y `npx expo install` no lo toca.

En la raíz se excluye `site/` de `tsconfig.json`, de los `ignores` de ESLint, de `testPathIgnorePatterns` de Jest y de `.prettierignore`, para que `npm run lint`, `typecheck`, `test` y `format:check` sigan revisando solo la app.

**Alternativa descartada:** un HTML suelto en `docs/`. Es más simple, pero no permite crecer a más páginas (la versión en inglés, la portada de la suite) ni reutilizar un layout.

### 2. Estructura del sitio
```
site/
  astro.config.mjs        site + base para GitHub Pages
  src/layouts/Base.astro  <html lang="es">, meta, tokens claro/oscuro
  src/pages/index.astro   portada mínima: nombre + enlace
  src/pages/privacidad.astro
  public/favicon.png
```
- La salida es estática (`output: 'static'`) y no se envía JavaScript al cliente.
- La URL es `https://everitosan.github.io/kapitaly/privacidad/`, con `base: '/kapitaly'`. Esta URL va en una constante de la app y en Play Console. Si después se usa un dominio propio, solo cambian `site`, `base` y la constante, y GitHub Pages redirige.
- El estilo es A-1 Duotono simplificado: el fondo de la app (`#F4F1EA` claro y `#020903` oscuro con `prefers-color-scheme`), una columna de lectura de unos 680 px y un bloque de color en el encabezado. El texto debe tener un contraste de al menos 4.5:1.
- El contenido va escrito en la página `.astro`. La fecha de "Última actualización" es una constante que se cambia a mano junto con el texto.

### 3. Despliegue con GitHub Actions
`.github/workflows/site.yml`:
- Se ejecuta con `push` a `release/**` y `main` cuando cambian `site/**` o el propio workflow. No usa `workflow_dispatch`, porque solo funciona con workflows que ya están en `main`, y aquí todavía no lo están.
- Un job `build` (`npm ci` y `npm run build` en `site/`, y luego `actions/upload-pages-artifact`) y un job `deploy` (`actions/deploy-pages`) en el entorno `github-pages`.
- Permisos mínimos (`contents: read`, `pages: write`, `id-token: write`) y `concurrency` en `pages` sin cancelar el que está en curso.
- Las acciones se fijan por SHA, igual que en `android-beta.yml`.
- Si el build falla, el job de deploy no corre y se queda publicado lo anterior.

**Relación con `flujo-ramas`:** el skill dice que producción se despliega solo desde tags estables, y eso es para la app. El sitio es documentación y lo necesita la beta, que vive en `release/0.1.0`, así que se publica desde la rama de release. Cuando 0.1.0 entre a `main`, se puede limitar a `main`.

### 4. Acceso desde la app
En Ajustes, debajo de "Beta", va una sección "Acerca de" con la fila "Política de privacidad". Se ve igual que las demás, pero lleva un ícono de enlace externo en lugar de la flecha. Al tocarla se llama a `WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL)`. La constante va en `src/features/settings/` o en un módulo de constantes de la app. La fila tiene `accessibilityRole="link"` y una pista de que abre el navegador.

No hay manejo especial sin conexión, porque la app es solo local y el navegador del sistema ya muestra su propio error.

### 5. El texto
La redacción sigue el borrador acordado (diez secciones: responsable, datos en el teléfono, copia de seguridad, comentarios, permisos, lo que no se hace, actualizaciones, borrado y ARCO, menores, cambios). Se escribe en lenguaje sencillo, en segunda persona ("tus datos") y sin jerga legal. Cada afirmación tiene que poder comprobarse en el código.

## Risks / Trade-offs

- **[El entorno `github-pages` solo permite desplegar desde la rama por defecto]** → Al activar Pages, se agrega `release/*` a las ramas permitidas del entorno. Es una tarea manual.
- **[Solo ciudad y estado en el domicilio]** → El artículo 15 pide "domicilio". Es una decisión del usuario. Si después se quiere cumplir del todo, se puede usar un apartado postal.
- **["No recopila" es una interpretación]** → La guía de Google no habla del correo por intent. La política lo explica con detalle, y si Google lo objeta, se cambia a "recopila, opcional: correo, info del dispositivo, fotos, comentarios".
- **[La política puede quedar desactualizada]** → La spec obliga a actualizar el formulario y la política antes de publicar fuera de la pista interna una versión que mande datos.
- **[La URL depende de `github.io`]** → GitHub Pages redirige si cambia el dominio, y la constante se actualiza en una versión nueva.
