const { execFileSync } = require('node:child_process');
const { appendFileSync } = require('node:fs');
const { betaVersion } = require('./beta-version');

function validateRelease({ eventName, ref, inputVersion, baseVersion }, git = (args) =>
  execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()) {
  let tag;
  if (eventName === 'push' && ref.startsWith('refs/tags/')) {
    tag = ref.slice('refs/tags/'.length);
  } else if (eventName === 'workflow_dispatch' && ref.startsWith('refs/heads/release/')) {
    tag = `v${inputVersion}`;
  } else {
    throw new Error('Se requiere un tag beta o ejecución manual sobre una rama release.');
  }
  const beta = betaVersion(tag, baseVersion);
  const branch = `refs/heads/${beta.releaseBranch}`;
  if (eventName === 'workflow_dispatch' && ref !== branch) {
    throw new Error('La rama release no corresponde a la versión solicitada.');
  }
  const commit = git(['rev-parse', '--verify', `${ref}^{commit}`]);
  if (git(['rev-parse', 'HEAD']) !== commit) throw new Error('El checkout no coincide con la referencia solicitada.');
  try {
    git(['merge-base', '--is-ancestor', commit, `refs/remotes/origin/${beta.releaseBranch}`]);
  } catch {
    throw new Error('El commit no pertenece a la rama remota release correspondiente.');
  }
  return { ...beta, tag, commit, publish: eventName === 'push' };
}

if (require.main === module) {
  try {
    const release = validateRelease({
      eventName: process.env.GITHUB_EVENT_NAME,
      ref: process.env.GITHUB_REF || '',
      inputVersion: process.env.INPUT_BETA_VERSION,
      baseVersion: require('../app.json').expo.version,
    });
    if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT,
      `tag=${release.tag}\nversionName=${release.versionName}\nversionCode=${release.versionCode}\npublish=${release.publish}\n`);
    console.log(JSON.stringify(release));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { validateRelease };
