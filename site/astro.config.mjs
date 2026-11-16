// @ts-check
import { defineConfig } from 'astro/config';

// Se publica en GitHub Pages: https://everitosan.github.io/kapitaly/
// Si se usa un dominio propio, cambiar `site` y `base`, y PRIVACY_POLICY_URL en la app.
export default defineConfig({
  site: 'https://everitosan.github.io',
  base: '/kapitaly',
  output: 'static',
  trailingSlash: 'always',
});
