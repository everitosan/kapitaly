# Tasks

## 1. Base del proyecto

- [x] 1.1 Inicializar el repositorio git y crear el proyecto Expo (plantilla TypeScript con expo-router) en la raíz de `kapitaly` con nombre visible "Kapitaly Expenses", conservando `openspec/`, `design/` y `.claude/`; verificar que `npx expo start` abre la app de ejemplo en un dispositivo o emulador
- [x] 1.2 Activar TypeScript estricto, configurar ESLint/Prettier y crear las carpetas `src/domain`, `src/data`, `src/features` y `src/ui`; verificar que `npx tsc --noEmit` y `npm run lint` pasan sin errores
- [x] 1.3 Configurar Jest con el preset `jest-expo` y React Native Testing Library; verificar que `npm test` ejecuta una prueba de ejemplo en verde
- [x] 1.4 Agregar una regla de lint (p. ej. `no-restricted-imports`) que impida a `src/domain` importar React, Expo, `src/data` o `src/ui`; verificar que un import prohibido de prueba hace fallar el lint

## 2. Dominio: fechas, dinero y entidades

- [x] 2.1 Implementar las utilidades de fecha civil `YYYY-MM-DD` en `src/domain/date.ts` (parsear, formatear, hoy en zona local como parámetro, días del mes, comparar, suma de meses con ajuste al último día); verificar con pruebas de 31→30, febrero y bisiestos
- [x] 2.2 Implementar `src/domain/money.ts` (parseo de texto a centavos sin `float`, rechazo de más de dos decimales, división con redondeo a la mitad hacia arriba, formato `es-MX`/MXN con fallback); verificar con pruebas que incluyen `1,500.50`, `0.1+0.2+0.3 = 0.60`, `10.555` y entradas inválidas
- [x] 2.3 Definir `PaymentMethod` (tipos crédito/débito/efectivo/transferencia, `institutionId` opcional, `color` como clave de paleta o nulo, `archivedAt`), la constante del método inicial "Efectivo" con su UUID fijo, `validatePaymentMethodInput` (nombre, últimos 4 dígitos) y las reglas puras `canRemove`/`canArchive` (en uso, último activo) y `suggestPaymentMethod` (último usado activo, si no "Efectivo" o el primer activo); verificar con pruebas de todos los escenarios del spec `payment-methods`
- [x] 2.4 Definir `RecurringExpense` con `paymentMethodId`, la normalización de frecuencia a meses y el mapeo de presets (Mensual, Bimestral, Trimestral, Semestral, Anual, cada N meses; 12 meses se muestra como Anual), y `validateRecurringExpenseInput` con errores por campo (incluido el método activo obligatorio); verificar con pruebas de los escenarios de validación y frecuencias del spec `recurring-expenses`
- [x] 2.5 Definir `OneOffExpense` (descripción libre, monto, fecha, `paymentMethodId`) y `validateOneOffExpenseInput`; verificar con pruebas de los escenarios de validación del spec `one-off-expenses`
- [ ] 2.6 Crear el catálogo `src/data/institutions/catalog.ts` (tipo `Institution`, versión, las 15 instituciones de la decisión 10 con `uses`, `baseColor` y `monogram`), junto con `institutionsFor('pay')`, `resolveInstitution` (incluidas las retiradas), `effectiveColor(method, catalog)` y `duotoneFromBase(hex)` con elección de texto por contraste; **confirmar con el usuario** los usos marcados "?" y los colores de marca, y verificar con pruebas que Cetesdirecto no está en `institutionsFor('pay')`, que una institución retirada se resuelve y que cada duotono derivado cumple AA en ambos extremos

## 3. Dominio: cálculo del balance

- [x] 3.1 Implementar `occurrencesInMonth` y `nextOccurrenceOnOrAfter` según el algoritmo del design (distancia en meses, día desde el ancla original, filtro por ancla y fin); verificar con pruebas de los escenarios de fechas de cobro y ajuste a meses cortos del spec `monthly-balance`
- [x] 3.2 Implementar `buildThisMonthView(recurring, oneOffs, methods, year, month)` (lista unificada ordenada por fecha y nombre, marca de único, conteo, total, subtotales por tipo, exclusión de eliminados); verificar con las pruebas de los escenarios "Total y conteo del mes", "Mes sin cargos" y el cambio de mes de un gasto único
- [x] 3.3 Agregar a la vista Este mes el desglose por método (monto mayor a 0, de mayor a menor, incluidos archivados, suma igual al total); verificar con las pruebas de los escenarios de "Desglose por método de pago"
- [x] 3.4 Implementar `buildAverageView(recurring, oneOffs, year, month, today)` (vigencia, proporcional redondeado, únicos del mes a monto real, subtotales de fijos, prorrateados y únicos, pista con fecha de referencia = la posterior entre hoy y el primer día del mes, "sin cobros próximos"); verificar con las pruebas de todos los escenarios de "Vista Promedio" y "Pista del cobro real"

## 4. Capa de datos

- [x] 4.1 Instalar expo-sqlite, drizzle-orm, drizzle-kit y expo-crypto; hacer la prueba de concepto de compartir el esquema y los repositorios Drizzle entre expo-sqlite (app) y better-sqlite3 (Jest); registrar el resultado en `design.md` (riesgo 1) y verificar que una consulta simple funciona en ambos entornos
- [x] 4.2 Definir en Drizzle las tablas `payment_methods` (con `institution_id` y `color` anulables), `recurring_expenses` y `one_off_expenses`, generar la migración inicial con drizzle-kit (incluido el `INSERT OR IGNORE` de "Efectivo" con su UUID fijo) y aplicarla al arrancar con `useMigrations` (con pantalla de error si falla); verificar que la app arranca, crea las tablas y que reabrirla no duplica "Efectivo"
- [x] 4.3 Definir la interfaz genérica `Repository<T, Input>`, `PaymentMethodRepository` (con `archive`/`unarchive` y los errores `PaymentMethodInUseError` y `LastActiveMethodError`) y una suite `describeRepositoryContract` por repositorio (UUID y metadatos, edición que respeta `id`/`created_at` y avanza `updated_at`, borrado lógico, exclusión de eliminados, notificación a suscriptores, y en métodos: archivado, bloqueo en uso, último activo y método inicial); verificar que las suites compilan
- [x] 4.4 Implementar las tres versiones en memoria (`InMemory…Repository`); verificar que pasan sus suites de contrato
- [x] 4.5 Implementar las tres versiones SQLite (`Sqlite…Repository`) con Drizzle, aplicando las reglas de dominio de 2.3; verificar que pasan sus suites de contrato en el entorno decidido en 4.1
- [x] 4.6 Crear `RepositoryProvider` y los hooks reactivos `usePaymentMethods`, `useRecurringExpenses` y `useOneOffExpenses` (vía `subscribe`); verificar con una prueba que se actualizan tras `create`, `update`, `remove` y `archive`

## 5. Sistema de diseño

- [x] 5.1 Extender la maqueta `design/propose/a-1-duotono.html` con las piezas de la decisión 11 (tarjeta "Por método", fila de gasto único, píldora de método con monograma, selector Único/Recurrente, "+ Nuevo", formulario de gasto único, lista y formulario de métodos con institución y color) en ambos temas; verificar con la aprobación del usuario antes de implementar esas piezas
- [x] 5.2 Crear `src/ui/theme.ts` con los tokens A-1 Duotono de `design.md` (decisión 9): espaciado, radios, tipografía, neutros de los temas claro y oscuro, `onBlock`, los degradados como tuplas `[desde, hasta]` con asignación por meses del intervalo, y la paleta de colores de métodos de pago por clave; verificar con una prueba que el texto cumple contraste AA (≥ 4.5:1) contra **ambos** extremos de cada degradado y contra cada color de método en los dos temas
- [x] 5.3 Crear `ThemeProvider` y el hook `useTheme` con `useColorScheme`, poner `userInterfaceStyle: "automatic"` en `app.json` y la barra de estado en modo `auto`; verificar con una prueba que al simular el esquema oscuro el hook devuelve los tokens oscuros y que el cambio no desmonta la pantalla (escenarios del spec `app-theme`)
- [ ] 5.4 Instalar `expo-linear-gradient` e implementar `DuotoneBlock` (135°, brillo superior de 1 px); verificar con una prueba de render que recibe los colores del token y con revisión visual en el dispositivo
- [x] 5.5 Implementar `TotalCard`, `SegmentedControl`, `MonthSwitcher`, `MoneyText` (centavos en tamaño menor), `ExpenseRow` (recurrente Este mes, recurrente Promedio con pista y único neutro, todas con píldora de método), `MethodBreakdownCard`, los botones (`PrimaryButton` con el "+" en duotono e invertido en oscuro, `SecondaryButton`, `DangerButton`), `FrequencyChips` (con *stepper* para "Cada N meses"), `PaymentMethodPicker` (con la opción "+ Nuevo"), `InstitutionBadge` (monograma sobre color base, con soporte de logo), `InstitutionPicker` (con búsqueda), `TextField` (con estado de error), `DateField` y `Switch`, usando solo tokens; verificar con pruebas de render en ambos temas
- [ ] 5.6 Crear una pantalla de muestra de desarrollo con todos los componentes; verificar en el dispositivo, en claro y en oscuro, que coincide con el catálogo de la maqueta aprobada

## 6. Métodos de pago

- [x] 6.1 Crear la pantalla `payment-methods/index.tsx` (lista de activos como tarjetas con color efectivo, `InstitutionBadge`, tipo, ••últimos 4 y número de gastos que lo usan; sección "Archivados" plegada) accesible desde el botón de tarjeta del encabezado del balance; verificar con pruebas RNTL de que en la primera apertura muestra "Efectivo" y del escenario "Conteo de uso"
- [x] 6.2 Crear el formulario de método `payment-methods/[id].tsx` (alta con "new" y edición: vista previa, tipo, `InstitutionPicker` filtrado por uso `pay` y oculto para efectivo, nombre propuesto desde la institución, últimos 4 y color con "Color de la institución" o la paleta) con validaciones junto a cada campo; verificar con pruebas RNTL de los escenarios de alta con y sin institución, nombre propuesto, color por defecto, sustituir y restablecer color, dígitos inválidos y que renombrar actualiza los gastos que lo usan
- [x] 6.3 Agregar las acciones Archivar/Reactivar y Eliminar con confirmación, aplicando `canRemove`/`canArchive` (ofrecer archivar si está en uso; bloquear el último activo con su mensaje); verificar con pruebas RNTL de todos los escenarios de "Archivar o eliminar un método de pago"

## 7. Alta, edición y borrado de gastos

- [x] 7.1 Crear el modal `expense/new.tsx` con el `SegmentedControl` Único | Recurrente (inicial Único) y el `PaymentMethodPicker` preseleccionado con `suggestPaymentMethod`, cuya opción "+ Nuevo" abre el formulario de método como segunda hoja; verificar con pruebas RNTL que cambiar a Recurrente muestra frecuencia, fecha de cobro y fecha de fin, del escenario de preselección del último método y del escenario "Nuevo método al registrar un gasto"
- [x] 7.2 Implementar el formulario de gasto único (bloque de monto neutro, descripción, fecha con hoy por defecto y método) y `expense/one-off/[id].tsx` para editarlo; verificar con pruebas RNTL de la alta rápida, la fecha pasada y los errores de validación junto a cada campo
- [x] 7.3 Implementar el formulario de gasto recurrente (bloque de monto con el duotono de la frecuencia y el texto "Se cobra cada mes" o "$X al mes en promedio", nombre, `FrequencyChips`, fecha de cobro con selector nativo, fecha de fin opcional y método) y `expense/recurring/[id].tsx` para editarlo; verificar con pruebas RNTL que los errores de validación aparecen junto a cada campo
- [x] 7.4 Conectar guardar (alta y edición de ambos tipos) a los repositorios con háptica ligera y cierre del modal; verificar con pruebas RNTL que el gasto creado o editado aparece en el balance del mes correcto
- [x] 7.5 Agregar la acción de eliminar (ambos tipos) con diálogo de confirmación; verificar con pruebas que confirmar lo quita de todas las vistas y que cancelar no cambia nada

## 8. Pantalla de balance

- [x] 8.1 Construir la pantalla principal con `MonthSwitcher` (abre en el mes actual, ‹ ›), el botón de métodos de pago, el `SegmentedControl` Este mes / Promedio (inicial Este mes, se conserva al cambiar de mes) y el botón flotante "Agregar gasto"; verificar con pruebas RNTL de los escenarios de navegación y alternancia
- [x] 8.2 Implementar la vista Este mes (`TotalCard` en duotono cobalto → violeta con número de cargos y subtotales de recurrentes y únicos, `MethodBreakdownCard`, lista unificada con fecha, nombre, monto, método y marca de único, estado vacío) usando `buildThisMonthView`; verificar con pruebas RNTL de los escenarios de noviembre 2026 y del desglose
- [x] 8.3 Implementar la vista Promedio (proporcional por recurrente con pista "monto · próximo cobro" o "sin cobros próximos" en los no mensuales, grupo "Únicos del mes", total con píldoras Fijos, Prorrateados y Únicos) usando `buildAverageView`; verificar con pruebas RNTL de los escenarios de proporcionales, pistas y únicos
- [x] 8.4 Permitir tocar un gasto en cualquiera de las vistas para abrir su edición según su tipo; verificar con una prueba RNTL que abre el formulario correcto con los datos del gasto

## 9. Tarjetas de crédito y confirmaciones: dominio y datos

- [x] 9.1 Extender `PaymentMethod` y `validatePaymentMethodInput` con saldo inicial (texto → centavos, ≥ 0, por defecto 0), fecha del saldo inicial, límite (opcional, > 0) y día de pago (opcional, 1–31), descartándolos en tipos que no son crédito; verificar con pruebas de los escenarios "Datos de una tarjeta de crédito"
- [x] 9.2 Implementar en `src/domain/creditCard.ts` `usedCents`, `lastDueOnOrBefore`, `nextDueOnOrAfter`, `pendingCardPayment` y `dueDateForNewPayment` (decisión 13); verificar con pruebas de los escenarios de usado, saldo a favor, próximo pago (incluido el día 31), pago total o parcial y aviso
- [x] 9.3 Implementar en `src/domain/confirmations.ts` `pendingConfirmations` (cobros ≤ hoy, ≥ máx(ancla, día local de registro), sin confirmación) y la validación de confirmar ("charged" con monto > 0, o "skipped"); verificar con pruebas de los escenarios de "Cobros por confirmar" y "Confirmar o descartar un cobro"
- [x] 9.4 Agregar la migración `0002` (columnas de tarjeta y tablas `card_payments` y `recurring_charge_confirmations`) con drizzle-kit, sin modificar las anteriores; verificar con una prueba que una base migrada en `0001` sube a `0002` conservando sus datos
- [x] 9.5 Agregar `CardPaymentRepository` y `ChargeConfirmationRepository` (en memoria y SQLite, con *upsert* por gasto y fecha) a `Repositories`, con sus suites de contrato y los hooks `useCardPayments` y `useChargeConfirmations`; verificar que ambas implementaciones pasan los contratos

- [x] 9.6 Agregar la tarjeta digital al dominio (`hasDigital` y `digitalLast4` en `PaymentMethod` para crédito y débito, `cardVariant` en ambos gastos con su normalización, `suggestCardVariant` y `methodLabel` con variante); verificar con pruebas de los escenarios "Tarjeta digital" y "Elegir tarjeta física o digital en un gasto", y de que el usado y el desglose suman ambas variantes
- [x] 9.7 Agregar la migración `0003` (columnas `has_digital`, `digital_last4` y `card_variant`) y su mapeo en los repositorios en memoria y SQLite; verificar con los contratos y con una prueba de actualización desde `0002` en la que los gastos existentes quedan con variante NULL

## 10. Tarjetas de crédito y confirmaciones: interfaz

- [x] 10.1 Extender la maqueta `design/propose/a-1-duotono.html` con: tarjeta de crédito con usado, límite y disponible ocultos y próximo pago; campos de tarjeta en el formulario de método; hoja "Pagar tarjeta" e historial de pagos; hoja "Pendientes" (cobro por confirmar y pago vencido); píldora "Por confirmar"; y tarjeta digital (campo en el método, selector Física | Digital en el gasto y variante en las filas); verificar con la aprobación del usuario antes de implementar esas piezas
- [x] 10.2 Agregar al formulario de método los campos de tarjeta (solo para crédito) y a `MethodCard` el usado o saldo a favor, el límite y el disponible ocultos que se revelan al tocar, y el próximo pago; verificar con pruebas RNTL de los escenarios de "Privacidad del límite" y "Próximo pago", y de que otros tipos no muestran estos campos
- [x] 10.3 Implementar "Pagar tarjeta" (monto propuesto = usado, fecha de hoy) y el historial de pagos con eliminar y confirmación; verificar con pruebas RNTL de pago total, parcial, eliminar un pago y de que los pagos no cambian "Este mes" ni "Promedio"
- [x] 10.4 Implementar la hoja "Pendientes" al abrir el balance (cobros por confirmar con "Sí, se cobró" y monto editable, "Aún no" y "No se cobró este mes"; pagos vencidos con "Sí, pagué" y monto editable o "Aún no") y el aviso "N pendientes" para reabrirla; verificar con pruebas RNTL de todos los escenarios de aviso, confirmación y "Aún no"
- [x] 10.5 Mostrar la píldora "Por confirmar" en las filas de "Este mes"; verificar con pruebas RNTL de los escenarios "Marca de cobros por confirmar"

- [x] 10.6 Agregar el interruptor "Tiene tarjeta digital" con sus dígitos al formulario de método (solo crédito y débito), el selector Física | Digital al formulario de gasto (solo si el método tiene digital, con la última variante preseleccionada) y la variante en la píldora de las filas; verificar con pruebas RNTL de los escenarios de tarjeta digital

## 11. Verificación integral en dispositivo

- [x] 11.1 En el dispositivo con Expo Go: crear, editar, archivar y eliminar métodos; registrar una tarjeta de crédito con saldo, pagarla y confirmar un cobro recurrente; registrar, editar y eliminar gastos únicos y recurrentes; navegar meses sin errores; cerrar la app por completo, reabrirla y comprobar que los datos persisten. (El funcionamiento sin conexión se cumple por diseño: el código no hace llamadas de red; la prueba en modo avión requiere un build instalable y queda como seguimiento.)
- [ ] 11.2 Revisión visual en ambas plataformas y en los temas claro y oscuro (incluido el cambio de tema con la app abierta) contra la maqueta aprobada (duotonos legibles, bordes redondeados, espacios amplios); ajustar los tokens si hace falta y documentar en el README cómo correr la app y las pruebas, verificando que los comandos documentados funcionan tal cual

## Workflow follow-up

- Archivar el cambio (`/opsx:archive`) cuando la v1 esté revisada y en uso.
- Con el primer build instalable (`v0.1.0-beta.1`), probar la app en modo avión: cerrarla, reabrirla sin red y operar normalmente.
- Siguientes cambios sugeridos: v2 de kapitaly-expenses con PocketBase, login, sync del teléfono y web; después, kapitaly-income (con frecuencias quincenal y semanal) y kapitaly-balances.
