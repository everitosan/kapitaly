# Design

## Context

Proyecto nuevo, sin código previo. Ver `proposal.md` (Why) para la motivación y `specs/` para el comportamiento requerido. Restricciones que moldean el diseño:

- La v1 vive solo en el teléfono y debe funcionar sin red; no hay backend.
- La v2 agregará PocketBase autohospedado (costo de operación bajo, sin servicios cobrados por uso), un motor de sincronización push/pull para el teléfono y una versión web que hablará directo con PocketBase. A futuro, posible migración a Postgres en infraestructura propia.
- Un solo usuario, varios dispositivos (en v2): los conflictos serán raros.
- Esta app es **kapitaly-expenses**, la primera de la suite Kapitaly. Después vendrán kapitaly-income y kapitaly-balances. Los métodos de pago nacen aquí, pero otras apps de la suite los leerán, y quizá también los editen, a través del backend de v2.

## Goals / Non-Goals

**Goals:**
- Arquitectura local-first donde la base SQLite del dispositivo es la fuente principal de datos.
- Dominio (fechas de cobro, balances) como TypeScript puro, sin dependencias de UI ni de almacenamiento, cubierto por pruebas unitarias.
- Acceso a datos detrás de una interfaz de repositorio, para que la v2 agregue implementaciones (PocketBase en web) sin tocar dominio ni UI.
- Esquema con las convenciones que el sync de v2 necesitará, para no migrar datos después.
- Sistema de diseño propio (tokens + componentes base) con estética iOS y color blocking.

**Non-Goals:**
- Motor de sync, `RemoteAdapter`, autenticación o cualquier código de red (v2).
- Build para web: se puede ejecutar en web para desarrollo, pero no se diseña ni prueba para ello.
- Selector de tema dentro de la app: la v1 sigue el tema del sistema (claro u oscuro), sin una preferencia propia.
- Internacionalización: textos en español, moneda MXN y formato `es-MX` fijos.

## Decisions

### 1. Stack: Expo (managed) + expo-router + TypeScript estricto
Un solo código para iOS y Android (y web en v2), con pruebas rápidas en el dispositivo vía Expo Go o development build. expo-router da navegación basada en archivos (ver decisión 11). El nombre visible de la app es "Kapitaly Expenses".
*Alternativas:* Flutter (mejor escritorio, pero Dart y descartado en explore), React Navigation manual (más configuración sin beneficio aquí).

### 2. Capas y dependencias

```
app/ (pantallas expo-router)
  |
  v
src/ui/        componentes + theme (tokens)
src/features/  hooks que unen UI con dominio y repositorio
  |                     |
  v                     v
src/domain/  <---  src/data/
(puro, sin          PaymentMethodRepository     (interfaces)
 dependencias)      RecurringExpenseRepository
                    OneOffExpenseRepository
                    sqlite/ (Drizzle + expo-sqlite)
```

Regla: `src/domain` no importa nada de `src/data`, `src/ui` ni de React/Expo. `src/data` depende del dominio (tipos), nunca al revés. La UI obtiene los repositorios por un proveedor (React context) para poder sustituirlo en pruebas y en web (v2).

### 3. Interfaces de repositorio
Hay tres repositorios con la misma forma base:
```ts
interface Repository<T, Input> {
  list(): Promise<T[]>;                          // excluye eliminados
  get(id: string): Promise<T | null>;            // incluye archivados (para mostrar gastos viejos)
  create(input: Input): Promise<T>;
  update(id: string, input: Input): Promise<T>;
  remove(id: string): Promise<void>;             // borrado lógico (deleted_at)
  subscribe(listener: () => void): () => void;   // notifica cambios a la UI
}
type RecurringExpenseRepository = Repository<RecurringExpense, RecurringExpenseInput>;
type OneOffExpenseRepository   = Repository<OneOffExpense, OneOffExpenseInput>;
interface PaymentMethodRepository extends Repository<PaymentMethod, PaymentMethodInput> {
  archive(id: string): Promise<void>;
  unarchive(id: string): Promise<void>;
  // remove() falla con PaymentMethodInUseError si lo usa algún gasto no eliminado,
  // y remove() o archive() fallan con LastActiveMethodError si es el último método activo.
}
```
Las interfaces son asíncronas aunque SQLite local sea rápido, porque la implementación PocketBase de v2 será de red. El repositorio asigna `id`, `created_at`, `updated_at`, `deleted_at` y `archived_at`; la UI nunca los manipula. Las reglas de archivado y borrado de métodos viven en el **dominio** (`canRemove` y `canArchive`, como funciones puras sobre los datos). El repositorio solo las aplica, así que cualquier implementación futura se comporta igual. El balance se calcula en memoria sobre las tres listas: con decenas o pocos cientos de registros al mes no hace falta consultar por rango.
*Alternativa:* consultas reactivas de Drizzle (`useLiveQuery`) directamente en la UI. Quedan más acopladas a SQLite y no son portables a PocketBase.

### 4. Persistencia: expo-sqlite + Drizzle ORM
Drizzle da un esquema tipado y migraciones versionadas generadas con drizzle-kit y aplicadas al arrancar (`useMigrations`), necesarias porque el esquema evolucionará. Todas las tablas comparten las columnas `id` (TEXT PK, UUID v4 de `expo-crypto.randomUUID()`), `created_at`, `updated_at` y `deleted_at` (TEXT, ISO 8601 UTC; `deleted_at` admite NULL).

Tabla `recurring_expenses`:

| columna | tipo | nota |
|---|---|---|
| `id` | TEXT PK | UUID v4 de `expo-crypto.randomUUID()` |
| `name` | TEXT | recortado |
| `amount_cents` | INTEGER | > 0 |
| `interval_unit` | TEXT | `'month'` \| `'year'` |
| `interval_count` | INTEGER | >= 1 |
| `anchor_date` | TEXT | `YYYY-MM-DD` |
| `end_date` | TEXT NULL | `YYYY-MM-DD` |
| `payment_method_id` | TEXT | referencia a `payment_methods.id` |

Tabla `one_off_expenses`:

| columna | tipo | nota |
|---|---|---|
| `description` | TEXT | texto libre, recortado |
| `amount_cents` | INTEGER | > 0 |
| `date` | TEXT | `YYYY-MM-DD` |
| `payment_method_id` | TEXT | referencia a `payment_methods.id` |

Tabla `payment_methods`:

| columna | tipo | nota |
|---|---|---|
| `name` | TEXT | recortado |
| `kind` | TEXT | `'credit'` \| `'debit'` \| `'cash'` \| `'transfer'` |
| `last4` | TEXT NULL | exactamente 4 dígitos |
| `institution_id` | TEXT NULL | id estable del catálogo (p. ej. `'nu-mx'`); NULL para efectivo o instituciones fuera del catálogo |
| `color` | TEXT NULL | **clave** de la paleta (`'cobalt'`, `'lime'`…), no un hex, para que cada tema la pinte. NULL significa "usar el color de la institución" |
| `archived_at` | TEXT NULL | ISO 8601 UTC |

**Referencias sin `FOREIGN KEY` estricta en SQLite.** La integridad (que el método exista y no esté eliminado) la valida el dominio al guardar. Así, en v2 un registro sincronizado puede llegar antes que su método sin romper la inserción.

**Método inicial "Efectivo".** Lo inserta la propia migración inicial con un **UUID fijo** (`00000000-0000-4000-8000-000000000001`) mediante `INSERT OR IGNORE`. Así aparece una sola vez y es el mismo registro en todos los dispositivos, de modo que el sync de v2 no lo duplica. Si el usuario lo elimina, sigue eliminado.

**Último método usado.** Se obtiene del gasto (único o recurrente) con `created_at` más reciente cuyo método siga activo, sin guardar una preferencia aparte.

*Alternativas:* SQL a mano con expo-sqlite (sin tipos ni migraciones), WatermelonDB (trae su propio sync que no queremos atar a PocketBase), AsyncStorage/MMKV (sin consultas ni migraciones).

### 5. Frecuencia como `interval_unit` + `interval_count`
Se guarda la intención del usuario: Anual se persiste como `year,1`, no como `month,12`. El dominio la normaliza a "meses por intervalo" (`year` = 12 × count) para calcular. Los presets de la UI son un mapeo de presentación: `month` con 1/2/3/6 y `year,1`. Al editar, cualquier combinación de 12 meses se muestra como Anual. Agregar `week`/`day` en el futuro es un valor nuevo de `interval_unit`, no una migración de datos.

### 6. Fechas de calendario como cadenas `YYYY-MM-DD`
Las fechas de cobro son fechas civiles, no instantes: se guardan y manejan como `YYYY-MM-DD` con una pequeña utilidad propia (año, mes, día; días del mes; suma de meses con ajuste al último día). Así se evitan errores de zona horaria de `Date`. "Hoy" se obtiene una sola vez en la UI con la zona local y se pasa al dominio como parámetro, de modo que el dominio es determinista y testeable.
*Alternativa:* date-fns / dayjs — útiles, pero aquí la lógica necesaria es poca y los casos límite (ajuste al día 31) los queremos explícitos y probados.

### 7. Algoritmo de cobros sin materializar
`occurrencesInMonth(expense, year, month)`: con `m = meses por intervalo`, se calcula la distancia en meses `d` entre el mes del ancla y el mes consultado. Hay cobro si `d >= 0` y `d % m === 0`. El día es `min(día_ancla, díasDelMes)`, siempre desde el ancla original, nunca encadenando cobros, para que tras febrero se recupere el día 31. Después se filtra por la fecha ancla y la fecha de fin. Con `m` en meses, cada gasto tiene como máximo un cobro por mes. `nextOccurrenceOnOrAfter(expense, date)` reutiliza la misma fórmula avanzando de `m` en `m` meses desde el primer mes candidato. Ambas funciones son O(1) u O(pocas iteraciones), sin tablas de cobros: el sync de v2 solo sincroniza reglas.

**Balance combinado:**
- `buildThisMonthView(recurring, oneOffs, methods, year, month)` produce una lista unificada de cargos `{ kind: 'recurring' | 'oneOff', date, label, amountCents, methodId }`, ordenada por fecha y nombre. También calcula el total, el conteo, los subtotales por tipo y el desglose por método (agrupado por `methodId`, monto mayor a 0, de mayor a menor; incluye métodos archivados).
- `buildAverageView(recurring, oneOffs, year, month, today)` suma los proporcionales de los recurrentes vigentes y los montos reales de los únicos del mes, con subtotales de fijos, prorrateados y únicos.

Ambas son funciones puras con los datos del repositorio como entrada.

### 8. Dinero en centavos enteros
Todo el dominio opera en enteros (`amount_cents`). Captura: se parsea el texto del usuario (acepta `1500`, `1,500.50`, `1500.5`) a centavos sin pasar por `float` y se rechazan más de dos decimales. Proporcional: `round(amount_cents / meses)` con redondeo a la mitad hacia arriba. El total de la vista Promedio suma los proporcionales ya redondeados, para que la suma visible cuadre. Formato con `Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })` (Hermes trae Intl).

### 9. Sistema de diseño: "A-1 Duotono" (estética iOS con color blocking en degradado)
La referencia visual aprobada es la maqueta `design/propose/a-1-duotono.html`: es la fuente de verdad para tokens, componentes y distribución, en tema claro y oscuro.
*Alternativas evaluadas* (en `design/propose/`): A Bloques, con colores sólidos y menos volumen; A-2 Blending, que necesita Skia y `expo-blur`, con más complejidad y costo de rendimiento; B Bento, más genérica; y C Editorial, en la que el encabezado ocupa demasiado espacio con muchos gastos.

**Distribución de la pantalla de balance:**
- Encabezado de mes con el nombre grande (34, peso 800), el año debajo en tono secundario y dos botones circulares de 44 (‹ ›) a la derecha.
- `SegmentedControl` de píldora a todo lo ancho; la opción activa es un bloque de tinta.
- Tarjeta de total con radio 30. En "Este mes" muestra la etiqueta "Cargos de <mes>", el monto de 46/800 con los centavos más pequeños y una píldora con el número de cargos. En "Promedio" muestra "Costo mensual promedio" y dos píldoras: Fijos y Prorrateados.
- Etiqueta de sección en versalitas: "Por fecha" o "Proporcional por gasto".
- Filas `ExpenseRow` como bloques de color completos con radio 22:
  - En "Este mes": insignia de fecha de 52 (día y mes) en blanco translúcido al 55%, nombre, frecuencia y monto.
  - En "Promedio": nombre, frecuencia y monto "al mes". Los gastos no mensuales llevan además una píldora de pista con el texto "$monto · próximo cobro <fecha>" o "Sin cobros próximos".
- Botón principal flotante "Agregar gasto" anclado abajo, en forma de píldora de 58 con un círculo "+" en duotono lima.

**Duotono:** cada bloque es un degradado lineal a 135° (de arriba a la izquierda hacia abajo a la derecha) entre dos tonos vecinos, con un brillo de 1 px en el borde superior (blanco al 45% en claro, 35% en oscuro). Los tokens guardan cada degradado como una tupla `[desde, hasta]`:

| Token | Claro | Oscuro | Texto |
|---|---|---|---|
| Mensual | `#E6F87C → #9EE36A` | `#D9F06A → #86D457` | `onBlock` |
| Bimestral | `#C4E6FF → #82B4FF` | `#AFD9FF → #6C9EF5` | `onBlock` |
| Trimestral | `#E1D1FF → #A98BFF` | `#D2BFFF → #9476F5` | `onBlock` |
| Semestral | `#FFD9AE → #FF9E78` | `#FFCB98 → #F98A63` | `onBlock` |
| Anual | `#FFC9E0 → #FF7FB2` | `#FFB8D6 → #F56CA2` | `onBlock` |
| Cada N meses | `#BFF4DF → #6FD7B5` | `#A9EDD3 → #57C7A2` | `onBlock` |
| Total "Este mes" | `#2B4BF2 → #7B3CF0` | `#3354FF → #8344F5` | blanco |
| Total "Promedio" | `#FFD45C → #FF9A3C` | igual | `onBlock` |

El color se asigna por meses del intervalo (1, 2, 3, 6, 12 u otro), de forma estable.

**Temas claro y oscuro (incluidos en la v1):** la app sigue el tema del sistema (`userInterfaceStyle: "automatic"` en `app.json` y `useColorScheme` en un `ThemeProvider`). Los tokens neutros cambian por tema:

| Token | Claro | Oscuro |
|---|---|---|
| `bg` | `#F4F1EA` (arena) | `#121110` |
| `card` | `#FFFFFF` | `#1E1D1A` |
| `ink` | `#141414` | `#F4F1EA` |
| `muted` | `#6E695F` | `#9C968A` |
| `line` | `#E4DFD3` | `#2E2C28` |
| `switchOff` | `#D8D2C5` | `#3A3833` |
| `onBlock` | `#141414` | `#141414` (texto sobre bloques de color: siempre oscuro) |

En el tema oscuro se invierten el botón principal y la opción activa del `SegmentedControl`: pasan a un degradado `#FFFFFF → #E4DFD3` con texto oscuro. La barra de estado se ajusta al tema con `expo-status-bar` en modo `auto`.

**Tokens de forma y tipografía:**
- **Espaciado:** márgenes de pantalla de 20; interior de bloques de 18 a 24; separación entre filas de 10.
- **Radios:** 30 en tarjetas de total, 22 en filas, 16 en campos e insignias, y 999 en píldoras y botones.
- **Tipografía del sistema** (SF Pro en iOS, Roboto en Android): total 46/800 con interletrado -3%, título 34/800, cuerpo 17/700, secundario 13/600.
- **Números** con `fontVariant: ['tabular-nums']`.

**Implementación de los degradados:** con `expo-linear-gradient`, mediante un componente `DuotoneBlock` (`start {x:0,y:0}` y `end {x:1,y:1}`, más una capa absoluta de 1 px para el brillo). Lo usan la tarjeta de total, `ExpenseRow`, los chips de frecuencia, el bloque de monto del formulario y el círculo "+".

**Componentes propios** (sin librería de UI externa): `DuotoneBlock`, `TotalCard`, `SegmentedControl`, `MonthSwitcher`, `ExpenseRow` (variantes "Este mes" y "Promedio con pista"), `MoneyText` (centavos en tamaño menor), `PrimaryButton`, `SecondaryButton`, `DangerButton`, `FrequencyChips` (con *stepper* para "Cada N meses"), `TextField` (con estado de error: borde rojo `#D7263D` y mensaje debajo), `DateField` (valor en píldora) y `Switch`.

**Formulario de alta/edición:** hoja modal (presentación `modal` de expo-router). Arriba va el bloque de monto grande, pintado con el duotono de la frecuencia elegida y con el texto "Se cobra cada mes" o "$X al mes en promedio". Después vienen nombre, chips de frecuencia, fecha de cobro con selector nativo (`@react-native-community/datetimepicker`), fecha de fin opcional con interruptor y el botón "Guardar" flotante.

**Hápticos:** feedback ligero con `expo-haptics` al guardar y al cambiar de vista.

### 10. Catálogo de instituciones financieras
**Origen y forma.** En la v1, el catálogo es un archivo de datos versionado incluido en la app (`src/data/institutions/catalog.ts`), con su propio número de versión. **No** se guarda en SQLite: es de solo lectura y llega con las actualizaciones de la app. En la v2 pasa a una colección de PocketBase que leen todas las apps de la suite; la app conserva el archivo incluido como respaldo sin conexión. Forma:
```ts
interface Institution {
  id: string;                 // estable y legible: 'bbva-mx', 'nu-mx'; nunca se reutiliza
  name: string;
  kind: 'bank' | 'fintech' | 'investment';
  uses: Array<'pay' | 'receive' | 'invest'>;  // expenses filtra por 'pay'
  baseColor: string;          // hex de marca
  monogram: string;           // 1-2 letras: 'BB', 'Nu', 'MP'
  logo?: string;              // clave de un recurso, vacío en v1
  retired?: boolean;          // retirada: se resuelve, pero no se ofrece
}
```
*Alternativas:* una tabla SQLite con *seed* (obligaría a migrar en cada cambio del catálogo y mezcla datos de referencia con datos del usuario); ids UUID (poco legibles para un catálogo curado a mano).

**Catálogo inicial (propuesta, a validar antes de cerrar la tarea 2.6).** Los colores son aproximados a la marca, y los usos marcados con "?" no están confirmados:

| id | Nombre | Tipo | Usos | Color base aprox. |
|---|---|---|---|---|
| `bbva-mx` | BBVA | banco | pay, receive, invest | `#004481` |
| `santander-mx` | Santander | banco | pay, receive, invest | `#EC0000` |
| `banamex-mx` | Banamex | banco | pay, receive, invest | `#056DAE` |
| `nu-mx` | Nu | fintech | pay, receive, invest | `#820AD1` |
| `mercadopago-mx` | Mercado Pago | fintech | pay, receive, invest | `#00B1EA` |
| `klar-mx` | Klar | fintech | pay, receive, invest | `#1A1A1A` |
| `stori-mx` | Stori | fintech | pay, receive, invest | `#00A88E` |
| `openbank-mx` | Openbank | banco | pay, receive, invest | `#E4002B` |
| `mifel-mx` | Mifel | banco | pay, receive, invest | `#00594F` |
| `invex-mx` | Invex | banco | pay, receive? | `#E30613` |
| `cetes-mx` | Cetesdirecto | inversión | receive, invest | `#0B5E3C` |
| `dinn-mx` | Dinn | inversión | receive?, invest | `#5B2EFF` |
| `kubo-mx` | Kubo | inversión | pay?, receive, invest | `#00B2A9` |
| `bitso-mx` | Bitso | inversión | receive, invest (su tarjeta se desactivó en mayo de 2025) | `#1AC37F` |
| `finsus-mx` | Finsus | inversión | pay (débito "Sin Fronteras"), receive, invest | `#2D2A7B` |

**Color efectivo de un método:** `color ?? institution.baseColor ?? 'ink'`. Las claves de la paleta se resuelven con los tokens del tema. Un color base hex se convierte en duotono con `duotoneFromBase(hex)`, una función pura de dominio con pruebas. **El primer tono siempre es el color de marca.** Se prueba en este orden:
1. Segundo tono 12 puntos más oscuro (luminosidad HSL) y tono girado 12°, con texto blanco.
2. Si el blanco no cumple (marcas claras), segundo tono 10 puntos más claro, con texto `onBlock`.
3. Como último recurso, se oscurecen ambos tonos hasta que el blanco cumpla.

Un texto "cumple" si da al menos 4.5:1 contra **ambos** extremos. Se probó en la maqueta con las 15 instituciones del catálogo: todas conservan su color de marca y cumplen AA. Mercado Pago, Stori, Kubo y Bitso usan texto oscuro.

**Monograma:** `InstitutionBadge` es un círculo con el color base y las letras del monograma (o el logo, cuando exista). Aparece en la tarjeta de método, en la píldora de método de las filas y en el selector de institución.

### 11. Pantallas y navegación (expo-router)

```
app/
  _layout.tsx                 ThemeProvider + RepositoryProvider + migraciones
  index.tsx                   Balance (Este mes / Promedio)
  expense/new.tsx             modal: Agregar gasto (Único | Recurrente)
  expense/one-off/[id].tsx    modal: editar gasto único
  expense/recurring/[id].tsx  modal: editar gasto recurrente
  payment-methods/index.tsx   lista de métodos (activos y archivados)
  payment-methods/[id].tsx    modal: alta/edición de método ("new" para alta)
```

- **Balance:** el encabezado lleva, junto a las flechas de mes, un botón circular con ícono de tarjeta que abre "Métodos de pago". Debajo de la tarjeta de total en "Este mes" va la tarjeta **"Por método"**: una fila por método con su color, nombre (y ••últimos 4) y monto, más una barra proporcional delgada en su color.
- **Filas:** los gastos recurrentes son bloques duotono de su frecuencia. Los **gastos únicos** son bloques neutros (`card`) con una píldora "Único", para distinguir lo fijo de lo variable. Todas las filas muestran una píldora pequeña con el método (punto de color y nombre). En "Promedio", los únicos van en su propio grupo, "Únicos del mes", después de los recurrentes. La tarjeta de total muestra las píldoras Fijos, Prorrateados y Únicos.
- **Agregar gasto:** un solo modal con `SegmentedControl` **Único | Recurrente** (inicial: Único). La versión "Único" muestra, en este orden: bloque de monto (neutro), descripción, fecha (hoy por defecto) y método. La versión "Recurrente" muestra el formulario de la decisión 9. El método se elige con `PaymentMethodPicker` (chips con el color de cada método; solo los activos; preselecciona el último usado). Editar abre el formulario del tipo correspondiente, sin el selector de tipo.
- **Métodos de pago:** lista de tarjetas con el color efectivo del método, `InstitutionBadge`, tipo, ••últimos 4 y número de gastos que lo usan, y una sección "Archivados" plegada. El formulario tiene, en este orden: vista previa, tipo (chips), institución (selector con búsqueda, solo instituciones con uso `pay`, oculto si el tipo es efectivo), nombre, últimos 4 y color ("Color de la institución" más el muestrario de la paleta). Incluye las acciones Archivar/Reactivar y Eliminar según las reglas del dominio.
- **"+ Nuevo" en el selector de método del gasto:** abre el formulario de método como segunda hoja sobre la del gasto. Al guardar se cierra, el nuevo método queda seleccionado y el gasto conserva lo capturado (estado del formulario en el componente padre, no en la ruta).
- **Maqueta:** todas estas piezas están en `design/propose/a-1-duotono.html` (tarea 5.1), con monogramas en lugar de logos.

### 12. Pruebas
- **Dominio**: Jest (`jest-expo` preset) con pruebas unitarias que reproducen los escenarios de los specs (ajuste de fin de mes, bisiestos, proporcionales, pistas, vigencia).
- **Contrato de repositorio**: una suite `describeRepositoryContract(factory)` por repositorio, que cualquier implementación debe pasar (alta, edición, borrado lógico, metadatos, exclusión de eliminados; en métodos de pago, también archivado, bloqueo de borrado en uso, último activo y método inicial). En v1 se ejecuta contra una implementación en memoria y contra la de SQLite. Para correr SQLite en Node, la implementación Drizzle se escribe sobre el núcleo `sqlite-core` y en pruebas se usa el driver `better-sqlite3` con las mismas migraciones (ver riesgo).
- **UI**: React Native Testing Library para los formularios (validaciones, selector de tipo, preselección de método), la pantalla de balance (vistas, desglose y navegación de mes) y la de métodos de pago, con repositorios en memoria.

### 13. Tarjetas de crédito, pagos y confirmación de cobros
Ver los specs `credit-cards` y `recurring-expenses` (cobros por confirmar). **Cambia la decisión 7:** los cobros siguen calculándose al vuelo a partir de las reglas, pero ahora se **guarda** la respuesta del usuario a cada cobro (confirmado o descartado). "Aún no" no se guarda.

**Esquema (migración `0002`, sin tocar las anteriores):**
- **`payment_methods` + columnas:** `opening_balance_cents` INTEGER NULL, `opening_balance_date` TEXT NULL, `credit_limit_cents` INTEGER NULL y `payment_due_day` INTEGER NULL. Solo tienen valor si `kind = 'credit'`.
- **`card_payments`:** metadatos comunes + `payment_method_id`, `amount_cents` (> 0), `date` y `for_due_date` (TEXT NULL; la fecha de pago que cubre).
- **`recurring_charge_confirmations`:** metadatos comunes + `recurring_expense_id`, `occurrence_date`, `status` (`'charged'` \| `'skipped'`), `amount_cents` (NULL si se descartó) y `payment_method_id` (el del gasto **al confirmar**, para que cambiar después el método del gasto no mueva cobros ya hechos). Hay a lo sumo una confirmación por (gasto, fecha), y la garantiza el repositorio.

**Dominio (funciones puras, en `src/domain/creditCard.ts` y `src/domain/confirmations.ts`):**
- `usedCents(card, oneOffs, confirmations, payments)` = saldo inicial + únicos vigentes de la tarjeta con `date ≥ opening_balance_date` + confirmados `charged` de la tarjeta con `occurrence_date ≥ opening_balance_date` − pagos vigentes. El saldo inicial representa lo usado **al inicio** del día de registro, por eso los gastos de ese mismo día sí cuentan.
- `dueDates`: la fecha de pago de cada mes es `clampedDate(año, mes, payment_due_day)`. `lastDueOnOrBefore(today)` da la más reciente y `nextDueOnOrAfter(today)` la próxima.
- `pendingCardPayment(card, payments, today, used)`: hay aviso si existe día de pago, `used > 0` y `last = lastDueOnOrBefore(today)` es ≥ `opening_balance_date` y ningún pago vigente tiene `for_due_date = last`.
- `dueDateCoveredBy(card, paymentDate)`: la fecha de pago **más cercana** a la fecha del pago (en empate, la posterior). Así, pagar el 3 dic con día 5 cubre el 5 dic y evita su aviso, y pagar tarde el 7 nov cubre el 5 nov. Un pago hecho desde el aviso cubre la fecha por la que se preguntó.
- `pendingConfirmations(recurring, confirmations, today, registeredOn)`: para cada gasto vigente, sus cobros (con `occurrenceInMonth`, mes a mes) con fecha ≤ hoy y ≥ máx(ancla, día local de registro), sin confirmación. `registeredOn(iso)` convierte `createdAt` (UTC) a fecha local; se inyecta para que el dominio siga siendo determinista.
- Validación de los datos de tarjeta en `validatePaymentMethodInput` (saldo ≥ 0, límite > 0, día de 1 a 31). Para otros tipos se descartan.

**Repositorios:** `CardPaymentRepository` y `ChargeConfirmationRepository`, con la forma base (`Repository<T, Input>`) y sus suites de contrato. El de confirmaciones hace *upsert* por (gasto, fecha).

**Interfaz:**
- **Al abrir la app** (pantalla de balance), si hay pendientes, aparece una hoja **"Pendientes"** con una tarjeta por cada cobro por confirmar y por cada pago de tarjeta vencido. "Aún no" los oculta durante esa sesión (en memoria). La hoja se puede volver a abrir desde un aviso "N pendientes" en el balance.
- **"Este mes":** la fila de un cobro por confirmar muestra la píldora "Por confirmar".
- **Métodos de pago:** la tarjeta de crédito muestra "Usado $X" (o "Saldo a favor $X"), "Límite ••••••" y "Disponible ••••••", que se revelan al tocar (estado local de la pantalla, que se pierde al salir), y "Próximo pago: 5 dic". En la edición aparecen "Pagar tarjeta" (hoja con monto y fecha) y el historial de pagos con opción de eliminar.
- **Formulario de método:** cuando el tipo es crédito, aparecen los campos saldo inicial, límite y día de pago.
- Estas piezas se agregan primero a la maqueta `design/propose/a-1-duotono.html` y se aprueban antes de implementarlas (tarea 10.1).

*Alternativas:* materializar todos los cobros al crear la regla (descartada: complica el sync y los cambios de regla); llevar el usado como un campo que se actualiza con cada operación (descartada: se desincroniza; mejor recalcularlo con funciones puras).

### 14. Tarjeta digital
La versión digital es una **variante del mismo método**, no un método aparte, porque comparte la línea de crédito (y la cuenta, en débito). Por eso el usado, el desglose "Por método" y las reglas de archivado siguen siendo por método.

- **Esquema (migración `0003`):**
  - En `payment_methods`: `has_digital` INTEGER NOT NULL DEFAULT 0 y `digital_last4` TEXT NULL.
  - En `recurring_expenses` y `one_off_expenses`: `card_variant` TEXT NULL (`'physical'` \| `'digital'`). NULL en gastos con métodos sin versión digital y en los gastos anteriores a esta migración, y se lee como física.
- **Dominio:**
  - `validatePaymentMethodInput` acepta `hasDigital` y `digitalLast4` solo para crédito y débito.
  - Los validadores de gastos normalizan `cardVariant`: NULL si el método no tiene digital, y `'physical'` si la tiene y no se eligió. Reciben `methodHasDigital(id)` en el contexto.
  - `suggestCardVariant(methodId, expenses)` devuelve la variante del gasto más reciente con ese método, o `'physical'`.
  - `methodLabel(method, variant)` produce "BBVA Azul ••7788 · digital", y si la digital no tiene dígitos, "BBVA Azul · digital".
- **Si se desactiva la digital** en un método, los gastos ya marcados como digitales conservan su marca (es historial), pero en gastos nuevos no se ofrece la opción.
- **Interfaz:**
  - En el formulario de método, el interruptor "Tiene tarjeta digital" con sus dígitos, solo para crédito y débito.
  - En el formulario de gasto, `SegmentedControl` Física | Digital bajo el selector de método, solo si el método elegido tiene digital.
  - En las filas, la píldora del método incluye la variante.
- Se agrega a la maqueta junto con las piezas de la decisión 13 (tarea 10.1).

## Risks / Trade-offs

- [Los drivers de Drizzle para expo-sqlite y better-sqlite3 pueden diferir en API (sync/async) o tipos] → hacer al inicio una prueba de concepto pequeña. Si no comparten código limpiamente, la suite de contrato se corre en dispositivo/emulador para SQLite y en Node solo para la implementación en memoria.
  - **Resultado de la prueba de concepto (tarea 4.1, con drizzle-orm 0.45 y expo-sqlite 58):** ambos drivers producen `BaseSQLiteDatabase<'sync', …, schema>`. Los repositorios SQLite se escriben contra el tipo compartido `AppDatabase` (`src/data/sqlite/database.ts`) y `tsc` comprueba que la base de expo-sqlite encaja en él. En Jest se usa better-sqlite3 en memoria con las **mismas** migraciones de `drizzle/` (migrador de better-sqlite3 sobre la carpeta). En la app se usa `useMigrations` con `drizzle/migrations.js`, que importa los `.sql` mediante `babel-plugin-inline-import` y la extensión `sql` en Metro. Por eso la suite de contrato SQLite corre en Node; en el dispositivo queda una verificación de humo.
- [`updated_at` con el reloj del dispositivo puede ser impreciso para *last-write-wins* en v2] → aceptable para un solo usuario. En v2 el cursor de pull usará el `updated` del servidor, no este campo.
- [UUID v4 de 36 caracteres frente al `id` de 15 caracteres por defecto de PocketBase] → decisión de v2: ajustar el patrón del campo `id` en PocketBase o mapear. No afecta los datos de v1.
- [Duotonos con mal contraste en alguno de sus extremos, o aspecto recargado con muchos gastos] → prueba automática de contraste AA del texto contra **ambos** extremos de cada degradado en los dos temas, y revisión en dispositivo real comparando con la maqueta.
- [Rendimiento de muchos `LinearGradient` en una lista larga] → con decenas de filas no debería notarse. Si se nota, usar `FlatList` con filas memorizadas y, como último recurso, volver a bloques sólidos con el color "desde" de cada token.
- [Hermes con `Intl` incompleto en algún dispositivo Android viejo] → `MoneyText` con *fallback* de formato manual si `Intl.NumberFormat` falla.
- [Sin respaldo de datos en v1: perder el teléfono significa perder los datos] → aceptado conscientemente; la v2 resuelve esto con el sync.
- [Sin `FOREIGN KEY`, un gasto podría quedar apuntando a un método inexistente] → el dominio valida la referencia al guardar y la UI muestra "Método desconocido" como respaldo. Además, como los métodos nunca se borran físicamente, la referencia siempre se puede resolver.
- [Colores de marca y usos del catálogo inicial no verificados] → la tarea 2.6 los valida antes de darse por terminada. Como el catálogo es un archivo versionado, corregirlo después no requiere migración.
- [Un color de marca no alcanza el contraste en duotono] → `duotoneFromBase` oscurece el segundo tono hasta cumplir, con prueba automática sobre todo el catálogo.
- [Los pagos de tarjeta modelan un movimiento de dinero que en la suite le corresponde a kapitaly-balances] → en la v1 viven aquí como un dato de la tarjeta; al llegar kapitaly-balances, sus transferencias podrán generar estos pagos.
- [Con muchos meses sin abrir la app, la hoja de pendientes podría ser larga] → se ordena por fecha y se ofrece "Confirmar todos" como mejora futura; en la v1 se listan todos.
- [Otra app de la suite podría editar los métodos en v2 con reglas distintas] → las reglas viven en el dominio como funciones puras, pensadas para extraerse a un paquete compartido de la suite cuando exista la segunda app.

## Migration Plan

No hay datos previos. Las migraciones de Drizzle se aplican al arrancar la app; la primera crea `payment_methods`, `recurring_expenses` y `one_off_expenses`, e inserta el método inicial "Efectivo". Toda evolución futura del esquema será una migración nueva y versionada, nunca una edición de una migración existente.

## Open Questions

- Ajustes finos de los tonos de la paleta tras verlos en un dispositivo real (la paleta base y la asignación por frecuencia ya están definidas en la decisión 9).
- Logos reales de las instituciones: el usuario decidirá cuáles usar y proveerá los archivos. Antes de publicar la suite en tiendas, revisar las reglas de uso de marca de cada institución.
- Ícono de la app y nombre exacto en la tienda ("Kapitaly Expenses"): se pueden ajustar sin cambiar specs ni tareas.
- Estructura de repositorio de la suite (monorepo con un paquete de dominio compartido o repos separados): se decide al empezar kapitaly-income; no afecta a esta v1.
