const { appendFileSync } = require('node:fs');

function betaVersion(tag, baseVersion) {
  const segment = '(0|[1-9][0-9]*)';
  const match = new RegExp(`^v${segment}\\.${segment}\\.${segment}-beta\\.([1-9][0-9]*)$`).exec(tag);
  if (!match || match[0] !== tag) throw new Error('La beta debe tener formato vX.Y.Z-beta.N, sin ceros iniciales.');
  const [major, minor, patch, beta] = match.slice(1).map(Number);
  if (![major, minor, patch, beta].every(Number.isSafeInteger)) {
    throw new Error('Los segmentos deben ser enteros seguros.');
  }
  if (minor > 99 || patch > 99) throw new Error('Y y Z deben estar entre 0 y 99.');
  if (beta < 1 || beta > 98) throw new Error('N debe estar entre 1 y 98.');
  const base = `${major}.${minor}.${patch}`;
  if (base !== baseVersion) throw new Error('La versión del tag no coincide con la versión de app.json.');
  const versionCode = major * 1000000 + minor * 10000 + patch * 100 + beta;
  if (!Number.isSafeInteger(versionCode) || versionCode > 2100000000) {
    throw new Error('versionCode supera el límite Android de 2100000000.');
  }
  return { versionName: tag.slice(1), versionCode, releaseBranch: `release/${major}.${minor}.0` };
}

if (require.main === module) {
  try {
    const beta = betaVersion(process.argv[2], require('../app.json').expo.version);
    if (process.env.GITHUB_OUTPUT) {
      appendFileSync(process.env.GITHUB_OUTPUT, `versionName=${beta.versionName}\nversionCode=${beta.versionCode}\n`);
    }
    console.log(JSON.stringify(beta));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { betaVersion };
