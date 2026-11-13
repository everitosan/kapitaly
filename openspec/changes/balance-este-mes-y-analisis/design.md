# Design

## Context

Ver `proposal.md` (Why) y la maqueta `design/propose/duotono-redesign.html`. Estado actual relevante:

- Todo el balance vive en `src/features/balance/BalanceScreen.tsx`; "Este mes" y "Promedio" son ramas de un `SegmentedControl`, no rutas.
- `buildThisMonthView` y `buildAverageView` (`src/domain/balance.ts`) no reciben confirmaciones: siempre suman `expense.amountCents`.
- Las confirmaciones (`ChargeConfirmation`: `charged` con monto real o `skipped`) ya se cargan con `useChargeConfirmations`. `pendingConfirmations` (`src/domain/confirmations.ts`) decide qué está por confirmar: cobros con fecha ≥ máx(ancla, día local de registro) y ≤ hoy, sin respuesta. Los cobros anteriores al día de registro no se preguntan nunca.
- Las categorías no tienen color propio (solo nombre e ícono).
- `ScreenLayout` envuelve un `ScrollView` sin exponer su ref.
- RN 0.88 con `react-native-svg` 15 ya instalado.

## Goals / Non-Goals

**Goals:**
- Que el estado de cada cobro (cobrado, por confirmar, por cobrar, no cobrado) se calcule en un solo lugar del dominio y lo usen la tarjeta, la barra y la lista.
- Mantener intacto el cálculo del costo mensual promedio; los nuevos repartos (categoría y método) salen de los mismos montos para que siempre sumen el total.
- Lógica nueva en funciones puras con pruebas; la UI solo presenta.

**Non-Goals:**
- Persistir la búsqueda o el orden entre sesiones.
- Darle color propio a las categorías en el modelo de datos.
- Animaciones de la gráfica.

## Decisions

### 1. Un solo cálculo de estado por cobro
Se agrega en `confirmations.ts` una función `chargeStatus(expense, date, confirmations, today, registeredOn)` que devuelve `charged` (con el monto confirmado o el de la regla), `skipped`, `pending` o `future`. Reglas, en orden: si hay confirmación vigente, manda ella; si la fecha es anterior a máx(ancla, día de registro), `charged` con el monto de la regla; si es ≤ hoy, `pending`; si no, `future`. `pendingConfirmations` se reescribe sobre la misma regla para que la marca "Por confirmar" y la tarjeta nunca discrepen.
*Alternativa:* calcular el estado en `BalanceScreen` con `isPending`. Se descarta porque duplicaría la regla del día de registro, y ahí es donde aparecerían las diferencias.

### 2. `buildThisMonthView` recibe confirmaciones, hoy y `registeredOn`
Cada `MonthCharge` gana `status`, `expectedCents` (el de la regla), `amountCents` (el que se muestra: el confirmado si lo hay) y `registeredAt` (`createdAt` del gasto, para desempatar). La vista expone `doneCents`, `pendingCents`, `futureCents` y `projectedCents` (= done + pending + future). Se quitan `breakdown`, `recurringCents` y `oneOffCents`, que ya no se muestran. Los únicos siempre son `charged`.
`registeredOn` se inyecta igual que en `pendingConfirmations` (`registeredOnLocal` en la app) para que las pruebas sean deterministas.

### 3. Orden y búsqueda como funciones puras
- `sortCharges(charges, direction)`: fecha → `registeredAt` → nombre (`localeCompare 'es'`); `desc` invierte el comparador completo.
- `matchesSearch(query, fields[])` en `src/domain/search.ts`: normaliza con NFD, quita diacríticos, pasa a minúsculas, recorta espacios; texto vacío coincide con todo. La usan la lista de "Este mes" y los tres modales con los campos nombre, nombre de categoría resuelta y etiqueta del método.
- La búsqueda y el orden viven en el estado de `BalanceScreen`. Al cambiar de mes se conservan; al salir de la pantalla se pierden.

### 4. Repartos de Análisis desde `buildAverageView`
`AverageView` agrega `byCategory` y `byMethod`: listas `{ id, amountCents }` de mayor a menor (desempate por nombre), sumando `monthlyCents` de cada `AverageItem` y `amountCents` de cada único. La categoría se resuelve con `resolveCategory`, así lo de categorías borradas cae en "Otro" y se agrega en una sola entrada. Por método se agrupa por `paymentMethodId`, sin importar la variante física/digital, e incluye archivados. Como suman exactamente los mismos centavos, ambos cuadran con `totalCents` sin ajustes de redondeo. Los porcentajes se redondean solo al mostrarlos.
La función `MethodBreakdownEntry` y la tarjeta `MethodBreakdownCard` se reutilizan con un texto de aclaración opcional.

### 5. Colores de la gráfica
Paleta categórica fija de 8 tonos tomados de los extremos de los duotonos (lima, cielo, lila, durazno, rosa, menta, ámbar, cobalto), definida en `src/ui/theme.ts` para claro y oscuro. A cada categoría se le asigna un color por su posición estable en la lista de categorías (las de inicio primero, luego las personalizadas por `createdAt`), y "Otro" siempre usa un gris neutro. Así una categoría conserva su color de un mes a otro.
*Alternativa:* asignar por posición en la gráfica (la mayor siempre lima). Se descarta porque el color cambiaría cuando cambia el orden, y el usuario dejaría de reconocer cada categoría por su color.
Con más de 8 categorías los colores se repiten; la leyenda con nombre sigue identificando cada una.

### 6. Dona con `react-native-svg`
Un `Circle` por categoría con `strokeDasharray`/`strokeDashoffset` y rotación de -90°, con un hueco de 3 px entre segmentos (si un segmento es más corto que el hueco, se dibuja de 1 px). El centro es un `View` superpuesto. El toque se maneja en la leyenda (`Pressable`) y también en los segmentos (`onPress` de `Circle`). La gráfica se oculta para el lector de pantalla y la leyenda lleva la información accesible (`"Hogar, $1,500.00, 59 %"`, con estado seleccionado).
*Alternativa:* una biblioteca de gráficas. Se descarta: no aporta nada para una sola dona y suma peso y código nativo.

### 7. Desplazar a una sección
`ScreenLayout` acepta un `scrollRef` opcional que pasa al `ScrollView`. En Análisis, las secciones "Por categoría" y "Por método" guardan su `y` con `onLayout`. Al tocar un atajo, `BalanceScreen` cambia a Análisis y guarda el destino; cuando llega el `onLayout` de esa sección, hace `scrollTo({ y: y - 12, animated: true })` y limpia el destino. Así funciona aunque la vista aún no esté montada al tocar.

### 8. Modales de Fijos, Prorrateados y Únicos
Un componente `AnalysisListSheet` dentro de un `Modal` `pageSheet` (como `PendingSheet`), con `SheetLayout` (`leftLabel="Cerrar"`). La tarjeta del total usa fondo `ink` y texto `bg` (se invierte en oscuro), sin el color de frecuencia, para no repetir el patrón de las filas. Las filas reutilizan `ExpenseRow` (`average` para Fijos y Prorrateados, `oneOff` para Únicos). Al tocar una fila se cierra el modal y, ya cerrado, se navega a la edición, para no apilar una ruta encima de un `Modal` nativo.

### 9. Aclaración del costo mensual
React Native no trae tooltips. El botón ⓘ despliega un bloque dentro de la tarjeta, debajo del título, con el texto y "Entendido". Cambia de altura en lugar de flotar, y así se evitan problemas de recorte y `zIndex` en Android.
*Alternativa:* un `Modal` transparente anclado al botón. Se descarta: medir la posición es más frágil y no aporta para un texto corto.

### 10. Estados en `ExpenseRow`
La variante `recurring` cambia `pending?: boolean` por `status` y agrega `expectedCents?`. `future`: opacidad 0.42 y píldora punteada "Por cobrar". `skipped`: fondo neutro de tarjeta en lugar del degradado, opacidad 0.42, nombre y monto tachados y "No se cobró". Se usa el fondo neutro en lugar de un filtro de saturación para no depender del soporte de `filter` en cada plataforma. Si `expectedCents` difiere del monto, se muestra "esperado $X" bajo el monto. El `accessibilityLabel` incluye el estado.

### 11. Encabezado
`MonthSwitcher` pierde `onMenu`. Un nuevo `BalanceTopBar` va arriba con dos botones discretos (sin fondo, ícono `muted`, 40 px de área táctil con `hitSlop`): `CardIcon` → `onOpenMethods` y un nuevo `GearIcon` (SVG) → `onOpenSettings`. `MenuIcon` se elimina si queda sin uso. `src/app/index.tsx` agrega `onOpenMethods={() => router.push('/payment-methods')}`.

### 12. `TotalCard`
Se separa en dos componentes, porque los dos formatos ya no se parecen: `MonthProgressCard` (efectuado, "de X proyectados", barra de tres tramos con leyenda y dos botones de atajo) y `AverageTotalCard` (título con ⓘ, monto y tres píldoras `Pressable` con "›").

## Risks / Trade-offs

- [Un confirmado con monto muy distinto puede hacer que lo efectuado supere lo esperado] → Es correcto: lo proyectado también usa el monto confirmado para ese cobro, así que la barra nunca pasa del 100 %.
- [Meses pasados con cobros nunca confirmados se quedan "por confirmar" y no cuentan en lo efectuado] → Es el comportamiento deseado (solo cuenta lo confirmado). La hoja de Pendientes ya los sigue pidiendo.
- [Gastos únicos con fecha futura cuentan como efectuados] → Se acepta: un único es un gasto ya decidido. Si se vuelve un problema, la regla vive en un solo lugar (Decisión 1).
- [Más trabajo en cada render por calcular estados] → Son decenas de cargos por mes; las confirmaciones se indexan en un `Map` por `expenseId|fecha` una vez por render.
- [Cambiar `MonthCharge` rompe las pruebas actuales de `BalanceScreen` y `balance.test.ts`] → Se actualizan en la misma tarea que el cambio de dominio. Los escenarios del spec dictan los nuevos valores esperados.

## Migration Plan

Sin migración de datos: solo cambia cómo se leen datos que ya existen. Sale en la siguiente beta según `flujo-ramas`. Para revertir, basta con revertir el commit.
