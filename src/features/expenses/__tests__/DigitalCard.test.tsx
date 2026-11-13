import { fireEvent, screen, waitFor, within } from '@testing-library/react-native';

import { sampleMethod, sampleOneOff, testDeps } from '@/data/repositories/contract';
import { createInMemoryRepositories } from '@/data/repositories/inMemory';

import { BalanceScreen } from '../../balance/BalanceScreen';
import { PaymentMethodForm } from '../../paymentMethods/PaymentMethodForm';
import { pendingSession } from '../../pending/session';
import { renderWithProviders } from '../../testUtils';
import { ExpenseForm } from '../ExpenseForm';

const TODAY = '2026-11-11';

async function setup() {
  const repos = createInMemoryRepositories(testDeps());
  const bbva = await repos.paymentMethods.create(
    sampleMethod({ hasDigital: true, digitalLast4: '7788' }),
  );
  const nu = await repos.paymentMethods.create(
    sampleMethod({ name: 'Nu Débito', kind: 'debit', institutionId: 'nu-mx', last4: '8830' }),
  );
  return { repos, bbva, nu };
}

beforeEach(() => pendingSession.reset());

describe('10.6 · tarjeta digital en el método', () => {
  it('registrar la versión digital con sus dígitos', async () => {
    const repos = createInMemoryRepositories(testDeps());
    const bbva = await repos.paymentMethods.create(sampleMethod());
    const onDone = jest.fn();
    await renderWithProviders(<PaymentMethodForm method={bbva} onDone={onDone} />, { repos });
    await fireEvent(screen.getByTestId('has-digital'), 'valueChange', true);
    expect(screen.getByText('Misma cuenta y mismo saldo que la física.')).toBeOnTheScreen();
    await fireEvent.changeText(screen.getByTestId('digital-last4'), '7788');
    await fireEvent.press(screen.getByText('Guardar'));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(await repos.paymentMethods.get(bbva.id)).toMatchObject({
      last4: '4521',
      hasDigital: true,
      digitalLast4: '7788',
    });
  });

  it('dígitos de la digital inválidos', async () => {
    const onDone = jest.fn();
    await renderWithProviders(<PaymentMethodForm method={null} onDone={onDone} />);
    await fireEvent.press(screen.getByTestId('institution-nu-mx'));
    await fireEvent(screen.getByTestId('has-digital'), 'valueChange', true);
    await fireEvent.changeText(screen.getByTestId('digital-last4'), '77A');
    await fireEvent.press(screen.getByText('Guardar'));
    expect(await screen.findAllByText('Deben ser 4 números')).toHaveLength(1);
    expect(onDone).not.toHaveBeenCalled();
  });

  it('efectivo y transferencia no ofrecen la opción', async () => {
    await renderWithProviders(<PaymentMethodForm method={null} onDone={jest.fn()} />);
    expect(screen.getByTestId('has-digital')).toBeOnTheScreen();
    await fireEvent.press(screen.getAllByText('Efectivo')[0]);
    expect(screen.queryByTestId('has-digital')).not.toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Transferencia'));
    expect(screen.queryByTestId('has-digital')).not.toBeOnTheScreen();
  });
});

describe('10.6 · física o digital en un gasto', () => {
  it('gasto con la digital y su etiqueta en el balance', async () => {
    const { repos, bbva } = await setup();
    const onDone = jest.fn();
    await renderWithProviders(
      <ExpenseForm target={{ kind: 'new' }} onDone={onDone} today={TODAY} />,
      { repos },
    );
    await fireEvent.changeText(screen.getByTestId('expense-title'), 'Farmacia');
    await fireEvent.changeText(screen.getByTestId('amount-input'), '238.50');
    await fireEvent.press(await screen.findByText('BBVA Azul ••4521'));
    expect(screen.getByRole('tab', { name: 'Física ••4521' })).toBeSelected();
    await fireEvent.press(screen.getByText('Digital ••7788'));
    await fireEvent.press(screen.getByText('Guardar'));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect((await repos.oneOffExpenses.list())[0]).toMatchObject({
      paymentMethodId: bbva.id,
      cardVariant: 'digital',
    });

    await renderWithProviders(
      <BalanceScreen
        onAdd={jest.fn()}
        onOpenSettings={jest.fn()}
        onOpenMethods={jest.fn()}
        onEdit={jest.fn()}
        today={TODAY}
      />,
      { repos },
    );
    const row = await screen.findByRole('button', { name: 'Farmacia, gasto único, $238.50' });
    expect(within(row).getByText('BBVA Azul ••7788 · digital')).toBeOnTheScreen();
  });

  it('preselecciona la variante usada en el último gasto con ese método', async () => {
    const { repos, bbva } = await setup();
    await repos.oneOffExpenses.create(sampleOneOff(bbva.id, { cardVariant: 'digital' }));
    await renderWithProviders(
      <ExpenseForm target={{ kind: 'new' }} onDone={jest.fn()} today={TODAY} />,
      { repos },
    );
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Digital ••7788' })).toBeSelected());
  });

  it('con un método sin versión digital no aparece la opción', async () => {
    const { repos } = await setup();
    await renderWithProviders(
      <ExpenseForm target={{ kind: 'new' }} onDone={jest.fn()} today={TODAY} />,
      { repos },
    );
    await fireEvent.press(await screen.findByText('Nu Débito ••8830'));
    expect(screen.queryByTestId('card-variant')).not.toBeOnTheScreen();
  });

  it('el desglose suma física y digital en una sola línea', async () => {
    const { repos, bbva } = await setup();
    await repos.oneOffExpenses.create(
      sampleOneOff(bbva.id, { amountCents: 21900, date: '2026-11-02', cardVariant: 'digital' }),
    );
    await repos.oneOffExpenses.create(
      sampleOneOff(bbva.id, { amountCents: 23850, date: '2026-11-03', cardVariant: 'physical' }),
    );
    await renderWithProviders(
      <BalanceScreen
        onAdd={jest.fn()}
        onOpenSettings={jest.fn()}
        onOpenMethods={jest.fn()}
        onEdit={jest.fn()}
        today={TODAY}
      />,
      { repos },
    );
    await fireEvent.press(await screen.findByRole('tab', { name: 'Análisis' }));
    const card = await screen.findByTestId('method-breakdown');
    expect(within(card).getByText('$457.50')).toBeOnTheScreen();
    expect(within(card).getAllByText(/BBVA Azul/)).toHaveLength(1);
  });
});
