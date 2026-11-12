const { writeFileSync, mkdirSync } = require('node:fs');
const { join } = require('node:path');

function validateSecrets(env, publish) {
  const required = ['ANDROID_KEYSTORE_BASE64', 'ANDROID_KEYSTORE_PASSWORD', 'ANDROID_KEY_ALIAS', 'ANDROID_KEY_PASSWORD'];
  if (publish) required.push('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON');
  const missing = required.filter((name) => !env[name]);
  if (missing.length) throw new Error(`Faltan secretos: ${missing.join(', ')}.`);
  if (env.ANDROID_KEY_ALIAS.toLowerCase() === 'androiddebugkey') throw new Error('No se permite la llave debug.');
  if (publish) {
    let account;
    try { account = JSON.parse(env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON); } catch { throw new Error('JSON de Google Play inválido.'); }
    if (account.type !== 'service_account' || !account.client_email || !account.private_key) {
      throw new Error('Se requiere una credencial de cuenta de servicio de Google Play.');
    }
  }
}

function prepareSecrets(env) {
  validateSecrets(env, env.PUBLISH_BETA === 'true');
  const directory = join(env.RUNNER_TEMP, 'kapitaly-signing');
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const key = Buffer.from(env.ANDROID_KEYSTORE_BASE64, 'base64');
  if (!key.length) throw new Error('La llave de subida está vacía.');
  writeFileSync(join(directory, 'upload.jks'), key, { mode: 0o600 });
  if (env.PUBLISH_BETA === 'true') {
    writeFileSync(join(directory, 'google-play.json'), env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON, { mode: 0o600 });
  }
}

if (require.main === module) {
  try { prepareSecrets(process.env); } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
module.exports = { validateSecrets, prepareSecrets };
