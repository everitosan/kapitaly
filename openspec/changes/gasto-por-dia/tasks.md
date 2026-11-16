# Tasks

## 1. Maqueta

- [x] 1.1 Crear `design/propose/gasto-por-dia.html` (A-1 Duotono, claro y oscuro), basada en `design/ejemplo grafica.png`, con la versión sobria: tarjeta blanca al final de Análisis, tres recuadros de cifras, barras en tinta con el día elegido en azul-violeta, deslizar con vibración, flechas ‹ ›, el switch "Incluir domiciliados" (apilado neutro con leyenda, por cobrar punteado y marcas en la lista) y días futuros punteados. Verificación: el usuario aprueba la maqueta y la posición.

## 2. Dominio y preferencias

- [x] 2.1 Crear `src/domain/dailySpending.ts` con `buildDailySpending` según design.md §1, exportando `oneOffCharges` de `balance.ts` y reutilizando `buildThisMonthView` para los domiciliados. Agregar `formatMXNWhole` en `src/domain/money.ts`. Verificación: `src/domain/__tests__/dailySpending.test.ts` cubre:
  - **Switch apagado:** recurrentes fuera; dos únicos el mismo día ($420.00); total y promedio del mes actual ($995.00 → $47); mes pasado ($3,100.00 → $100); inicio a mitad de mes ($500.00 → $50).
  - **Switch encendido:** Netflix confirmado con $239.00 más Cine el 15 ($419.00); Renta por confirmar con el monto de la regla; Gym no cobrado fuera; Internet por cobrar en `upcomingCents` sin sumar; promedio ($2,734.00 → $130); y los únicos antes que los domiciliados.
  - **Días sin registros:** 15 con el switch apagado o encendido; hoy no cuenta; 1 desde el primer uso; 0.
  - **Otros:** `state: 'future'`; `maxCents` incluyendo lo por cobrar; únicos borrados fuera; y `formatMXNWhole` ("$995", "$2,734").

  `npm test` pasa.
- [x] 2.2 Agregar `DAILY_INCLUDE_RECURRING_KEY` y `parseIncludeRecurring` a `src/domain/uiPreferences.ts`, y el hook `useDailyIncludeRecurring` en `src/features/balance/` siguiendo `useBalanceSort` (design.md §2). Verificación: pruebas del parseo (`'1'`, `'0'`, ausente, inválido) y del hook (arranca en falso, `toggle` guarda `'1'`, una segunda montura lee el valor guardado).

## 3. Tema y formato

- [x] 3.1 Agregar `chart.recurring` a los temas claro y oscuro en `src/ui/theme.ts` (design.md §3), y `formatWeekdayDate` y `formatDayMonth` en `src/ui/format.ts`. Verificación: pruebas de "Sábado 7 nov", "Jueves 12 nov" (incluido un cambio de año) y "7 de noviembre", y `npm run typecheck` pasa.

## 4. Componentes

- [x] 4.1 Crear `DailyBars` y `DailySpendingCard` en `src/ui/components/dailySpending.tsx` según design.md §3 y §4. Verificación: pruebas en `src/ui/components/__tests__/components.test.tsx`, en claro y oscuro:
  - **Gráfica:** un solo elemento ajustable con la etiqueta del día elegido ("7 de noviembre, $420.00", "12 de noviembre, sin registros", "15 de noviembre, $419.00, $239.00 domiciliado"); las acciones `increment`/`decrement` llaman `onSelectDay` con el día siguiente o el anterior; un toque y un deslizamiento simulados (`responderGrant`/`responderMove` con `locationX`) eligen el día bajo el dedo y vibran solo al cambiar de día.
  - **Lista del día:** muestra "Sábado 7 nov", "$420.00", "Súper" y "Uber"; un día sin gastos muestra "Sin registros este día"; con domiciliados, "Netflix" va después de "Cine" con "DOMICILIADO", y un por cobrar con "POR COBRAR"; las flechas "Día anterior"/"Día siguiente" llaman `onSelectDay` y se deshabilitan en el día 1 y el último.
  - **Switch, cifras y leyenda:** el switch anuncia su estado y llama `onToggleRecurring`; la leyenda solo aparece encendido; los recuadros muestran "$995", "~$47" y "15"; "1 día sin registros" en singular y "Registraste todos los días"; el mes sin gastos muestra "$0" sin gráfica.

## 5. Integración en Análisis

- [x] 5.1 En `BalanceScreen.tsx`, calcular `firstUseDate` y `buildDailySpending` con el switch de `useDailyIncludeRecurring`, guardar `selectedDay` y montar la tarjeta (`section-daily`) después de "Por método", salvo en meses futuros (design.md §5). Verificación: pruebas en `BalanceScreen.test.tsx`:
  - Con hoy 21/11/2026, la tarjeta es la última sección, con el 21 elegido; la flecha anterior elige el 20.
  - Retroceder a octubre la muestra sin día elegido; avanzar a diciembre no la muestra.
  - Con el switch apagado, la Renta del 20 no suma; al encenderlo suma, se anuncia como domiciliado, queda guardado en `uiPreferences` y se conserva al volver a montar la pantalla.

  Las pruebas existentes de Análisis siguen pasando.

## 6. Verificación integral

- [x] 6.1 Correr `npm run lint`, `npm run typecheck`, `npm test` y `npx prettier --check` sobre los archivos cambiados. Verificación: todo pasa.
- [ ] 6.2 Probar en el teléfono o emulador, en claro y oscuro: la tarjeta al final de Análisis con datos reales; deslizar el dedo por las barras (vibra en cada día y no mueve la pantalla); flechas; un día sin registros y uno futuro; encender y apagar "Incluir domiciliados" y cerrar la app para ver que se recuerda; cambiar de mes; y TalkBack ajustando el día en la gráfica. Verificación: las cifras coinciden con lo registrado y elegir días es preciso a lo ancho del teléfono.

## Workflow follow-up

- Hacer commit de la propuesta con la maqueta ("docs: propuesta y maqueta del gasto por día") antes de la implementación, siguiendo el skill `flujo-ramas`.
- Si sale en una beta, agregar sus notas en `release-notes/<versionName>/whatsnew-en-US`.
- Al implementar `compra-unica-kapitaly-completo`, poner la tarjeta detrás del candado con `usePremium()` y agregar "Gasto del día a día" a la lista de lo que incluye Kapitaly completo.
- Considerar un acceso "Gasto del día a día ›" desde "Tus gastos", como los de "Por categoría" y "Por método".
- La comparación con el mes anterior sigue en espera en `comparar-gasto-mes-anterior`.
