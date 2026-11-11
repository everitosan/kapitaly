import { fireEvent, screen } from '@testing-library/react-native';

import {
  sampleMethod,
  sampleOneOff,
  sampleRecurring,
  testDeps,
} from '@/data/repositories/contract';
import { createInMemoryRepositories } from '@/data/repositories/inMemory';

import { renderWithProviders } from '../../testUtils';
import { PaymentMethodList } from '../PaymentMethodList';

const props = () => ({ onBack: jest.fn(), onOpen: jest.fn(), onAdd: jest.fn() });

describe('PaymentMethodList', () => {
  it('en la primera apertura muestra "Efectivo"', async () => {
    await renderWithProviders(<PaymentMethodList {...props()} />);
    expect(await screen.findByRole('button', { name: 'Efectivo' })).toBeOnTheScreen();
    expect(screen.getByText('Método inicial')).toBeOnTheScreen();
    expect(screen.getByText('1 activo · de dónde sale cada gasto')).toBeOnTheScreen();
  });

  it('conteo de uso: dos recurrentes y un único → "3 gastos"', async () => {
    const repos = createInMemoryRepositories(testDeps());
    const nu = await repos.paymentMethods.create(
      sampleMethod({ name: 'Nu Débito', institutionId: 'nu-mx', last4: '8830' }),
    );
    await repos.recurringExpenses.create(sampleRecurring(nu.id));
    await repos.recurringExpenses.create(sampleRecurring(nu.id, { name: 'Renta' }));
    await repos.oneOffExpenses.create(sampleOneOff(nu.id));
    const removed = await repos.oneOffExpenses.create(sampleOneOff(nu.id));
    await repos.oneOffExpenses.remove(removed.id);
    await renderWithProviders(<PaymentMethodList {...props()} />, { repos });
    expect(await screen.findByText('Nu Débito')).toBeOnTheScreen();
    expect(screen.getByText('3 gastos')).toBeOnTheScreen();
    expect(screen.getByText('•••• 8830')).toBeOnTheScreen();
  });

  it('los archivados van en una sección plegable', async () => {
    const repos = createInMemoryRepositories(testDeps());
    const old = await repos.paymentMethods.create(sampleMethod({ name: 'Banamex Clásica' }));
    await repos.paymentMethods.archive(old.id);
    await renderWithProviders(<PaymentMethodList {...props()} />, { repos });
    const header = await screen.findByText('ARCHIVADOS · 1');
    expect(screen.queryByText('Banamex Clásica')).not.toBeOnTheScreen();
    await fireEvent.press(header);
    expect(screen.getByText('Banamex Clásica')).toBeOnTheScreen();
  });

  it('abre un método, agrega y vuelve', async () => {
    const p = props();
    await renderWithProviders(<PaymentMethodList {...p} />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Efectivo' }));
    expect(p.onOpen).toHaveBeenCalledWith('00000000-0000-4000-8000-000000000001');
    await fireEvent.press(screen.getByText('Agregar método'));
    expect(p.onAdd).toHaveBeenCalled();
    await fireEvent.press(screen.getByLabelText('Volver'));
    expect(p.onBack).toHaveBeenCalled();
  });
});
