const { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { checkReleaseNotes, MAX_LENGTH } = require('../release-notes');

let root;
const write = (text) => {
  mkdirSync(join(root, 'release-notes', '0.1.0-beta.9'), { recursive: true });
  writeFileSync(join(root, 'release-notes', '0.1.0-beta.9', 'whatsnew-en-US'), text);
};
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'kapitaly-notes-test-'));
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

test('acepta notas dentro del límite de Play', () => {
  write('Bug fixes.\n');
  expect(checkReleaseNotes('0.1.0-beta.9', root)).toEqual({
    file: join('release-notes', '0.1.0-beta.9', 'whatsnew-en-US'),
    length: 10,
  });
});

test('rechaza notas faltantes, vacías o largas', () => {
  expect(() => checkReleaseNotes('0.1.0-beta.9', root)).toThrow('Faltan');
  write('  \n');
  expect(() => checkReleaseNotes('0.1.0-beta.9', root)).toThrow('vacías');
  write('a'.repeat(MAX_LENGTH + 1));
  expect(() => checkReleaseNotes('0.1.0-beta.9', root)).toThrow('500');
});

test('las notas guardadas en el repo cumplen el límite', () => {
  for (const version of readdirSync(join(__dirname, '../../release-notes'), {
    withFileTypes: true,
  })) {
    if (version.isDirectory()) expect(() => checkReleaseNotes(version.name)).not.toThrow();
  }
});
