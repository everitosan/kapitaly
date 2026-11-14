import { fireEvent, screen, waitFor, within } from '@testing-library/react-native';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';

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
    <BalanceScreen
      onAdd={jest.fn()}
      onOpenSettings={jest.fn()}
      onOpenMethods={jest.fn()}
      onEdit={jest.fn()}
      today={today}
    />,
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
    expect(screen.getByRole('button', { name: 'Pendientes, ninguno' })).toBeDisabled();
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

  it('cerrar la hoja la deja disponible desde la campana', async () => {
    const { repos, netflix } = await withNetflix();
    await renderBalance(repos, '2026-11-16');
    await screen.findByTestId(`pending-charge-${netflix.id}`);
    await fireEvent.press(screen.getByText('Cerrar'));
    expect(screen.queryByTestId(`pending-charge-${netflix.id}`)).not.toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Pendientes, 1' }));
    expect(screen.getByTestId(`pending-charge-${netflix.id}`)).toBeOnTheScreen();
  });
});

describe('posponer durante la sesión', () => {
  it('"Aún no" en uno de dos pendientes lo quita de la hoja y baja el conteo', async () => {
    const repos = createInMemoryRepositories(testDeps());
    const bbva = await repos.paymentMethods.create(
      sampleMethod({
        openingBalanceCents: 745750,
        openingBalanceDate: '2026-11-01',
        paymentDueDay: 5,
      }),
    );
    const netflix = await repos.recurringExpenses.create(
      sampleRecurring(bbva.id, { anchorDate: '2026-01-15' }),
    );
    await renderBalance(repos, '2026-12-05');
    const charge = await screen.findByTestId(`pending-charge-${netflix.id}`);
    expect(screen.getByTestId(`pending-payment-${bbva.id}`)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Pendientes, 2' })).toBeOnTheScreen();

    await fireEvent.press(within(charge).getByText('Aún no'));

    expect(screen.queryByTestId(`pending-charge-${netflix.id}`)).not.toBeOnTheScreen();
    expect(screen.getByTestId(`pending-payment-${bbva.id}`)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Pendientes, 1' })).toBeOnTheScreen();
  });

  it('posponer el último cierra la hoja y deja la campana inactiva', async () => {
    const { repos, netflix } = await withNetflix();
    await renderBalance(repos, '2026-11-16');
    const charge = await screen.findByTestId(`pending-charge-${netflix.id}`);
    await fireEvent.press(within(charge).getByText('Aún no'));
    expect(screen.queryByText('Pendientes')).not.toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Pendientes, ninguno' })).toBeDisabled();
    // Cuenta como cerrada: si en esta sesión aparece otro pendiente, no se abre sola.
    expect(pendingSession.autoDismissed).toBe(true);
  });

  it('no muestra un aviso de pendientes en la lista del balance', async () => {
    const { repos, netflix } = await withNetflix();
    await renderBalance(repos, '2026-11-16');
    await screen.findByTestId(`pending-charge-${netflix.id}`);
    await fireEvent.press(screen.getByText('Cerrar'));
    expect(screen.getByRole('button', { name: 'Pendientes, 1' })).toBeOnTheScreen();
    expect(screen.queryByText(/por confirmar · toca para revisar/)).not.toBeOnTheScreen();
    expect(screen.queryByText(/^\d+ pendientes?$/)).not.toBeOnTheScreen();
  });
});

describe('orden de las acciones', () => {
  /** Etiquetas de los botones, en el orden en que se muestran. */
  const labels = (node: ReturnType<typeof screen.getByTestId>) =>
    within(node)
      .getAllByRole('button')
      .map((b) => b.props.accessibilityLabel ?? within(b).queryByText(/./)?.props.children);

  it('cobro: "Aún no" y "No se cobró" en una fila, "Sí, se cobró" debajo', async () => {
    const { repos, netflix } = await withNetflix();
    await renderBalance(repos, '2026-11-16');
    const card = await screen.findByTestId(`pending-charge-${netflix.id}`);
    expect(labels(screen.getByTestId(`pending-charge-actions-${netflix.id}`))).toEqual([
      'Aún no',
      'No se cobró',
    ]);
    const all = labels(card);
    expect(all.slice(-3)).toEqual(['Aún no', 'No se cobró', 'Sí, se cobró']);
  });

  it('pago: "Aún no" a la izquierda y "Sí, pagué" a la derecha', async () => {
    const repos = createInMemoryRepositories(testDeps());
    const bbva = await repos.paymentMethods.create(
      sampleMethod({
        openingBalanceCents: 10000,
        openingBalanceDate: '2026-11-01',
        paymentDueDay: 5,
      }),
    );
    await renderBalance(repos, '2026-12-05');
    await screen.findByTestId(`pending-payment-${bbva.id}`);
    expect(labels(screen.getByTestId(`pending-payment-actions-${bbva.id}`))).toEqual([
      'Aún no',
      'Sí, pagué',
    ]);
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
    const row = screen.getByRole('button', { name: 'Netflix, por confirmar' });
    expect(within(row).getByText('POR CONFIRMAR')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Pendientes, 1' }));
    await fireEvent.press(
      within(screen.getByTestId(`pending-charge-${netflix.id}`)).getByText('Sí, se cobró'),
    );
    await waitFor(() =>
      expect(
        within(screen.getByRole('button', { name: 'Netflix' })).queryByText('POR CONFIRMAR'),
      ).not.toBeOnTheScreen(),
    );
  });

  it('Este mes usa el monto confirmado y Análisis el de la regla', async () => {
    const { repos, netflix } = await withNetflix();
    await repos.chargeConfirmations.upsert({
      recurringExpenseId: netflix.id,
      occurrenceDate: '2026-11-15',
      status: 'charged',
      amountCents: 24900,
      paymentMethodId: netflix.paymentMethodId,
    });
    await renderBalance(repos, '2026-11-16');
    const card = await screen.findByTestId('month-progress');
    expect(within(card).getByLabelText('$249.00')).toBeOnTheScreen();
    expect(
      within(screen.getByRole('button', { name: 'Netflix' })).getByText('esperado $219.00'),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('tab', { name: 'Análisis' }));
    expect(within(screen.getByTestId('average-total')).getByLabelText('$219.00')).toBeOnTheScreen();
  });
});

describe('Pendientes sin interrumpir el acceso rápido', () => {
  /** Simula la ruta: el balance empieza tapado por el formulario y queda visible al volver. */
  function Harness() {
    const [focused, setFocused] = useState(false);
    return (
      <>
        <Pressable accessibilityRole="button" onPress={() => setFocused(true)}>
          <Text>volver al balance</Text>
        </Pressable>
        <BalanceScreen
          onAdd={jest.fn()}
          onOpenSettings={jest.fn()}
          onOpenMethods={jest.fn()}
          onEdit={jest.fn()}
          today="2026-11-16"
          focused={focused}
        />
      </>
    );
  }

  it('sin el balance visible no se abre; al volver al balance aparece', async () => {
    const { repos, netflix } = await withNetflix();
    await renderWithProviders(<Harness />, { repos });
    // Esperar a que carguen los datos antes de afirmar que la hoja no está.
    expect(await screen.findByRole('button', { name: 'Pendientes, 1' })).toBeOnTheScreen();
    expect(screen.queryByTestId(`pending-charge-${netflix.id}`)).not.toBeOnTheScreen();
    expect(pendingSession.autoDismissed).toBe(false);

    await fireEvent.press(screen.getByText('volver al balance'));
    expect(await screen.findByTestId(`pending-charge-${netflix.id}`)).toBeOnTheScreen();
  });
});
