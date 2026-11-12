import { fireEvent, screen, within } from '@testing-library/react-native';

import {
  sampleMethod,
  sampleOneOff,
  sampleRecurring,
  testDeps,
} from '@/data/repositories/contract';
import { createInMemoryRepositories } from '@/data/repositories/inMemory';
import { CASH_METHOD_ID } from '@/domain/paymentMethod';

import { renderWithProviders } from '../../testUtils';
import { BalanceScreen } from '../BalanceScreen';

const TODAY = '2026-11-11';

/** Datos de los escenarios del spec monthly-balance (noviembre 2026). */
async function novemberScenario() {
  const repos = createInMemoryRepositories(testDeps());
  const bbva = await repos.paymentMethods.create(sampleMethod({ name: 'BBVA Azul' }));
  const nu = await repos.paymentMethods.create(
    sampleMethod({ name: 'Nu Débito', institutionId: 'nu-mx', last4: '8830' }),
  );
  const ids = {
    netflix: (
      await repos.recurringExpenses.create(
        sampleRecurring(bbva.id, { name: 'Netflix', amountCents: 21900, anchorDate: '2026-01-15' }),
      )
    ).id,
    renta: (
      await repos.recurringExpenses.create(
        sampleRecurring(nu.id, { name: 'Renta', amountCents: 150000, anchorDate: '2026-01-20' }),
      )
    ).id,
    internet: (
      await repos.recurringExpenses.create(
        sampleRecurring(nu.id, {
          name: 'Internet',
          amountCents: 45000,
          intervalCount: 2,
          anchorDate: '2026-09-28',
        }),
      )
    ).id,
    seguro: (
      await repos.recurringExpenses.create(
        sampleRecurring(bbva.id, {
          name: 'Seguro',
          amountCents: 600000,
          intervalUnit: 'year',
          intervalCount: 1,
          anchorDate: '2026-03-15',
        }),
      )
    ).id,
    metro: (
      await repos.oneOffExpenses.create(
        sampleOneOff(CASH_METHOD_ID, {
          description: 'Recarga metro',
          amountCents: 10000,
          date: '2026-11-08',
        }),
      )
    ).id,
  };
  return { repos, ids };
}

const props = () => ({ onAdd: jest.fn(), onOpenSettings: jest.fn(), onEdit: jest.fn() });

describe('8.1 · navegación y vistas', () => {
  it('abre en el mes actual, en "Este mes"', async () => {
    await renderWithProviders(<BalanceScreen {...props()} today={TODAY} />);
    expect(screen.getByRole('header', { name: 'Noviembre' })).toBeOnTheScreen();
    expect(screen.getByText('2026')).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Este mes' })).toBeSelected();
  });

  it('avanza y retrocede mes por mes, cruzando años', async () => {
    await renderWithProviders(<BalanceScreen {...props()} today={TODAY} />);
    await fireEvent.press(screen.getByLabelText('Mes siguiente'));
    await fireEvent.press(screen.getByLabelText('Mes siguiente'));
    expect(screen.getByRole('header', { name: 'Enero' })).toBeOnTheScreen();
    expect(screen.getByText('2027')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Mes anterior'));
    expect(screen.getByRole('header', { name: 'Diciembre' })).toBeOnTheScreen();
  });

  it('al cambiar de mes conserva la vista seleccionada', async () => {
    await renderWithProviders(<BalanceScreen {...props()} today={TODAY} />);
    await fireEvent.press(screen.getByText('Promedio'));
    expect(screen.getByText('Costo mensual promedio')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Mes siguiente'));
    expect(screen.getByRole('header', { name: 'Diciembre' })).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Promedio' })).toBeSelected();
    expect(screen.getByText('Costo mensual promedio')).toBeOnTheScreen();
  });

  it('botones de agregar gasto y de métodos de pago', async () => {
    const p = props();
    await renderWithProviders(<BalanceScreen {...p} today={TODAY} />);
    await fireEvent.press(screen.getByText('Agregar gasto'));
    await fireEvent.press(screen.getByLabelText('Ajustes'));
    expect(p.onAdd).toHaveBeenCalled();
    expect(p.onOpenSettings).toHaveBeenCalled();
  });
});

describe('8.2 · vista Este mes', () => {
  it('total, conteo, subtotales y orden por fecha (noviembre 2026)', async () => {
    const { repos } = await novemberScenario();
    await renderWithProviders(<BalanceScreen {...props()} today={TODAY} />, { repos });
    expect(await screen.findByText('4 cargos')).toBeOnTheScreen();
    expect(screen.getByText('Cargos de noviembre')).toBeOnTheScreen();
    expect(screen.getByLabelText('$2,269.00')).toBeOnTheScreen();
    expect(screen.getByText('Recurrentes $2,169.00')).toBeOnTheScreen();
    expect(screen.getByText('Únicos $100.00')).toBeOnTheScreen();
    const rows = screen
      .getAllByRole('button')
      .map((b) => b.props.accessibilityLabel)
      .filter((l: string | undefined) => /Netflix|Renta|Internet|Recarga|Seguro/.test(l ?? ''));
    expect(rows).toEqual(['Recarga metro, gasto único, $100.00', 'Netflix', 'Renta', 'Internet']);
    expect(screen.getByText('ÚNICO')).toBeOnTheScreen();
  });

  it('desglose por método, de mayor a menor', async () => {
    const { repos } = await novemberScenario();
    await renderWithProviders(<BalanceScreen {...props()} today={TODAY} />, { repos });
    const card = await screen.findByTestId('method-breakdown');
    const names = within(card)
      .getAllByText(/Nu Débito|BBVA Azul|Efectivo/)
      .map((t) => t.props.children[0] ?? t.props.children);
    expect(names).toEqual(['Nu Débito ••8830', 'BBVA Azul ••4521', 'Efectivo']);
    expect(within(card).getByText('$1,950.00')).toBeOnTheScreen();
    expect(within(card).getByText('$219.00')).toBeOnTheScreen();
    expect(within(card).getByText('$100.00')).toBeOnTheScreen();
  });

  it('mes sin cargos', async () => {
    const { repos } = await novemberScenario();
    await renderWithProviders(<BalanceScreen {...props()} today="2025-06-01" />, { repos });
    expect(await screen.findByText('No hay cargos este mes')).toBeOnTheScreen();
    expect(screen.getByText('0 cargos')).toBeOnTheScreen();
    expect(screen.getByLabelText('$0.00')).toBeOnTheScreen();
    expect(screen.queryByTestId('method-breakdown')).not.toBeOnTheScreen();
  });
});

describe('8.3 · vista Promedio', () => {
  it('proporcionales, únicos, total y pista del cobro real', async () => {
    const { repos } = await novemberScenario();
    await renderWithProviders(<BalanceScreen {...props()} today={TODAY} />, { repos });
    await screen.findByText('4 cargos');
    await fireEvent.press(screen.getByText('Promedio'));
    expect(screen.getByLabelText('$2,544.00')).toBeOnTheScreen();
    expect(screen.getByText('Fijos $1,719.00')).toBeOnTheScreen();
    expect(screen.getByText('Prorrateados $725.00')).toBeOnTheScreen();
    expect(screen.getByText('Únicos $100.00')).toBeOnTheScreen();
    const seguro = screen.getByRole('button', { name: 'Seguro' });
    expect(within(seguro).getByLabelText('$500.00')).toBeOnTheScreen();
    expect(within(seguro).getByText('$6,000.00 · próximo cobro 15 mar 2027')).toBeOnTheScreen();
    const internet = screen.getByRole('button', { name: 'Internet' });
    expect(within(internet).getByLabelText('$225.00')).toBeOnTheScreen();
    expect(
      within(screen.getByRole('button', { name: 'Netflix' })).queryByText(/próximo cobro/),
    ).not.toBeOnTheScreen();
    expect(screen.getByText('Únicos del mes')).toBeOnTheScreen();
    expect(screen.getByText('Recarga metro')).toBeOnTheScreen();
  });

  it('pista en un mes futuro', async () => {
    const { repos } = await novemberScenario();
    await renderWithProviders(<BalanceScreen {...props()} today={TODAY} />, { repos });
    await fireEvent.press(screen.getByText('Promedio'));
    await fireEvent.press(screen.getByLabelText('Mes siguiente'));
    await fireEvent.press(screen.getByLabelText('Mes siguiente'));
    expect(await screen.findByText('$450.00 · próximo cobro 28 ene 2027')).toBeOnTheScreen();
  });

  it('sin cobros próximos', async () => {
    const repos = createInMemoryRepositories(testDeps());
    await repos.recurringExpenses.create(
      sampleRecurring(CASH_METHOD_ID, {
        name: 'Semestral',
        intervalCount: 6,
        anchorDate: '2026-01-01',
        endDate: '2026-06-30',
      }),
    );
    await renderWithProviders(<BalanceScreen {...props()} today={TODAY} />, { repos });
    await fireEvent.press(screen.getByText('Promedio'));
    for (let i = 0; i < 5; i++) await fireEvent.press(screen.getByLabelText('Mes anterior'));
    expect(await screen.findByText('Sin cobros próximos')).toBeOnTheScreen();
  });
});

describe('8.4 · tocar un gasto abre su edición', () => {
  it('según su tipo y con su id, en ambas vistas', async () => {
    const { repos, ids } = await novemberScenario();
    const p = props();
    await renderWithProviders(<BalanceScreen {...p} today={TODAY} />, { repos });
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Recarga metro, gasto único, $100.00' }),
    );
    expect(p.onEdit).toHaveBeenLastCalledWith('oneOff', ids.metro);
    await fireEvent.press(screen.getByRole('button', { name: 'Netflix' }));
    expect(p.onEdit).toHaveBeenLastCalledWith('recurring', ids.netflix);
    await fireEvent.press(screen.getByText('Promedio'));
    await fireEvent.press(screen.getByRole('button', { name: 'Seguro' }));
    expect(p.onEdit).toHaveBeenLastCalledWith('recurring', ids.seguro);
  });
});
