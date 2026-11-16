import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

import { testDeps } from '@/data/repositories/contract';
import { createInMemoryRepositories } from '@/data/repositories/inMemory';

import { renderWithProviders } from '../../testUtils';
import { useDailyIncludeRecurring } from '../useDailyIncludeRecurring';

function Probe() {
  const { includeRecurring, loaded, toggle } = useDailyIncludeRecurring();
  return (
    <Pressable accessibilityRole="button" onPress={toggle}>
      <Text>{loaded ? (includeRecurring ? 'encendido' : 'apagado') : 'cargando'}</Text>
    </Pressable>
  );
}

describe('useDailyIncludeRecurring', () => {
  it('arranca apagado, guarda al cambiar y se conserva en otra montura', async () => {
    const repos = createInMemoryRepositories(testDeps());
    const first = await renderWithProviders(<Probe />, { repos });
    expect(await screen.findByText('apagado')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button'));
    expect(screen.getByText('encendido')).toBeOnTheScreen();
    await waitFor(async () =>
      expect(await repos.uiPreferences.get('daily.includeRecurring')).toBe('1'),
    );
    await act(async () => first.unmount());

    await renderWithProviders(<Probe />, { repos });
    expect(await screen.findByText('encendido')).toBeOnTheScreen();
  });
});
