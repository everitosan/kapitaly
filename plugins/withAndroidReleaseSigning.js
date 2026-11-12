const { withAppBuildGradle } = require('expo/config-plugins');

const signingVariables = [
  'ANDROID_KEYSTORE_PATH', 'ANDROID_KEYSTORE_PASSWORD', 'ANDROID_KEY_ALIAS', 'ANDROID_KEY_PASSWORD',
];
const start = '// @kapitaly-release-signing start';
const end = '// @kapitaly-release-signing end';

function configureSigning(contents, env = process.env) {
  const provided = signingVariables.filter((name) => env[name]);
  if (provided.length > 0 && provided.length !== signingVariables.length) {
    throw new Error(`Firma Android incompleta: faltan ${signingVariables.filter((name) => !env[name]).join(', ')}.`);
  }
  // El bloque se evalúa después de la configuración de la plantilla y reemplaza
  // su firma debug para release, incluso cuando faltan credenciales.
  const block = `${start}
def kapitalySigningEnv = ${JSON.stringify(signingVariables).replaceAll('"', "'")}
def kapitalyHasSigning = kapitalySigningEnv.every { System.getenv(it) }
android {
    signingConfigs {
        release {
            if (kapitalyHasSigning) {
                storeFile file(System.getenv('ANDROID_KEYSTORE_PATH'))
                storePassword System.getenv('ANDROID_KEYSTORE_PASSWORD')
                keyAlias System.getenv('ANDROID_KEY_ALIAS')
                keyPassword System.getenv('ANDROID_KEY_PASSWORD')
            }
        }
    }
    buildTypes.release.signingConfig = signingConfigs.release
}
gradle.taskGraph.whenReady { graph ->
    if (graph.allTasks.any { it.project == project && it.name.toLowerCase().contains('release') }) {
        if (!kapitalyHasSigning) {
            throw new GradleException('Faltan credenciales de firma Android release.')
        }
        if (System.getenv('ANDROID_KEY_ALIAS').equalsIgnoreCase('androiddebugkey')) {
            throw new GradleException('No se permite la llave debug para release.')
        }
    }
}
${end}`;
  const startIndex = contents.indexOf(start);
  if (startIndex !== -1) {
    const endIndex = contents.indexOf(end, startIndex);
    if (endIndex === -1) throw new Error('Bloque de firma Android incompleto.');
    return contents.slice(0, startIndex) + block + contents.slice(endIndex + end.length);
  }
  return `${contents.trimEnd()}\n\n${block}\n`;
}

module.exports = (config) => withAppBuildGradle(config, (mod) => {
  if (mod.modResults.language !== 'groovy') throw new Error('La firma requiere build.gradle Groovy.');
  mod.modResults.contents = configureSigning(mod.modResults.contents);
  return mod;
});
module.exports.configureSigning = configureSigning;
