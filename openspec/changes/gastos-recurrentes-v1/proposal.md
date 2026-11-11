# Proposal

## Why

Kapitaly será una **suite de apps de finanzas personales**, cada una con una sola intención clara, para saber desde que la abres qué vas a hacer:

```
  Suite Kapitaly
  +--------------------+  +--------------------+  +----------------------+
  | kapitaly-expenses  |  | kapitaly-income    |  | kapitaly-balances    |
  | registrar gastos   |  | registrar ingresos |  | ver balances para    |
  | (este cambio)      |  | (después)          |  | decidir (después)    |
  +--------------------+  +--------------------+  +----------------------+
       ^ datos compartidos: métodos de pago, gastos, ingresos (vía backend en v2)
       otras apps posibles: inversiones, dividir cuentas... cada una con sus widgets
```

Este cambio crea la primera app, **kapitaly-expenses**: registrar mis gastos (los recurrentes y los únicos del día a día), saber con qué los pago y ver cuánto suman en el mes. Hoy no hay ninguna app (el repositorio `kapitaly` está vacío). Esta primera versión establece la base técnica que compartirá la suite (local-first y lista para sincronizar en el futuro) y entrega valor diario desde el inicio, sin depender de internet ni de infraestructura.

## What Changes

- Nueva app móvil multiplataforma **Kapitaly Expenses** (iOS y Android), construida con Expo y TypeScript. Funciona 100% sin conexión, con almacenamiento local en el dispositivo.
- **Catálogo de instituciones financieras** (bancos, fintechs e inversión), compartido por la suite. Cada institución tiene un color base, un monograma (el logo se agregará después) y sus usos (pagar, recibir ingresos, invertir). Esta app solo ofrece las que sirven para pagar.
- **Métodos de pago**: alta, edición y archivado de tarjetas, efectivo y transferencias (nombre, tipo, institución opcional, últimos 4 dígitos opcionales y color). El color es por defecto el de la institución y se puede sustituir por uno de la paleta. Se pueden crear desde el formulario de gasto. "Efectivo" viene creado de inicio. Un método en uso no se borra: se archiva.
- **Tarjetas de crédito**: saldo inicial al registrarla, límite de crédito (oculto hasta tocarlo) y día de pago. La app lleva el **usado** de cada tarjeta: saldo inicial + gastos con la tarjeta + cobros recurrentes confirmados − pagos. Al llegar la fecha de pago pregunta si ya se pagó y cuánto; también se puede "Pagar tarjeta" desde Métodos de pago. Los pagos no son gastos: no cuentan en el balance del mes.
- **Tarjeta digital**: una tarjeta de crédito o débito puede tener versión digital (con sus propios últimos 4 dígitos, opcionales). Comparte el mismo saldo, y al registrar un gasto se elige si se pagó con la física o con la digital.
- **Confirmación de cobros recurrentes**: la app pregunta si ya se efectuó cada cobro recurrente vencido ("Sí, se cobró" con monto editable, "Aún no", "No se cobró este mes"), y marca "Por confirmar" en el balance los que faltan.
- **Gastos recurrentes**: alta, edición y borrado de reglas con nombre, monto, frecuencia por meses (mensual, bimestral, trimestral, semestral, anual o cada N meses), fecha de cobro, fecha de fin opcional y método de pago obligatorio.
- **Gastos únicos**: registro rápido de un gasto puntual con descripción libre (no es un catálogo), monto, fecha y método de pago obligatorio. Por ejemplo, "Recarga metro, $100".
- **Balance mensual**: navegación entre meses y un control para alternar entre dos vistas.
  - **Este mes**: los cargos recurrentes que caen en el mes más los gastos únicos, con su número, el total, los subtotales por tipo y un desglose de cuánto sale por cada método de pago.
  - **Promedio**: el costo mensual proporcional de cada gasto recurrente (por ejemplo, anual / 12) más los gastos únicos del mes, con el total y una pista del monto real y la próxima fecha de cobro de los recurrentes no mensuales.
- **Modelo de datos preparado para sincronizar** en una versión futura y para compartirse con otras apps de la suite: identificadores generados en el dispositivo, marcas de tiempo, borrado lógico, montos en centavos y métodos de pago como entidad propia. El acceso a datos va detrás de interfaces de repositorio.
- **Identidad visual "A-1 Duotono"**, estilo iOS: bordes muy redondeados, mucho espacio y color blocking con degradados de dos tonos. Incluye **tema claro y oscuro** que sigue al sistema. La maqueta aprobada está en `design/propose/a-1-duotono.html`.

**Fuera de alcance (v1):**
- Ingresos y balance de ingresos contra gastos (serán kapitaly-income y kapitaly-balances).
- Backend, inicio de sesión, sincronización y versión web.
- Categorías, presupuestos, fechas de corte, intereses y estados de cuenta de tarjetas.
- Logos reales de las instituciones (la v1 usa monogramas) y la edición del catálogo de instituciones.
- Frecuencias semanales o quincenales.
- Multimoneda (se asume MXN) y selector de tema dentro de la app.

## Capabilities

### New Capabilities
- `financial-institutions`: catálogo de solo lectura de instituciones financieras con identidad visual y usos, compartido por la suite.
- `payment-methods`: métodos de pago del usuario (alta, edición, archivado, institución y color, creación desde el gasto, método inicial "Efectivo"), compartibles con otras apps de la suite.
- `credit-cards`: datos de las tarjetas de crédito (saldo inicial, límite privado, día de pago), cálculo del usado, pagos y su aviso en la fecha de pago.
- `recurring-expenses`: reglas de gastos recurrentes (alta, edición, borrado lógico, validación, frecuencias por meses, método de pago), confirmación de sus cobros y su persistencia local sin conexión.
- `one-off-expenses`: registro, edición y borrado de gastos únicos con descripción libre, monto, fecha y método de pago.
- `monthly-balance`: cálculo y presentación del balance de un mes. Cubre los cargos del mes (recurrentes y únicos), el desglose por método de pago, el costo mensual promedio, la pista del próximo cobro y la navegación entre meses.
- `app-theme`: apariencia en tema claro u oscuro según la preferencia del sistema.

### Modified Capabilities
<!-- Ninguna: el proyecto no tiene specs existentes. -->

## Impact

- **Código nuevo**: proyecto Expo completo (pantallas, dominio en TypeScript puro, capa de datos con SQLite local, sistema de diseño con temas).
- **Dependencias nuevas**: Expo SDK, expo-router, expo-sqlite, Drizzle ORM (y drizzle-kit para migraciones), expo-crypto (UUID), expo-linear-gradient (duotonos), expo-haptics, expo-status-bar, `@react-native-community/datetimepicker` y Jest con React Native Testing Library para pruebas.
- **Infraestructura**: ninguna en v1. La v2 agregará PocketBase autohospedado, y la v1 no debe impedirlo.
- **Datos**: base SQLite local en el dispositivo con métodos de pago, gastos recurrentes, gastos únicos, pagos de tarjeta y confirmaciones de cobro, más el catálogo de instituciones incluido en la app como datos versionados. Su esquema es la base que se sincronizará y compartirá con la suite. Sus convenciones (UUID, `updated_at`, `deleted_at`, centavos, referencias por id a métodos de pago) son un contrato a largo plazo.
- **Nombre del cambio**: se conserva `gastos-recurrentes-v1` por continuidad, aunque ahora cubre la v1 completa de kapitaly-expenses.
