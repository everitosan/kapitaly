const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { execFileSync } = require('node:child_process');
const { validateRelease } = require('../validate-beta-release');

let directory;
let git;
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'kapitaly-release-test-'));
  git = (args) => execFileSync('git', args, { cwd: directory, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  git(['init', '--initial-branch=main']);
  git(['config', 'user.name', 'Test']);
  git(['config', 'user.email', 'test@example.invalid']);
  git(['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '--allow-empty', '-m', 'initial']);
  git(['update-ref', 'refs/remotes/origin/release/0.1.0', 'HEAD']);
  git(['branch', 'release/0.1.0']);
  git(['tag', '-a', 'v0.1.0-beta.2', '-m', 'beta', '--no-sign']);
});
afterEach(() => rmSync(directory, { recursive: true, force: true }));
const push = { eventName: 'push', ref: 'refs/tags/v0.1.0-beta.2', baseVersion: '0.1.0' };
test('acepta tag anotado sobre rama remota release', () => {
  expect(validateRelease(push, git)).toMatchObject({ publish: true, versionCode: 10002 });
});
test('modo manual no publica', () => {
  expect(validateRelease({ eventName: 'workflow_dispatch', ref: 'refs/heads/release/0.1.0', inputVersion: '0.1.0-beta.1', baseVersion: '0.1.0' }, git))
    .toMatchObject({ publish: false, versionCode: 10001 });
});
test('rechaza commit fuera de release', () => {
  git(['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '--allow-empty', '-m', 'outside']);
  git(['tag', '-f', 'v0.1.0-beta.2']);
  expect(() => validateRelease(push, git)).toThrow('no pertenece');
});
test('rechaza checkout distinto del tag', () => {
  git(['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '--allow-empty', '-m', 'different']);
  expect(() => validateRelease(push, git)).toThrow('checkout');
});
test.each([
  { ...push, baseVersion: '0.2.0' },
  { ...push, ref: 'refs/tags/v0.1.0' },
  { ...push, ref: 'refs/tags/v0.1.0-beta.2$(touch /tmp/injected)' },
  { eventName: 'workflow_dispatch', ref: 'refs/heads/main', inputVersion: '0.1.0-beta.1', baseVersion: '0.1.0' },
  { eventName: 'workflow_dispatch', ref: 'refs/heads/release/0.2.0', inputVersion: '0.1.0-beta.1', baseVersion: '0.1.0' },
])('rechaza entrada inválida %#', (input) => {
  expect(() => validateRelease(input, git)).toThrow();
});
