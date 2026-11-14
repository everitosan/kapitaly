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
      android:targetClass="${packageName}.MainActivity"
      android:data="${newExpenseUri(scheme)}" />
  </shortcut>
</shortcuts>
`;
}

/**
 * Geometría del ícono (lienzo de 108 de los íconos adaptativos). Réplica de
 * src/ui/shortcutIconArt.ts; una prueba comprueba que coincidan.
 */
const ICON_ART = {
  canvas: 108,
  center: 54,
  visible: 72,
  safeRadius: 33,
  background: '#020903',
  gradient: { top: '#328844', bottom: '#063D12' },
  circleRadii: [33, 27, 20.5],
  wallet: {
    stroke: '#0A3315',
    strokeWidth: 2.38,
    paths: [
      'M44.9,50.5L57.64,44.06A1.82,1.82 0 0 1 60.3,45.74V50.5',
      'M44.9,50.5h15.68a3.92,3.92 0 0 1 3.92,3.92v7.56a3.92,3.92 0 0 1 -3.92,3.92H48.82a3.92,3.92 0 0 1 -3.92,-3.92z',
    ],
    clasp: { cx: 59.88, cy: 58.2, r: 1.55, strokeWidth: 1.1, line: 'M59.88,56.65v3.1' },
  },
};

const argb = (hex) => `#FF${hex.slice(1).toUpperCase()}`;
const circlePath = (cx, cy, r) =>
  `M${cx},${cy - r}a${r},${r} 0 1 1 0,${2 * r}a${r},${r} 0 1 1 0,${-2 * r}z`;

/** Círculos con degradado y cartera: el contenido de la capa de frente (coordenadas de 108). */
function foregroundPaths() {
  const { center: c, gradient, circleRadii, wallet } = ICON_ART;
  const circles = circleRadii.map(
    (r) => `  <path android:pathData="${circlePath(c, c, r)}">
    <aapt:attr name="android:fillColor">
      <gradient
        android:type="linear"
        android:startX="${c}" android:startY="${c - r}"
        android:endX="${c}" android:endY="${c + r}"
        android:startColor="${argb(gradient.top)}"
        android:endColor="${argb(gradient.bottom)}" />
    </aapt:attr>
  </path>`,
  );
  const stroke = (pathData, width) => `  <path
    android:pathData="${pathData}"
    android:strokeColor="${wallet.stroke}"
    android:strokeWidth="${width}"
    android:strokeLineCap="round"
    android:strokeLineJoin="round" />`;
  const { clasp } = wallet;
  return [
    ...circles,
    ...wallet.paths.map((d) => stroke(d, wallet.strokeWidth)),
    stroke(circlePath(clasp.cx, clasp.cy, clasp.r), clasp.strokeWidth),
    stroke(clasp.line, clasp.strokeWidth),
  ].join('\n');
}

const VECTOR_OPEN = (size, viewport) => `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
  xmlns:aapt="http://schemas.android.com/aapt"
  android:width="${size}dp"
  android:height="${size}dp"
  android:viewportWidth="${viewport}"
  android:viewportHeight="${viewport}">`;

/** Capa de fondo del ícono adaptativo: todo el lienzo en el color de la marca. */
const backgroundXml = () => `${VECTOR_OPEN(108, ICON_ART.canvas)}
  <path android:fillColor="${ICON_ART.background}" android:pathData="M0,0h108v108h-108z" />
</vector>
`;

/** Capa de frente: círculos y cartera dentro de la zona segura. */
const foregroundXml = () => `${VECTOR_OPEN(108, ICON_ART.canvas)}
${foregroundPaths()}
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
 * visible, sobre un cuadro oscuro redondeado.
 */
const legacyXml = () => {
  const offset = (ICON_ART.canvas - ICON_ART.visible) / 2;
  return `${VECTOR_OPEN(48, ICON_ART.visible)}
  <path android:fillColor="${ICON_ART.background}"
    android:pathData="M14,0h44a14,14 0 0 1 14,14v44a14,14 0 0 1 -14,14h-44a14,14 0 0 1 -14,-14v-44a14,14 0 0 1 14,-14z" />
  <group android:translateX="${-offset}" android:translateY="${-offset}">
${foregroundPaths()}
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
module.exports.ICON_ART = ICON_ART;
module.exports.iconResources = iconResources;
