import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as SplashScreen from 'expo-splash-screen';
import { Text } from 'react-native';

import { SPLASH_DURATION } from '@/ui/BrandSplash';
import { ThemeProvider } from '@/ui/ThemeProvider';

import { resetSplashSession, SPLASH_FADE_MS, SplashGate } from '../SplashGate';

jest.mock('expo-splash-screen', () => ({ hide: jest.fn(), preventAutoHideAsync: jest.fn() }));
const mockStatusBar = jest.fn((_props: { style: string }) => null);
jest.mock('expo-status-bar', () => ({
  StatusBar: (props: { style: string }) => mockStatusBar(props),
}));

const advance = (ms: number) => act(async () => jest.advanceTimersByTime(ms));

function App({ ready, animate = true }: { ready: boolean; animate?: boolean }) {
  return (
    <SplashGate ready={ready} animate={animate}>
      {ready ? <Text>Balance</Text> : null}
    </SplashGate>
  );
}

describe('SplashGate', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resetSplashSession();
    jest.mocked(SplashScreen.hide).mockClear();
  });
  afterEach(() => jest.useRealTimers());

  it('si se vuelve a montar en la misma sesión, no muestra el splash y oculta el nativo', async () => {
    const first = await render(<App ready />);
    expect(screen.getByTestId('splash-gate')).toBeOnTheScreen();
    await first.unmount();
    jest.mocked(SplashScreen.hide).mockClear();

    await render(<App ready />);
    expect(screen.queryByTestId('splash-gate')).not.toBeOnTheScreen();
    expect(screen.getByText('Balance')).toBeOnTheScreen();
    expect(SplashScreen.hide).toHaveBeenCalled();
  });

  it.each([
    ['light', 'dark'],
    ['dark', 'light'],
  ] as const)('en tema %s la barra de estado va en %s', async (scheme, style) => {
    await render(
      <ThemeProvider scheme={scheme}>
        <App ready={false} />
      </ThemeProvider>,
    );
    expect(mockStatusBar).toHaveBeenLastCalledWith(expect.objectContaining({ style }));
  });

  it('oculta el splash nativo en cuanto el de marca está pintado', async () => {
    await render(<App ready={false} />);
    expect(SplashScreen.hide).not.toHaveBeenCalled();
    fireEvent(screen.getByTestId('splash-gate'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 400, height: 800 } },
    });
    expect(SplashScreen.hide).toHaveBeenCalled();
  });

  it('con la base de datos lenta, espera en el estado final y luego se desvanece', async () => {
    const view = await render(<App ready={false} />);
    await advance(SPLASH_DURATION + 500);
    expect(screen.getByTestId('splash-gate')).toBeTruthy();

    await view.rerender(<App ready />);
    await advance(SPLASH_FADE_MS + 50);
    expect(screen.queryByTestId('splash-gate')).toBeNull();
    expect(screen.getByText('Balance')).toBeTruthy();
  });

  it('con la base de datos rápida, completa la animación antes de desvanecerse', async () => {
    await render(<App ready />);
    await advance(SPLASH_DURATION - 200);
    expect(screen.getByTestId('splash-gate')).toBeTruthy();

    await advance(250); // termina la animación; el fundido arranca al aplicarse ese cambio
    await advance(SPLASH_FADE_MS + 50);
    expect(screen.queryByTestId('splash-gate')).toBeNull();
  });

  it('sin animación se va en cuanto la app está lista', async () => {
    await render(<App ready animate={false} />);
    await advance(SPLASH_FADE_MS + 50);
    expect(screen.queryByTestId('splash-gate')).toBeNull();
  });
});
