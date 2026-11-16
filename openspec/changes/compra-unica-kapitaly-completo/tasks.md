# Tasks

## 1. Maqueta

- [ ] 1.1 Crear `design/propose/compra-unica.html` (A-1 Duotono, claro y oscuro) con: el aviso de candado abierto bajo "Transporte" en Por categoría y bajo un método en Por método; el aviso con "tu prueba terminó"; la pantalla "Kapitaly completo" en sus estados (en prueba con días restantes, comprar con precio, pago pendiente, activo, tienda no disponible); y Ajustes con la nueva sección. Verificación: el usuario aprueba la maqueta y los textos antes de implementar.

## 2. Dependencia y candado por build

- [ ] 2.1 Instalar `expo-iap` con `npx expo install expo-iap` y agregar `"expo-iap"` a `plugins` en `app.json`. Verificación: `npx expo-doctor` no reporta problemas nuevos y `npx expo prebuild --platform android --no-install` en una carpeta temporal agrega el permiso `com.android.vending.BILLING` sin errores. Si pide compileSdk o Kotlin mayores, configurarlos con `expo-build-properties`.
- [ ] 2.2 En `app.config.js`, exponer `extra.premiumGate` (`KAPITALY_PREMIUM_GATE === 'on'`) sin romper el ajuste de versión de beta. Verificación: pruebas en `scripts/__tests__/` (o junto a `beta-version.test.js`) para encendido, apagado y con `KAPITALY_BETA_TAG`.
- [ ] 2.3 Simular `expo-iap` en `jest.setup.ts` con un `useIAP` falso controlable desde las pruebas. Verificación: `npm test` sigue pasando completo.

## 3. Dominio del desbloqueo

- [ ] 3.1 Crear `src/domain/premium.ts` con `PREMIUM_PRODUCT_ID`, `PREMIUM_OWNED_KEY`, `PREMIUM_TRIAL_START_KEY`, `TRIAL_DAYS`, `PremiumState`, `isPremiumOpen`, `trialDaysLeft`, `resolvePremium` y `purchasesToAcknowledge` según design.md §2. Verificación: `src/domain/__tests__/premium.test.ts` cubre gate apagado, comprado, pendiente, sin compra (reembolso), tienda caída con y sin caché, otro producto ignorado y compras ya confirmadas que no se repiten. Para la prueba: inicio 16/11/2026 da 10 días el 20/11, 1 día el 29/11 y `locked` con `trialEnded` el 30/11; compra durante la prueba da `unlocked`; sin `trialStart` no hay `trialEnded`; un cambio de mes o de año se cuenta bien.

## 4. Proveedor y hook `usePremium`

- [ ] 4.1 Crear `src/features/premium/PremiumProvider.tsx` y `usePremium()` según design.md §3 (caché inicial, consulta al conectar y al volver a primer plano, confirmación, `buy`, `restore`, precio de la tienda), y montarlo en `src/app/_layout.tsx`. Verificación: pruebas en `src/features/premium/__tests__/` con el `useIAP` falso: arranca desbloqueado desde la caché sin tienda; un código canjeado (compra en `getAvailablePurchases`) desbloquea y llama `finishTransaction` con `isConsumable: false`; volver a `active` vuelve a consultar; una compra pendiente da `pending` sin confirmar; la tienda sin la compra bloquea y guarda `premium.owned`; con gate apagado no se conecta a la tienda ni guarda `premium.trialStart`; la primera apertura con gate encendido guarda hoy como inicio y una segunda apertura no lo cambia; al volver a `active` otro día, la prueba vencida pasa a `locked`.

## 5. Aviso de candado en Análisis

- [ ] 5.1 Crear `PremiumLock` en `src/ui/components/premiumLock.tsx` (mensaje, botón "Desbloquear" con rol de botón y etiqueta accesible). Verificación: prueba en `src/ui/components/__tests__/components.test.tsx` que tocar "Desbloquear" llama `onUnlock`.
- [ ] 5.2 Agregar la prop `locked` a `CategoryDonut` y `MethodBreakdownCard`: con `locked`, la fila activa conserva su resaltado y en lugar de `BreakdownDetail` va `PremiumLock`. Verificación: pruebas de componentes con `locked` en las que no aparece ninguna fila de detalle ni su monto y sí el aviso; sin `locked` siguen pasando las pruebas actuales sin cambios.
- [ ] 5.3 En `BalanceScreen`, pasar `locked = !isPremiumOpen(state)` desde `usePremium()`, el mensaje de prueba terminada cuando `trialEnded`, y `onUnlock` → `/premium`. Verificación: pruebas en `BalanceScreen.test.tsx` con el escenario de noviembre: bloqueado, tocar "Transporte" y "BBVA Azul" muestra el aviso en cada uno; con prueba terminada, el aviso dice que terminó; en prueba y desbloqueado, el detalle se ve como hoy.

## 6. Pantalla Kapitaly completo y Ajustes

- [ ] 6.1 Crear `src/features/premium/PremiumScreen.tsx` y la ruta `src/app/premium.tsx` (registrada en el `Stack`), con los textos en `src/features/messages.ts`. Si el gate está apagado, la ruta regresa al balance. Verificación: pruebas de la pantalla para "Comprar por $29.00" con el precio falso; "Te quedan 10 días de prueba" y "Último día de prueba" junto a "Comprar"; "Activo" sin "Comprar"; "Pago pendiente" deshabilitado; tienda no disponible sin precio y con "Comprar" deshabilitado; cancelación sin `Alert`; error con `Alert`; restaurar sin compras con el mensaje de "no hay compras".
- [ ] 6.2 En `SettingsScreen` y `src/app/settings/index.tsx`, agregar `onOpenPremium` y la sección inicial "Kapitaly completo" con detalle `Activo`, `Pago pendiente`, `Prueba: N días` o el precio, solo con gate encendido. Verificación: pruebas de Ajustes en las que con gate encendido aparece la fila con su estado y abre la pantalla, y con gate apagado no aparece. Las pruebas de opciones existentes siguen pasando.

## 7. Play Console y privacidad

- [ ] 7.1 Crear en Play Console el producto único `kapitaly_completo` con precio provisional de $49 MXN y agregar testers de licencia. Verificación: el producto aparece activo y la cuenta de prueba figura como tester de licencia.
- [ ] 7.2 Revisar la política de privacidad (`site/`) y el formulario de Seguridad de los datos de Play por el uso de Google Play Billing, y actualizarlos si hace falta. Verificación: el usuario aprueba el texto, o se registra que no requiere cambios.

## 8. Verificación integral

- [ ] 8.1 Correr `npm run lint`, `npm run typecheck`, `npm test` y `npx prettier --check` sobre los archivos cambiados. Verificación: todo pasa.
- [ ] 8.2 Publicar una build de prueba interna con `KAPITALY_PREMIUM_GATE=on` y probar en un teléfono físico, en claro y oscuro: la primera apertura empieza la prueba con 14 días; el fin de la prueba (con `premium.trialStart` puesto 14 días atrás desde una build de desarrollo); el aviso en ambos detalles; compra con tarjeta de prueba; compra pendiente con la tarjeta de prueba "lenta" (aprobada después); restaurar después de reinstalar; canje de un código promocional con la app en segundo plano; sin internet tras comprar; y que la compra sigue después de 3 días (confirmada). Verificación: cada caso se comporta según `premium-unlock` y TalkBack lee el aviso y el botón.
- [ ] 8.3 Compilar una beta normal (sin la variable) y confirmar que todo está desbloqueado y Ajustes no muestra "Kapitaly completo". Verificación: la revisión manual en el teléfono lo confirma.

## Workflow follow-up

- Hacer commit de la propuesta con la maqueta ("docs: propuesta y maqueta de la compra única") antes de la implementación, siguiendo el skill `flujo-ramas`.
- Mandar los códigos promocionales a los testers fundadores antes de publicar la primera build pública con el candado encendido.
- Configurar en Play Console el precio de lanzamiento ($29) y las recompensas de pre-registro cuando se prepare el lanzamiento.
- Archivar después de `sitio-politica-privacidad`, porque este delta de `settings-menu` parte del suyo.
- Proponer aparte la vista de gasto por día usando `usePremium()`, y el soporte de iOS con offer codes.
