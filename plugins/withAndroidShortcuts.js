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

/** Ícono del atajo: "+" en tinta sobre círculo lima (estilo Duotono). Vector, sin PNGs. */
const iconXml = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
  android:width="48dp"
  android:height="48dp"
  android:viewportWidth="48"
  android:viewportHeight="48">
  <path android:fillColor="#C2EE73" android:pathData="M24,0a24,24 0,1 1,0 48a24,24 0,1 1,0 -48z" />
  <path
    android:strokeColor="#141414"
    android:strokeWidth="4"
    android:strokeLineCap="round"
    android:pathData="M24,14V34M14,24H34" />
</vector>
`;

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
      fs.mkdirSync(path.join(res, 'drawable'), { recursive: true });
      fs.writeFileSync(path.join(res, 'xml/shortcuts.xml'), shortcutsXml({ packageName, scheme }));
      fs.writeFileSync(path.join(res, `drawable/${ICON}.xml`), iconXml);
      return mod;
    },
  ]);
};

module.exports = withAndroidShortcuts;
module.exports.shortcutsXml = shortcutsXml;
module.exports.addShortcutsMetaData = addShortcutsMetaData;
module.exports.newExpenseUri = newExpenseUri;
module.exports.SHORTCUT_ID = SHORTCUT_ID;
