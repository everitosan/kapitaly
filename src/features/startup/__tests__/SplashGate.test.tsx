import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as SplashScreen from 'expo-splash-screen';
import { Text } from 'react-native';

import { SPLASH_DURATION } from '@/ui/BrandSplash';

import { SPLASH_FADE_MS, SplashGate } from '../SplashGate';

jest.mock('expo-splash-screen', () => ({ hide: jest.fn(), preventAutoHideAsync: jest.fn() }));

const advance = (ms: number) => act(async () => jest.advanceTimersByTime(ms));

function App({ ready, animate = true }: { ready: boolean; animate?: boolean }) {
  return (
    <SplashGate ready={ready} animate={animate}>
      {ready ? <Text>Balance</Text> : null}
    </SplashGate>
  );
}

describe('SplashGate', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

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
