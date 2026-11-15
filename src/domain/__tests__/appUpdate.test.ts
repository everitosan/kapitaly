import {
  INITIAL_UPDATE_STATE,
  reduceUpdate,
  updateBanner,
  versionNameFromCode,
  type UpdateEvent,
  type UpdateState,
} from '../appUpdate';

const run = (...events: UpdateEvent[]): UpdateState =>
  events.reduce(reduceUpdate, INITIAL_UPDATE_STATE);
const available = (code = 10007): UpdateEvent => ({
  type: 'checked',
  check: { status: 'available', availableVersionCode: code },
});

describe('versionNameFromCode', () => {
  it.each([
    [10007, '0.1.0-beta.7'],
    [10099, '0.1.0'],
    [1020398, '1.2.3-beta.98'],
    [10000, null],
    [0, null],
    [null, null],
    [1.5, null],
  ])('%p -> %p', (code, name) => {
    expect(versionNameFromCode(code)).toBe(name);
  });
});

describe('aviso de actualización', () => {
  it('sin actualización no muestra nada', () => {
    const state = run({ type: 'checked', check: { status: 'none', availableVersionCode: null } });
    expect(updateBanner(state)).toBeNull();
  });

  it('hay versión nueva: "Nueva versión disponible" con su nombre', () => {
    expect(updateBanner(run(available()))).toEqual({
      kind: 'available',
      versionName: '0.1.0-beta.7',
    });
  });

  it('descargando muestra el porcentaje redondeado', () => {
    const state = run(available(), { type: 'progress', bytesDownloaded: 45, totalBytes: 100 });
    expect(updateBanner(state)).toEqual({ kind: 'downloading', percent: 45 });
    expect(
      updateBanner(reduceUpdate(state, { type: 'progress', bytesDownloaded: 1, totalBytes: 3 })),
    ).toEqual({ kind: 'downloading', percent: 33 });
  });

  it('cancelar la confirmación o un fallo vuelve a ofrecerla', () => {
    const state = run(
      available(),
      { type: 'progress', bytesDownloaded: 10, totalBytes: 100 },
      {
        type: 'canceled',
      },
    );
    expect(updateBanner(state)).toEqual({ kind: 'available', versionName: '0.1.0-beta.7' });
  });

  it('al terminar: "Lista para instalar", y no se puede ocultar', () => {
    const state = run(available(), { type: 'downloaded' }, { type: 'dismissed' });
    expect(updateBanner(state)).toEqual({ kind: 'downloaded' });
  });

  it('descarga terminada fuera de la app: al consultar sale lista para instalar', () => {
    const state = run({
      type: 'checked',
      check: { status: 'downloaded', availableVersionCode: 10007 },
    });
    expect(updateBanner(state)).toEqual({ kind: 'downloaded' });
  });

  it('la [x] oculta "Nueva versión disponible" en esta apertura', () => {
    const state = run(available(), { type: 'dismissed' }, available());
    expect(updateBanner(state)).toBeNull();
    // Nueva apertura: el estado empieza de cero.
    expect(updateBanner(run(available()))).not.toBeNull();
  });
});
