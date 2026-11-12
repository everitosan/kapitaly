import { fireEvent, screen } from '@testing-library/react-native';

import { sampleMethod, testDeps } from '@/data/repositories/contract';
import { createInMemoryRepositories } from '@/data/repositories/inMemory';
import { BUILTIN_CATEGORIES } from '@/domain/category';

import { renderWithProviders } from '../../testUtils';
import { SettingsScreen } from '../SettingsScreen';

const props = () => ({ onBack: jest.fn(), onOpenMethods: jest.fn(), onOpenCategories: jest.fn() });

describe('Ajustes', () => {
  it('muestra solo "Métodos de pago" y "Categorías", con sus conteos', async () => {
    const repos = createInMemoryRepositories(testDeps());
    await repos.paymentMethods.create(sampleMethod());
    await repos.categories.hide(BUILTIN_CATEGORIES[5].id);
    await renderWithProviders(<SettingsScreen {...props()} />, { repos });
    expect(await screen.findByRole('button', { name: 'Métodos de pago, 2' })).toBeOnTheScreen();
    expect(await screen.findByRole('button', { name: 'Categorías, 7' })).toBeOnTheScreen();
    expect(screen.getAllByRole('button').map((b) => b.props.accessibilityLabel)).toEqual([
      'Volver',
      'Métodos de pago, 2',
      'Categorías, 7',
    ]);
    expect(screen.queryByText(/recordatorio/i)).toBeNull();
    expect(screen.queryByText(/componentes/i)).toBeNull();
  });

  it('abre métodos de pago y categorías', async () => {
    const p = props();
    await renderWithProviders(<SettingsScreen {...p} />);
    await fireEvent.press(await screen.findByText('Métodos de pago'));
    await fireEvent.press(screen.getByText('Categorías'));
    expect(p.onOpenMethods).toHaveBeenCalled();
    expect(p.onOpenCategories).toHaveBeenCalled();
  });
});
