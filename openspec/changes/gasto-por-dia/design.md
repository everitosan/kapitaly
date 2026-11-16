# Design

## Context

- Análisis (`BalanceScreen.tsx`, rama `view !== 'this'`) pinta en orden `AverageTotalCard`, la tarjeta "Por categoría" (`section-category`, una `View` con `styles.card`) y "Por método" (`section-method`, `MethodBreakdownCard`). Su cálculo sale de `buildAverageView`.
- `buildThisMonthView` (`src/domain/balance.ts`) ya da los cargos del mes con `status` (`charged | pending | future | skipped`), y en los cobrados usa el monto confirmado. `oneOffCharges` filtra los únicos vigentes del mes.
- `registeredOnLocal` (`src/features/pending/usePending`) convierte un `createdAt` a fecha local.
- Las preferencias de interfaz se guardan en `uiPreferences` (clave-valor), con el patrón de `useBalanceSort`.
- Las gráficas se dibujan a mano con `react-native-svg`, como `CategoryDonut`. `expo-haptics` ya está instalado (lo usa `ExpenseForm`).
- `src/ui/format.ts` tiene `formatLongDate` ("7 de noviembre de 2026"), pero no un formato sin año ni el día de la semana.

## Goals / Non-Goals

**Goals:**
- Un cálculo puro y probado del gasto por día, que no pueda contradecir a "Tus gastos".
- Una gráfica ligera, sin dependencias nuevas, que se pueda usar con precisión aunque tenga 31 barras angostas.
- Que visualmente sea una sección más de Análisis y no compita con el total.

**Non-Goals:**
- Un componente genérico de gráficas.
- Animaciones de las barras.

## Decisions

### 1. Dominio: `buildDailySpending` en `src/domain/dailySpending.ts`
`buildDailySpending({ oneOffs, recurring, confirmations, includeRecurring, year, month, today, registeredOn, firstUseDate })` devuelve:
- `days: { date, oneOffCents, recurringCents, upcomingCents, items }[]`: un día por cada día del mes.
  - `items`: los únicos, ordenados por `registeredAt`, y después los domiciliados, con `kind: 'oneOff' | 'recurring'` y, en los domiciliados, `upcoming`.
  - Con `includeRecurring` apagado, los campos de domiciliados quedan en 0 y sin items.
- `totalCents`, `averageCents` (redondeado a pesos, en centavos múltiplos de 100) y `daysWithoutRecords`.
- `maxCents`: el máximo por día de `oneOffCents + recurringCents + upcomingCents`, para que la escala no salte cuando un cobro pasa de por cobrar a cobrado. También `state: 'current' | 'past' | 'future'`.

Reglas:
- **Únicos:** se reutiliza `oneOffCharges`, que pasa a exportarse.
- **Domiciliados:** se toman los cargos `kind: 'recurring'` de `buildThisMonthView`, con la regla `charged | pending` → `recurringCents`, `future` → `upcomingCents` y `skipped` → fuera. Así "Tus gastos" y esta tarjeta no pueden contradecirse.
- **Inicio efectivo:** `max(primer día del mes, firstUseDate)`.
- **Días transcurridos:** del inicio efectivo a `min(hoy, último día)`, inclusive. Si da 0, el promedio es 0.
- **Días sin registros:** del inicio efectivo a `min(ayer, último día)`, sin únicos. Nunca dependen de `includeRecurring`.
- **`firstUseDate`:** el día local del `createdAt` más antiguo entre todos los recurrentes y únicos, incluidos los borrados, porque también indican uso. Si no hay ninguno, `null`, y se cuenta desde el inicio del mes.

**Alternativa descartada:** usar la fecha de instalación. No está disponible sin un módulo nativo, y los gastos ya registrados son una mejor señal de uso real.

### 2. Switch recordado
`DAILY_INCLUDE_RECURRING_KEY = 'daily.includeRecurring'` va en `src/domain/uiPreferences.ts`, con `parseIncludeRecurring` (`'1'` → verdadero; cualquier otro valor o ausente → falso). El hook `useDailyIncludeRecurring` (`src/features/balance/`) sigue a `useBalanceSort`: tiene `loaded` para no dibujar primero una versión y luego la otra, y `toggle()` guarda el nuevo valor.

### 3. Estilo: una sección más, con los colores que ya existen
Se probaron en la maqueta un verde nuevo y bloques lima y menta. Se descartaron porque competían con el total y rompían el estilo. Queda así:
- **Tarjeta:** `colors.card` con `radii.row`, como `section-category`. El encabezado va en versalitas `colors.muted`: "GASTO DEL DÍA A DÍA" con el mes a la derecha.
- **Cifras:** tres recuadros iguales con fondo `colors.bg` ("$995 / en el mes", "~$47 / al día", "15 / días sin registros"), números de 18 px. El total va sin centavos, con un nuevo `formatMXNWhole` en `src/domain/money.ts`.
- **Barras:** sólidas en `colors.ink`. Las no elegidas van al 85% de opacidad. La elegida lleva el degradado `totals.thisMonth` (azul-violeta, el de "Cargos de noviembre").
- **Domiciliados:** el nuevo `theme.chart.recurring` (`#CBC4B6` en claro, `#57534B` en oscuro), apilados encima de los únicos con un hueco de 2 px. Se distinguen de la tinta por luminosidad, además de por la leyenda, el globo y la lista.
- **Switch y globo:** el switch va en una píldora con fondo `colors.bg`, y su color encendido es el de los `Switch` de la app. El globo usa `colors.ink` con texto `colors.bg`.

### 4. Componentes en `src/ui/components/dailySpending.tsx`
- **`DailyBars({ days, maxCents, selected, today, includeRecurring, onSelect })`:**
  - **Lienzo:** un `Svg` del ancho disponible (`onLayout`), con una columna por día y barras de ancho `min(24, ancho/díasDelMes − 2)`. La esquina superior de la barra completa es redondeada (4 px) y la base es recta.
  - **Por cobrar:** un contorno punteado de su altura.
  - **Días futuros vacíos:** un trazo punteado corto.
  - **Eje y marcas:** etiquetas 1, 5, 10, 15, 20, 25 y el último día, y "HOY" sobre hoy en el mes actual. El globo va sobre la barra elegida.
- **Elegir el día (deslizar):** una `View` transparente sobre el `Svg` con `onStartShouldSetResponder` y `onResponderGrant`/`onResponderMove`. El día se calcula como `floor(x / ancho * díasDelMes) + 1`, limitado al mes, y solo llama `onSelect` cuando el día cambia, con `Haptics.selectionAsync()`. Se usa el sistema de respuesta de React Native y no una librería de gestos, porque basta y evita configurar `react-native-gesture-handler`. `onResponderTerminationRequest` devuelve `false` para que el scroll vertical no le robe el gesto a mitad de un deslizamiento.
- **Accesibilidad:** esa `View` es un solo elemento con `accessible`, `accessibilityRole="adjustable"`, `accessibilityLabel` del día elegido ("7 de noviembre, $420.00", "…, sin registros" o "15 de noviembre, $419.00, $239.00 domiciliado"), y `accessibilityActions` `increment`/`decrement` que mueven un día. Sin día elegido anuncia "Gasto por día, elige un día".
- **`DailySpendingCard`:** el encabezado, la nota según el switch, los tres recuadros, la píldora "Incluir domiciliados" (`Switch` con `accessibilityLabel`), la leyenda (solo encendido), `DailyBars`, la pista "Toca o desliza el dedo sobre las barras" y, si hay día elegido, la lista del día:
  - **Fila de la fecha:** `‹` (`accessibilityLabel="Día anterior"`), la fecha con día de la semana, el total del día y `›` ("Día siguiente"). Las flechas se deshabilitan en los extremos.
  - **Filas:** concepto y monto. Los domiciliados llevan la marca "DOMICILIADO" o "POR COBRAR", con el estilo de marca de `BreakdownDetail`.
  - **Mes vacío:** "$0" y el texto "Aún no hay gastos únicos este mes. Registra tus gastos del día para ver tus hábitos.", sin barras.
- **Formatos nuevos en `src/ui/format.ts`:** `formatWeekdayDate(date)` ("Sábado 7 nov"), con el día de la semana calculado desde la fecha civil sin zona horaria, y `formatDayMonth(date)` ("7 de noviembre").

### 5. Integración en `BalanceScreen`
- **Día elegido:** el estado es `selectedDay: CivilDate | null`. Al cambiar de mes se reinicia a `today` si el mes es el actual, o a `null` si es pasado, con el mismo ajuste durante el render que `selectedCategory`.
- **Montaje:** la tarjeta va después de `section-method`, con `testID="section-daily"`. Se monta solo si `state !== 'future'` y cuando el switch ya cargó.
- **Datos:** las confirmaciones ya están cargadas con `useChargeConfirmations`.

## Risks / Trade-offs

- **[Un gasto grande, como una laptop, o la renta con domiciliados encendidos, aplana las demás barras]** → Se acepta. Con el switch apagado, que es lo que viene por omisión, la renta no aparece, y el globo y la lista dan el detalle. Si molesta en uso real, se puede limitar la escala al percentil 90.
- **[El deslizamiento puede chocar con el scroll vertical de la pantalla]** → Se toma el gesto al primer toque dentro de la gráfica y no se suelta hasta levantar el dedo. Afuera de la gráfica el scroll funciona igual. Se verifica en el teléfono (6.2).
- **["Días sin registros" puede desanimar al inicio del uso]** → Se cuenta solo desde el primer registro, y con cero se muestra en positivo.
- **[Al final de Análisis se descubre menos]** → Se acepta, por la coherencia de la vista. Más adelante se puede agregar un acceso desde "Tus gastos", como los de "Por categoría" y "Por método".
- **[Sin candado premium al salir]** → Se acepta. `compra-unica-kapitaly-completo` lo agrega con `usePremium()`.
