const fs = require('node:fs');
const path = require('node:path');
const {
  AndroidConfig,
  withAndroidManifest,
  withDangerousMod,
  withStringsXml,
} = require('expo/config-plugins');

/** Atajo "Nuevo gasto": mismo id y destino que el acceso directo fijado desde Ajustes. */
const SHORTCUT_ID = 'new-expense';
const ICON = 'shortcut_new_expense';
const STRINGS = {
  shortcut_new_expense_short: 'Nuevo gasto',
  shortcut_new_expense_long: 'Agregar un gasto nuevo',
};

const newExpenseUri = (scheme) => `${scheme}://expense/new?quick=1`;

/**
 * Los atajos estáticos se lanzan con FLAG_ACTIVITY_CLEAR_TASK; apuntan a la trampolín del módulo
 * kapitaly-shortcuts para no destruir la app si ya está abierta.
 */
const TRAMPOLINE = 'expo.modules.kapitalyshortcuts.ShortcutTrampolineActivity';

function shortcutsXml({ packageName, scheme }) {
  return `<?xml version="1.0" encoding="utf-8"?>
<shortcuts xmlns:android="http://schemas.android.com/apk/res/android">
  <shortcut
    android:shortcutId="${SHORTCUT_ID}"
    android:enabled="true"
    android:icon="@drawable/${ICON}"
    android:shortcutShortLabel="@string/shortcut_new_expense_short"
    android:shortcutLongLabel="@string/shortcut_new_expense_long">
    <intent
      android:action="android.intent.action.VIEW"
      android:targetPackage="${packageName}"
      android:targetClass="${TRAMPOLINE}"
      android:data="${newExpenseUri(scheme)}" />
  </shortcut>
</shortcuts>
`;
}

/**
 * Geometría del ícono (design/link-expeneses.svg, lienzo de 108 de los íconos adaptativos). Réplica
 * de src/ui/shortcutIconArt.ts; una prueba comprueba que coincidan.
 */
const ICON_ART = {
  canvas: 108,
  center: 54,
  visible: 72,
  safeRadius: 33,
  background: '#020903',
  field: {
    cx: 76.5,
    cy: 76.5,
    r: 62.5,
    gradient: { top: '#328844', bottom: '#063D12' },
  },
  wallet: {
    stroke: '#0A2F11',
    transform: { scale: 0.13, translateX: 25.01, translateY: 25.92 },
    paths: [
      {
        d: 'M67.1819 153H275.649C324.785 153 349.353 153 364.618 168.816C379.883 184.633 379.883 210.089 379.883 261V279C379.883 329.911 379.883 355.367 364.618 371.183C349.353 387 324.785 387 275.649 387H171.416C122.279 387 97.7113 387 82.4466 371.183C67.1819 355.367 67.1819 329.911 67.1819 279V153Z',
        strokeWidth: 18,
      },
      {
        d: 'M275.649 152.97V73.9854C275.649 57.9773 263.124 45 247.675 45C243.226 45 238.841 46.0994 234.884 48.2072L80.4248 130.487C72.2935 134.818 67.1819 143.497 67.1819 152.97',
        strokeWidth: 18,
      },
      {
        d: 'M316.051 295.055C326.999 295.055 335.876 285.856 335.876 274.513C335.876 263.17 326.999 253.971 316.051 253.971M316.051 295.055C305.103 295.055 296.226 285.856 296.226 274.513C296.226 263.17 305.103 253.971 316.051 253.971M316.051 295.055V253.971',
        strokeWidth: 8,
      },
    ],
  },
};

const argb = (hex) => `#FF${hex.slice(1).toUpperCase()}`;
const circlePath = (cx, cy, r) =>
  `M${cx},${cy - r}a${r},${r} 0 1 1 0,${2 * r}a${r},${r} 0 1 1 0,${-2 * r}z`;

/** Fondo oscuro y campo verde con degradado (coordenadas de 108). */
function backgroundPaths() {
  const { background, field } = ICON_ART;
  return `  <path android:fillColor="${background}" android:pathData="M0,0h108v108h-108z" />
  <path android:pathData="${circlePath(field.cx, field.cy, field.r)}">
    <aapt:attr name="android:fillColor">
      <gradient
        android:type="linear"
        android:startX="${field.cx}" android:startY="${field.cy - field.r}"
        android:endX="${field.cx}" android:endY="${field.cy + field.r}"
        android:startColor="${argb(field.gradient.top)}"
        android:endColor="${argb(field.gradient.bottom)}" />
    </aapt:attr>
  </path>`;
}

/** Cartera: las rutas del SVG en un grupo que las lleva de 432 a 108, dentro de la zona segura. */
function walletGroup() {
  const { stroke, transform, paths } = ICON_ART.wallet;
  const strokes = paths
    .map(
      (p) => `    <path
      android:pathData="${p.d}"
      android:strokeColor="${stroke}"
      android:strokeWidth="${p.strokeWidth}"
      android:strokeLineCap="round"
      android:strokeLineJoin="round" />`,
    )
    .join('\n');
  return `  <group
    android:scaleX="${transform.scale}"
    android:scaleY="${transform.scale}"
    android:translateX="${transform.translateX}"
    android:translateY="${transform.translateY}">
${strokes}
  </group>`;
}

const VECTOR_OPEN = (size, viewport) => `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
  xmlns:aapt="http://schemas.android.com/aapt"
  android:width="${size}dp"
  android:height="${size}dp"
  android:viewportWidth="${viewport}"
  android:viewportHeight="${viewport}">`;

/** Capa de fondo del ícono adaptativo: oscuro y campo verde (la esquina oscura queda arriba a la izquierda). */
const backgroundXml = () => `${VECTOR_OPEN(108, ICON_ART.canvas)}
${backgroundPaths()}
</vector>
`;

/** Capa de frente: la cartera dentro de la zona segura. */
const foregroundXml = () => `${VECTOR_OPEN(108, ICON_ART.canvas)}
${walletGroup()}
</vector>
`;

/** Ícono adaptativo (API 26+): el launcher le aplica su forma. */
const adaptiveXml = () => `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <background android:drawable="@drawable/${ICON}_background" />
  <foreground android:drawable="@drawable/${ICON}_foreground" />
</adaptive-icon>
`;

/**
 * Respaldo para Android 7 (API 24–25, sin íconos adaptativos): el mismo dibujo recortado al área
 * visible con un cuadro redondeado (el campo verde no debe pintar las esquinas).
 */
const legacyXml = () => {
  const offset = (ICON_ART.canvas - ICON_ART.visible) / 2;
  const a = offset;
  const b = ICON_ART.canvas - offset;
  const r = 14;
  const roundedSquare = `M${a + r},${a}H${b - r}A${r},${r} 0 0 1 ${b},${a + r}V${b - r}A${r},${r} 0 0 1 ${b - r},${b}H${a + r}A${r},${r} 0 0 1 ${a},${b - r}V${a + r}A${r},${r} 0 0 1 ${a + r},${a}z`;
  return `${VECTOR_OPEN(48, ICON_ART.visible)}
  <group android:translateX="${-offset}" android:translateY="${-offset}">
  <clip-path android:pathData="${roundedSquare}" />
${backgroundPaths()}
${walletGroup()}
  </group>
</vector>
`;
};

/** Recursos del ícono, por ruta relativa a `res/`. Mismo nombre que antes: el código nativo no cambia. */
const iconResources = () => ({
  [`drawable/${ICON}_background.xml`]: backgroundXml(),
  [`drawable/${ICON}_foreground.xml`]: foregroundXml(),
  [`drawable-anydpi-v26/${ICON}.xml`]: adaptiveXml(),
  [`drawable/${ICON}.xml`]: legacyXml(),
});

/** Agrega el meta-data de atajos a la actividad principal (idempotente). */
function addShortcutsMetaData(manifest) {
  const activity = AndroidConfig.Manifest.getMainActivityOrThrow(manifest);
  activity['meta-data'] = (activity['meta-data'] ?? []).filter(
    (m) => m.$['android:name'] !== 'android.app.shortcuts',
  );
  activity['meta-data'].push({
    $: { 'android:name': 'android.app.shortcuts', 'android:resource': '@xml/shortcuts' },
  });
  return manifest;
}

function requireConfig(config) {
  const packageName = config.android?.package;
  const scheme = Array.isArray(config.scheme) ? config.scheme[0] : config.scheme;
  if (!packageName || !scheme) throw new Error('Los atajos requieren android.package y scheme.');
  return { packageName, scheme };
}

const withAndroidShortcuts = (config) => {
  const { packageName, scheme } = requireConfig(config);
  config = withStringsXml(config, (mod) => {
    for (const [name, value] of Object.entries(STRINGS))
      mod.modResults = AndroidConfig.Strings.setStringItem(
        [{ $: { name }, _: value }],
        mod.modResults,
      );
    return mod;
  });
  config = withAndroidManifest(config, (mod) => {
    mod.modResults = addShortcutsMetaData(mod.modResults);
    return mod;
  });
  return withDangerousMod(config, [
    'android',
    async (mod) => {
      const res = path.join(mod.modRequest.platformProjectRoot, 'app/src/main/res');
      fs.mkdirSync(path.join(res, 'xml'), { recursive: true });
      fs.writeFileSync(path.join(res, 'xml/shortcuts.xml'), shortcutsXml({ packageName, scheme }));
      for (const [file, xml] of Object.entries(iconResources())) {
        fs.mkdirSync(path.dirname(path.join(res, file)), { recursive: true });
        fs.writeFileSync(path.join(res, file), xml);
      }
      return mod;
    },
  ]);
};

module.exports = withAndroidShortcuts;
module.exports.shortcutsXml = shortcutsXml;
module.exports.addShortcutsMetaData = addShortcutsMetaData;
module.exports.newExpenseUri = newExpenseUri;
module.exports.SHORTCUT_ID = SHORTCUT_ID;
module.exports.TRAMPOLINE = TRAMPOLINE;
module.exports.ICON_ART = ICON_ART;
module.exports.iconResources = iconResources;
