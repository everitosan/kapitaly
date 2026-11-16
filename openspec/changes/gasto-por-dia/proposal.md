# Proposal

## Why

Kapitaly busca que la gente sea más consciente de sus gastos y cambie hábitos, no solo que lleve un registro. Los fijos (renta, suscripciones) se pagan solos. Lo que sí cambia con los hábitos es el gasto que se decide cada día: antojos, súper, salidas, transporte. Hoy Análisis solo muestra el costo mensual estimado y no deja ver ese gasto del día a día.

## What Changes

- Nueva tarjeta **"Gasto del día a día"** al final de Análisis, después de "Por método", con el mismo formato sobrio que "Por categoría" para no competir con el total:
  - **Por omisión solo cuenta gastos únicos** (lo que se registra a mano).
  - **Switch "Incluir domiciliados"**, apagado por omisión y recordado en el teléfono. Encendido, suma también los cobros recurrentes del mes en su fecha: los cobrados con el monto confirmado y los por confirmar con el de la regla. Los no cobrados no cuentan, y los por cobrar se ven pero no suman.
  - **Cifras:** tres recuadros chicos: el total del mes, el promedio por día ("~$47 al día") sobre los días transcurridos según el switch, y los días sin registros.
  - **Hábito:** "N días sin registros", en tono neutral, contado siempre solo con únicos: un domiciliado no es un registro. Invita a registrar y no premia el olvido. No cuenta los días anteriores a que se empezó a usar la app.
  - **Gráfica de barras por día** (no una línea, porque los días son discretos). Las barras van en tinta y el día elegido con el degradado azul-violeta de la app. Los domiciliados se apilan encima en un tono neutro, con leyenda. Los días futuros van punteados, y el día elegido lleva un globo con su monto.
  - **Elegir un día:** tocar o deslizar el dedo sobre las barras (vibra en cada día), o usar las flechas ‹ › junto a la fecha. Para TalkBack, la gráfica es un solo elemento ajustable. Debajo aparece el total del día y la lista de lo que lo forma: los únicos, y los domiciliados con su marca.
- En el mes actual la tarjeta abre con hoy seleccionado. En un mes pasado muestra el mes completo sin selección. En un mes futuro no se muestra.

**Fuera de alcance:** comparar con el mes anterior (queda en espera en `comparar-gasto-mes-anterior`); metas o presupuestos diarios; editar desde la lista del día; y el candado premium (ver Impact).

## Capabilities

### New Capabilities
- `daily-spending`: el gasto por día del mes (únicos y, opcionalmente, domiciliados), sus cifras (total, promedio por día, días sin registros), la gráfica y la lista del día seleccionado.

### Modified Capabilities
<!-- Ninguna: la tarjeta es una sección nueva de Análisis y no cambia los requisitos existentes de `monthly-balance`. -->

## Impact

- **Dominio:** nuevo `src/domain/dailySpending.ts`, con funciones puras sobre los únicos, los cobros recurrentes con sus confirmaciones (mismo `chargeStatus` de "Tus gastos") y la fecha del primer registro.
- **Preferencias:** una clave más en `uiPreferences` para el switch (`daily.includeRecurring`). Sin migraciones.
- **UI:** nuevo componente de gráfica de barras con `react-native-svg` (sin librerías nuevas), la tarjeta en `src/ui/components/`, y `BalanceScreen.tsx` la agrega a Análisis con el día seleccionado.
- **Tema:** `src/ui/theme.ts` gana el tono neutro de los domiciliados, en claro y oscuro. El resto reutiliza colores que ya existen (tinta y `totals.thisMonth`).
- **Diseño:** maqueta `design/propose/gasto-por-dia.html` (A-1 Duotono, claro y oscuro), basada en `design/ejemplo grafica.png`. Se probaron un verde nuevo y bloques de color (lima y menta), y se descartaron porque competían con el total y rompían el estilo.
- **Premium:** esta función será de pago según la estrategia de monetización. El candado se agrega cuando se implemente `compra-unica-kapitaly-completo` (usando `usePremium()`), no en este cambio.
- **Datos y nativo:** sin cambios; solo JS.
