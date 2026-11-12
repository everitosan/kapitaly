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
  expect(xml).toContain('android:targetClass="com.kapitaly.expenses.MainActivity"');
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
