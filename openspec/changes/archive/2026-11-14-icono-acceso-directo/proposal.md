# Proposal

## Why

El acceso directo "Nuevo gasto" funciona, pero en el teléfono se ve como un ícono negro. Hoy es un vector plano (círculo lima con "+"), y desde Android 8 los launchers esperan íconos adaptativos: cada uno trata un vector plano a su manera. Además, el "+" lima no se parece a la marca actual de KPTLY expenses.

## What Changes

- El ícono del acceso directo fijado y del atajo (mantener presionado el ícono de la app) pasa a ser el diseño de `design/link-expeneses.svg` (reemplazó a la propuesta anterior, `design/acceso directo expenses.png`): un campo verde con degradado, una esquina oscura `#020903` arriba a la izquierda y una cartera grande en verde oscuro.
- Se entrega como **ícono adaptativo**: la capa de fondo lleva el oscuro y el círculo verde (colocado para que la esquina oscura se vea en cualquier forma de launcher, también en la redonda), y la capa de frente, la cartera escalada dentro de la zona segura. Así cada launcher le aplica su propia forma.
- En Android 7 (sin íconos adaptativos) se usa un ícono de respaldo con el mismo dibujo.
- La fila "Acceso directo: nuevo gasto" en Ajustes muestra el mismo ícono.

Maqueta: `design/propose/comentarios-y-atajo.html` (sección "Ícono del acceso directo").

**Fuera de alcance:** cambiar el ícono de la app, el destino del atajo o sus textos.

## Capabilities

### New Capabilities
<!-- Ninguna -->

### Modified Capabilities
- `quick-add-shortcut`: se agrega el requisito del ícono de marca, adaptativo, del acceso directo y el atajo.

## Impact

- `plugins/withAndroidShortcuts.js`: genera los recursos del ícono (adaptive-icon para API 26+ y respaldo) en lugar del vector lima. Se actualizan sus pruebas.
- `modules/kapitaly-shortcuts`: el acceso directo fijado sigue usando el recurso `shortcut_new_expense`; con el ícono adaptativo no hay cambio de código, solo de recurso.
- `src/features/settings/SettingsScreen.tsx`: el ícono de la fila "Acceso directo".
- Requiere un build nuevo; no se puede ver en Expo Go.
