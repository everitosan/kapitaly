import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert, type AlertButton } from 'react-native';

import { INSTITUTION_CATALOG } from '@/data/institutions/catalog';
import { sampleMethod, sampleRecurring, testDeps } from '@/data/repositories/contract';
import { createInMemoryRepositories } from '@/data/repositories/inMemory';
import { effectiveColor } from '@/domain/institution';
import { CASH_METHOD_ID } from '@/domain/paymentMethod';

import { renderWithProviders } from '../../testUtils';
import { PaymentMethodForm } from '../PaymentMethodForm';

/** Pulsa el botón de un `Alert.alert` simulado. */
async function pressAlertButton(spy: jest.SpyInstance, text: string) {
  const buttons = spy.mock.calls.at(-1)?.[2] as AlertButton[] | undefined;
  const button = buttons?.find((b) => b.text === text);
  if (!button?.onPress) throw new Error(`No hay botón "${text}" en la alerta`);
  await button.onPress();
}

const save = () => fireEvent.press(screen.getByText('Guardar'));

describe('PaymentMethodForm · alta', () => {
  it('alta de tarjeta con institución', async () => {
    const onDone = jest.fn();
    const { repos } = await renderWithProviders(
      <PaymentMethodForm method={null} onDone={onDone} />,
    );
    await fireEvent.press(screen.getByText('Crédito'));
    await fireEvent.press(screen.getByTestId('institution-bbva-mx'));
    await fireEvent.changeText(screen.getByTestId('method-name'), 'BBVA Azul');
    await fireEvent.changeText(screen.getByTestId('method-last4'), '4521');
    await save();
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    const created = (await repos.paymentMethods.list()).find((m) => m.name === 'BBVA Azul');
    expect(created).toMatchObject({ kind: 'credit', institutionId: 'bbva-mx', last4: '4521' });
  });

  it('alta sin institución con un color de la paleta', async () => {
    const onDone = jest.fn();
    const { repos } = await renderWithProviders(
      <PaymentMethodForm method={null} onDone={onDone} />,
    );
    await fireEvent.press(screen.getByText('Crédito'));
    await fireEvent.changeText(screen.getByTestId('method-name'), 'Tarjeta de la tienda');
    await fireEvent.press(screen.getByTestId('color-peach'));
    await save();
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    const created = (await repos.paymentMethods.list()).find(
      (m) => m.name === 'Tarjeta de la tienda',
    );
    expect(created).toMatchObject({ institutionId: null, color: 'peach' });
  });

  it('propone el nombre de la institución y el usuario puede cambiarlo', async () => {
    await renderWithProviders(<PaymentMethodForm method={null} onDone={jest.fn()} />);
    await fireEvent.press(screen.getByTestId('institution-nu-mx'));
    expect(screen.getByTestId('method-name')).toHaveDisplayValue('Nu');
    await fireEvent.press(screen.getByTestId('institution-klar-mx'));
    expect(screen.getByTestId('method-name')).toHaveDisplayValue('Klar');
    await fireEvent.changeText(screen.getByTestId('method-name'), 'Mi Klar');
    await fireEvent.press(screen.getByTestId('institution-nu-mx'));
    expect(screen.getByTestId('method-name')).toHaveDisplayValue('Mi Klar');
  });

  it('Cetesdirecto no se ofrece como institución', async () => {
    await renderWithProviders(<PaymentMethodForm method={null} onDone={jest.fn()} />);
    expect(screen.queryByTestId('institution-cetes-mx')).not.toBeOnTheScreen();
  });

  it('color de la institución por defecto', async () => {
    const onDone = jest.fn();
    const { repos } = await renderWithProviders(
      <PaymentMethodForm method={null} onDone={onDone} />,
    );
    await fireEvent.press(screen.getByTestId('institution-santander-mx'));
    await fireEvent.press(screen.getByTestId('color-institution'));
    await save();
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    const created = (await repos.paymentMethods.list()).find((m) => m.name === 'Santander')!;
    expect(created.color).toBeNull();
    const c = effectiveColor(created, INSTITUTION_CATALOG);
    expect(c.kind === 'brand' && c.duotone.from).toBe('#EC0000');
  });

  it('dígitos inválidos', async () => {
    const onDone = jest.fn();
    await renderWithProviders(<PaymentMethodForm method={null} onDone={onDone} />);
    await fireEvent.changeText(screen.getByTestId('method-name'), 'Débito');
    await fireEvent.changeText(screen.getByTestId('method-last4'), '45A');
    await save();
    expect(await screen.findByText('Deben ser 4 números')).toBeOnTheScreen();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('nombre obligatorio', async () => {
    await renderWithProviders(<PaymentMethodForm method={null} onDone={jest.fn()} />);
    await save();
    expect(await screen.findByText('El nombre es obligatorio')).toBeOnTheScreen();
  });

  it('el efectivo oculta institución y dígitos', async () => {
    await renderWithProviders(<PaymentMethodForm method={null} onDone={jest.fn()} />);
    await fireEvent.press(screen.getAllByText('Efectivo')[0]);
    expect(screen.queryByLabelText('Buscar institución')).not.toBeOnTheScreen();
    expect(screen.queryByTestId('method-last4')).not.toBeOnTheScreen();
  });
});

describe('PaymentMethodForm · edición', () => {
  async function setupWithNu() {
    const repos = createInMemoryRepositories(testDeps());
    const nu = await repos.paymentMethods.create(
      sampleMethod({ name: 'Nu Débito', kind: 'debit', institutionId: 'nu-mx', last4: '8830' }),
    );
    return { repos, nu };
  }

  it('sustituir y restablecer el color', async () => {
    const { repos, nu } = await setupWithNu();
    const onDone = jest.fn();
    const view = await renderWithProviders(<PaymentMethodForm method={nu} onDone={onDone} />, {
      repos,
    });
    await fireEvent.press(screen.getByTestId('color-lime'));
    await save();
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect((await repos.paymentMethods.get(nu.id))?.color).toBe('lime');

    const updated = (await repos.paymentMethods.get(nu.id))!;
    await view.rerender(<></>);
    await renderWithProviders(<PaymentMethodForm method={updated} onDone={onDone} />, { repos });
    await fireEvent.press(screen.getByTestId('color-institution'));
    await save();
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(2));
    expect((await repos.paymentMethods.get(nu.id))?.color).toBeNull();
  });

  it('renombrar actualiza los gastos que lo usan (se refieren por id)', async () => {
    const { repos, nu } = await setupWithNu();
    const expense = await repos.recurringExpenses.create(sampleRecurring(nu.id));
    const onDone = jest.fn();
    await renderWithProviders(<PaymentMethodForm method={nu} onDone={onDone} />, { repos });
    await fireEvent.changeText(screen.getByTestId('method-name'), 'Nu Oro');
    await save();
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    const stored = await repos.recurringExpenses.get(expense.id);
    expect((await repos.paymentMethods.get(stored!.paymentMethodId))?.name).toBe('Nu Oro');
  });
});

describe('PaymentMethodForm · archivar y eliminar', () => {
  let alert: jest.SpyInstance;
  beforeEach(() => {
    alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });
  afterEach(() => alert.mockRestore());

  it('archivar un método en uso', async () => {
    const repos = createInMemoryRepositories(testDeps());
    const bbva = await repos.paymentMethods.create(sampleMethod());
    await repos.recurringExpenses.create(sampleRecurring(bbva.id));
    const onDone = jest.fn();
    await renderWithProviders(<PaymentMethodForm method={bbva} onDone={onDone} />, { repos });
    expect(await screen.findByText(/Lo usan 1 gasto/)).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Archivar'));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect((await repos.paymentMethods.get(bbva.id))?.archivedAt).not.toBeNull();
  });

  it('eliminar un método sin uso, con confirmación', async () => {
    const repos = createInMemoryRepositories(testDeps());
    const m = await repos.paymentMethods.create(sampleMethod());
    const onDone = jest.fn();
    await renderWithProviders(<PaymentMethodForm method={m} onDone={onDone} />, { repos });
    await fireEvent.press(await screen.findByText('Eliminar'));
    expect(alert).toHaveBeenCalledWith(
      '¿Eliminar "BBVA Azul"?',
      expect.any(String),
      expect.any(Array),
    );
    await pressAlertButton(alert, 'Eliminar método');
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(await repos.paymentMethods.get(m.id)).toBeNull();
  });

  it('intentar eliminar un método en uso ofrece archivarlo', async () => {
    const repos = createInMemoryRepositories(testDeps());
    const m = await repos.paymentMethods.create(sampleMethod());
    await repos.recurringExpenses.create(sampleRecurring(m.id));
    const onDone = jest.fn();
    await renderWithProviders(<PaymentMethodForm method={m} onDone={onDone} />, { repos });
    await screen.findByText(/Lo usan 1 gasto/);
    await fireEvent.press(screen.getByText('Eliminar'));
    expect(alert).toHaveBeenCalledWith(
      '"BBVA Azul" está en uso',
      expect.any(String),
      expect.any(Array),
    );
    await pressAlertButton(alert, 'Archivar método');
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    const stored = await repos.paymentMethods.get(m.id);
    expect(stored).not.toBeNull();
    expect(stored?.archivedAt).not.toBeNull();
  });

  it('el último método activo no se puede archivar ni eliminar', async () => {
    const repos = createInMemoryRepositories(testDeps());
    const cash = (await repos.paymentMethods.get(CASH_METHOD_ID))!;
    await renderWithProviders(<PaymentMethodForm method={cash} onDone={jest.fn()} />, { repos });
    expect(await screen.findByText(/Debe existir al menos un método activo/)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Archivar' })).toBeDisabled();
  });

  it('reactivar un método archivado', async () => {
    const repos = createInMemoryRepositories(testDeps());
    const m = await repos.paymentMethods.create(sampleMethod());
    await repos.paymentMethods.archive(m.id);
    const archived = (await repos.paymentMethods.get(m.id))!;
    const onDone = jest.fn();
    await renderWithProviders(<PaymentMethodForm method={archived} onDone={onDone} />, { repos });
    await fireEvent.press(screen.getByText('Reactivar'));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect((await repos.paymentMethods.get(m.id))?.archivedAt).toBeNull();
  });
});
