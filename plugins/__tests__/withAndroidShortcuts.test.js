const { addShortcutsMetaData, newExpenseUri, shortcutsXml } = require('../withAndroidShortcuts');

const manifest = () => ({
  manifest: {
    application: [
      {
        activity: [
          {
            $: { 'android:name': '.MainActivity' },
            'intent-filter': [
              {
                action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }],
                category: [{ $: { 'android:name': 'android.intent.category.LAUNCHER' } }],
              },
            ],
          },
        ],
      },
    ],
  },
});

test('el atajo abre el formulario en modo rápido dentro de la app', () => {
  const xml = shortcutsXml({ packageName: 'com.kapitaly.expenses', scheme: 'kapitalyexpenses' });
  expect(xml).toContain('android:shortcutId="new-expense"');
  expect(xml).toContain('android:data="kapitalyexpenses://expense/new?quick=1"');
  expect(xml).toContain('android:targetPackage="com.kapitaly.expenses"');
  // A la trampolín: Android lanza los atajos con CLEAR_TASK y destruiría la app abierta.
  expect(xml).toContain(
    'android:targetClass="expo.modules.kapitalyshortcuts.ShortcutTrampolineActivity"',
  );
  expect(xml).toContain('android:shortcutShortLabel="@string/shortcut_new_expense_short"');
  expect(newExpenseUri('x')).toBe('x://expense/new?quick=1');
});

test('agrega el meta-data de atajos a la actividad principal sin duplicarlo', () => {
  const once = addShortcutsMetaData(manifest());
  const twice = addShortcutsMetaData(once);
  const meta = twice.manifest.application[0].activity[0]['meta-data'];
  expect(meta).toEqual([
    { $: { 'android:name': 'android.app.shortcuts', 'android:resource': '@xml/shortcuts' } },
  ]);
});

describe('ícono del acceso directo', () => {
  const { ICON_ART, iconResources } = require('../withAndroidShortcuts');
  const files = iconResources();

  test('genera el ícono adaptativo, sus capas y el respaldo con el mismo nombre de recurso', () => {
    expect(Object.keys(files).sort()).toEqual([
      'drawable-anydpi-v26/shortcut_new_expense.xml',
      'drawable/shortcut_new_expense.xml',
      'drawable/shortcut_new_expense_background.xml',
      'drawable/shortcut_new_expense_foreground.xml',
    ]);
    const adaptive = files['drawable-anydpi-v26/shortcut_new_expense.xml'];
    expect(adaptive).toContain('<adaptive-icon');
    expect(adaptive).toContain(
      '<background android:drawable="@drawable/shortcut_new_expense_background" />',
    );
    expect(adaptive).toContain(
      '<foreground android:drawable="@drawable/shortcut_new_expense_foreground" />',
    );
  });

  test('fondo: oscuro de la marca y campo verde con degradado', () => {
    const bg = files['drawable/shortcut_new_expense_background.xml'];
    expect(bg).toContain('android:viewportWidth="108"');
    expect(bg).toContain('android:fillColor="#020903"');
    expect(bg.match(/<gradient/g)).toHaveLength(1);
    expect(bg).toContain('android:startColor="#FF328844"');
    expect(bg).toContain('android:endColor="#FF063D12"');
    expect(bg).not.toContain('#C2EE73');
  });

  test('frente: la cartera escalada a la zona segura', () => {
    const fg = files['drawable/shortcut_new_expense_foreground.xml'];
    expect(fg).toContain('android:scaleX="0.13"');
    expect(fg).toContain('android:translateX="25.01"');
    for (const p of ICON_ART.wallet.paths) expect(fg).toContain(`android:pathData="${p.d}"`);
    expect(fg).toContain('android:strokeColor="#0A2F11"');
    expect(fg).not.toContain('<gradient');
  });

  test('el respaldo de Android 7 recorta el dibujo al área visible con un cuadro redondeado', () => {
    const legacy = files['drawable/shortcut_new_expense.xml'];
    expect(legacy).toContain('android:viewportWidth="72"');
    expect(legacy).toContain('android:translateX="-18"');
    expect(legacy).toContain('<clip-path');
    expect(legacy).toContain('android:fillColor="#020903"');
    expect(legacy).toContain('android:scaleX="0.13"');
  });

  test('la geometría coincide con src/ui/shortcutIconArt.ts', () => {
    const { SHORTCUT_ICON } = require('../../src/ui/shortcutIconArt');
    expect(JSON.parse(JSON.stringify(ICON_ART))).toEqual(JSON.parse(JSON.stringify(SHORTCUT_ICON)));
  });
});
