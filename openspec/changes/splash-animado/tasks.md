# Tasks

## 1. Splash nativo

- [x] 1.1 Crear `assets/images/splash-blank.png` transparente y configurar `expo-splash-screen` en `app.json` con `backgroundColor: #020903` y esa imagen, en claro y en `dark`. Verificación: `npx expo config --type public` muestra la nueva configuración, y `npx expo-doctor` no reporta problemas nuevos.

## 2. Componente BrandSplash

- [x] 2.1 Crear `src/ui/BrandSplash.tsx` con el SVG del diseño: `viewBox` recortado al contenido, ancho del 56 % de la pantalla y centrado, fondo `#020903` fijo, `ClipPath` `rx=9`, cuatro círculos (el mayor al fondo) con degradados `objectBoundingBox` y el `Path` del texto. Acepta `animate` y `onDone`. Verificación: una prueba de componente comprueba que, con `animate=false`, se renderizan los 4 círculos con sus radios finales y el texto, y que `onDone` se llama de inmediato.
- [x] 2.2 Implementar la animación de la variante C con `useAnimatedProps` (`cx`, `cy` y `r` escalados desde `(313, 437)`), los retrasos de 100, 250, 400 y 550 ms, 520 ms por círculo, el texto a los 800 ms y `onDone` al terminar. Verificación: una prueba con timers falsos de Jest comprueba que `onDone` no se llama antes de ~1.1 s y sí se llama antes de 1.5 s.

## 3. Integración en el arranque

- [x] 3.1 En `src/app/_layout.tsx`: `SplashScreen.preventAutoHideAsync()` en scope global; overlay `BrandSplash` absoluto sobre el contenido; `SplashScreen.hide()` en el `onLayout` del overlay; montar el Stack en cuanto las migraciones terminen; fundido de 200 ms y desmontaje cuando `(animationDone || skip) && (success || error)`. Verificación: pruebas del layout para los escenarios del spec "Ocultar cuando la app está lista": BD lenta, BD rápida y error de migración.
- [x] 3.2 Omitir la animación cuando la URL inicial trae `quick=1` (API de `expo-linking` v58, verificada en los docs) o cuando `useReducedMotion()` es verdadero. Verificación: pruebas del layout con URL de atajo y con movimiento reducido, en las que `BrandSplash` recibe `animate=false` y el overlay se va al terminar las migraciones. Las pruebas existentes de `quick-add-shortcut` siguen pasando.
- [x] 3.3 Ejecutar `npm test`, `npm run typecheck` y `npm run lint`. Verificación: los tres pasan.

## 4. Splash según el tema (tras la beta 6)

- [x] 4.1 `app.json`: `expo-splash-screen` con `backgroundColor: #F4F1EA` y `dark.backgroundColor: #020903`. `BrandSplash` toma fondo y color del texto del tema (claro: `#F4F1EA` y `#141414`; oscuro: `#020903` y blanco). `SplashGate` pone la barra de estado según el tema. Verificación: `npx expo config --type public` muestra los dos fondos, y las pruebas de `BrandSplash` y `SplashGate` en tema claro y oscuro comprueban fondo, texto y barra de estado.

## 5. Atajo con la app abierta (tras la beta 6)

- [x] 5.1 `ShortcutTrampolineActivity` en `modules/kapitaly-shortcuts` (Kotlin y el `AndroidManifest.xml` del módulo: tema translúcido, `taskAffinity=""`, `excludeFromRecents`, `noHistory`): reenvía el mismo URI a `MainActivity` con `FLAG_ACTIVITY_NEW_TASK` y termina sin animación. El atajo estático (`targetClass` en `withAndroidShortcuts.js`) y el acceso directo fijado (`setComponent` en `requestPinNewExpense`) apuntan a ella. Verificación: pruebas del plugin con el nuevo `targetClass`; compilar el módulo y el manifiesto fusionado con Gradle (`./gradlew :app:processReleaseMainManifest` y la compilación del módulo) sobre un prebuild temporal.
- [x] 5.2 `SplashGate` recuerda en memoria que el splash ya se mostró en esta sesión: si vuelve a montarse, oculta el splash nativo de inmediato y no monta el de marca. Verificación: prueba que monta, desmonta y vuelve a montar el layout y comprueba que la segunda vez no aparece el splash.
- [x] 5.3 Ejecutar `npm test`, `npm run typecheck` y `npm run lint`. Verificación: los tres pasan.

## 6. Verificación en dispositivo

- [ ] 6.1 Instalar la beta en Android 12+. Verificación:
  - el splash del sistema se ve solo con el fondo del tema, sin ícono, y la animación no tiene salto ni frame blanco;
  - el estado final coincide con `design/splash-expenses.svg`;
  - en modo claro el splash es claro y en modo oscuro es oscuro;
  - volver de segundo plano no muestra el splash (confirmado en la beta 6);
  - el atajo "Nuevo gasto" con la app cerrada abre el formulario sin animación y con el teclado listo;
  - con la app en segundo plano, el atajo y el acceso directo (vuelto a fijar) abren el formulario sin ningún splash y encima de la pantalla anterior;
  - con reducir movimiento activado no hay animación.
