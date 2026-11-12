import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { INSTITUTION_CATALOG } from '@/data/institutions/catalog';
import { institutionsFor } from '@/domain/institution';
import { CASH_METHOD_ID, NO_CARD_DATA, type PaymentMethod } from '@/domain/paymentMethod';

import { themes, type ColorSchemeName } from '../../theme';
import { ThemeProvider } from '../../ThemeProvider';
import {
  DangerButton,
  MoneyText,
  PrimaryButton,
  SecondaryButton,
  Switch,
  TextField,
} from '../basics';
import {
  ExpenseRow,
  InstitutionBadge,
  MethodBreakdownCard,
  MonthSwitcher,
  SegmentedControl,
  TotalCard,
} from '../balance';
import {
  AmountBlock,
  DateField,
  FrequencyChips,
  InstitutionPicker,
  MethodCard,
  PaymentMethodPicker,
  recurringCaption,
} from '../forms';

const meta = {
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  deletedAt: null,
  ...NO_CARD_DATA,
};
const bbva: PaymentMethod = {
  ...meta,
  id: 'bbva',
  name: 'BBVA Azul',
  kind: 'credit',
  institutionId: 'bbva-mx',
  last4: '4521',
  color: null,
  archivedAt: null,
};
const cash: PaymentMethod = {
  ...meta,
  id: CASH_METHOD_ID,
  name: 'Efectivo',
  kind: 'cash',
  institutionId: null,
  last4: null,
  color: 'mint',
  archivedAt: null,
};
const old: PaymentMethod = {
  ...bbva,
  id: 'old',
  name: 'Banamex Clásica',
  institutionId: 'banamex-mx',
  last4: '3310',
  archivedAt: '2026-10-01T00:00:00Z',
};

const renderIn = (scheme: ColorSchemeName, ui: ReactElement) =>
  render(<ThemeProvider scheme={scheme}>{ui}</ThemeProvider>);

describe.each(['light', 'dark'] as const)('componentes en tema %s', (scheme) => {
  const theme = themes[scheme];

  it('MoneyText separa centavos', async () => {
    await renderIn(scheme, <MoneyText cents={785650} />);
    expect(screen.getByLabelText('$7,856.50')).toBeTruthy();
  });

  it('botones', async () => {
    const onPress = jest.fn();
    await renderIn(
      scheme,
      <>
        <PrimaryButton label="Agregar gasto" plus onPress={onPress} />
        <SecondaryButton label="Cancelar" />
        <DangerButton label="Eliminar" disabled />
      </>,
    );
    await fireEvent.press(screen.getByText('Agregar gasto'));
    expect(onPress).toHaveBeenCalled();
    expect(screen.getByText('+')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeDisabled();
  });

  it('SegmentedControl cambia de opción', async () => {
    const onChange = jest.fn();
    await renderIn(
      scheme,
      <SegmentedControl
        options={[
          { value: 'this', label: 'Este mes' },
          { value: 'avg', label: 'Promedio' },
        ]}
        value="this"
        onChange={onChange}
      />,
    );
    expect(screen.getByRole('tab', { name: 'Este mes' })).toBeSelected();
    await fireEvent.press(screen.getByText('Promedio'));
    expect(onChange).toHaveBeenCalledWith('avg');
  });

  it('MonthSwitcher con mes, año y botones', async () => {
    const onPrev = jest.fn();
    const onMenu = jest.fn();
    await renderIn(
      scheme,
      <MonthSwitcher
        year={2026}
        month={11}
        onPrev={onPrev}
        onNext={jest.fn()}
        onMenu={onMenu}
      />,
    );
    expect(screen.getByText('Noviembre')).toBeTruthy();
    expect(screen.getByText('2026')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Mes anterior'));
    await fireEvent.press(screen.getByLabelText('Ajustes'));
    expect(onPrev).toHaveBeenCalled();
    expect(onMenu).toHaveBeenCalled();
  });

  it('TotalCard con píldoras', async () => {
    await renderIn(
      scheme,
      <TotalCard
        variant="thisMonth"
        label="Cargos de noviembre"
        cents={226900}
        pills={['4 cargos', 'Únicos $100.00']}
      />,
    );
    expect(screen.getByText('Cargos de noviembre')).toBeTruthy();
    expect(screen.getByText('4 cargos')).toBeTruthy();
    expect(screen.getByLabelText('$2,269.00')).toBeTruthy();
  });

  it('ExpenseRow: recurrente, único y promedio con pista, todos con método', async () => {
    await renderIn(
      scheme,
      <>
        <ExpenseRow
          variant="recurring"
          gradient={theme.frequency.monthly}
          date="2026-11-15"
          title="Netflix"
          frequency="Mensual"
          amountCents={21900}
          method={bbva}
        />
        <ExpenseRow
          variant="oneOff"
          date="2026-11-08"
          title="Recarga metro"
          amountCents={10000}
          method={cash}
        />
        <ExpenseRow
          variant="average"
          gradient={theme.frequency.annual}
          title="Seguro"
          frequency="Anual"
          monthlyCents={50000}
          hint="$6,000.00 · próximo cobro 15 mar 2027"
          method={null}
        />
      </>,
    );
    expect(screen.getAllByText('BBVA Azul ••4521')).toHaveLength(1);
    expect(screen.getByText('ÚNICO')).toBeTruthy();
    expect(screen.getByText('Efectivo')).toBeTruthy();
    expect(screen.getByText('$6,000.00 · próximo cobro 15 mar 2027')).toBeTruthy();
    expect(screen.getByText('Método desconocido')).toBeTruthy();
    expect(screen.getByText('al mes')).toBeTruthy();
  });

  it('MethodBreakdownCard marca los archivados', async () => {
    await renderIn(
      scheme,
      <MethodBreakdownCard
        totalCents={300000}
        entries={[
          { paymentMethodId: 'bbva', method: bbva, amountCents: 200000 },
          { paymentMethodId: 'old', method: old, amountCents: 100000 },
        ]}
      />,
    );
    expect(screen.getByText('POR MÉTODO')).toBeTruthy();
    expect(screen.getByText('$2,000.00')).toBeTruthy();
    expect(screen.getByText(/archivado/)).toBeTruthy();
  });

  it('InstitutionBadge muestra el monograma', async () => {
    await renderIn(
      scheme,
      <InstitutionBadge
        method={{ institutionId: 'mercadopago-mx', kind: 'debit', name: 'MP' }}
        size={30}
      />,
    );
    expect(screen.getByText('MP')).toBeTruthy();
  });

  it('TextField con error', async () => {
    await renderIn(
      scheme,
      <TextField
        label="Monto"
        value="0"
        onChangeText={jest.fn()}
        error="El monto debe ser mayor que cero"
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('El monto debe ser mayor que cero');
  });

  it('Switch', async () => {
    const onChange = jest.fn();
    await renderIn(scheme, <Switch label="Fecha de fin" value={false} onValueChange={onChange} />);
    await fireEvent(screen.getByLabelText('Fecha de fin'), 'valueChange', true);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('AmountBlock neutro y en duotono', async () => {
    await renderIn(
      scheme,
      <>
        <AmountBlock
          amountText="100"
          onChangeText={jest.fn()}
          caption="Gasto único · no se repite"
        />
        <AmountBlock
          amountText="219"
          onChangeText={jest.fn()}
          caption={recurringCaption(21900, 2)}
          gradient={theme.frequency.bimonthly}
        />
      </>,
    );
    expect(screen.getByText('$109.50 al mes en promedio')).toBeTruthy();
  });

  it('FrequencyChips: presets y stepper de "Cada N meses"', async () => {
    const onChange = jest.fn();
    const { rerender } = await renderIn(
      scheme,
      <FrequencyChips unit="month" count={1} onChange={onChange} />,
    );
    await fireEvent.press(screen.getByText('Anual'));
    expect(onChange).toHaveBeenLastCalledWith('year', 1);
    await fireEvent.press(screen.getByText('Cada N meses'));
    expect(onChange).toHaveBeenLastCalledWith('month', 4);
    await rerender(
      <ThemeProvider scheme={scheme}>
        <FrequencyChips unit="month" count={4} onChange={onChange} />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('interval-months')).toHaveTextContent('4');
    await fireEvent.press(screen.getByLabelText('Más meses'));
    expect(onChange).toHaveBeenLastCalledWith('month', 5);
  });

  it('PaymentMethodPicker solo ofrece activos y tiene "+ Nuevo"', async () => {
    const onSelect = jest.fn();
    const onNew = jest.fn();
    await renderIn(
      scheme,
      <PaymentMethodPicker
        methods={[cash, bbva, old]}
        selectedId={cash.id}
        onSelect={onSelect}
        onNew={onNew}
      />,
    );
    expect(screen.queryByText('Banamex Clásica ••3310')).toBeNull();
    expect(screen.getByRole('button', { name: 'Efectivo' })).toBeSelected();
    await fireEvent.press(screen.getByText('BBVA Azul ••4521'));
    expect(onSelect).toHaveBeenCalledWith('bbva');
    await fireEvent.press(screen.getByText('+ Nuevo'));
    expect(onNew).toHaveBeenCalled();
  });

  it('InstitutionPicker filtra con la búsqueda y permite "Sin institución"', async () => {
    const onSelect = jest.fn();
    await renderIn(
      scheme,
      <InstitutionPicker
        institutions={institutionsFor(INSTITUTION_CATALOG, 'pay')}
        selectedId="nu-mx"
        onSelect={onSelect}
      />,
    );
    expect(screen.queryByText('Cetesdirecto')).toBeNull();
    await fireEvent.changeText(screen.getByLabelText('Buscar institución'), 'mer');
    expect(screen.getByText('Mercado Pago')).toBeTruthy();
    expect(screen.queryByText('BBVA')).toBeNull();
    await fireEvent.press(screen.getByText('Sin institución'));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('DateField muestra la fecha corta', async () => {
    await renderIn(
      scheme,
      <DateField label="Fecha" prefix="Hoy" value="2026-11-11" onChange={jest.fn()} />,
    );
    expect(screen.getByText('Hoy · 11 nov 2026')).toBeTruthy();
  });

  it('MethodCard con institución, dígitos y conteo de uso', async () => {
    await renderIn(scheme, <MethodCard method={bbva} uses={3} />);
    expect(screen.getByText('BBVA · Crédito')).toBeTruthy();
    expect(screen.getByText('•••• 4521')).toBeTruthy();
    expect(screen.getByText('3 gastos')).toBeTruthy();
  });
});
