import { fireEvent, screen, waitFor, within } from '@testing-library/react-native';
import { Alert, type AlertButton } from 'react-native';

import {
  sampleMethod,
  sampleOneOff,
  sampleRecurring,
  testDeps,
} from '@/data/repositories/contract';
import {
  createInMemoryRepositories,
  type InMemoryRepositories,
} from '@/data/repositories/inMemory';
import { CASH_METHOD_ID } from '@/domain/paymentMethod';

import { BalanceScreen } from '../../balance/BalanceScreen';
import { renderWithProviders } from '../../testUtils';
import { ExpenseForm } from '../ExpenseForm';

const TODAY = '2026-11-11';

/** Elige una fecha en el DateField indicado (abre el selector y simula la elección nativa). */
async function pickDate(testID: string, year: number, month: number, day: number) {
  await fireEvent.press(screen.getByTestId(testID));
  const date = new Date(year, month - 1, day);
  const picker = screen.getByTestId('date-picker');
  await fireEvent(
    picker,
    'change',
    { type: 'set', nativeEvent: { timestamp: date.getTime(), utcOffset: 0 } },
    date,
  );
}

async function balanceShows(repos: InMemoryRepositories, text: string, monthsAhead = 0) {
  await renderWithProviders(
    <BalanceScreen onAdd={jest.fn()} onOpenMethods={jest.fn()} onEdit={jest.fn()} today={TODAY} />,
    { repos },
  );
  for (let i = 0; i < monthsAhead; i++)
    await fireEvent.press(screen.getByLabelText('Mes siguiente'));
  for (let i = 0; i > monthsAhead; i--)
    await fireEvent.press(screen.getByLabelText('Mes anterior'));
  return screen.findByText(text);
}

const save = () => fireEvent.press(screen.getByText('Guardar'));

describe('7.1 · Agregar gasto: tipo y método', () => {
  it('empieza en Único y al cambiar a Recurrente muestra frecuencia, fecha de cobro y fecha de fin', async () => {
    await renderWithProviders(
      <ExpenseForm target={{ kind: 'new' }} onDone={jest.fn()} today={TODAY} />,
    );
    expect(screen.getByRole('tab', { name: 'Único' })).toBeSelected();
    expect(screen.getByText('Descripción')).toBeOnTheScreen();
    expect(screen.queryByText('Frecuencia')).not.toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Recurrente'));
    expect(screen.getByText('Frecuencia')).toBeOnTheScreen();
    expect(screen.getByText('Fecha de cobro')).toBeOnTheScreen();
    expect(screen.getByText('Fecha de fin')).toBeOnTheScreen();
  });

  it('preselecciona el método del último gasto registrado', async () => {
    const repos = createInMemoryRepositories(testDeps());
    const bbva = await repos.paymentMethods.create(sampleMethod());
    const nu = await repos.paymentMethods.create(
      sampleMethod({ name: 'Nu Débito', institutionId: 'nu-mx', last4: '8830' }),
    );
    await repos.oneOffExpenses.create(sampleOneOff(bbva.id));
    await repos.recurringExpenses.create(sampleRecurring(nu.id));
    await renderWithProviders(
      <ExpenseForm target={{ kind: 'new' }} onDone={jest.fn()} today={TODAY} />,
      { repos },
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Nu Débito ••8830' })).toBeSelected(),
    );
  });

  it('"+ Nuevo" crea un método sin perder lo capturado y lo deja seleccionado', async () => {
    const { repos } = await renderWithProviders(
      <ExpenseForm target={{ kind: 'new' }} onDone={jest.fn()} today={TODAY} />,
    );
    await fireEvent.changeText(screen.getByTestId('expense-title'), 'Farmacia');
    await fireEvent.changeText(screen.getByTestId('amount-input'), '238.50');
    await fireEvent.press(screen.getByText('+ Nuevo'));
    expect(await screen.findByRole('header', { name: 'Nuevo método' })).toBeOnTheScreen();
    expect(screen.getByText('Farmacia · $238.50')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('institution-klar-mx'));
    await fireEvent.changeText(screen.getByTestId('method-name'), 'Klar Débito');
    await fireEvent.press(screen.getByText('Guardar y usar'));
    await waitFor(() =>
      expect(screen.queryByRole('header', { name: 'Nuevo método' })).not.toBeOnTheScreen(),
    );
    expect(screen.getByTestId('expense-title')).toHaveDisplayValue('Farmacia');
    expect(screen.getByTestId('amount-input')).toHaveDisplayValue('238.50');
    expect(screen.getByRole('button', { name: 'Klar Débito' })).toBeSelected();
    expect((await repos.paymentMethods.list()).some((m) => m.name === 'Klar Débito')).toBe(true);
  });
});

describe('7.2 · Gasto único', () => {
  it('alta rápida con la fecha de hoy', async () => {
    const onDone = jest.fn();
    const { repos } = await renderWithProviders(
      <ExpenseForm target={{ kind: 'new' }} onDone={onDone} today={TODAY} />,
    );
    expect(screen.getByText('Hoy · 11 nov 2026')).toBeOnTheScreen();
    await fireEvent.changeText(screen.getByTestId('expense-title'), 'Recarga metro');
    await fireEvent.changeText(screen.getByTestId('amount-input'), '100');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Efectivo' })).toBeSelected());
    await save();
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(await repos.oneOffExpenses.list()).toEqual([
      expect.objectContaining({
        description: 'Recarga metro',
        amountCents: 10000,
        date: TODAY,
        paymentMethodId: CASH_METHOD_ID,
      }),
    ]);
  });

  it('fecha pasada', async () => {
    const onDone = jest.fn();
    const { repos } = await renderWithProviders(
      <ExpenseForm target={{ kind: 'new' }} onDone={onDone} today={TODAY} />,
    );
    await fireEvent.changeText(screen.getByTestId('expense-title'), 'Comida con amigos');
    await fireEvent.changeText(screen.getByTestId('amount-input'), '450');
    await pickDate('expense-date', 2026, 10, 30);
    expect(screen.getByText('30 oct 2026')).toBeOnTheScreen();
    await save();
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect((await repos.oneOffExpenses.list())[0].date).toBe('2026-10-30');
  });

  it('muestra los errores junto a cada campo', async () => {
    const onDone = jest.fn();
    await renderWithProviders(
      <ExpenseForm target={{ kind: 'new' }} onDone={onDone} today={TODAY} />,
    );
    await save();
    expect(await screen.findByText('La descripción es obligatoria')).toBeOnTheScreen();
    expect(screen.getByText('Captura un monto')).toBeOnTheScreen();
    await fireEvent.changeText(screen.getByTestId('amount-input'), '10.555');
    await save();
    expect(await screen.findByText('El monto admite hasta dos decimales')).toBeOnTheScreen();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('edición de un gasto único existente', async () => {
    const repos = createInMemoryRepositories(testDeps());
    const e = await repos.oneOffExpenses.create(
      sampleOneOff(CASH_METHOD_ID, { date: '2026-11-02' }),
    );
    const onDone = jest.fn();
    await renderWithProviders(
      <ExpenseForm target={{ kind: 'oneOff', expense: e }} onDone={onDone} today={TODAY} />,
      { repos },
    );
    expect(screen.queryByTestId('expense-type')).not.toBeOnTheScreen();
    expect(screen.getByTestId('amount-input')).toHaveDisplayValue('100.00');
    await pickDate('expense-date', 2026, 10, 28);
    await save();
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect((await repos.oneOffExpenses.get(e.id))?.date).toBe('2026-10-28');
  });
});

describe('7.3 · Gasto recurrente', () => {
  it('el bloque de monto refleja la frecuencia', async () => {
    await renderWithProviders(
      <ExpenseForm target={{ kind: 'new' }} onDone={jest.fn()} today={TODAY} />,
    );
    await fireEvent.press(screen.getByText('Recurrente'));
    await fireEvent.changeText(screen.getByTestId('amount-input'), '219');
    expect(screen.getByText('Se cobra cada mes')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Bimestral'));
    expect(screen.getByText('$109.50 al mes en promedio')).toBeOnTheScreen();
  });

  it('muestra los errores junto a cada campo', async () => {
    const onDone = jest.fn();
    await renderWithProviders(
      <ExpenseForm target={{ kind: 'new' }} onDone={onDone} today={TODAY} />,
    );
    await fireEvent.press(screen.getByText('Recurrente'));
    await fireEvent.changeText(screen.getByTestId('amount-input'), '0');
    await fireEvent(screen.getByTestId('has-end'), 'valueChange', true);
    await pickDate('expense-end', 2026, 11, 1);
    await save();
    expect(await screen.findByText('El nombre es obligatorio')).toBeOnTheScreen();
    expect(screen.getByText('El monto debe ser mayor que cero')).toBeOnTheScreen();
    expect(
      screen.getByText('La fecha de fin no puede ser anterior a la fecha de cobro'),
    ).toBeOnTheScreen();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('alta semestral con fecha de fin', async () => {
    const onDone = jest.fn();
    const { repos } = await renderWithProviders(
      <ExpenseForm target={{ kind: 'new' }} onDone={onDone} today={TODAY} />,
    );
    await fireEvent.press(screen.getByText('Recurrente'));
    await fireEvent.changeText(screen.getByTestId('expense-title'), 'Servicio del auto');
    await fireEvent.changeText(screen.getByTestId('amount-input'), '2,400');
    await fireEvent.press(screen.getByText('Semestral'));
    await fireEvent(screen.getByTestId('has-end'), 'valueChange', true);
    await pickDate('expense-end', 2028, 5, 10);
    await save();
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(await repos.recurringExpenses.list()).toEqual([
      expect.objectContaining({
        name: 'Servicio del auto',
        amountCents: 240000,
        intervalUnit: 'month',
        intervalCount: 6,
        anchorDate: TODAY,
        endDate: '2028-05-10',
      }),
    ]);
  });
});

describe('7.4 · Guardar y ver en el balance', () => {
  it('un gasto único con fecha pasada aparece en el balance de su mes', async () => {
    const { repos } = await renderWithProviders(
      <ExpenseForm target={{ kind: 'new' }} onDone={jest.fn()} today={TODAY} />,
    );
    await fireEvent.changeText(screen.getByTestId('expense-title'), 'Comida con amigos');
    await fireEvent.changeText(screen.getByTestId('amount-input'), '450');
    await pickDate('expense-date', 2026, 10, 30);
    await save();
    await waitFor(async () => expect(await repos.oneOffExpenses.list()).toHaveLength(1));
    expect(await balanceShows(repos, 'Comida con amigos', -1)).toBeOnTheScreen();
  });

  it('editar el monto de un recurrente se refleja en el balance', async () => {
    const repos = createInMemoryRepositories(testDeps());
    const renta = await repos.recurringExpenses.create(
      sampleRecurring(CASH_METHOD_ID, {
        name: 'Renta',
        amountCents: 150000,
        anchorDate: '2026-01-20',
      }),
    );
    const onDone = jest.fn();
    await renderWithProviders(
      <ExpenseForm target={{ kind: 'recurring', expense: renta }} onDone={onDone} today={TODAY} />,
      { repos },
    );
    await fireEvent.changeText(screen.getByTestId('amount-input'), '1650');
    await save();
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    await balanceShows(repos, 'Renta');
    const row = screen.getByRole('button', { name: 'Renta' });
    expect(within(row).getByLabelText('$1,650.00')).toBeOnTheScreen();
  });
});

describe('7.5 · Eliminar', () => {
  let alert: jest.SpyInstance;
  beforeEach(() => {
    alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });
  afterEach(() => alert.mockRestore());
  const press = async (text: string) => {
    const buttons = alert.mock.calls.at(-1)?.[2] as AlertButton[];
    await buttons.find((b) => b.text === text)?.onPress?.();
  };

  it('confirmar lo quita de todas las vistas', async () => {
    const repos = createInMemoryRepositories(testDeps());
    const netflix = await repos.recurringExpenses.create(sampleRecurring(CASH_METHOD_ID));
    const onDone = jest.fn();
    await renderWithProviders(
      <ExpenseForm
        target={{ kind: 'recurring', expense: netflix }}
        onDone={onDone}
        today={TODAY}
      />,
      { repos },
    );
    await fireEvent.press(screen.getByText('Eliminar gasto'));
    expect(alert).toHaveBeenCalledWith(
      '¿Eliminar "Netflix"?',
      expect.any(String),
      expect.any(Array),
    );
    await press('Eliminar gasto');
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(await repos.recurringExpenses.list()).toEqual([]);
    await renderWithProviders(
      <BalanceScreen
        onAdd={jest.fn()}
        onOpenMethods={jest.fn()}
        onEdit={jest.fn()}
        today={TODAY}
      />,
      { repos },
    );
    expect(await screen.findByText('No hay cargos este mes')).toBeOnTheScreen();
  });

  it('cancelar no cambia nada', async () => {
    const repos = createInMemoryRepositories(testDeps());
    const metro = await repos.oneOffExpenses.create(sampleOneOff(CASH_METHOD_ID));
    const onDone = jest.fn();
    await renderWithProviders(
      <ExpenseForm target={{ kind: 'oneOff', expense: metro }} onDone={onDone} today={TODAY} />,
      { repos },
    );
    await fireEvent.press(screen.getByText('Eliminar gasto'));
    await press('Cancelar');
    expect(onDone).not.toHaveBeenCalled();
    expect(await repos.oneOffExpenses.list()).toHaveLength(1);
  });
});
