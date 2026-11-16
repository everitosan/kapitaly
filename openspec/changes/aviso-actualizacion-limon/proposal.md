# Proposal

## Why

El aviso de actualización es una tarjeta blanca igual a las demás del balance y pasa desapercibido. De las opciones de `design/propose/aviso-actualizacion-v2.html` se eligió la **A: bloque limón**, que destaca sin cambiar dónde ni cómo funciona el aviso. La opción "C + B" (píldora en la barra con hoja) queda en pausa en `aviso-actualizacion-pildora` hasta que haya infraestructura para mostrar las novedades de cada versión, que es lo que justificaría la hoja.

## What Changes

- La tarjeta de arriba del mes se ve como un **bloque de color amarillo limón** (degradado `#FFF27A → #FFD23F`; oscuro `#FFEE6B → #F5C52E`) en lugar de blanco, con tinta oscura en los dos temas. El limón se eligió para distinguirse del ámbar de "Análisis".
- A la izquierda lleva un **ícono ↑** en un círculo oscuro.
- Los botones "Actualizar" y "Reiniciar" pasan a ser negros con texto limón.
- Mientras descarga, además del texto "Descargando la nueva versión… N %", se ve una **barra de avance**.
- Sin cambios: los textos, la ✕ (solo en "Nueva versión disponible"), cuándo aparece, el flujo de Google Play y el respaldo con Play Store.

**Fuera de alcance:** mover el aviso, hojas o modales, y notas de la versión.

## Capabilities

### New Capabilities
<!-- Ninguna -->

### Modified Capabilities
<!-- Ninguna: solo cambia el aspecto; los requisitos de `app-updates` siguen igual (skip_specs). -->

## Impact

- **UI:** `src/features/updates/UpdateBanner.tsx` (estilos, ícono y barra) y el token `update` en `src/ui/theme.ts`.
- **Pruebas:** `useAppUpdate.test.tsx` sigue igual en lo que comprueba; se agregan pruebas del ícono, la barra y el color.
- **Datos y nativo:** sin cambios; solo JS.
