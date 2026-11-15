# Design

## Context

Ver `proposal.md` y el delta de `quick-add-shortcut`. Estado actual:

- `plugins/withAndroidShortcuts.js` escribe `res/drawable/shortcut_new_expense.xml`, un vector de 48 dp (círculo `#C2EE73` y "+" `#141414`). Ese recurso lo usan `res/xml/shortcuts.xml` (el atajo estático) y `KapitalyShortcutsModule.kt` (el acceso directo fijado, con `IconCompat.createWithResource`).
- `minSdk` es 24. Los íconos adaptativos (`<adaptive-icon>`) existen desde la API 26.
- El diseño está en `design/acceso directo expenses.png`; la maqueta con las formas de launcher, en `design/propose/comentarios-y-atajo.html`. Los colores salen de `src/ui/brandSplashArt.ts`.

## Goals / Non-Goals

**Goals:** que el ícono se vea bien en cualquier launcher, en vector y sin PNG por densidad, usando el mismo nombre de recurso para que el código nativo no cambie.

**Non-Goals:** íconos temáticos o monocromos de Android 13 (aplican solo al ícono de la app, no a los atajos) y cambiar el ícono de la app.

## Decisions

### 1. Ícono adaptativo con el mismo nombre de recurso

El plugin escribe cuatro archivos:

```
res/drawable/shortcut_new_expense_background.xml   vector 108dp: rectángulo #020903
res/drawable/shortcut_new_expense_foreground.xml   vector 108dp: 3 círculos con degradado + cartera
res/drawable-anydpi-v26/shortcut_new_expense.xml   <adaptive-icon> con esas dos capas
res/drawable/shortcut_new_expense.xml              respaldo API 24–25: vector de 48 dp con el área visible (72)
                                                   sobre un cuadro oscuro redondeado
```

Android elige `drawable-anydpi-v26` en la API 26+ y `drawable/` en la 24 y 25. El respaldo es un vector y no un `<layer-list>`: así recorta el dibujo al área visible (un `group` desplazado 18) sin depender de capas ni de `inset`. El nombre `shortcut_new_expense` no cambia, así que `shortcuts.xml` y `KapitalyShortcutsModule.kt` siguen igual. `IconCompat.createWithResource` acepta el adaptive-icon y el launcher aplica su máscara.

*Alternativa descartada:* `IconCompat.createWithAdaptiveBitmap` con un PNG. Obliga a cambiar el módulo nativo, a mantener un PNG y no aplica al atajo estático de `shortcuts.xml`.

### 2. Geometría de la capa de frente

En un lienzo de 108 × 108 con centro en (54, 54) se ven los 72 del centro y la zona segura es un círculo de radio 33. Siguiendo la maqueta:

- Círculos concéntricos de radio 33, 27 y 20.5, con el degradado vertical `#328844` → `#063D12`. Se usa `<gradient android:type="linear">` en el `aapt:attr` del `fillColor`, que se soporta en vectores desde la API 24.
- Cartera centrada, de unos 20 de ancho: trazo `#0A3315` de grosor 1.7, solapa diagonal, cuerpo redondeado y broche. Su `pathData` se escribe a partir del dibujo de la maqueta.

Los textos del vector se generan en el plugin a partir de constantes, para poder probarlos (que existan las capas, los colores y el degradado).

### 3. Fila de Ajustes

Un componente `ShortcutIcon` en `src/ui/icons/` dibuja con `react-native-svg` la misma geometría (fondo, círculos y cartera) en un cuadro redondeado de 40 px. Así la fila coincide con lo que se agrega a la pantalla de inicio. Las constantes de geometría se comparten en `src/ui/shortcutIconArt.ts` y el plugin las replica, porque es CommonJS fuera de `src`; una prueba compara que coincidan.

### 4. Rediseño con `design/link-expeneses.svg` (tras la beta 6)

El usuario entregó un SVG nuevo (432 × 432). Era un ícono completo, no capas: traía su propio cuadro redondeado (`rx=101`), un fondo de 416.9 px de ancho (dejaba una franja transparente), una `mask` alfa que los vectores de Android no soportan, y la cartera ocupaba del 15 % al 88 % del lienzo, así que un launcher redondo la cortaba. Se adapta sin cambiar el dibujo:

- **Fondo:** `#020903` en todo el lienzo y un círculo verde con el degradado del diseño (`#328844` → `#063D12`). En el lienzo de 432 tiene centro (306, 306) y radio 250, es decir, (76.5, 76.5) y 62.5 en el de 108. Así cruza los bordes superior e izquierdo: la esquina oscura es una cuña arriba a la izquierda, visible también con la máscara redonda, sin franjas oscuras en los demás bordes. Se probó con las máscaras de círculo, squircle, cuadro redondeado y cuadrado.
- **Frente:** las tres rutas de la cartera tal cual el SVG (trazos de 18 y 8, `#0A2F11`), dentro de un grupo con `scale 0.13` y `translate (25.01, 25.92)`. Equivale a escalarla al 52 % alrededor de su centro (223, 216) y pasar de 432 a 108. Su caja, con el grosor del trazo, queda dentro de la zona segura.
- Se descartan el cuadro redondeado y la máscara del SVG: el launcher pone la forma.
- **Respaldo de Android 7:** el mismo dibujo recortado al área visible con un `clip-path` de cuadro redondeado, para que el círculo verde no pinte las esquinas.

Los círculos concéntricos de la decisión 2 quedan reemplazados por esto.

## Risks / Trade-offs

- [Algunos launchers cachean el ícono de accesos directos ya fijados] → si el usuario ya tenía el acceso directo, puede que tenga que quitarlo y volver a fijarlo. Se menciona en la nota de la beta.
- [El degradado en vectores se ve distinto entre versiones de Android] → se verifica en la beta. Si falla, el plan B es un color sólido intermedio (`#1F6A33`).
- [La causa del ícono negro no está confirmada] → la verificación final en el teléfono lo confirma. Si sigue negro con un adaptive-icon, se investiga el launcher concreto.

## Migration Plan

Sin datos. Se entrega en la siguiente beta. Para revertir, basta con regresar el commit; el nombre del recurso no cambia.
