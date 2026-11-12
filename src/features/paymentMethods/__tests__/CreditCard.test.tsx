import { fireEvent, screen, waitFor, within } from '@testing-library/react-native';
import { Alert, type AlertButton } from 'react-native';

import {
  sampleMethod,
  sampleOneOff,
  sampleRecurring,
  testDeps,
} from '@/data/repositories/contract';
import { createInMemoryRepositories } from '@/data/repositories/inMemory';
import { usedCents } from '@/domain/creditCard';

import { BalanceScreen } from '../../balance/BalanceScreen';
import { pendingSession } from '../../pending/session';
import { renderWithProviders } from '../../testUtils';
import { PaymentMethodForm } from '../PaymentMethodForm';
import { PaymentMethodList } from '../PaymentMethodList';

const listProps = () => ({ onBack: jest.fn(), onOpen: jest.fn(), onAdd: jest.fn() });

async function setupCard(over: Parameters<typeof sampleMethod>[0] = {}) {
  const repos = createInMemoryRepositories(testDeps());
  const card = await repos.paymentMethods.create(
    sampleMethod({
      openingBalanceCents: 1200000,
      openingBalanceDate: '2026-11-01',
      creditLimitCents: 5000000,
      paymentDueDay: 5,
      ...over,
    }),
  );
  return { repos, card };
}

beforeEach(() => pendingSession.reset());

describe('10.2 · tarjeta de crédito en Métodos de pago', () => {
  it('usado visible; límite y disponible ocultos hasta tocarlos', async () => {
    const { repos, card } = await setupCard();
    await repos.oneOffExpenses.create(
      sampleOneOff(card.id, { amountCents: 23850, date: '2026-11-09' }),
    );
    await repos.chargeConfirmations.upsert({
      recurringExpenseId: 'netflix',
      occurrenceDate: '2026-11-15',
      status: 'charged',
      amountCents: 21900,
      paymentMethodId: card.id,
    });
    const view = await renderWithProviders(
      <PaymentMethodList {...listProps()} today="2026-11-20" />,
      { repos },
    );
    expect(await screen.findByText('$12,457.50')).toBeOnTheScreen();
    expect(screen.getByText('•••••• · ••••••')).toBeOnTheScreen();
    expect(screen.queryByText(/\$50,000\.00/)).not.toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Mostrar límite'));
    expect(screen.getByText('$50,000.00 · $37,542.50')).toBeOnTheScreen();

    // Al salir y volver a la pantalla, se vuelve a ocultar.
    await view.unmount();
    await renderWithProviders(<PaymentMethodList {...listProps()} today="2026-11-20" />, { repos });
    expect(await screen.findByText('•••••• · ••••••')).toBeOnTheScreen();
  });

  it('próximo pago, incluido el día 31 en un mes corto', async () => {
    const { repos } = await setupCard();
    await repos.paymentMethods.create(
      sampleMethod({
        name: 'Tarjeta 31',
        paymentDueDay: 31,
        openingBalanceCents: 0,
        openingBalanceDate: '2026-10-01',
      }),
    );
    await renderWithProviders(<PaymentMethodList {...listProps()} today="2026-11-11" />, { repos });
    expect(await screen.findByText('5 dic 2026')).toBeOnTheScreen();
    const card31 = screen.getByRole('button', { name: 'Tarjeta 31' });
    expect(within(card31).getByText('30 nov 2026')).toBeOnTheScreen();
  });

  it('saldo a favor', async () => {
    const { repos, card } = await setupCard({ openingBalanceCents: 50000 });
    await repos.cardPayments.create({
      paymentMethodId: card.id,
      amountCents: 70000,
      date: '2026-11-10',
      forDueDate: null,
    });
    await renderWithProviders(<PaymentMethodList {...listProps()} today="2026-11-11" />, { repos });
    expect(await screen.findByText('SALDO A FAVOR')).toBeOnTheScreen();
    expect(screen.getByText('$200.00')).toBeOnTheScreen();
  });
});

describe('10.2 · campos de tarjeta en el formulario', () => {
  it('solo el tipo crédito muestra saldo inicial, límite y día de pago', async () => {
    await renderWithProviders(<PaymentMethodForm method={null} onDone={jest.fn()} />);
    expect(screen.queryByTestId('opening-balance')).not.toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Crédito'));
    expect(screen.getByTestId('opening-balance')).toBeOnTheScreen();
    expect(screen.getByTestId('credit-limit')).toBeOnTheScreen();
    expect(screen.getByText('Día de pago')).toBeOnTheScreen();
  });

  it('alta de tarjeta con saldo, límite y día de pago', async () => {
    const onDone = jest.fn();
    const { repos } = await renderWithProviders(
      <PaymentMethodForm method={null} onDone={onDone} />,
    );
    await fireEvent.press(screen.getByText('Crédito'));
    await fireEvent.press(screen.getByTestId('institution-bbva-mx'));
    await fireEvent.changeText(screen.getByTestId('opening-balance'), '12,000');
    await fireEvent.changeText(screen.getByTestId('credit-limit'), '50000');
    for (let i = 0; i < 5; i++) await fireEvent.press(screen.getByLabelText('Día siguiente'));
    expect(screen.getByTestId('due-day')).toHaveTextContent('5');
    await fireEvent.press(screen.getByText('Guardar'));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    const saved = (await repos.paymentMethods.list()).find((m) => m.name === 'BBVA')!;
    expect(saved).toMatchObject({
      kind: 'credit',
      openingBalanceCents: 1200000,
      creditLimitCents: 5000000,
      paymentDueDay: 5,
    });
    expect(saved.openingBalanceDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('el límite se captura oculto y un límite en cero se rechaza', async () => {
    const onDone = jest.fn();
    await renderWithProviders(<PaymentMethodForm method={null} onDone={onDone} />);
    await fireEvent.press(screen.getByText('Crédito'));
    await fireEvent.press(screen.getByTestId('institution-bbva-mx'));
    expect(screen.getByTestId('credit-limit')).toHaveProp('secureTextEntry', true);
    await fireEvent.changeText(screen.getByTestId('credit-limit'), '0');
    await fireEvent.press(screen.getByText('Guardar'));
    expect(await screen.findByText('El límite debe ser mayor que cero')).toBeOnTheScreen();
    expect(onDone).not.toHaveBeenCalled();
  });
});

describe('10.3 · pagar tarjeta e historial', () => {
  let alert: jest.SpyInstance;
  beforeEach(() => {
    alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });
  afterEach(() => alert.mockRestore());

  it('pago total con el monto propuesto', async () => {
    const { repos, card } = await setupCard();
    await renderWithProviders(<PaymentMethodForm method={card} onDone={jest.fn()} />, { repos });
    await fireEvent.press(await screen.findByTestId('pay-card'));
    expect(await screen.findByTestId('amount-input')).toHaveDisplayValue('12000.00');
    await fireEvent.press(screen.getByText('Registrar pago'));
    await waitFor(async () => expect(await repos.cardPayments.list()).toHaveLength(1));
    expect(usedCents(card, [], [], await repos.cardPayments.list())).toBe(0);
  });

  it('pago parcial', async () => {
    const { repos, card } = await setupCard();
    await renderWithProviders(<PaymentMethodForm method={card} onDone={jest.fn()} />, { repos });
    await fireEvent.press(await screen.findByTestId('pay-card'));
    await fireEvent.changeText(screen.getByTestId('amount-input'), '5000');
    await fireEvent.press(screen.getByText('Registrar pago'));
    await waitFor(async () => expect(await repos.cardPayments.list()).toHaveLength(1));
    expect(usedCents(card, [], [], await repos.cardPayments.list())).toBe(700000);
  });

  it('eliminar un pago registrado por error', async () => {
    const { repos, card } = await setupCard();
    await repos.cardPayments.create({
      paymentMethodId: card.id,
      amountCents: 500000,
      date: '2026-11-10',
      forDueDate: '2026-11-05',
    });
    await renderWithProviders(<PaymentMethodForm method={card} onDone={jest.fn()} />, { repos });
    await fireEvent.press(await screen.findByLabelText('Eliminar pago de $5,000.00'));
    const buttons = alert.mock.calls.at(-1)?.[2] as AlertButton[];
    await buttons.find((b) => b.text === 'Eliminar pago')?.onPress?.();
    await waitFor(async () => expect(await repos.cardPayments.list()).toHaveLength(0));
    expect(await screen.findByText('Sin pagos todavía.')).toBeOnTheScreen();
  });

  it('los pagos no cambian "Este mes" ni "Promedio"', async () => {
    const { repos, card } = await setupCard();
    await repos.recurringExpenses.create(sampleRecurring(card.id, { anchorDate: '2026-11-25' }));
    await repos.cardPayments.create({
      paymentMethodId: card.id,
      amountCents: 500000,
      date: '2026-11-10',
      forDueDate: '2026-11-05',
    });
    await renderWithProviders(
      <BalanceScreen
        onAdd={jest.fn()}
        onOpenSettings={jest.fn()}
        onEdit={jest.fn()}
        today="2026-11-11"
      />,
      { repos },
    );
    expect(await screen.findByText('1 cargo')).toBeOnTheScreen();
    expect(screen.getAllByLabelText('$219.00')).toHaveLength(2); // total y fila: el pago no suma
    await fireEvent.press(screen.getByText('Promedio'));
    expect(screen.getAllByLabelText('$219.00').length).toBeGreaterThan(0);
    expect(screen.queryByText(/5,000/)).not.toBeOnTheScreen();
  });
});
