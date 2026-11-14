import { render, screen } from '@testing-library/react-native';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import * as Linking from 'expo-linking';
import { useReducedMotion } from 'react-native-reanimated';

import RootLayout from '@/app/_layout';

jest.mock('expo-splash-screen', () => ({ hide: jest.fn(), preventAutoHideAsync: jest.fn() }));
jest.mock('expo-linking', () => ({ getLinkingURL: jest.fn(() => null) }));
jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual('react-native-reanimated');
  return { __esModule: true, ...actual, default: actual.default, useReducedMotion: jest.fn() };
});
jest.mock('drizzle-orm/expo-sqlite/migrator', () => ({ useMigrations: jest.fn() }));
jest.mock('../../../../drizzle/migrations', () => ({}));
jest.mock('@/data/sqlite/appDatabase', () => ({ getAppDatabase: () => ({ db: {} }) }));
jest.mock('@/data/appRepositories', () => ({ getAppRepositories: () => ({}) }));
jest.mock('@/features/repositories', () => ({
  RepositoryProvider: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('expo-router', () => {
  const { Text } = jest.requireActual('react-native');
  const Stack = () => <Text>App</Text>;
  Stack.Screen = function Screen() {
    return null;
  };
  return { Stack };
});
// Solo interesa qué recibe el splash; el componente real tiene sus propias pruebas.
jest.mock('@/ui/BrandSplash', () => {
  const { View } = jest.requireActual('react-native');
  return {
    BrandSplash: ({ animate }: { animate: boolean }) => (
      <View testID="brand-splash" accessibilityHint={animate ? 'animado' : 'fijo'} />
    ),
  };
});

const mockedMigrations = jest.mocked(useMigrations);
const mockedURL = jest.mocked(Linking.getLinkingURL);
const mockedReducedMotion = jest.mocked(useReducedMotion);

function splashMode() {
  return screen.getByTestId('brand-splash').props.accessibilityHint;
}

describe('RootLayout y el splash', () => {
  beforeEach(() => {
    mockedMigrations.mockReturnValue({ success: false, error: undefined });
    mockedURL.mockReturnValue(null);
    mockedReducedMotion.mockReturnValue(false);
  });

  it('anima el splash en un arranque normal', async () => {
    await render(<RootLayout />);
    expect(splashMode()).toBe('animado');
  });

  it('no anima al abrir desde el atajo "Nuevo gasto"', async () => {
    mockedURL.mockReturnValue('kapitalyexpenses://expense/new?quick=1');
    await render(<RootLayout />);
    expect(splashMode()).toBe('fijo');
  });

  it('no anima con reducir movimiento activado', async () => {
    mockedReducedMotion.mockReturnValue(true);
    await render(<RootLayout />);
    expect(splashMode()).toBe('fijo');
  });

  it('monta la app debajo del splash en cuanto terminan las migraciones', async () => {
    mockedMigrations.mockReturnValue({ success: true, error: undefined });
    await render(<RootLayout />);
    expect(screen.getByText('App')).toBeTruthy();
    expect(screen.getByTestId('brand-splash')).toBeTruthy();
  });

  it('muestra el error de migración detrás del splash', async () => {
    mockedMigrations.mockReturnValue({ success: false, error: new Error('disco lleno') });
    await render(<RootLayout />);
    expect(screen.getByText('No se pudo preparar la base de datos')).toBeTruthy();
  });
});
