const { readFileSync } = require('node:fs');
const { join } = require('node:path');
// js-yaml llega con Jest (istanbul); basta para validar la estructura del workflow.
const yaml = require('js-yaml');

const workflow = yaml.load(readFileSync(join(__dirname, '../../.github/workflows/android-beta.yml'), 'utf8'));
const steps = workflow.jobs.beta.steps;
const index = (name) => steps.findIndex((step) => step.name === name);
const step = (name) => steps[index(name)];

test('solo se dispara con tags beta y ejecución manual', () => {
  expect(Object.keys(workflow.on).sort()).toEqual(['push', 'workflow_dispatch']);
  expect(workflow.on.push).toEqual({ tags: ['v*-beta.*'] });
});

test('fija cada acción a un SHA completo', () => {
  for (const { uses } of steps.filter((s) => s.uses)) expect(uses).toMatch(/@[0-9a-f]{40}$/);
});

test('valida, prueba, revisa tipos y lint antes de compilar', () => {
  const build = index('Generate and build Android');
  for (const name of ['Validate version and release branch', 'Install dependencies', 'Tests', 'Typecheck', 'Lint',
    'Prepare signing credentials']) {
    expect(index(name)).toBeGreaterThanOrEqual(0);
    expect(index(name)).toBeLessThan(build);
  }
  expect(step('Install dependencies').run).toBe('npm ci');
});

test('publica solo en modo tag, a la pista interna y sin cancelar ejecuciones', () => {
  const publish = step('Publish to internal testing');
  expect(publish.if).toBe("steps.release.outputs.publish == 'true'");
  expect(publish.with).toMatchObject({ packageName: 'com.kapitaly.expenses', tracks: 'internal' });
  expect(workflow.concurrency['cancel-in-progress']).toBe(false);
  expect(step('Prepare signing credentials').env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON).toContain("publish == 'true'");
});

test('verifica la firma, limita el artefacto y siempre borra credenciales', () => {
  expect(index('Verify upload signature')).toBeLessThan(index('Save signed bundle'));
  expect(step('Save signed bundle').with['retention-days']).toBeLessThanOrEqual(7);
  const cleanup = steps.at(-1);
  expect(cleanup.if).toBe('always()');
  expect(cleanup.run).toContain('kapitaly-signing');
  expect(workflow.permissions).toEqual({ contents: 'read' });
});

test('no pasa la entrada manual directo al shell', () => {
  for (const { run = '' } of steps) expect(run).not.toContain('${{');
});
