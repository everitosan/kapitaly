const { readFileSync } = require('node:fs');
const { join } = require('node:path');

// Play acepta hasta 500 caracteres por idioma. El idioma predeterminado de la ficha es inglés.
const MAX_LENGTH = 500;
const LOCALE = 'en-US';

function releaseNotesDir(versionName) {
  return join('release-notes', versionName);
}

function checkReleaseNotes(versionName, root = join(__dirname, '..'), read = readFileSync) {
  const file = join(releaseNotesDir(versionName), `whatsnew-${LOCALE}`);
  let text;
  try {
    text = read(join(root, file), 'utf8').trim();
  } catch {
    throw new Error(`Faltan las notas de la versión: crea ${file}.`);
  }
  if (!text) throw new Error(`Las notas de la versión están vacías: ${file}.`);
  const length = [...text].length;
  if (length > MAX_LENGTH) {
    throw new Error(
      `Las notas de la versión tienen ${length} caracteres; Play acepta ${MAX_LENGTH}: ${file}.`,
    );
  }
  return { file, length };
}

if (require.main === module) {
  try {
    const result = checkReleaseNotes(process.argv[2]);
    console.log(`${result.file}: ${result.length}/${MAX_LENGTH} caracteres`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { checkReleaseNotes, releaseNotesDir, MAX_LENGTH, LOCALE };
