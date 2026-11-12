# Proposal

## Why

Hoy los gastos solo se distinguen por frecuencia y método de pago, así que no hay forma de saber en qué se va el dinero. Clasificar cada gasto desde ahora prepara el desglose por categoría en los balances (de esta app y de la suite) y deja ver de inmediato qué gastos quedaron sin clasificar. Además, la pantalla del balance ya está justa: agregar más accesos directos no cabe, y pronto vendrán otras opciones (recordatorios).

## What Changes

- **Catálogo de categorías de gasto:** la app trae 8 categorías de inicio con identificador fijo para toda la suite: Hogar, Comida, Transporte, Servicios, Suscripciones, Salud, Entretenimiento y Otro. El usuario puede crear categorías personalizadas (nombre e ícono), renombrarlas y borrarlas; las de inicio se pueden ocultar y cambiar de ícono, pero no renombrar ni borrar; "Otro" no se puede ocultar, renombrar ni borrar.
- **Íconos propios:** cada categoría tiene un ícono de un set fijo de SVG propios (idénticos en Android, iOS y web), no emojis. Se guarda solo la clave del ícono.
- **BREAKING (datos):** todo gasto recurrente y único SHALL tener categoría. La migración asigna "Otro" a los gastos existentes. Al crear un gasto, la categoría propuesta es "Otro". Los gastos de una categoría borrada se muestran como "Otro"; los de una oculta la conservan.
- **Formulario de gasto:** una fila compacta "Categoría" abre un selector con las categorías vigentes.
- **Balance:** cada fila de "Este mes" y de "Promedio" muestra el ícono y el nombre de su categoría.
- **Menú de ajustes:** el botón de métodos de pago del encabezado del balance pasa a ser un botón de menú que abre "Ajustes", con "Métodos de pago" y "Categorías". Se elimina la pantalla de desarrollo "Catálogo de componentes": aunque su enlace solo aparecía en modo desarrollo, la pantalla llegaba al bundle de producción y podía abrirse por enlace profundo.
- **Diseño primero:** el menú, la pantalla de categorías, el selector de ícono y la fila del formulario se maquetan en la maqueta A-1 Duotono antes de implementarse.

**Fuera de alcance:** desglose del balance por categoría, recordatorios con notificaciones push (no se muestra la opción hasta que exista), sugerir la última categoría usada y categorías por cobro individual.

## Capabilities

### New Capabilities
- `expense-categories`: catálogo de categorías de gasto (de inicio y personalizadas), sus reglas de edición, íconos e identificadores estables para la suite.
- `settings-menu`: pantalla de ajustes accesible desde el balance que agrupa la configuración de la app (métodos de pago, categorías y, en el futuro, recordatorios).

### Modified Capabilities
- `one-off-expenses`: registrar un gasto único requiere categoría, propuesta como "Otro".
- `recurring-expenses`: registrar un gasto recurrente requiere categoría, propuesta como "Otro"; sus cobros usan la categoría del gasto.
- `monthly-balance`: las filas de "Este mes" y "Promedio" muestran la categoría de cada gasto.

## Impact

- **Datos:** nueva tabla `categories` y columna `category_id` (obligatoria) en `recurring_expenses` y `one_off_expenses`; migración 0005 con la semilla y la asignación a "Otro". Repositorios SQLite y en memoria, y contrato de repositorios.
- **Dominio:** nueva entidad y validaciones de categoría en `src/domain`; validación de gastos con categoría.
- **UI:** nuevo set de íconos en `src/ui`, pantallas de Ajustes y Categorías en `src/app` + `src/features`, cambios en el formulario de gasto, filas del balance y encabezado (`MonthSwitcher`).
- **Diseño:** nuevas secciones en `design/propose/a-1-duotono.html`.
- **Licencias:** trazos de íconos tomados de Lucide (ISC), con su aviso de licencia en el repo. Sin dependencias nuevas.
- **Distribución:** sale como `v0.1.0-beta.3` desde `release/0.1.0`.
