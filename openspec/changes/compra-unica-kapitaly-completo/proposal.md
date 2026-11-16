# Proposal

## Why

Kapitaly necesita un ingreso sostenible sin servidores ni suscripciones. La estrategia acordada es app gratis con registros ilimitados y una **compra única "Kapitaly completo"** a precio accesible ($29 MXN de lanzamiento y después $49 MXN) que desbloquea los extras. Hay que preparar el candado y la compra antes del lanzamiento público para que el cobro esté activo desde el primer día, mientras la beta cerrada sigue con todo desbloqueado.

## What Changes

- Nuevo producto de Google Play de pago único (no consumible) `kapitaly_completo`, que se compra con **expo-iap** directo con Play Billing, sin servicios externos ni cuentas.
- **Funciones premium:** el detalle por categoría y el detalle por método de Análisis, es decir, la lista de gastos del mes que se abre al tocar una categoría o un método. La futura vista de gasto por día también será premium, pero se propone aparte y solo reutilizará el candado de este cambio.
- **Lo que sigue gratis:** registrar gastos sin límite, "Tus gastos", y las cifras, la dona y las barras de Análisis. Tocar una categoría o un método sigue resaltándolo, pero con el candado en vez de la lista se abre un aviso para desbloquear.
- **Prueba gratis de 14 días:** la primera vez que se abre una build con el cobro activado, Kapitaly completo queda desbloqueado 14 días. La pantalla y Ajustes muestran los días que quedan. Al terminar vuelve el candado, salvo que se haya comprado. La fecha de inicio se guarda en el teléfono. Reinstalar reinicia la prueba, pero también borra los datos, así que no compensa.
- Nueva pantalla **"Kapitaly completo"** con lo que incluye, el precio que da la tienda, "Comprar", "Restaurar compras" y el estado (activo o pago pendiente). Se abre desde el aviso del candado y desde una nueva opción en Ajustes.
- **Compras hechas fuera de la app:** los códigos promocionales de los testers fundadores y las recompensas de pre-registro de Play se reconocen al abrir la app y al volver a ella, y se confirman (acknowledge) para que Google no las reembolse.
- **Pagos pendientes** (por ejemplo, en efectivo en OXXO): la app muestra "Pago pendiente" y desbloquea cuando Play confirma el pago.
- El desbloqueo se recuerda en el teléfono para funcionar sin tienda disponible. Si la tienda responde que ya no hay compra (reembolso), se vuelve a bloquear.
- **Candado por build:** se enciende solo con `KAPITALY_PREMIUM_GATE=on` al compilar. Las betas, y cualquier build que no lo encienda, tienen todo desbloqueado y no muestran nada de la compra.

**Fuera de alcance:** iOS y offer codes de Apple (otra propuesta cuando se publique en App Store); la vista de gasto por día; validar recibos en un servidor; configurar precios escalonados, promociones y pre-registro en Play Console (se hace en la consola, sin código); el flujo de lanzamiento y release en `main`.

## Capabilities

### New Capabilities
- `premium-unlock`: el producto "Kapitaly completo", su prueba gratis de 14 días, su compra, restauración, pagos pendientes, compras hechas fuera de la app, el recuerdo del desbloqueo, el candado por build y el aviso de candado que usan las funciones premium.

### Modified Capabilities
- `monthly-balance`: "Detalle de la categoría activa" y "Detalle del método activo" muestran el aviso de candado en lugar de la lista cuando Kapitaly completo está bloqueado.
- `settings-menu`: "Opciones de Ajustes" y "Sin pantallas de desarrollo en producción" agregan la opción "Kapitaly completo" cuando el candado está encendido.

## Impact

- **Dependencia nativa nueva:** `expo-iap`, con su config plugin en `app.json`. Requiere development build y agrega el permiso `com.android.vending.BILLING`. Verificar los requisitos de Android (compileSdk y Kotlin) con `npx expo-doctor`.
- **Configuración:** `app.config.js` expone `extra.premiumGate` según `KAPITALY_PREMIUM_GATE`.
- **Código:** nuevo `src/domain/premium.ts` (reglas puras del desbloqueo), `src/features/premium/` (proveedor, hook y pantalla), ruta `src/app/premium.tsx`, aviso de candado en `src/ui/components/`, y cambios en `CategoryDonut`, `MethodBreakdownCard`, `BalanceScreen` y `SettingsScreen`.
- **Datos:** dos claves más en las preferencias clave-valor (`premium.owned` y `premium.trialStart`). Sin migraciones.
- **Play Console:** crear el producto, agregar testers de licencia y, al lanzar, generar códigos promocionales y las recompensas de pre-registro.
- **Privacidad:** el pago lo procesa Google Play y la app no envía datos propios. Revisar si la política y el formulario de Seguridad de los datos deben mencionarlo.
- **Diseño:** maqueta `design/propose/compra-unica.html` (A-1 Duotono, claro y oscuro) antes de implementar.
- **Depende de:** `sitio-politica-privacidad`. Su delta de `settings-menu` debe archivarse antes que el de este cambio.
