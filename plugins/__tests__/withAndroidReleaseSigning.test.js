const { execFileSync } = require('node:child_process');
const { configureSigning } = require('../withAndroidReleaseSigning');

const template = execFileSync('tar', [
  '-xOf', require.resolve('expo/template.tgz'), 'package/android/app/build.gradle',
], { encoding: 'utf8' });
const env = {
  ANDROID_KEYSTORE_PATH: '/tmp/private-upload.jks',
  ANDROID_KEYSTORE_PASSWORD: 'private-store-password',
  ANDROID_KEY_ALIAS: 'private-alias',
  ANDROID_KEY_PASSWORD: 'private-key-password',
};

test('configura la plantilla real sin incrustar secretos', () => {
  const result = configureSigning(template, env);
  for (const value of Object.values(env)) expect(result).not.toContain(value);
  expect(result).toContain("storePassword System.getenv('ANDROID_KEYSTORE_PASSWORD')");
  expect(result).toContain('buildTypes.release.signingConfig = signingConfigs.release');
  expect(result.indexOf('buildTypes.release.signingConfig')).toBeGreaterThan(result.lastIndexOf('signingConfig signingConfigs.debug'));
  expect(configureSigning(result, env)).toBe(result);
});

test('rechaza configuración parcial sin revelar valores', () => {
  expect(() => configureSigning(template, { ANDROID_KEYSTORE_PASSWORD: 'secret' }))
    .toThrow('Firma Android incompleta: faltan ANDROID_KEYSTORE_PATH, ANDROID_KEY_ALIAS, ANDROID_KEY_PASSWORD.');
});

test('sin credenciales permite generar el proyecto pero protege tareas release', () => {
  const result = configureSigning(template, {});
  expect(result).toContain("it.name.toLowerCase().contains('release')");
  expect(result).toContain("throw new GradleException('Faltan credenciales de firma Android release.')");
  expect(result).toContain("equalsIgnoreCase('androiddebugkey')");
  expect(result).toContain('buildTypes.release.signingConfig = signingConfigs.release');
});
