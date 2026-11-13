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

describe('8.2 · vista Este mes', () => {
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

    await fireEvent.press(screen.getByRole('tab', { name: 'Este mes' }));
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

describe('8.4 · tocar un gasto de "Este mes" abre su edición', () => {
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

  it('"Este mes" muestra la categoría de recurrentes y únicos', async () => {
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
