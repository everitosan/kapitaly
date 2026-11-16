// @ts-check
import { defineConfig } from 'astro/config';

// Se publica en GitHub Pages: https://everitosan.github.io/kapitaly/
// Si se usa un dominio propio, cambiar `site` y `base`, y PRIVACY_POLICY_URL en la app.
export default defineConfig({
  site: 'https://everitosan.github.io',
  base: '/kapitaly',
  output: 'static',
  trailingSlash: 'always',
  vite: {
    // Fija el tsconfig del sitio. Sin esto, Vite también lee el tsconfig.json de la app
    // (extiende expo/tsconfig.base) y falla en CI, donde solo se instalan las dependencias de site/.
    tsconfig: './tsconfig.json',
  },
});
