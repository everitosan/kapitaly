# Design

## Context

- La app guarda todo en el teléfono (SQLite y la tabla clave-valor `uiPreferences`). No hay cuentas ni servidor propio. Ver proposal.md, sección Why.
- Las betas se compilan en `.github/workflows/android-beta.yml` con `KAPITALY_BETA_TAG`, y `app.config.js` ya ajusta la configuración según el entorno.
- El detalle por categoría (`CategoryDonut` en `src/ui/components/analysis.tsx`) y el detalle por método (`MethodBreakdownCard` en `src/ui/components/balance.tsx`) pintan `BreakdownDetail` bajo la fila activa. `BalanceScreen` guarda la selección de cada uno.
- `expo-iap` (v6.x, openiap) requiere un development build y un dispositivo físico para probar. No funciona en Expo Go. Expone `useIAP` (`connected`, `fetchProducts`, `requestPurchase`, `finishTransaction`, `getAvailablePurchases`, `onPurchaseSuccess`, `onPurchaseError`) y `ErrorCode.UserCancelled`.

## Goals / Non-Goals

**Goals:**
- Un solo punto de verdad del desbloqueo (`usePremium()`) que cualquier función premium futura, como el gasto por día, pueda consultar.
- Reglas de desbloqueo puras y probadas, separadas de la librería de la tienda.
- La app nunca se bloquea ni tarda en abrir por esperar a la tienda.

**Non-Goals:**
- Validar recibos en un servidor o con IAPKit (ver Riesgos).
- Abstraer varias tiendas. Solo Google Play. iOS se hará en otra propuesta sobre la misma interfaz.

## Decisions

### 1. Candado por variable de compilación `KAPITALY_PREMIUM_GATE`
`app.config.js` pone `extra.premiumGate = process.env.KAPITALY_PREMIUM_GATE === 'on'`, y la app lo lee con `expo-constants`. Si está apagado, `usePremium()` devuelve `unlocked`, no se conecta a la tienda y se ocultan la opción de Ajustes y la pantalla: la ruta `/premium` regresa al balance.
- **Por qué explícito y apagado por omisión:** si se olvida encenderlo, el error es regalar las funciones a algunos usuarios, no bloquearle la app a un tester. Una beta de cobro con testers de licencia solo agrega `KAPITALY_PREMIUM_GATE: on` al workflow.
- **Alternativa descartada:** encenderlo cuando no hay `KAPITALY_BETA_TAG`. Las builds locales y de desarrollo quedarían bloqueadas sin querer, y probar el cobro dentro de una beta sería más difícil.

### 2. Reglas puras en `src/domain/premium.ts`
- `type PremiumState = { status: 'unlocked' } | { status: 'trial'; daysLeft: number } | { status: 'locked'; trialEnded: boolean } | { status: 'pending' }`. Las funciones premium están abiertas con `unlocked` y con `trial`.
- `PREMIUM_PRODUCT_ID = 'kapitaly_completo'`, `PREMIUM_OWNED_KEY = 'premium.owned'`, `PREMIUM_TRIAL_START_KEY = 'premium.trialStart'` (fecha local `YYYY-MM-DD`) y `TRIAL_DAYS = 14`.
- `trialDaysLeft(start, today)`: devuelve `14 - díasEntre(start, today)`, con 0 o menos si ya terminó. Usa los días naturales del calendario local, con los helpers de `src/domain/date.ts`.
- `resolvePremium({ gate, cached, store, trialStart, today })`, donde `store` es `{ ok: true, purchases } | { ok: false }`. Se resuelve en este orden:
  1. Gate apagado → `unlocked`.
  2. Determinar si hay compra: con `store.ok`, una compra `kapitaly_completo` en estado *purchased*; con `!store.ok`, lo que diga `cached`. Si hay compra → `unlocked`.
  3. `store.ok` y solo hay una compra *pending* → `pending`. Si la prueba sigue vigente, se muestra la prueba y además el aviso de pago pendiente en la pantalla.
  4. Prueba vigente (`trialDaysLeft > 0`) → `trial`.
  5. En cualquier otro caso → `locked`, con `trialEnded = trialStart !== null`. Cubre los reembolsos.
- `purchasesToAcknowledge(purchases)`: las compras de `kapitaly_completo` en estado *purchased* que aún no están confirmadas.
- **Por qué:** así se prueba cada escenario de la spec (sin conexión, reembolso, pendiente, beta) en Jest sin simular la librería.

### 3. `PremiumProvider` en `src/features/premium/`
Se monta en `_layout.tsx` dentro de `RepositoryProvider`.
1. Lee `premium.owned` y `premium.trialStart` de `uiPreferences`. Si el gate está encendido y no hay `trialStart`, guarda hoy como inicio de la prueba. Después fija el estado inicial con `resolvePremium({ store: { ok: false } })`, así el desbloqueo es instantáneo y funciona sin conexión. `today` se vuelve a calcular en cada consulta, para que la prueba termine aunque la app siga abierta de un día para otro.
2. Con `connected`, llama a `getAvailablePurchases()` y a `fetchProducts({ skus: [PREMIUM_PRODUCT_ID], type: 'in-app' })`, resuelve el estado, guarda `premium.owned` si `store.ok` y llama a `finishTransaction({ purchase, isConsumable: false })` por cada compra que deba confirmarse.
3. Repite el paso 2 en `AppState` → `active`, para detectar canjes con la app en segundo plano.
4. En `onPurchaseSuccess` aplica la misma resolución con la compra recibida. Las pendientes no se confirman: se confirman cuando llegan como *purchased*.
5. Expone `{ status, gateOn, price, storeAvailable, buy(), restore(), lastError }`. `price` es el texto localizado de la tienda (`displayPrice`), nunca un monto escrito en el código.
- **Alternativa descartada:** consultar la tienda cada vez que se abre un detalle. Agrega latencia y falla sin conexión.

### 3b. Prueba local y no de la tienda
Play no ofrece pruebas gratis para productos de pago único, solo para suscripciones. Por eso la prueba vive en el teléfono.
- **Inicio en la primera apertura con el gate encendido, no en la fecha de instalación:** los testers de la beta, que ya tienen la app instalada, también reciben sus 14 días si no han canjeado su código. Y una build sin cobro nunca consume la prueba.
- **Alternativa descartada:** usar la fecha de instalación de Android (`firstInstallTime`). Requiere un módulo nativo, y para los testers la prueba ya estaría vencida.
- Al vivir en el teléfono, la prueba es tan confiable como el teléfono mismo (ver Riesgos).

### 4. Aviso de candado reutilizable `PremiumLock`
Va en `src/ui/components/premiumLock.tsx` y recibe `{ message, onUnlock, testID }`. `CategoryDonut` y `MethodBreakdownCard` reciben una prop `locked`. Cuando es verdadera, en lugar de `BreakdownDetail` pintan `PremiumLock` en el mismo lugar. La fila conserva el resaltado y la selección, y la suma, la dona y las barras no cambian. Si `trialEnded`, el mensaje del aviso dice que la prueba terminó. `BalanceScreen` obtiene `locked = !isPremiumOpen(state)` de `usePremium()`, donde `isPremiumOpen` es verdadero con `unlocked` o `trial`, y `onUnlock` hace `router.push('/premium')`.
- **Por qué en el mismo lugar:** el usuario ve que hay algo más justo donde lo buscaba. Es la invitación más natural a comprar y no rompe el gesto aprendido.

### 5. Pantalla `src/app/premium.tsx` y `PremiumScreen`
Estilo A-1 Duotono con un bloque destacado. Muestra:
- Lo que incluye: el detalle por categoría y por método, y "Funciones futuras incluidas".
- El texto "Pago único, sin suscripciones".
- Un botón según el estado: `Comprar por {price}`, `Pago pendiente` (deshabilitado, con una explicación) o `Activo` con un agradecimiento.
- Durante la prueba, arriba del botón de compra: "Te quedan N días de prueba", o "Último día de prueba" cuando `daysLeft === 1`.
- "Restaurar compras" como enlace.

Los mensajes de error y de "no hay compras que restaurar" usan `Alert`, como en el resto de la app. La cancelación (`ErrorCode.UserCancelled`) no muestra nada. Los textos van en `src/features/messages.ts`.

### 6. Opción en Ajustes
`SettingsScreen` recibe `onOpenPremium` y muestra, si `gateOn`, una primera sección con la fila "Kapitaly completo" cuyo detalle es `Activo`, `Pago pendiente`, `Prueba: N días` o el precio. Si la tienda no responde, la fila queda sin detalle.

### 7. Dependencia y configuración nativa
- `npx expo install expo-iap` y agregar `"expo-iap"` a los `plugins` de `app.json`.
- Revisar con `npx expo-doctor` y con un build de prueba que compileSdk y Kotlin cumplan lo que pide la librería. Si piden más, ajustarlo con `expo-build-properties`, nunca a mano en `android/`.
- En Jest, simular `expo-iap` en `jest.setup.ts` con un `useIAP` falso controlable desde las pruebas.

## Risks / Trade-offs

- **[El desbloqueo y la prueba se resuelven en el teléfono, sin servidor]** → Se acepta que builds modificadas puedan desbloquear. El precio es bajo, no hay contenido en servidor que proteger y validar en servidor contradice la infraestructura mínima. Si las estadísticas de Play lo justifican, se agrega validación en servidor más adelante sin cambiar la spec.
- **[Olvidar confirmar una compra la reembolsa a los 3 días]** → La confirmación se hace en cada consulta de compras, no solo en el flujo de compra, y `purchasesToAcknowledge` tiene pruebas. La prueba manual incluye un código promocional.
- **[Un `premium.owned` viejo desbloquea después de un reembolso si la tienda nunca responde]** → Se acepta. Basta con que la tienda responda una vez para corregirlo.
- **[El candado apagado por omisión puede salir así al lanzar]** → La tarea de release incluye verificar `extra.premiumGate` en la build pública. La propuesta del flujo de lanzamiento debe encenderlo.
- **[Testers de la beta que reciben la build con cobro antes que su código]** → Se mitiga desde el lado operativo: los códigos se mandan antes de publicar la primera build con `KAPITALY_PREMIUM_GATE=on`.
- **[Las pruebas reales solo funcionan en dispositivo físico y con la app subida a un track de Play]** → La verificación manual usa el track de pruebas interno con testers de licencia.

## Migration Plan

1. Mergear con el candado apagado. Las betas no cambian para los testers.
2. Crear `kapitaly_completo` en Play Console y agregar testers de licencia.
3. Publicar una beta interna con `KAPITALY_PREMIUM_GATE=on` para probar la compra, la compra pendiente (tarjeta de prueba "lenta"), restaurar y un código promocional.
4. Al lanzar, encender el candado en la build pública.
5. **Rollback:** publicar una build sin el candado. Lo recordado en `premium.owned` no estorba.

## Open Questions

- El texto exacto del aviso de candado y de la pantalla se define con la maqueta.
- Si la política de privacidad y el formulario de Seguridad de los datos necesitan mencionar Google Play Billing. Se resuelve al revisarlos, sin afectar el código.
