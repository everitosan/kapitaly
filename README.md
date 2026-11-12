# Kapitaly Expenses

Primera app de la suite **Kapitaly**: registro de gastos recurrentes y únicos, métodos de pago y el balance del mes. Funciona 100% sin conexión (SQLite en el dispositivo).

- Planeación (OpenSpec): `openspec/changes/gastos-recurrentes-v1/` (proposal, specs, design, tasks).
- Maqueta aprobada del sistema de diseño "A-1 Duotono": `design/propose/a-1-duotono.html`.

## Requisitos

- Node.js 20 o superior.
- En el teléfono, **Expo Go** de la versión compatible con el SDK 58 (todas las dependencias nativas vienen incluidas en Expo Go).

## Correr la app

```bash
npm install
npx expo start            # escanea el QR con Expo Go (teléfono y computadora en la misma red)
npx expo start --tunnel   # si el teléfono está en otra red
```

Pantalla de muestra del sistema de diseño: en modo desarrollo, al final del balance aparece el enlace "Catálogo de componentes (desarrollo)" (ruta `/dev/components`). No se muestra en builds de producción.

## Pruebas y calidad

```bash
npm test             # Jest: dominio, repositorios (en memoria y SQLite con better-sqlite3) e interfaz
npm run typecheck    # TypeScript estricto
npm run lint         # ESLint (incluye la regla de pureza de src/domain)
npm run format       # Prettier
```

## Betas en Google Play

Las betas de Android se compilan, firman y publican en la pista de prueba interna con GitHub Actions al crear un tag `vX.Y.Z-beta.N` sobre `release/X.Y.0`. Guía completa (versiones, llave de subida, secretos, cuenta de servicio): [`docs/android-beta.md`](docs/android-beta.md).

## Estructura

```
src/app/        rutas de expo-router (pantallas delgadas)
src/features/   pantallas y lógica de UI (balance, gastos, métodos de pago) + hooks de repositorios
src/ui/         sistema de diseño: tokens (theme.ts), ThemeProvider y componentes
src/data/       repositorios (interfaces, en memoria, SQLite), esquema, catálogo de instituciones
src/domain/     TypeScript puro: fechas civiles, dinero en centavos, entidades, reglas y balance
drizzle/        migraciones SQL generadas por drizzle-kit
```

## Migraciones

El esquema vive en `src/data/sqlite/schema.ts`. Después de cambiarlo:

```bash
npx drizzle-kit generate --name <descripcion>
```

Nunca edites una migración ya publicada: agrega una nueva. Las migraciones se aplican al abrir la app y en las pruebas.
