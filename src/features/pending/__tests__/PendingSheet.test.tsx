import { fireEvent, screen, waitFor, within } from '@testing-library/react-native';

import { sampleMethod, sampleRecurring, testDeps } from '@/data/repositories/contract';
import {
  createInMemoryRepositories,
  type InMemoryRepositories,
} from '@/data/repositories/inMemory';
import { validateCardPayment } from '@/domain/creditCard';

import { BalanceScreen } from '../../balance/BalanceScreen';
import { renderWithProviders } from '../../testUtils';
import { pendingSession } from '../session';

const renderBalance = (repos: InMemoryRepositories, today: string) =>
  renderWithProviders(
    <BalanceScreen onAdd={jest.fn()} onOpenMethods={jest.fn()} onEdit={jest.fn()} today={today} />,
    { repos },
  );

/** Netflix (día 15) registrado el 11/11/2026 con BBVA Azul. */
async function withNetflix() {
  const repos = createInMemoryRepositories(testDeps());
  const bbva = await repos.paymentMethods.create(
    sampleMethod({ openingBalanceCents: 0, openingBalanceDate: '2026-11-01' }),
  );
  const netflix = await repos.recurringExpenses.create(
    sampleRecurring(bbva.id, { anchorDate: '2026-01-15' }),
  );
  return { repos, bbva, netflix };
}

beforeEach(() => pendingSession.reset());

describe('10.4 · cobros por confirmar', () => {
  it('pregunta al abrir la app y confirma con otro monto', async () => {
    const { repos, netflix } = await withNetflix();
    await renderBalance(repos, '2026-11-16');
    const card = await screen.findByTestId(`pending-charge-${netflix.id}`);
    expect(within(card).getByText('¿Ya se cobró Netflix?')).toBeOnTheScreen();
    await fireEvent.changeText(within(card).getByLabelText('Monto cobrado de Netflix'), '249');
    await fireEvent.press(within(card).getByText('Sí, se cobró'));
    await waitFor(async () =>
      expect(await repos.chargeConfirmations.list()).toEqual([
        expect.objectContaining({
          recurringExpenseId: netflix.id,
          occurrenceDate: '2026-11-15',
          status: 'charged',
          amountCents: 24900,
        }),
      ]),
    );
    await waitFor(() =>
      expect(screen.queryByTestId(`pending-charge-${netflix.id}`)).not.toBeOnTheScreen(),
    );
    expect(screen.queryByTestId('pending-banner')).not.toBeOnTheScreen();
  });

  it('con tarjeta de crédito permite no sumar el cobro al saldo', async () => {
    const { repos, netflix } = await withNetflix();
    await renderBalance(repos, '2026-11-16');
    const card = await screen.findByTestId(`pending-charge-${netflix.id}`);
    await fireEvent(within(card).getByTestId(`adds-to-card-${netflix.id}`), 'valueChange', false);
    await fireEvent.press(within(card).getByText('Sí, se cobró'));
    await waitFor(async () =>
      expect(await repos.chargeConfirmations.list()).toEqual([
        expect.objectContaining({ status: 'charged', addsToCardBalance: false }),
      ]),
    );
  });

  it('nada antes del registro', async () => {
    const { repos } = await withNetflix();
    await renderBalance(repos, '2026-11-12');
    expect(await screen.findByText('Cargos de noviembre')).toBeOnTheScreen();
    expect(screen.queryByText('¿Ya se cobró Netflix?')).not.toBeOnTheScreen();
  });

  it('"No se cobró este mes" lo descarta', async () => {
    const { repos, netflix } = await withNetflix();
    await renderBalance(repos, '2026-11-16');
    await fireEvent.press(
      within(await screen.findByTestId(`pending-charge-${netflix.id}`)).getByText('No se cobró'),
    );
    await waitFor(async () =>
      expect((await repos.chargeConfirmations.list())[0]).toMatchObject({
        status: 'skipped',
        amountCents: null,
      }),
    );
  });

  it('"Aún no" no guarda nada y vuelve a preguntar en la siguiente apertura', async () => {
    const { repos, netflix } = await withNetflix();
    const view = await renderBalance(repos, '2026-11-16');
    await fireEvent.press(
      within(await screen.findByTestId(`pending-charge-${netflix.id}`)).getByText('Aún no'),
    );
    expect(screen.queryByTestId(`pending-charge-${netflix.id}`)).not.toBeOnTheScreen();
    expect(await repos.chargeConfirmations.list()).toEqual([]);
    await view.unmount();
    pendingSession.reset(); // nueva apertura de la app
    await renderBalance(repos, '2026-11-16');
    expect(await screen.findByTestId(`pending-charge-${netflix.id}`)).toBeOnTheScreen();
  });

  it('cerrar la hoja la deja disponible desde el aviso de pendientes', async () => {
    const { repos, netflix } = await withNetflix();
    await renderBalance(repos, '2026-11-16');
    await screen.findByTestId(`pending-charge-${netflix.id}`);
    await fireEvent.press(screen.getByText('Cerrar'));
    expect(screen.queryByTestId(`pending-charge-${netflix.id}`)).not.toBeOnTheScreen();
    expect(screen.getByText('1 pendiente')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('pending-banner'));
    expect(screen.getByTestId(`pending-charge-${netflix.id}`)).toBeOnTheScreen();
  });
});

describe('10.4 · aviso en la fecha de pago', () => {
  async function withCard(usedOpening: number) {
    const repos = createInMemoryRepositories(testDeps());
    const bbva = await repos.paymentMethods.create(
      sampleMethod({
        openingBalanceCents: usedOpening,
        openingBalanceDate: '2026-11-01',
        paymentDueDay: 5,
      }),
    );
    return { repos, bbva };
  }

  it('al llegar la fecha pregunta si se pagó, con el usado propuesto', async () => {
    const { repos, bbva } = await withCard(745750);
    await renderBalance(repos, '2026-12-05');
    const card = await screen.findByTestId(`pending-payment-${bbva.id}`);
    expect(within(card).getByText('¿Ya pagaste BBVA Azul?')).toBeOnTheScreen();
    expect(within(card).getByLabelText('Monto pagado de BBVA Azul')).toHaveDisplayValue('7457.50');
    await fireEvent.press(within(card).getByText('Sí, pagué'));
    await waitFor(async () =>
      expect(await repos.cardPayments.list()).toEqual([
        expect.objectContaining({
          paymentMethodId: bbva.id,
          amountCents: 745750,
          forDueDate: '2026-12-05',
        }),
      ]),
    );
  });

  it('pagar antes desde Métodos de pago evita el aviso', async () => {
    const { repos, bbva } = await withCard(745750);
    const p = validateCardPayment({ amountText: '1000', date: '2026-12-03' }, bbva);
    if (p.ok) await repos.cardPayments.create(p.value);
    await renderBalance(repos, '2026-12-05');
    expect(await screen.findByText('Cargos de diciembre')).toBeOnTheScreen();
    expect(screen.queryByTestId(`pending-payment-${bbva.id}`)).not.toBeOnTheScreen();
  });

  it('sin aviso con usado en cero', async () => {
    const { repos, bbva } = await withCard(0);
    await renderBalance(repos, '2026-12-05');
    expect(await screen.findByText('Cargos de diciembre')).toBeOnTheScreen();
    expect(screen.queryByTestId(`pending-payment-${bbva.id}`)).not.toBeOnTheScreen();
  });

  it('"Aún no" pospone el aviso del pago', async () => {
    const { repos, bbva } = await withCard(10000);
    await renderBalance(repos, '2026-12-05');
    await fireEvent.press(
      within(await screen.findByTestId(`pending-payment-${bbva.id}`)).getByText('Aún no'),
    );
    expect(screen.queryByTestId(`pending-payment-${bbva.id}`)).not.toBeOnTheScreen();
    expect(await repos.cardPayments.list()).toEqual([]);
  });
});

describe('10.5 · marca "Por confirmar"', () => {
  it('aparece en el cobro vencido y desaparece al confirmarlo', async () => {
    const { repos, netflix } = await withNetflix();
    await renderBalance(repos, '2026-11-16');
    await screen.findByTestId(`pending-charge-${netflix.id}`);
    await fireEvent.press(screen.getByText('Cerrar'));
    const row = screen.getByRole('button', { name: 'Netflix' });
    expect(within(row).getByText('POR CONFIRMAR')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('pending-banner'));
    await fireEvent.press(
      within(screen.getByTestId(`pending-charge-${netflix.id}`)).getByText('Sí, se cobró'),
    );
    await waitFor(() =>
      expect(
        within(screen.getByRole('button', { name: 'Netflix' })).queryByText('POR CONFIRMAR'),
      ).not.toBeOnTheScreen(),
    );
  });

  it('las cifras del mes siguen usando el monto de la regla', async () => {
    const { repos, netflix } = await withNetflix();
    await repos.chargeConfirmations.upsert({
      recurringExpenseId: netflix.id,
      occurrenceDate: '2026-11-15',
      status: 'charged',
      amountCents: 24900,
      paymentMethodId: netflix.paymentMethodId,
    });
    await renderBalance(repos, '2026-11-16');
    expect(await screen.findByText('1 cargo')).toBeOnTheScreen();
    expect(screen.getAllByLabelText('$219.00').length).toBeGreaterThan(0);
  });
});
