# Tasks

## 1. Maqueta

- [x] 1.1 Crear `design/propose/politica-privacidad.html` con la página de la política (claro y oscuro, a ancho de teléfono y de escritorio) y la fila "Política de privacidad" en la sección "Acerca de" de Ajustes, usando `base.css`, con su botón para cambiar de tema y con el texto completo en español. Verificación: el usuario aprueba la maqueta y el texto.
- [x] 1.2 Hacer commit de la propuesta con la maqueta ("docs: propuesta y maqueta de la política de privacidad"), siguiendo `flujo-ramas`.

## 2. Sitio

- [x] 2.1 Crear `site/` con Astro 7 (`package.json` y `package-lock.json` propios, `astro.config.mjs` con `site: 'https://everitosan.github.io'`, `base: '/kapitaly'` y `output: 'static'`) y el layout `Base.astro` con `lang="es"`, los tokens claro y oscuro y el favicon. Verificación: `npm run build` dentro de `site/` genera `dist/` sin errores.
- [x] 2.2 Escribir `src/pages/privacidad.astro` con el texto aprobado y todos los puntos de la spec `privacy-policy`, cada uno con su encabezado, y `src/pages/index.astro` con el nombre de la app y un enlace a la política. Verificación: en `dist/privacidad/index.html` aparecen el título, el responsable, "Ciudad de México, México", eve.san.dev@gmail.com, "24 meses", "20 días" y "13 años", y no hay `<script>`.
- [x] 2.3 Excluir `site/` de `tsconfig.json`, de ESLint, de Jest y de `.prettierignore` en la raíz. Verificación: `npm run lint`, `npm run typecheck` y `npm test` dan el mismo resultado que antes.

## 3. Despliegue

- [x] 3.1 Crear `.github/workflows/site.yml` (se ejecuta con push a `release/**` y `main` cuando cambian `site/**` o el workflow; jobs `build` y `deploy`; permisos mínimos; acciones fijadas por SHA; `concurrency: pages`). Verificación: el YAML pasa `actionlint` o, si no está disponible, se revisa a mano contra el diseño.
- [x] 3.2 (Usuario) En GitHub, en Settings → Pages, elegir "GitHub Actions" como origen y agregar `release/*` a las ramas permitidas del entorno `github-pages`. Verificación: el entorno muestra la regla.
- [x] 3.3 Subir los cambios y comprobar la publicación. Verificación: el workflow termina bien y `https://everitosan.github.io/kapitaly/privacidad/` responde con 200 y la página completa, sin sesión iniciada.

## 4. App

- [x] 4.1 Agregar la constante `PRIVACY_POLICY_URL` y, en `SettingsScreen.tsx`, la sección "Acerca de" con "Política de privacidad", que abre la URL con `WebBrowser.openBrowserAsync`, con `accessibilityRole="link"`. Verificación: se agregan casos en `src/features/settings/__tests__/SettingsScreen.test.tsx`: aparecen la sección y la fila, y al tocarla se llama a `openBrowserAsync` con la URL. La prueba de "solo opciones del usuario" incluye la nueva fila.
- [x] 4.2 Correr `npm run lint`, `npm run typecheck`, `npm test` y `npx prettier --check` sobre los archivos cambiados. Verificación: todo pasa.

## 5. Play Console

- [ ] 5.1 (Usuario) Registrar la URL de la política en Play Console, llenar Seguridad de los datos con "No recopila ni comparte datos" y elegir como público objetivo 13-15, 16-17 y 18+. Verificación: Play Console no muestra pendientes en esas secciones.
- [ ] 5.2 Probar en el teléfono con una beta que incluya el cambio: en Ajustes, "Política de privacidad" abre la página y al cerrarla se vuelve a Ajustes; TalkBack la anuncia como enlace. Verificación: el usuario lo confirma.

## Workflow follow-up

- Archivar con `/opsx:archive` cuando la beta cerrada esté abierta con la política publicada.
- Después de 0.1.0, abrir un cambio para la versión en inglés (`/en/privacy/`).
