const { betaVersion } = require('../beta-version');
const configure = require('../../app.config');
const { expo } = require('../../app.json');

describe('versionado beta', () => {
  test('calcula versión, código y rama', () => {
    expect(betaVersion('v0.1.0-beta.2', '0.1.0')).toEqual({
      versionName: '0.1.0-beta.2', versionCode: 10002, releaseBranch: 'release/0.1.0',
    });
  });
  test('mantiene orden entre betas y versiones', () => {
    const codes = ['0.1.0-beta.9', '0.1.1-beta.1', '1.0.0-beta.1'].map((value) =>
      betaVersion(`v${value}`, value.split('-')[0]).versionCode);
    expect(codes).toEqual([10009, 10101, 1000001]);
  });
  test.each([
    ['v0.1.0-beta.0', '0.1.0'], ['v0.1.0-beta.99', '0.1.0'],
    ['v0.1.0-beta.01', '0.1.0'], ['v00.1.0-beta.1', '0.1.0'],
    ['v0.1.0', '0.1.0'], ['v0.1.0-beta.1\n', '0.1.0'],
    ['v0.1.0-beta.1;touch /tmp/injected', '0.1.0'],
    ['v0.100.0-beta.1', '0.100.0'], ['v0.1.100-beta.1', '0.1.100'],
    ['v2100.0.0-beta.1', '2100.0.0'], ['v9007199254740992.0.0-beta.1', '9007199254740992.0.0'],
    ['v0.2.0-beta.1', '0.1.0'],
  ])('rechaza %s con base %s', (tag, base) => {
    expect(() => betaVersion(tag, base)).toThrow();
  });
  test('admite los extremos de segmentos sin colisiones', () => {
    expect(betaVersion('v0.99.99-beta.98', '0.99.99').versionCode).toBe(999998);
    expect(betaVersion('v1.0.0-beta.1', '1.0.0').versionCode).toBe(1000001);
  });
});

describe('configuración Expo', () => {
  const original = process.env.KAPITALY_BETA_TAG;
  afterEach(() => {
    if (original === undefined) delete process.env.KAPITALY_BETA_TAG;
    else process.env.KAPITALY_BETA_TAG = original;
  });
  test('preserva configuración de desarrollo', () => {
    delete process.env.KAPITALY_BETA_TAG;
    expect(configure({ config: expo })).toEqual(expo);
  });
  test('solo cambia la versión de beta y código Android', () => {
    process.env.KAPITALY_BETA_TAG = 'v0.1.0-beta.2';
    expect(configure({ config: expo })).toEqual({
      ...expo, version: '0.1.0-beta.2', android: { ...expo.android, versionCode: 10002 },
    });
  });
});
