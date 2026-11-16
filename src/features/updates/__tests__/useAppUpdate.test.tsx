import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { AppState } from 'react-native';

import type {
  NativeUpdateCheck,
  NativeUpdateProgress,
} from '../../../../modules/kapitaly-shortcuts';
import { renderWithProviders } from '../../testUtils';
import { UpdateBanner } from '../UpdateBanner';
import { PLAY_STORE_URLS, useAppUpdate, type AppUpdateDeps } from '../useAppUpdate';

function fakeUpdates(
  check: NativeUpdateCheck,
  start: 'started' | 'canceled' | 'failed' = 'started',
) {
  const listeners = new Set<(p: NativeUpdateProgress) => void>();
  let current = check;
  return {
    setCheck: (next: NativeUpdateCheck) => {
      current = next;
    },
    emit: (p: NativeUpdateProgress) => listeners.forEach((l) => l(p)),
    deps: {
      checkUpdate: jest.fn(async () => current),
      startFlexibleUpdate: jest.fn(async () => start),
      completeUpdate: jest.fn(),
      onUpdateProgress: (l: (p: NativeUpdateProgress) => void) => {
        listeners.add(l);
        return () => listeners.delete(l);
      },
    },
  };
}

function Harness(props: AppUpdateDeps) {
  const { banner, update, restart, dismiss } = useAppUpdate(props);
  return banner ? (
    <UpdateBanner banner={banner} onUpdate={update} onRestart={restart} onDismiss={dismiss} />
  ) : null;
}

const AVAILABLE: NativeUpdateCheck = { status: 'available', availableVersionCode: 10007 };
const NONE: NativeUpdateCheck = { status: 'none', availableVersionCode: null };

beforeEach(() => jest.spyOn(AppState, 'addEventListener'));
afterEach(() => jest.restoreAllMocks());

describe('aviso de actualización', () => {
  it('hay versión nueva: muestra la tarjeta con el nombre y "Actualizar"', async () => {
    const f = fakeUpdates(AVAILABLE);
    await renderWithProviders(<Harness updates={f.deps} />);
    expect(await screen.findByText('Nueva versión disponible')).toBeOnTheScreen();
    expect(screen.getByText('0.1.0-beta.7')).toBeOnTheScreen();
    expect(screen.getByText('Actualizar')).toBeOnTheScreen();
  });

  it('al día o fuera de Play: no muestra nada', async () => {
    const f = fakeUpdates(NONE);
    await renderWithProviders(<Harness updates={f.deps} />);
    await waitFor(() => expect(f.deps.checkUpdate).toHaveBeenCalled());
    expect(screen.queryByTestId('update-banner')).not.toBeOnTheScreen();
  });

  it('descarga en curso y luego lista para instalar, que reinicia', async () => {
    const f = fakeUpdates(AVAILABLE);
    await renderWithProviders(<Harness updates={f.deps} />);
    await fireEvent.press(await screen.findByText('Actualizar'));
    expect(f.deps.startFlexibleUpdate).toHaveBeenCalled();
    await act(async () => f.emit({ status: 'downloading', bytesDownloaded: 45, totalBytes: 100 }));
    expect(screen.getByText('Descargando la nueva versión… 45 %')).toBeOnTheScreen();
    await act(async () => f.emit({ status: 'downloaded', bytesDownloaded: 100, totalBytes: 100 }));
    expect(screen.getByText('Lista para instalar')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Ocultar aviso de actualización')).not.toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Reiniciar'));
    expect(f.deps.completeUpdate).toHaveBeenCalled();
  });

  it('bloque limón: barra de avance solo al descargar y el ícono es decorativo', async () => {
    const f = fakeUpdates(AVAILABLE);
    await renderWithProviders(<Harness updates={f.deps} />);
    await screen.findByText('Actualizar');
    expect(screen.queryByRole('progressbar')).not.toBeOnTheScreen();
    expect(screen.queryByTestId('update-icon')).not.toBeOnTheScreen();
    expect(screen.getByTestId('update-icon', { includeHiddenElements: true })).toBeTruthy();
    await act(async () => f.emit({ status: 'downloading', bytesDownloaded: 45, totalBytes: 100 }));
    expect(
      screen.getByRole('progressbar', { name: 'Avance de la descarga' }),
    ).toHaveAccessibilityValue({
      min: 0,
      max: 100,
      now: 45,
    });
    await act(async () => f.emit({ status: 'downloaded', bytesDownloaded: 100, totalBytes: 100 }));
    expect(screen.queryByRole('progressbar')).not.toBeOnTheScreen();
  });

  it('cancelar la confirmación de Google vuelve a ofrecerla', async () => {
    const f = fakeUpdates(AVAILABLE, 'canceled');
    await renderWithProviders(<Harness updates={f.deps} />);
    await fireEvent.press(await screen.findByText('Actualizar'));
    await waitFor(() => expect(f.deps.startFlexibleUpdate).toHaveBeenCalled());
    expect(screen.getByText('Nueva versión disponible')).toBeOnTheScreen();
  });

  it('descarga terminada fuera de la app: al abrir sale lista para instalar', async () => {
    const f = fakeUpdates({ status: 'downloaded', availableVersionCode: 10007 });
    await renderWithProviders(<Harness updates={f.deps} />);
    expect(await screen.findByText('Lista para instalar')).toBeOnTheScreen();
  });

  it('al volver a la app vuelve a consultar', async () => {
    const f = fakeUpdates(NONE);
    await renderWithProviders(<Harness updates={f.deps} />);
    await waitFor(() => expect(f.deps.checkUpdate).toHaveBeenCalledTimes(1));
    f.setCheck({ status: 'downloaded', availableVersionCode: 10007 });
    const calls = (AppState.addEventListener as jest.Mock).mock.calls as [
      string,
      (s: string) => void,
    ][];
    await act(async () => calls.filter(([t]) => t === 'change').forEach(([, h]) => h('active')));
    expect(await screen.findByText('Lista para instalar')).toBeOnTheScreen();
  });

  it('la [x] la oculta en esta apertura y vuelve en la siguiente', async () => {
    const f = fakeUpdates(AVAILABLE);
    const view = await renderWithProviders(<Harness updates={f.deps} />);
    await fireEvent.press(await screen.findByLabelText('Ocultar aviso de actualización'));
    expect(screen.queryByTestId('update-banner')).not.toBeOnTheScreen();
    await view.unmount();
    await renderWithProviders(<Harness updates={f.deps} />);
    expect(await screen.findByText('Nueva versión disponible')).toBeOnTheScreen();
  });

  it('si el flujo de Google falla, abre la página de la app en Play Store', async () => {
    const f = fakeUpdates(AVAILABLE, 'failed');
    const openUrl = jest
      .fn()
      .mockRejectedValueOnce(new Error('sin app de Play'))
      .mockResolvedValueOnce(true);
    await renderWithProviders(<Harness updates={f.deps} openUrl={openUrl} />);
    await fireEvent.press(await screen.findByText('Actualizar'));
    await waitFor(() => expect(openUrl).toHaveBeenCalledTimes(2));
    expect(openUrl.mock.calls.map(([u]) => u)).toEqual(PLAY_STORE_URLS);
  });
});
