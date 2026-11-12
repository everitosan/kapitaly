import { useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { buildAverageView, buildThisMonthView, type MonthCharge } from '@/domain/balance';
import { resolveCategory } from '@/domain/category';
import { civilDateFromLocal, parseCivilDate, shiftMonth, type CivilDate } from '@/domain/date';
import { formatMXN } from '@/domain/money';
import { frequencyLabel, monthsPerInterval } from '@/domain/recurringExpense';
import { PrimaryButton, SectionLabel } from '@/ui/components/basics';
import {
  ExpenseRow,
  MethodBreakdownCard,
  MonthSwitcher,
  SegmentedControl,
  TotalCard,
} from '@/ui/components/balance';
import { ScreenLayout } from '@/ui/components/layout';
import { formatShortDate, MONTH_NAMES } from '@/ui/format';
import { frequencyKeyForMonths } from '@/ui/theme';
import { useTheme } from '@/ui/ThemeProvider';

import { isPending } from '@/domain/confirmations';

import { PendingSheet } from '../pending/PendingSheet';
import { pendingSession } from '../pending/session';
import { usePending } from '../pending/usePending';
import {
  useCategories,
  useOneOffExpenses,
  usePaymentMethods,
  useRecurringExpenses,
} from '../repositories';

export type BalanceView = 'this' | 'avg';

export interface BalanceScreenProps {
  onAdd: () => void;
  onOpenSettings: () => void;
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

export function BalanceScreen({
  onAdd,
  onOpenSettings,
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
  const start = parseCivilDate(today);
  const [{ year, month }, setMonth] = useState({ year: start.year, month: start.month });
  const [view, setView] = useState<BalanceView>('this');
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

  const methodById = new Map(methods.data.map((m) => [m.id, m]));
  const methodOf = (id: string) => methodById.get(id) ?? null;
  const go = (delta: number) => setMonth(shiftMonth(year, month, delta));

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
        category={resolveCategory(c.expense.categoryId, categories.data)}
        onPress={() => onEdit('oneOff', c.id)}
      />
    ) : (
      <ExpenseRow
        key={`r-${c.id}`}
        variant="recurring"
        pending={c.date <= today && isPending(pending.allCharges, c.id, c.date)}
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
        category={resolveCategory(c.expense.categoryId, categories.data)}
        onPress={() => onEdit('recurring', c.id)}
      />
    );

  let body;
  if (view === 'this') {
    const v = buildThisMonthView(recurring.data, oneOffs.data, methods.data, year, month);
    body = (
      <>
        <TotalCard
          variant="thisMonth"
          label={`Cargos de ${MONTH_NAMES[month - 1]}`}
          cents={v.totalCents}
          pills={[
            plural(v.count, 'cargo', 'cargos'),
            `Recurrentes ${formatMXN(v.recurringCents)}`,
            `Únicos ${formatMXN(v.oneOffCents)}`,
          ]}
        />
        {v.count > 0 ? (
          <MethodBreakdownCard entries={v.breakdown} totalCents={v.totalCents} />
        ) : null}
        <SectionLabel>Por fecha</SectionLabel>
        {v.count > 0 ? v.charges.map(chargeRow) : <Empty text="No hay cargos este mes" />}
      </>
    );
  } else {
    const v = buildAverageView(recurring.data, oneOffs.data, year, month, today);
    body = (
      <>
        <TotalCard
          variant="average"
          label="Costo mensual promedio"
          cents={v.totalCents}
          pills={[
            `Fijos ${formatMXN(v.fixedCents)}`,
            `Prorrateados ${formatMXN(v.proratedCents)}`,
            `Únicos ${formatMXN(v.oneOffCents)}`,
          ]}
        />
        <SectionLabel>Proporcional por gasto</SectionLabel>
        {v.items.length > 0 ? (
          v.items.map((i) => (
            <ExpenseRow
              key={i.expense.id}
              variant="average"
              gradient={theme.frequency[frequencyKeyForMonths(i.monthsPerInterval)]}
              title={i.expense.name}
              frequency={frequencyLabel(i.expense.intervalUnit, i.expense.intervalCount)}
              monthlyCents={i.monthlyCents}
              hint={
                i.nextCharge === undefined
                  ? undefined
                  : i.nextCharge === null
                    ? 'Sin cobros próximos'
                    : `${formatMXN(i.expense.amountCents)} · próximo cobro ${formatShortDate(i.nextCharge)}`
              }
              method={methodOf(i.expense.paymentMethodId)}
              cardVariant={i.expense.cardVariant}
              category={resolveCategory(i.expense.categoryId, categories.data)}
              onPress={() => onEdit('recurring', i.expense.id)}
            />
          ))
        ) : (
          <Empty text="Sin gastos vigentes" />
        )}
        {v.oneOffs.length > 0 ? (
          <>
            <SectionLabel style={styles.groupGap}>Únicos del mes</SectionLabel>
            {v.oneOffs.map(chargeRow)}
          </>
        ) : null}
      </>
    );
  }

  return (
    <ScreenLayout
      footer={<PrimaryButton label="Agregar gasto" plus onPress={onAdd} testID="add-expense" />}
    >
      <MonthSwitcher
        year={year}
        month={month}
        onPrev={() => go(-1)}
        onNext={() => go(1)}
        onMenu={onOpenSettings}
      />
      <View style={styles.seg}>
        <SegmentedControl
          testID="balance-view"
          options={[
            { value: 'this', label: 'Este mes' },
            { value: 'avg', label: 'Promedio' },
          ]}
          value={view}
          onChange={setView}
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
  groupGap: { marginTop: 22 },
  empty: { paddingVertical: 34, paddingHorizontal: 24, alignItems: 'center' },
  emptyIcon: { fontSize: 40, marginBottom: 6 },
  emptyText: { fontSize: 15, fontWeight: '600' },
});
