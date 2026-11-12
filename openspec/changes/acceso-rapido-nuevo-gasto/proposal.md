# Proposal

## Why

Registrar un gasto hoy toma varios pasos: abrir la app, esperar el balance y tocar "Agregar gasto". Es justo la acción que se repite varias veces al día, y si cuesta, se deja para después y se olvida. Un ícono propio en la pantalla de inicio que abra el formulario con un toque reduce la fricción al mínimo.

## What Changes

- **Acceso directo en la pantalla de inicio (Android):** en Ajustes aparece "Acceso directo: nuevo gasto". Al tocarlo, Android muestra su diálogo para agregar un ícono "Nuevo gasto" a la pantalla de inicio, sin tener que mantener nada presionado. Desde entonces, un toque en ese ícono abre el formulario de nuevo gasto.
- **Atajo en el ícono de la app (Android):** al mantener presionado el ícono de Kapitaly aparece "Nuevo gasto", con el mismo destino.
- **Formulario listo para capturar:** al entrar por el acceso directo o el atajo, el formulario abre en "Único" con el cursor en el monto. Al guardar o cancelar se regresa al balance.
- **Sin interrupciones:** al entrar por el acceso directo, la hoja automática de "Pendientes" no se abre encima del formulario; aparece al volver al balance.
- **Primer código nativo propio:** un módulo local pequeño (Expo Modules API, Kotlin) para pedir a Android que fije el acceso directo, y un plugin de configuración para el atajo estático y su ícono. Sin dependencias de terceros.
- **Diseño primero:** el ícono del acceso directo y la opción en Ajustes se maquetan antes de implementarse.

**Fuera de alcance:** widgets en la pantalla de inicio (y mostrar el total del mes ahí), registrar un gasto sin abrir la app, iOS (sus Quick Actions quedan para cuando exista la versión de iOS) y accesos directos a otras pantallas.

## Capabilities

### New Capabilities
- `quick-add-shortcut`: accesos directos de Android (fijado en la pantalla de inicio y atajo del ícono) que abren el formulario de nuevo gasto listo para capturar.

### Modified Capabilities
- `settings-menu`: Ajustes agrega la opción "Acceso directo: nuevo gasto" cuando el dispositivo puede fijar accesos directos.

## Impact

- **Nativo:** nuevo módulo local en `modules/` (Kotlin, `ShortcutManagerCompat`), autoenlazado por Expo; nuevo plugin `plugins/withAndroidShortcuts.js` (atajo estático, ícono vectorial y `meta-data` en el manifiesto). `android/` sigue generándose con prebuild.
- **Navegación:** `unstable_settings.anchor = 'index'` en el layout raíz y un parámetro en `/expense/new` para el modo de captura rápida.
- **UI:** opción nueva en Ajustes, foco automático en el monto del formulario y hoja de Pendientes condicionada a que el balance esté visible.
- **Desarrollo:** esta parte no funciona en Expo Go; se prueba con un development build o con la beta de Play. El resto de la app sigue funcionando en Expo Go (el módulo responde "no disponible").
- **Distribución:** sale en `v0.1.0-beta.3`, junto con las categorías.
