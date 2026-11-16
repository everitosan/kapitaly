import { fireEvent, screen, waitFor, within } from '@testing-library/react-native';
import { ScrollView } from 'react-native';

import {
  sampleMethod,
  sampleOneOff,
  sampleRecurring,
  testDeps,
} from '@/data/repositories/contract';
import { createInMemoryRepositories } from '@/data/repositories/inMemory';
import { BUILTIN_CATEGORIES, OTHER_CATEGORY_ID } from '@/domain/category';
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

const props = () => ({
  onAdd: jest.fn(),
  onOpenSettings: jest.fn(),
  onOpenMethods: jest.fn(),
  onEdit: jest.fn(),
});

/** Etiquetas accesibles de las filas de gastos, en orden. */
const rowLabels = () =>
  screen
    .getAllByRole('button')
    .map((b) => b.props.accessibilityLabel as string | undefined)
    .filter((l): l is string => /Netflix|Renta|Internet|Recarga|Seguro/.test(l ?? ''));

const openAnalysis = () => fireEvent.press(screen.getByRole('tab', { name: 'Análisis' }));

describe('8.1 · navegación y vistas', () => {
  it('abre en el mes actual, en "Tus gastos"', async () => {
    await renderWithProviders(<BalanceScreen {...props()} today={TODAY} />);
    expect(screen.getByRole('header', { name: 'Noviembre' })).toBeOnTheScreen();
    expect(screen.getByText('2026')).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Tus gastos' })).toBeSelected();
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

  it('cambio de vista y cambio de mes conservando la vista', async () => {
    await renderWithProviders(<BalanceScreen {...props()} today={TODAY} />);
    await openAnalysis();
    expect(screen.getByText('Costo mensual promedio')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Mes siguiente'));
    expect(screen.getByRole('header', { name: 'Diciembre' })).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Análisis' })).toBeSelected();
    expect(screen.getByText('Costo mensual promedio')).toBeOnTheScreen();
  });

  it('agregar gasto, Ajustes y Métodos de pago desde el encabezado', async () => {
    const p = props();
    await renderWithProviders(<BalanceScreen {...p} today={TODAY} />);
    await fireEvent.press(screen.getByText('Agregar gasto'));
    await fireEvent.press(screen.getByRole('button', { name: 'Ajustes' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Métodos de pago' }));
    expect(p.onAdd).toHaveBeenCalled();
    expect(p.onOpenSettings).toHaveBeenCalled();
    expect(p.onOpenMethods).toHaveBeenCalled();
  });

  it('tarjeta y engrane en su propia fila, separados de las flechas', async () => {
    await renderWithProviders(<BalanceScreen {...props()} today={TODAY} />);
    const bar = screen.getByTestId('balance-top-bar');
    expect(within(bar).getByRole('button', { name: 'Métodos de pago' })).toBeOnTheScreen();
    expect(within(bar).getByRole('button', { name: 'Ajustes' })).toBeOnTheScreen();
    expect(within(bar).queryByLabelText('Mes anterior')).not.toBeOnTheScreen();
  });
});

describe('8.2 · vista Tus gastos', () => {
  it('total y conteo del mes: lista en orden y efectuado de proyectado', async () => {
    const { repos } = await novemberScenario();
    await renderWithProviders(<BalanceScreen {...props()} today={TODAY} />, { repos });
    const card = await screen.findByTestId('month-progress');
    expect(within(card).getByText('Cargos de noviembre')).toBeOnTheScreen();
    expect(within(card).getByLabelText('$100.00')).toBeOnTheScreen();
    expect(within(card).getByText('$2,269.00')).toBeOnTheScreen();
    await waitFor(() => expect(rowLabels()).toHaveLength(4));
    expect(rowLabels()).toEqual([
      'Recarga metro, gasto único, $100.00',
      'Netflix, por cobrar',
      'Renta, por cobrar',
      'Internet, por cobrar',
    ]);
    expect(
      within(screen.getByRole('button', { name: 'Netflix, por cobrar' })).getByText('POR COBRAR'),
    ).toBeOnTheScreen();
  });

  it('sin desglose por método', async () => {
    const { repos } = await novemberScenario();
    await renderWithProviders(<BalanceScreen {...props()} today={TODAY} />, { repos });
    await screen.findByTestId('month-progress');
    await waitFor(() => expect(rowLabels()).toHaveLength(4));
    expect(screen.queryByTestId('method-breakdown')).not.toBeOnTheScreen();
  });

  it('mes sin cargos', async () => {
    const { repos } = await novemberScenario();
    await renderWithProviders(<BalanceScreen {...props()} today="2025-06-01" />, { repos });
    expect(await screen.findByText('No hay cargos este mes')).toBeOnTheScreen();
    const card = screen.getByTestId('month-progress');
    expect(within(card).getByLabelText('$0.00')).toBeOnTheScreen();
    expect(within(card).getByText('de $0.00 proyectados')).toBeOnTheScreen();
  });

  it('efectuado con monto confirmado, no cobrado fuera del proyectado y barra', async () => {
    const { repos, ids } = await novemberScenario();
    const nu = (await repos.paymentMethods.list()).find((m) => m.name === 'Nu Débito')!;
    await repos.chargeConfirmations.upsert({
      recurringExpenseId: ids.netflix,
      occurrenceDate: '2026-11-15',
      status: 'charged',
      amountCents: 23900,
      paymentMethodId: (await repos.recurringExpenses.list()).find((r) => r.id === ids.netflix)!
        .paymentMethodId,
    });
    await repos.chargeConfirmations.upsert({
      recurringExpenseId: ids.renta,
      occurrenceDate: '2026-11-20',
      status: 'skipped',
      amountCents: null,
      paymentMethodId: nu.id,
    });
    await renderWithProviders(<BalanceScreen {...props()} today="2026-11-21" />, { repos });
    const card = await screen.findByTestId('month-progress');
    await waitFor(() => expect(within(card).getByLabelText('$339.00')).toBeOnTheScreen());
    expect(within(card).getByText('$789.00')).toBeOnTheScreen();
    expect(within(card).getByText('Por cobrar $450.00')).toBeOnTheScreen();
    const netflix = screen.getByRole('button', { name: 'Netflix' });
    expect(within(netflix).getByLabelText('$239.00')).toBeOnTheScreen();
    expect(within(netflix).getByText('esperado $219.00')).toBeOnTheScreen();
    const renta = screen.getByRole('button', { name: 'Renta, no se cobró' });
    expect(within(renta).getByText('NO SE COBRÓ')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Internet, por cobrar' })).toBeOnTheScreen();
  });

  it('cobro por confirmar en la barra', async () => {
    const { repos } = await novemberScenario();
    await renderWithProviders(<BalanceScreen {...props()} today="2026-11-21" focused={false} />, {
      repos,
    });
    const card = await screen.findByTestId('month-progress');
    await waitFor(() =>
      expect(within(card).getByText('Por confirmar $1,719.00')).toBeOnTheScreen(),
    );
    expect(screen.getByRole('button', { name: 'Renta, por confirmar' })).toBeOnTheScreen();
  });

  it('buscar filtra sin cambiar la tarjeta; sin acentos; sin coincidencias; borrar', async () => {
    const { repos } = await novemberScenario();
    const hogar = BUILTIN_CATEGORIES.find((c) => c.name === 'Hogar')!.id;
    const all = await repos.recurringExpenses.list();
    const renta = all.find((r) => r.name === 'Renta')!;
    await repos.recurringExpenses.update(renta.id, { ...renta, categoryId: hogar });
    await renderWithProviders(<BalanceScreen {...props()} today={TODAY} />, { repos });
    await waitFor(() => expect(rowLabels()).toHaveLength(4));
    const search = screen.getByTestId('month-search');

    await fireEvent.changeText(search, 'netf');
    expect(rowLabels()).toEqual(['Netflix, por cobrar']);
    expect(screen.getByText('1 de 4 cargos')).toBeOnTheScreen();
    expect(within(screen.getByTestId('month-progress')).getByText('$2,269.00')).toBeOnTheScreen();

    await fireEvent.changeText(search, 'HOGAR');
    expect(rowLabels()).toEqual(['Renta, por cobrar']);

    await fireEvent.changeText(search, 'débito');
    expect(rowLabels()).toEqual(['Renta, por cobrar', 'Internet, por cobrar']);

    await fireEvent.changeText(search, 'zzz');
    expect(screen.getByText('Nada coincide con "zzz"')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Borrar búsqueda' }));
    expect(rowLabels()).toHaveLength(4);
  });

  it('el botón de orden invierte la lista', async () => {
    const { repos } = await novemberScenario();
    await renderWithProviders(<BalanceScreen {...props()} today={TODAY} />, { repos });
    await waitFor(() => expect(rowLabels()).toHaveLength(4));
    expect(screen.getByText('↑ Más antiguo')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('sort-toggle'));
    expect(screen.getByText('↓ Más reciente')).toBeOnTheScreen();
    expect(rowLabels()[0]).toBe('Internet, por cobrar');
    expect(rowLabels()[3]).toBe('Recarga metro, gasto único, $100.00');
  });

  it('sin orden elegido empieza en "Más antiguo"', async () => {
    const { repos } = await novemberScenario();
    await renderWithProviders(<BalanceScreen {...props()} today={TODAY} />, { repos });
    await waitFor(() => expect(rowLabels()).toHaveLength(4));
    expect(screen.getByText('↑ Más antiguo')).toBeOnTheScreen();
    expect(rowLabels()[0]).toBe('Recarga metro, gasto único, $100.00');
  });

  it('conserva el orden elegido al volver a abrir la app', async () => {
    const { repos } = await novemberScenario();
    const view = await renderWithProviders(<BalanceScreen {...props()} today={TODAY} />, {
      repos,
    });
    await waitFor(() => expect(rowLabels()).toHaveLength(4));
    await fireEvent.press(screen.getByTestId('sort-toggle'));
    await waitFor(async () => expect(await repos.uiPreferences.get('balance.sort')).toBe('desc'));

    await view.unmount();
    await renderWithProviders(<BalanceScreen {...props()} today={TODAY} />, { repos });
    await waitFor(() => expect(rowLabels()).toHaveLength(4));
    expect(screen.getByText('↓ Más reciente')).toBeOnTheScreen();
    expect(rowLabels()[0]).toBe('Internet, por cobrar');
  });

  it('los atajos cambian a Análisis y desplazan hasta la sección', async () => {
    const { repos } = await novemberScenario();
    await renderWithProviders(<BalanceScreen {...props()} today={TODAY} />, { repos });
    await screen.findByTestId('month-progress');
    // El mock de ScrollView define `scrollTo` en su prototipo.
    const scrollTo = jest.spyOn(
      (ScrollView as unknown as { prototype: { scrollTo: () => void } }).prototype,
      'scrollTo',
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Por método' }));
    expect(screen.getByRole('tab', { name: 'Análisis' })).toBeSelected();
    await fireEvent(screen.getByTestId('section-method'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 812, width: 360, height: 200 } },
    });
    expect(scrollTo).toHaveBeenLastCalledWith({ y: 800, animated: true });

    await fireEvent.press(screen.getByRole('tab', { name: 'Tus gastos' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Por categoría' }));
    await fireEvent(screen.getByTestId('section-category'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 412, width: 360, height: 300 } },
    });
    expect(scrollTo).toHaveBeenLastCalledWith({ y: 400, animated: true });
  });
});

describe('8.3 · vista Análisis', () => {
  it('costo mensual promedio con subtotales y sin lista suelta', async () => {
    const { repos } = await novemberScenario();
    await renderWithProviders(<BalanceScreen {...props()} today={TODAY} />, { repos });
    await screen.findByTestId('month-progress');
    await openAnalysis();
    const card = screen.getByTestId('average-total');
    await waitFor(() => expect(within(card).getByLabelText('$2,544.00')).toBeOnTheScreen());
    expect(within(card).getByText('Fijos $1,719.00 ›')).toBeOnTheScreen();
    expect(within(card).getByText('Prorrateados $725.00 ›')).toBeOnTheScreen();
    expect(within(card).getByText('Únicos $100.00 ›')).toBeOnTheScreen();
    expect(screen.queryByText('Proporcional por gasto')).not.toBeOnTheScreen();
    expect(screen.queryByText('Únicos del mes')).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Seguro' })).not.toBeOnTheScreen();
  });

  it('la aclaración se abre y se cierra con "Entendido"', async () => {
    await renderWithProviders(<BalanceScreen {...props()} today={TODAY} />);
    await openAnalysis();
    await fireEvent.press(
      screen.getByRole('button', { name: '¿Qué es el costo mensual promedio?' }),
    );
    expect(screen.getByText('Tu costo de vida real')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Entendido'));
    expect(screen.queryByText('Tu costo de vida real')).not.toBeOnTheScreen();
  });

  it('modal de Prorrateados con costo mensual y pista del cobro real', async () => {
    const { repos } = await novemberScenario();
    await renderWithProviders(<BalanceScreen {...props()} today={TODAY} />, { repos });
    await screen.findByTestId('month-progress');
    await openAnalysis();
    await fireEvent.press(screen.getByRole('button', { name: 'Prorrateados $725.00, ver lista' }));
    expect(
      within(screen.getByTestId('analysis-sheet-total')).getByLabelText('$725.00'),
    ).toBeOnTheScreen();
    const seguro = screen.getByRole('button', { name: 'Seguro' });
    expect(within(seguro).getByLabelText('$500.00')).toBeOnTheScreen();
    expect(within(seguro).getByText('$6,000.00 · próximo cobro 15 mar 2027')).toBeOnTheScreen();
    expect(
      within(screen.getByRole('button', { name: 'Internet' })).getByLabelText('$225.00'),
    ).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Netflix' })).not.toBeOnTheScreen();
  });

  it('modal de Fijos: buscar, sin pista y tocar un gasto abre su edición al cerrar', async () => {
    const { repos, ids } = await novemberScenario();
    const p = props();
    await renderWithProviders(<BalanceScreen {...p} today={TODAY} />, { repos });
    await screen.findByTestId('month-progress');
    await openAnalysis();
    await fireEvent.press(screen.getByRole('button', { name: 'Fijos $1,719.00, ver lista' }));
    expect(
      within(screen.getByRole('button', { name: 'Netflix' })).queryByText(/próximo cobro/),
    ).not.toBeOnTheScreen();
    await fireEvent.changeText(screen.getByTestId('analysis-sheet-search'), 'renta');
    expect(screen.queryByRole('button', { name: 'Netflix' })).not.toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Renta' }));
    await waitFor(() => expect(p.onEdit).toHaveBeenLastCalledWith('recurring', ids.renta));
    expect(screen.queryByTestId('analysis-sheet-total')).not.toBeOnTheScreen();
  });

  it('modal de Únicos', async () => {
    const { repos, ids } = await novemberScenario();
    const p = props();
    await renderWithProviders(<BalanceScreen {...p} today={TODAY} />, { repos });
    await screen.findByTestId('month-progress');
    await openAnalysis();
    await fireEvent.press(screen.getByRole('button', { name: 'Únicos $100.00, ver lista' }));
    await fireEvent.press(
      screen.getByRole('button', { name: 'Recarga metro, gasto único, $100.00' }),
    );
    await waitFor(() => expect(p.onEdit).toHaveBeenLastCalledWith('oneOff', ids.metro));
  });

  it('pista en un mes futuro', async () => {
    const { repos } = await novemberScenario();
    await renderWithProviders(<BalanceScreen {...props()} today={TODAY} />, { repos });
    await openAnalysis();
    await fireEvent.press(screen.getByLabelText('Mes siguiente'));
    await fireEvent.press(screen.getByLabelText('Mes siguiente'));
    await fireEvent.press(await screen.findByRole('button', { name: /^Prorrateados/ }));
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
    await openAnalysis();
    for (let i = 0; i < 5; i++) await fireEvent.press(screen.getByLabelText('Mes anterior'));
    await fireEvent.press(await screen.findByRole('button', { name: /^Prorrateados/ }));
    expect(await screen.findByText('Sin cobros próximos')).toBeOnTheScreen();
  });

  it('dona por categoría: leyenda con monto y porcentaje, y resaltar', async () => {
    const repos = createInMemoryRepositories(testDeps());
    const cat = (name: string) => BUILTIN_CATEGORIES.find((c) => c.name === name)!.id;
    const add = (over: Parameters<typeof sampleRecurring>[1]) =>
      repos.recurringExpenses.create(sampleRecurring(CASH_METHOD_ID, over));
    await add({
      name: 'Renta',
      amountCents: 150000,
      anchorDate: '2026-01-20',
      categoryId: cat('Hogar'),
    });
    await add({
      name: 'Seguro',
      amountCents: 600000,
      intervalUnit: 'year',
      anchorDate: '2026-03-15',
      categoryId: cat('Transporte'),
    });
    await add({
      name: 'Internet',
      amountCents: 45000,
      intervalCount: 2,
      anchorDate: '2026-09-28',
      categoryId: cat('Servicios'),
    });
    await add({ name: 'Netflix', amountCents: 21900, categoryId: cat('Suscripciones') });
    await repos.oneOffExpenses.create(
      sampleOneOff(CASH_METHOD_ID, {
        description: 'Recarga metro',
        amountCents: 10000,
        date: '2026-11-08',
        categoryId: cat('Transporte'),
      }),
    );
    await renderWithProviders(<BalanceScreen {...props()} today={TODAY} />, { repos });
    await screen.findByTestId('month-progress');
    await openAnalysis();
    const section = screen.getByTestId('section-category');
    await waitFor(() =>
      expect(
        within(section).getByRole('button', { name: 'Hogar, $1,500.00, 59 %' }),
      ).toBeOnTheScreen(),
    );
    const legend = within(section)
      .getAllByRole('button')
      .map((b) => b.props.accessibilityLabel);
    expect(legend).toEqual([
      'Hogar, $1,500.00, 59 %',
      'Transporte, $600.00, 24 %',
      'Servicios, $225.00, 9 %',
      'Suscripciones, $219.00, 9 %',
    ]);
    const transporte = within(section).getByRole('button', { name: 'Transporte, $600.00, 24 %' });
    await fireEvent.press(transporte);
    expect(transporte).toBeSelected();
    // El centro de la dona está oculto al lector de pantalla (la leyenda lleva la información).
    const hidden = { includeHiddenElements: true };
    expect(within(section).getByText('24% al mes', hidden)).toBeTruthy();
    expect(within(section).getAllByText('$600.00', hidden)).toHaveLength(2); // centro y leyenda
    await fireEvent.press(transporte);
    expect(within(section).queryByText('24% al mes', hidden)).toBeNull();
  });

  it('dona sin gastos', async () => {
    await renderWithProviders(<BalanceScreen {...props()} today={TODAY} />);
    await openAnalysis();
    expect(screen.getByText('No hay gastos para analizar este mes.')).toBeOnTheScreen();
  });

  it('por método con prorrateo y aclaración', async () => {
    const { repos } = await novemberScenario();
    await renderWithProviders(<BalanceScreen {...props()} today={TODAY} />, { repos });
    await screen.findByTestId('month-progress');
    await openAnalysis();
    const card = await screen.findByTestId('method-breakdown');
    const names = within(card)
      .getAllByText(/Nu Débito|BBVA Azul|Efectivo/)
      .map((t) => t.props.children[0] ?? t.props.children);
    expect(names).toEqual(['Nu Débito ••8830', 'BBVA Azul ••4521', 'Efectivo']);
    expect(within(card).getByText('$1,725.00')).toBeOnTheScreen();
    expect(within(card).getByText('$719.00')).toBeOnTheScreen();
    expect(within(card).getByText('$100.00')).toBeOnTheScreen();
    expect(within(card).getByText(/Estimado con prorrateo, no es lo cobrado/)).toBeOnTheScreen();
  });
});

describe('detalle por categoría', () => {
  const cat = (name: string) => BUILTIN_CATEGORIES.find((c) => c.name === name)!.id;

  async function scenario() {
    const repos = createInMemoryRepositories(testDeps());
    const add = (over: Parameters<typeof sampleRecurring>[1]) =>
      repos.recurringExpenses.create(sampleRecurring(CASH_METHOD_ID, over));
    const once = (over: Parameters<typeof sampleOneOff>[1]) =>
      repos.oneOffExpenses.create(sampleOneOff(CASH_METHOD_ID, over));
    await add({
      name: 'Renta',
      amountCents: 150000,
      anchorDate: '2026-01-20',
      categoryId: cat('Hogar'),
    });
    await once({
      description: 'Focos',
      amountCents: 18000,
      date: '2026-11-03',
      categoryId: cat('Hogar'),
    });
    await add({
      name: 'Seguro anual',
      amountCents: 600000,
      intervalUnit: 'year',
      anchorDate: '2026-03-15',
      categoryId: cat('Transporte'),
    });
    await once({
      description: 'Recarga metro',
      amountCents: 10000,
      date: '2026-11-08',
      categoryId: cat('Transporte'),
    });
    await once({
      description: 'Tacos',
      amountCents: 25000,
      date: '2026-11-10',
      categoryId: cat('Comida'),
    });
    await renderWithProviders(<BalanceScreen {...props()} today={TODAY} />, { repos });
    await screen.findByTestId('month-progress');
    await openAnalysis();
    const section = screen.getByTestId('section-category');
    await waitFor(() =>
      expect(
        within(section).getByRole('button', { name: /^Transporte, \$600\.00/ }),
      ).toBeOnTheScreen(),
    );
    return section;
  }

  const legendRow = (section: ReturnType<typeof screen.getByTestId>, name: string) =>
    within(section).getByRole('button', { name: new RegExp(`^${name}, `) });
  const detailText = () =>
    within(screen.getByTestId('category-detail'))
      .getAllByText(/./)
      .map((t) => t.props.children);

  it('muestra el texto de la tarjeta', async () => {
    await scenario();
    expect(
      screen.getByText(
        'Incluye la parte proporcional de lo que pagas cada cierto tiempo, como un seguro anual. Así ves cuánto te cuesta tu estilo de vida.',
      ),
    ).toBeOnTheScreen();
  });

  it('abre desde la leyenda con lo que forma la cifra, y se cierra al tocar otra vez', async () => {
    const section = await scenario();
    expect(screen.queryByTestId('category-detail')).toBeNull();
    const transporte = legendRow(section, 'Transporte');
    await fireEvent.press(transporte);
    expect(transporte).toBeExpanded();
    expect(detailText()).toEqual([
      '8 nov',
      'Recarga metro',
      '$100.00',
      '15 mar 2027',
      'Seguro anual',
      'PRORRATEO',
      '$500.00',
    ]);
    await fireEvent.press(transporte);
    expect(screen.queryByTestId('category-detail')).toBeNull();
  });

  it('abre desde la dona y cambia de categoría', async () => {
    const section = await scenario();
    await fireEvent.press(
      within(section).getByTestId(`donut-${cat('Hogar')}`, { includeHiddenElements: true }),
    );
    expect(legendRow(section, 'Hogar')).toBeExpanded();
    expect(detailText()).toEqual([
      '3 nov',
      'Focos',
      '$180.00',
      '20 nov',
      'Renta',
      'POR COBRAR',
      '$1,500.00',
    ]);
    await fireEvent.press(legendRow(section, 'Transporte'));
    expect(screen.getAllByTestId('category-detail')).toHaveLength(1);
    expect(legendRow(section, 'Hogar')).not.toBeExpanded();
    expect(detailText()).toContain('Recarga metro');
  });

  it('sigue abierto en un mes donde la categoría tiene gastos', async () => {
    const section = await scenario();
    await fireEvent.press(legendRow(section, 'Hogar'));
    await fireEvent.press(screen.getByLabelText('Mes siguiente'));
    await waitFor(() =>
      expect(detailText()).toEqual(['20 dic', 'Renta', 'POR COBRAR', '$1,500.00']),
    );
  });

  it('se cierra en un mes sin la categoría y no reaparece al volver', async () => {
    const section = await scenario();
    await fireEvent.press(legendRow(section, 'Comida'));
    expect(detailText()).toEqual(['10 nov', 'Tacos', '$250.00']);
    await fireEvent.press(screen.getByLabelText('Mes siguiente'));
    await waitFor(() => expect(screen.queryByTestId('category-detail')).toBeNull());
    await fireEvent.press(screen.getByLabelText('Mes anterior'));
    await waitFor(() =>
      expect(legendRow(screen.getByTestId('section-category'), 'Comida')).toBeOnTheScreen(),
    );
    expect(screen.queryByTestId('category-detail')).toBeNull();
    expect(legendRow(screen.getByTestId('section-category'), 'Comida')).not.toBeSelected();
  });
});

describe('detalle por método', () => {
  async function scenario() {
    const { repos } = await novemberScenario();
    await renderWithProviders(<BalanceScreen {...props()} today={TODAY} />, { repos });
    await screen.findByTestId('month-progress');
    await openAnalysis();
    await screen.findByTestId('method-breakdown');
  }
  const methodRow = (name: string) =>
    within(screen.getByTestId('method-breakdown')).getByRole('button', {
      name: new RegExp(`^${name}`),
    });
  const detailText = () =>
    within(screen.getByTestId('method-detail'))
      .getAllByText(/./)
      .map((t) => t.props.children);

  it('abre el detalle con lo que forma la cifra y se cierra al tocar otra vez', async () => {
    await scenario();
    expect(screen.queryByTestId('method-detail')).toBeNull();
    const bbva = methodRow('BBVA Azul');
    await fireEvent.press(bbva);
    expect(bbva).toBeExpanded();
    expect(detailText()).toEqual([
      '15 nov',
      'Netflix',
      'POR COBRAR',
      '$219.00',
      '15 mar 2027',
      'Seguro',
      'PRORRATEO',
      '$500.00',
    ]);
    await fireEvent.press(bbva);
    expect(screen.queryByTestId('method-detail')).toBeNull();
  });

  it('cambia de método', async () => {
    await scenario();
    await fireEvent.press(methodRow('BBVA Azul'));
    await fireEvent.press(methodRow('Nu Débito'));
    expect(screen.getAllByTestId('method-detail')).toHaveLength(1);
    expect(methodRow('BBVA Azul')).not.toBeExpanded();
    expect(detailText()).toEqual([
      '20 nov',
      'Renta',
      'POR COBRAR',
      '$1,500.00',
      '28 nov',
      'Internet',
      'PRORRATEO',
      '$225.00',
    ]);
  });

  it('es independiente de la categoría abierta', async () => {
    await scenario();
    const section = screen.getByTestId('section-category');
    await fireEvent.press(within(section).getByRole('button', { name: /^Otro, / }));
    await fireEvent.press(methodRow('BBVA Azul'));
    expect(screen.getByTestId('category-detail')).toBeOnTheScreen();
    expect(screen.getByTestId('method-detail')).toBeOnTheScreen();
  });

  it('sigue abierto en un mes donde el método tiene gastos', async () => {
    await scenario();
    await fireEvent.press(methodRow('Nu Débito'));
    await fireEvent.press(screen.getByLabelText('Mes siguiente'));
    await waitFor(() =>
      expect(detailText()).toEqual([
        '20 dic',
        'Renta',
        'POR COBRAR',
        '$1,500.00',
        '28 ene 2027',
        'Internet',
        'PRORRATEO',
        '$225.00',
      ]),
    );
  });

  it('se cierra en un mes sin el método y no reaparece al volver', async () => {
    await scenario();
    await fireEvent.press(methodRow('Efectivo'));
    expect(detailText()).toEqual(['8 nov', 'Recarga metro', '$100.00']);
    await fireEvent.press(screen.getByLabelText('Mes siguiente'));
    await waitFor(() => expect(screen.queryByTestId('method-detail')).toBeNull());
    await fireEvent.press(screen.getByLabelText('Mes anterior'));
    await waitFor(() => expect(methodRow('Efectivo')).toBeOnTheScreen());
    expect(screen.queryByTestId('method-detail')).toBeNull();
    expect(methodRow('Efectivo')).not.toBeSelected();
  });
});

describe('8.4 · tocar un gasto de "Tus gastos" abre su edición', () => {
  it('según su tipo y con su id', async () => {
    const { repos, ids } = await novemberScenario();
    const p = props();
    await renderWithProviders(<BalanceScreen {...p} today={TODAY} />, { repos });
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Recarga metro, gasto único, $100.00' }),
    );
    expect(p.onEdit).toHaveBeenLastCalledWith('oneOff', ids.metro);
    await fireEvent.press(screen.getByRole('button', { name: 'Netflix, por cobrar' }));
    expect(p.onEdit).toHaveBeenLastCalledWith('recurring', ids.netflix);
  });
});

describe('categoría en las filas', () => {
  const id = (name: string) => BUILTIN_CATEGORIES.find((b) => b.name === name)!.id;

  it('"Tus gastos" muestra la categoría de recurrentes y únicos', async () => {
    const repos = createInMemoryRepositories(testDeps());
    await repos.recurringExpenses.create(
      sampleRecurring(CASH_METHOD_ID, { categoryId: id('Suscripciones') }),
    );
    await repos.oneOffExpenses.create(
      sampleOneOff(CASH_METHOD_ID, { date: '2026-11-08', categoryId: id('Transporte') }),
    );
    await renderWithProviders(<BalanceScreen {...props()} today={TODAY} />, { repos });
    expect(await screen.findByText('Suscripciones')).toBeOnTheScreen();
    expect(screen.getByText('Transporte')).toBeOnTheScreen();
  });

  it('categoría en la lista de Fijos de Análisis', async () => {
    const repos = createInMemoryRepositories(testDeps());
    await repos.recurringExpenses.create(
      sampleRecurring(CASH_METHOD_ID, { name: 'Renta', categoryId: id('Hogar') }),
    );
    await renderWithProviders(<BalanceScreen {...props()} today={TODAY} />, { repos });
    await openAnalysis();
    await fireEvent.press(await screen.findByRole('button', { name: /^Fijos \$219/ }));
    const row = screen.getByRole('button', { name: 'Renta' });
    expect(within(row).getByText('Hogar')).toBeOnTheScreen();
  });

  it('un gasto de una categoría borrada se muestra con "Otro"', async () => {
    const repos = createInMemoryRepositories(testDeps());
    const gym = await repos.categories.create({ name: 'Gimnasio', icon: 'dumbbell' });
    await repos.recurringExpenses.create(
      sampleRecurring(CASH_METHOD_ID, { name: 'Smart Fit', categoryId: gym.id }),
    );
    await repos.categories.remove(gym.id);
    await renderWithProviders(<BalanceScreen {...props()} today={TODAY} />, { repos });
    expect(await screen.findByTestId(`category-pill-${OTHER_CATEGORY_ID}`)).toBeOnTheScreen();
    expect(screen.queryByText('Gimnasio')).toBeNull();
  });
});

describe('estado de cobros en el detalle', () => {
  it('marca lo vencido y lo futuro en el detalle por categoría y por método', async () => {
    const { repos, ids } = await novemberScenario();
    const nu = (await repos.paymentMethods.list()).find((m) => m.name === 'Nu Débito')!;
    const bbva = (await repos.paymentMethods.list()).find((m) => m.name === 'BBVA Azul')!;
    await repos.recurringExpenses.create(
      sampleRecurring(nu.id, { name: 'Agua', amountCents: 32000, anchorDate: '2026-01-28' }),
    );
    await repos.chargeConfirmations.upsert({
      recurringExpenseId: ids.netflix,
      occurrenceDate: '2026-11-15',
      status: 'charged',
      amountCents: 21900,
      paymentMethodId: bbva.id,
    });
    await renderWithProviders(<BalanceScreen {...props()} today="2026-11-21" />, { repos });
    await screen.findByTestId('month-progress');
    await openAnalysis();
    const breakdown = await screen.findByTestId('method-breakdown');
    await fireEvent.press(within(breakdown).getByRole('button', { name: /^Nu Débito/ }));
    const method = within(screen.getByTestId('method-detail'));
    expect(
      within(screen.getByTestId(`method-detail-recurring:${ids.renta}`)).getByText('POR CONFIRMAR'),
    ).toBeOnTheScreen();
    expect(
      method.getByLabelText(/^Agua, \$320\.00, 28 de noviembre de 2026, por cobrar$/),
    ).toBeOnTheScreen();

    const section = screen.getByTestId('section-category');
    await fireEvent.press(within(section).getByRole('button', { name: /^Otro, / }));
    const category = within(screen.getByTestId('category-detail'));
    expect(
      category.getByLabelText(/^Netflix, \$219\.00, 15 de noviembre de 2026$/),
    ).toBeOnTheScreen();
    expect(category.getByLabelText(/^Renta, .*, por confirmar$/)).toBeOnTheScreen();
    expect(category.getByLabelText(/^Agua, .*, por cobrar$/)).toBeOnTheScreen();
  });
});

describe('gasto del día a día', () => {
  async function analysis(repos?: Awaited<ReturnType<typeof novemberScenario>>['repos']) {
    const r = repos ?? (await novemberScenario()).repos;
    const view = await renderWithProviders(<BalanceScreen {...props()} today="2026-11-21" />, {
      repos: r,
    });
    await screen.findByTestId('month-progress');
    await openAnalysis();
    await screen.findByTestId('section-daily');
    return { repos: r, view };
  }
  const barsLabel = () => screen.getByTestId('daily-bars').props.accessibilityLabel as string;

  it('es la última sección de Análisis y abre con hoy elegido', async () => {
    await analysis();
    const tree = JSON.stringify(screen.toJSON());
    expect(tree.indexOf('"section-method"')).toBeLessThan(tree.indexOf('"section-daily"'));
    expect(barsLabel()).toBe('21 de noviembre, sin registros');
    await fireEvent.press(screen.getByLabelText('Día anterior'));
    expect(barsLabel()).toBe('20 de noviembre, sin registros');
  });

  it('en un mes pasado no hay día elegido y en uno futuro no se muestra', async () => {
    await analysis();
    await fireEvent.press(screen.getByLabelText('Mes anterior'));
    // Octubre no tiene únicos (y es anterior al primer uso): la tarjeta invita a registrar.
    await waitFor(() => expect(screen.getByText(/Aún no hay gastos únicos/)).toBeOnTheScreen());
    expect(screen.queryByTestId('daily-day')).toBeNull();
    await fireEvent.press(screen.getByLabelText('Mes siguiente'));
    await fireEvent.press(screen.getByLabelText('Mes siguiente'));
    await waitFor(() => expect(screen.queryByTestId('section-daily')).toBeNull());
  });

  it('incluir domiciliados suma la Renta y se recuerda', async () => {
    const { repos, view } = await analysis();
    await fireEvent.press(screen.getByLabelText('Día anterior'));
    expect(barsLabel()).toBe('20 de noviembre, sin registros');
    await fireEvent(screen.getByLabelText('Incluir domiciliados'), 'valueChange', true);
    await waitFor(() =>
      expect(barsLabel()).toBe('20 de noviembre, $1,500.00, $1,500.00 domiciliado'),
    );
    await waitFor(async () =>
      expect(await repos.uiPreferences.get('daily.includeRecurring')).toBe('1'),
    );
    view.unmount();

    await analysis(repos);
    expect(screen.getByLabelText('Incluir domiciliados').props.value).toBe(true);
  });
});
