const { mkdtempSync, readFileSync, statSync, existsSync, rmSync } = require('node:fs');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const { validateSecrets, prepareSecrets } = require('../prepare-android-secrets');

const signing = {
  ANDROID_KEYSTORE_BASE64: Buffer.from('fake-keystore').toString('base64'),
  ANDROID_KEYSTORE_PASSWORD: 'test-store-password', ANDROID_KEY_ALIAS: 'upload', ANDROID_KEY_PASSWORD: 'test-key-password',
};
test('modo manual no requiere credencial de Play', () => expect(() => validateSecrets(signing, false)).not.toThrow());
test('modo publicación requiere credencial de Play', () => expect(() => validateSecrets(signing, true)).toThrow('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON'));
test('rechaza firma incompleta e indica solo el nombre del secreto', () => {
  expect(() => validateSecrets({ ...signing, ANDROID_KEY_PASSWORD: '' }, false)).toThrow('Faltan secretos: ANDROID_KEY_PASSWORD.');
});
test('rechaza cuenta inválida sin imprimir su contenido', () => {
  expect(() => validateSecrets({ ...signing, GOOGLE_PLAY_SERVICE_ACCOUNT_JSON: 'private-value' }, true)).toThrow('JSON de Google Play inválido.');
});
test('rechaza alias debug', () => {
  expect(() => validateSecrets({ ...signing, ANDROID_KEY_ALIAS: 'androiddebugkey' }, false)).toThrow('llave debug');
});
test.each([false, true])('crea únicamente los archivos necesarios con permisos restringidos: publish=%s', (publish) => {
  const directory = mkdtempSync(join(tmpdir(), 'kapitaly-secret-test-'));
  const account = JSON.stringify({ type: 'service_account', client_email: 'test@example.invalid', private_key: 'fake' });
  try {
    prepareSecrets({ ...signing, RUNNER_TEMP: directory, PUBLISH_BETA: String(publish), GOOGLE_PLAY_SERVICE_ACCOUNT_JSON: account });
    const key = join(directory, 'kapitaly-signing/upload.jks');
    expect(readFileSync(key, 'utf8')).toBe('fake-keystore');
    expect(statSync(key).mode & 0o777).toBe(0o600);
    expect(statSync(join(directory, 'kapitaly-signing')).mode & 0o777).toBe(0o700);
    expect(existsSync(join(directory, 'kapitaly-signing/google-play.json'))).toBe(publish);
    if (publish) expect(statSync(join(directory, 'kapitaly-signing/google-play.json')).mode & 0o777).toBe(0o600);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
