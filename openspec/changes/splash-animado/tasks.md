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

## 4. Verificación en dispositivo

- [ ] 4.1 Instalar un build release (beta interna o `npx expo run:android --variant release`) en Android 12+. Verificación: el splash del sistema se ve solo `#020903`, sin ícono; la animación no tiene salto ni frame blanco; el estado final coincide con `design/splash-expenses.svg`; en modo claro también se ve oscuro; volver de segundo plano no muestra el splash; el atajo "Nuevo gasto" abre el formulario sin animación y con el teclado listo; con reducir movimiento activado no hay animación. Si aparece el ícono del launcher, aplicar el plan del riesgo en `design.md` antes de marcar la tarea.
