import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';

import {
  buildAverageView,
  buildThisMonthView,
  sortCharges,
  type MonthCharge,
  type SortDirection,
} from '@/domain/balance';
import { resolveCategory } from '@/domain/category';
import { civilDateFromLocal, parseCivilDate, shiftMonth, type CivilDate } from '@/domain/date';
import { methodLabel } from '@/domain/paymentMethod';
import { frequencyLabel, monthsPerInterval } from '@/domain/recurringExpense';
import { matchesSearch } from '@/domain/search';
import {
  AverageTotalCard,
  CategoryDonut,
  MonthProgressCard,
  type AverageListKind,
} from '@/ui/components/analysis';
import { PrimaryButton, SearchField } from '@/ui/components/basics';
import {
  BalanceTopBar,
  ExpenseRow,
  MethodBreakdownCard,
  MonthSwitcher,
  SegmentedControl,
} from '@/ui/components/balance';
import { ScreenLayout } from '@/ui/components/layout';
import { categoryColorMap } from '@/ui/categoryColor';
import { MONTH_NAMES } from '@/ui/format';
import { frequencyKeyForMonths } from '@/ui/theme';
import { useTheme } from '@/ui/ThemeProvider';

import { PendingSheet } from '../pending/PendingSheet';
import { pendingSession } from '../pending/session';
import { registeredOnLocal, usePending } from '../pending/usePending';
import {
  useCategories,
  useChargeConfirmations,
  useOneOffExpenses,
  usePaymentMethods,
  useRecurringExpenses,
} from '../repositories';
import { AnalysisListSheet } from './AnalysisListSheet';

export type BalanceView = 'this' | 'avg';
type Section = 'category' | 'method';

export interface BalanceScreenProps {
  onAdd: () => void;
  onOpenSettings: () => void;
  onOpenMethods: () => void;
  onEdit: (kind: 'recurring' | 'oneOff', id: string) => void;
  /** Fecha de hoy (zona local). Se inyecta en pruebas. */
  today?: CivilDate;
  /** Contenido extra al final de la lista. */
  extra?: ReactNode;
  /**
   * Si el balance está visible (sin otra pantalla encima). La hoja automática de Pendientes solo se
   * abre así, para no tapar el formulario cuando la app arranca desde el acceso directo.
   */
  focused?: boolean;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const METHOD_NOTE = 'Estimado con prorrateo, no es lo cobrado. Lo real del mes está en "Este mes".';

export function BalanceScreen({
  onAdd,
  onOpenSettings,
  onOpenMethods,
  onEdit,
  today = civilDateFromLocal(new Date()),
  extra,
  focused = true,
}: BalanceScreenProps) {
  const theme = useTheme();
  const methods = usePaymentMethods();
  const recurring = useRecurringExpenses();
  const categories = useCategories();
  const oneOffs = useOneOffExpenses();
  const confirmations = useChargeConfirmations();
  const start = parseCivilDate(today);
  const [{ year, month }, setMonth] = useState({ year: start.year, month: start.month });
  const [view, setView] = useState<BalanceView>('this');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortDirection>('asc');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [list, setList] = useState<AverageListKind | null>(null);
  const editAfterClose = useRef<{ kind: 'recurring' | 'oneOff'; id: string } | null>(null);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const [scrollTarget, setScrollTarget] = useState<Section | null>(null);

  const pending = usePending(today);
  const [forceSheet, setForceSheet] = useState(false);
  const [, setSessionTick] = useState(0);
  // La hoja se abre sola cuando el balance queda visible y hay pendientes; al cerrarla no vuelve
  // sola en esta sesión.
  const sheetVisible =
    pending.loaded &&
    pending.count > 0 &&
    (forceSheet || (focused && !pendingSession.autoDismissed));
  const closeSheet = () => {
    pendingSession.dismissAuto();
    setForceSheet(false);
    setSessionTick((t) => t + 1);
  };

  // Se navega a la edición solo cuando el modal de la lista ya se cerró.
  useEffect(() => {
    const target = editAfterClose.current;
    if (list === null && target) {
      editAfterClose.current = null;
      onEdit(target.kind, target.id);
    }
  }, [list, onEdit]);

  const methodById = new Map(methods.data.map((m) => [m.id, m]));
  const methodOf = (id: string) => methodById.get(id) ?? null;
  const methodName = (id: string) => {
    const m = methodOf(id);
    return m ? methodLabel(m) : 'Método desconocido';
  };
  const go = (delta: number) => setMonth(shiftMonth(year, month, delta));
  const changeView = (v: BalanceView) => {
    setView(v);
    setScrollTarget(null);
  };
  const jumpTo = (section: Section) => {
    setView('avg');
    setScrollTarget(section);
  };
  // Al montarse la sección destino, se desplaza hasta ella.
  const handleSectionLayout = (section: Section, y: number) => {
    if (scrollTarget !== section) return;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
    setScrollTarget(null);
  };

  const chargeRow = (c: MonthCharge) =>
    c.kind === 'oneOff' ? (
      <ExpenseRow
        key={`o-${c.id}`}
        variant="oneOff"
        date={c.date}
        title={c.label}
        amountCents={c.amountCents}
        method={methodOf(c.paymentMethodId)}
        cardVariant={c.expense.cardVariant}
        category={resolveCategory(c.categoryId, categories.data)}
        onPress={() => onEdit('oneOff', c.id)}
      />
    ) : (
      <ExpenseRow
        key={`r-${c.id}`}
        variant="recurring"
        status={c.status}
        expectedCents={c.expectedCents}
        gradient={
          theme.frequency[
            frequencyKeyForMonths(
              monthsPerInterval(c.expense.intervalUnit, c.expense.intervalCount),
            )
          ]
        }
        date={c.date}
        title={c.label}
        frequency={frequencyLabel(c.expense.intervalUnit, c.expense.intervalCount)}
        amountCents={c.amountCents}
        method={methodOf(c.paymentMethodId)}
        cardVariant={c.expense.cardVariant}
        category={resolveCategory(c.categoryId, categories.data)}
        onPress={() => onEdit('recurring', c.id)}
      />
    );

  const average = buildAverageView(recurring.data, oneOffs.data, year, month, today, {
    methods: methods.data,
    categories: categories.data,
  });

  let body;
  if (view === 'this') {
    const v = buildThisMonthView({
      recurring: recurring.data,
      oneOffs: oneOffs.data,
      confirmations: confirmations.data,
      year,
      month,
      today,
      registeredOn: registeredOnLocal,
    });
    const shown = sortCharges(
      v.charges.filter((c) =>
        matchesSearch(query, [
          c.label,
          resolveCategory(c.categoryId, categories.data).name,
          methodName(c.paymentMethodId),
        ]),
      ),
      sort,
    );
    body = (
      <>
        <MonthProgressCard
          monthName={MONTH_NAMES[month - 1]}
          doneCents={v.doneCents}
          pendingCents={v.pendingCents}
          futureCents={v.futureCents}
          projectedCents={v.projectedCents}
          onByCategory={() => jumpTo('category')}
          onByMethod={() => jumpTo('method')}
        />
        {v.count > 0 ? (
          <>
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder={`Buscar en ${MONTH_NAMES[month - 1]}`}
              testID="month-search"
            />
            <View style={styles.listHead}>
              <Text style={[styles.sectionText, { color: theme.colors.muted }]}>
                CARGOS DEL MES
              </Text>
              <Pressable
                testID="sort-toggle"
                accessibilityRole="button"
                accessibilityLabel={`Orden: ${sort === 'asc' ? 'más antiguo primero' : 'más reciente primero'}`}
                onPress={() => setSort((s) => (s === 'asc' ? 'desc' : 'asc'))}
                hitSlop={8}
                style={[styles.sort, { backgroundColor: theme.colors.card }]}
              >
                <Text style={[styles.sortText, { color: theme.colors.ink }]}>
                  {sort === 'asc' ? '↑ Más antiguo' : '↓ Más reciente'}
                </Text>
              </Pressable>
            </View>
            {query ? (
              <Text style={[styles.count, { color: theme.colors.muted }]}>
                {`${shown.length} de ${plural(v.count, 'cargo', 'cargos')}`}
              </Text>
            ) : null}
            {shown.length > 0 ? (
              shown.map(chargeRow)
            ) : (
              <Empty text={`Nada coincide con "${query}"`} />
            )}
          </>
        ) : (
          <Empty text="No hay cargos este mes" />
        )}
      </>
    );
  } else {
    const color = categoryColorMap(categories.data, theme);
    body = (
      <>
        <AverageTotalCard
          totalCents={average.totalCents}
          fixedCents={average.fixedCents}
          proratedCents={average.proratedCents}
          oneOffCents={average.oneOffCents}
          onOpen={setList}
        />
        <View
          testID="section-category"
          onLayout={(e) => handleSectionLayout('category', e.nativeEvent.layout.y)}
          style={[
            styles.card,
            { backgroundColor: theme.colors.card, borderRadius: theme.radii.row },
          ]}
        >
          <View style={styles.cardHead}>
            <Text style={[styles.sectionText, { color: theme.colors.muted }]}>POR CATEGORÍA</Text>
            <Text style={[styles.sectionText, { color: theme.colors.muted }]}>al mes</Text>
          </View>
          {average.byCategory.length > 0 ? (
            <>
              <Text style={[styles.cardNote, { color: theme.colors.muted }]}>
                Con lo prorrateado: así se reparte tu costo de vida.
              </Text>
              <CategoryDonut
                entries={average.byCategory.map((e) => ({
                  id: e.category.id,
                  name: e.category.name,
                  amountCents: e.amountCents,
                  color: color(e.category.id),
                }))}
                totalCents={average.totalCents}
                selectedId={selectedCategory}
                onSelect={setSelectedCategory}
              />
            </>
          ) : (
            <Text style={[styles.cardNote, { color: theme.colors.muted }]}>
              No hay gastos para analizar este mes.
            </Text>
          )}
        </View>
        <View
          testID="section-method"
          onLayout={(e) => handleSectionLayout('method', e.nativeEvent.layout.y)}
        >
          {average.byMethod.length > 0 ? (
            <MethodBreakdownCard
              entries={average.byMethod}
              totalCents={average.totalCents}
              caption="al mes"
              note={METHOD_NOTE}
            />
          ) : null}
        </View>
      </>
    );
  }

  return (
    <ScreenLayout
      scrollRef={scrollRef}
      footer={<PrimaryButton label="Agregar gasto" plus onPress={onAdd} testID="add-expense" />}
    >
      <BalanceTopBar onOpenMethods={onOpenMethods} onOpenSettings={onOpenSettings} />
      <MonthSwitcher year={year} month={month} onPrev={() => go(-1)} onNext={() => go(1)} />
      <View style={styles.seg}>
        <SegmentedControl
          testID="balance-view"
          options={[
            { value: 'this', label: 'Este mes' },
            { value: 'avg', label: 'Análisis' },
          ]}
          value={view}
          onChange={changeView}
        />
      </View>
      {pending.count > 0 ? (
        <Pressable
          testID="pending-banner"
          accessibilityRole="button"
          onPress={() => setForceSheet(true)}
          style={[styles.banner, { backgroundColor: theme.colors.card }]}
        >
          <View style={[styles.bannerDot, { backgroundColor: theme.frequency.semiannual.from }]}>
            <Text style={[styles.bannerDotText, { color: theme.colors.onBlock }]}>
              {pending.count}
            </Text>
          </View>
          <View>
            <Text style={[styles.bannerTitle, { color: theme.colors.ink }]}>
              {plural(pending.count, 'pendiente', 'pendientes')}
            </Text>
            <Text style={[styles.bannerSub, { color: theme.colors.muted }]}>
              Cobros y pagos por confirmar · toca para revisar
            </Text>
          </View>
        </Pressable>
      ) : null}
      {body}
      {extra}
      <Modal
        visible={sheetVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeSheet}
      >
        {sheetVisible ? (
          <PendingSheet
            charges={pending.charges}
            cardPayments={pending.cardPayments}
            methods={pending.methods}
            today={today}
            onClose={closeSheet}
            onSnooze={() => setSessionTick((t) => t + 1)}
          />
        ) : null}
      </Modal>
      <Modal
        visible={list !== null && !sheetVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setList(null)}
      >
        {list !== null ? (
          <AnalysisListSheet
            kind={list}
            view={average}
            methods={methods.data}
            categories={categories.data}
            onClose={() => setList(null)}
            onSelect={(kind, id) => {
              editAfterClose.current = { kind, id };
              setList(null);
            }}
          />
        ) : null}
      </Modal>
    </ScreenLayout>
  );
}

function Empty({ text }: { text: string }) {
  const { colors, radii } = useTheme();
  return (
    <View style={[styles.empty, { backgroundColor: colors.card, borderRadius: radii.row }]}>
      <Text style={[styles.emptyIcon, { color: colors.muted }]}>✦</Text>
      <Text style={[styles.emptyText, { color: colors.muted }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  seg: { marginBottom: 18 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    padding: 12,
    marginBottom: 16,
  },
  bannerDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerDotText: { fontWeight: '800' },
  bannerTitle: { fontSize: 15, fontWeight: '800' },
  bannerSub: { fontSize: 12, fontWeight: '600' },
  listHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 4,
    marginBottom: 12,
  },
  sectionText: { fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  sort: { borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6 },
  sortText: { fontSize: 12, fontWeight: '800' },
  count: { fontSize: 12, fontWeight: '700', marginHorizontal: 4, marginTop: -6, marginBottom: 12 },
  card: { padding: 18, marginBottom: 22 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  cardNote: { fontSize: 13, fontWeight: '600', marginBottom: 12 },
  empty: { paddingVertical: 34, paddingHorizontal: 24, alignItems: 'center' },
  emptyIcon: { fontSize: 40, marginBottom: 6 },
  emptyText: { fontSize: 15, fontWeight: '600' },
});
