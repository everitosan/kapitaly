# Design

## Context

Ver `proposal.md` (Why) y `specs/app-splash/spec.md`. Lo que importa del estado actual:

- `app.json` configura `expo-splash-screen` con `splash-icon.png` sobre `#F4F1EA` (claro) y `#121110` (oscuro). No hay ninguna llamada a `SplashScreen` en el código, así que el splash nativo se oculta solo.
- `src/app/_layout.tsx` ejecuta `useMigrations` y devuelve `null` mientras no terminan. Si fallan, muestra `MigrationError`.
- El atajo "Nuevo gasto" abre `kapitalyexpenses://expense/new?quick=1` (`plugins/withAndroidShortcuts.js`).
- `react-native-svg` 15.16 y `react-native-reanimated` 4.7 ya están instalados.
- Maqueta aprobada (variante C): https://claude.ai/artifact/4ZapFoArxb1w3DgVotLR9n

## Goals / Non-Goals

**Goals:** que el estado final sea idéntico al SVG de diseño, que la animación corra en el hilo de UI, que no haya un frame en blanco entre el splash nativo y el animado, y que la entrada por el atajo no se haga más lenta.

**Non-Goals:** splash al volver de segundo plano, `AnimatedVectorDrawable` en el splash nativo, y Lottie u otras dependencias.

## Decisions

### 1. Dos etapas: nativo vacío y overlay en React Native

```
arranque en frío
  |
  v
splash NATIVO  fondo del tema (#F4F1EA claro / #020903 oscuro), imagen transparente
  |  SplashScreen.preventAutoHideAsync() en scope global de _layout
  v
<BrandSplash> se monta como overlay absoluto sobre el Stack
  |  onLayout -> SplashScreen.hide()        (mismo fondo: sin salto)
  |  animación (~1.2 s)  ||  useMigrations
  v
ambos listos -> fundido de 200 ms -> se desmonta el overlay
```

`expo-splash-screen` usa `backgroundColor: #F4F1EA` y, en `dark`, `#020903` (ver decisión 6), con una **imagen transparente** (`assets/images/splash-blank.png`). Sin imagen, Android 12+ usa el ícono del launcher en el splash del sistema, y el spec pide que no aparezca. Esto se comprueba en un build release (tarea 4.1).

*Alternativa descartada:* dejar el logo completo en el splash nativo. La animación tendría que empezar "borrando" el logo, y el texto no cabe en el splash de Android 12+.

### 2. Componente `BrandSplash` en `src/ui/`

- Un `Svg` con un `viewBox` recortado al contenido del diseño (`89 213 224 440`: logo y texto). Su ancho es el 56 % del ancho de pantalla (224/402, como en el diseño) y está centrado. Así respeta la proporción del diseño en cualquier pantalla.
- Fondo y color del texto según el tema (decisión 6).
- `ClipPath` con el `Rect` `rx=9` del diseño, cuatro `Circle` en el mismo orden del SVG (el mayor primero, para que quede al fondo) y el `Path` del texto, copiado de `design/splash-expenses.svg`.
- **Degradados con `objectBoundingBox`** (`x1=.5 y1=0 x2=.5 y2=1`) en lugar de los `userSpaceOnUse` del diseño. En el diseño, cada degradado cubre exactamente la caja de su círculo, así que el resultado final es idéntico, y además el degradado escala con el círculo mientras crece. Con `userSpaceOnUse`, un círculo pequeño cerca de la esquina solo mostraría el verde oscuro del final.

### 3. Animación: escalar desde la esquina sin transform

Escalar un círculo por un factor `s` alrededor del punto `O = (313, 437)` (la esquina inferior derecha del cuadro) es equivalente a `cx' = Ox + s(cx − Ox)`, `cy' = Oy + s(cy − Oy)`, `r' = s·r`. Se animan `cx`, `cy` y `r` con `useAnimatedProps` sobre `Animated.createAnimatedComponent(Circle)`. Esto evita depender de `transform-origin` en SVG, que se comporta distinto entre plataformas.

Tiempos de la maqueta: el círculo menor arranca a los 100 ms y los demás a los 250, 400 y 550 ms, cada uno con 520 ms de `Easing.bezier(.2,.8,.2,1)`. El texto entra a los 800 ms (opacidad 0→1 y desplazamiento de 14 a 0 en 380 ms). La animación termina a ~1.18 s y avisa con `runOnJS(onDone)`.

### 4. Orquestación en `_layout.tsx`

`Root` mantiene dos estados, `animationDone` y el `success`/`error` de las migraciones. El overlay se desvanece cuando se cumple `(animationDone || skip) && (success || error)`. El `Stack` se monta debajo en cuanto `success` es verdadero, así que el balance ya está pintado cuando empieza el fundido. `preventAutoHideAsync()` se llama en scope global, sin `await`, como recomiendan los docs de SDK 58.

### 5. Cuándo se omite la animación

- **Atajo:** la URL inicial contiene `quick=1`. Se lee de forma síncrona al montar, con la API de URL inicial de `expo-linking` vigente en SDK 58 (verificar el nombre exacto en los docs v58 antes de escribir). Con `skip`, el overlay se muestra en su estado final solo mientras faltan las migraciones, que normalmente es imperceptible, y luego se oculta sin esperar animación.
- **Movimiento reducido:** `useReducedMotion()` de Reanimated. Se muestra el estado final y la regla de ocultamiento es la misma que con `skip`.

### 6. Colores según el tema (tras la beta 6)

Al probar la beta, el usuario pidió que el splash fuera claro en modo claro. `BrandSplash` toma el esquema de `useTheme()`:

| Tema | Fondo | Texto | Círculos | Barra de estado |
|---|---|---|---|---|
| Oscuro | `#020903` | `#FFFFFF` | degradado verde | `light` |
| Claro | `#F4F1EA` (`lightTheme.colors.bg`) | `#141414` | el mismo degradado | `dark` |

El splash nativo usa los mismos fondos por tema en `app.json` (`backgroundColor` y `dark.backgroundColor`), así que el paso al splash animado no cambia de color. En modo claro, el fondo coincide con el de la app y el fundido final es casi invisible, como se busca. `SplashGate` pone la barra de estado según el tema, en lugar de fijarla en `light`.

### 7. Atajo con la app abierta: actividad trampolín (tras la beta 6)

La documentación de Android dice que el primer intent de un atajo estático siempre lleva `FLAG_ACTIVITY_NEW_TASK` y `FLAG_ACTIVITY_CLEAR_TASK`: con la app abierta, destruye sus actividades. Por eso `MainActivity` se recreaba y se veían el splash del sistema y el de marca, y se perdía la pantalla anterior. El acceso directo fijado se lanza de la misma forma.

```
atajo / acceso directo
   -> ShortcutTrampolineActivity   (invisible, taskAffinity="", excludeFromRecents, noHistory)
        onCreate: startActivity(Intent(ACTION_VIEW, mismo URI) -> MainActivity, FLAG_ACTIVITY_NEW_TASK)
                  finish()  sin animación
   -> MainActivity (singleTask) ya existe: se trae al frente y recibe onNewIntent con el URI
   -> expo-router navega a /expense/new?quick=1 encima de lo que había
   (si la app estaba cerrada, MainActivity arranca en frío como hoy: splash sin animación)
```

- La actividad vive en `modules/kapitaly-shortcuts` (Kotlin y el `AndroidManifest.xml` del módulo, que se fusiona con el de la app), con un tema translúcido sin ventana visible.
- El atajo estático (`plugins/withAndroidShortcuts.js`, `targetClass`) y el acceso directo fijado (`KapitalyShortcutsModule.requestPinNewExpense`, con `setComponent`) apuntan a la trampolín. Los accesos directos ya fijados conservan su intent viejo hasta que el usuario los vuelva a fijar; el atajo del menú del ícono se actualiza solo.
- Hay que verificar en el teléfono si la trampolín debe ser `exported="true"` para que el launcher la pueda abrir. El intent solo acepta el URI propio del atajo.

Además, como protección, `SplashGate` recuerda en el módulo (memoria del proceso JS) que el splash ya se mostró. Si la vista raíz se monta de nuevo en la misma sesión, oculta el splash nativo de inmediato y no monta el de marca.

## Risks / Trade-offs

- [Android 12+ ignora la imagen transparente y muestra el ícono del launcher] → probarlo en el build release. Si pasa, buscar en el plugin `android` de expo-splash-screen v58 una opción para el ícono, o aceptar el ícono y empezar la animación con un fundido desde él (habría que actualizar el spec).
- [`useAnimatedProps` en `Circle` con cuatro círculos y degradados] → es ligero, pero se revisa en un Android de gama baja o 32 bits, porque ya se compila `armeabi-v7a`.
- [La trampolín no funciona con algún launcher o la actividad recreada pierde el estado] → la protección de `SplashGate` evita el splash de marca, y la verificación en el teléfono cubre el atajo del ícono y el acceso directo fijado.
- [Expo Go no muestra el splash nativo real] → las pruebas de JS cubren la lógica y la apariencia se valida en el release.
- [Una animación de ~1.2 s en cada arranque en frío puede cansar] → es corta, se omite en el atajo y con movimiento reducido, y solo pasa en arranque en frío.

## Migration Plan

Sin datos que migrar. Se entrega en una beta. Para revertir, basta con quitar el overlay y regresar `app.json` a su configuración anterior.
