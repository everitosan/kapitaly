import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AverageItem, AverageView } from '@/domain/balance';
import { resolveCategory, type Category } from '@/domain/category';
import { formatMXN, type Cents } from '@/domain/money';
import { methodLabel, type PaymentMethod } from '@/domain/paymentMethod';
import { frequencyLabel } from '@/domain/recurringExpense';
import { matchesSearch } from '@/domain/search';
import type { AverageListKind } from '@/ui/components/analysis';
import { MoneyText, SearchField } from '@/ui/components/basics';
import { ExpenseRow } from '@/ui/components/balance';
import { SheetLayout } from '@/ui/components/layout';
import { formatShortDate } from '@/ui/format';
import { frequencyKeyForMonths } from '@/ui/theme';
import { useTheme } from '@/ui/ThemeProvider';

const TITLES: Record<AverageListKind, { title: string; desc: string }> = {
  fixed: { title: 'Fijos', desc: 'Se cobran cada mes por el mismo monto.' },
  prorated: {
    title: 'Prorrateados',
    desc: 'Se pagan cada varios meses; aquí cuentan su parte mensual.',
  },
  oneOff: { title: 'Únicos', desc: 'Gastos únicos registrados en el mes.' },
};

export interface AnalysisListSheetProps {
  kind: AverageListKind;
  view: AverageView;
  methods: readonly PaymentMethod[];
  categories: readonly Category[];
  onClose: () => void;
  onSelect: (kind: 'recurring' | 'oneOff', id: string) => void;
}

/** Modal con el total, un buscador y la lista de Fijos, Prorrateados o Únicos de Análisis. */
export function AnalysisListSheet({
  kind,
  view,
  methods,
  categories,
  onClose,
  onSelect,
}: AnalysisListSheetProps) {
  const theme = useTheme();
  const { colors } = theme;
  const [query, setQuery] = useState('');
  const methodById = new Map(methods.map((m) => [m.id, m]));
  const methodOf = (id: string) => methodById.get(id) ?? null;
  const methodName = (id: string) => {
    const m = methodOf(id);
    return m ? methodLabel(m) : 'Método desconocido';
  };
  const { title, desc } = TITLES[kind];
  const totalCents: Cents =
    kind === 'fixed'
      ? view.fixedCents
      : kind === 'prorated'
        ? view.proratedCents
        : view.oneOffCents;

  const averageRow = (i: AverageItem) => (
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
      category={resolveCategory(i.expense.categoryId, categories)}
      onPress={() => onSelect('recurring', i.expense.id)}
    />
  );

  let rows;
  if (kind === 'oneOff') {
    rows = view.oneOffs
      .filter((c) =>
        matchesSearch(query, [
          c.label,
          resolveCategory(c.categoryId, categories).name,
          methodName(c.paymentMethodId),
        ]),
      )
      .map((c) =>
        c.kind === 'oneOff' ? (
          <ExpenseRow
            key={c.id}
            variant="oneOff"
            date={c.date}
            title={c.label}
            amountCents={c.amountCents}
            method={methodOf(c.paymentMethodId)}
            cardVariant={c.expense.cardVariant}
            category={resolveCategory(c.categoryId, categories)}
            onPress={() => onSelect('oneOff', c.id)}
          />
        ) : null,
      );
  } else {
    rows = view.items
      .filter((i) => (kind === 'fixed' ? i.monthsPerInterval === 1 : i.monthsPerInterval > 1))
      .filter((i) =>
        matchesSearch(query, [
          i.expense.name,
          resolveCategory(i.expense.categoryId, categories).name,
          methodName(i.expense.paymentMethodId),
        ]),
      )
      .map(averageRow);
  }

  return (
    <SheetLayout title={title} leftLabel="Cerrar" onLeft={onClose}>
      <View style={[styles.summary, { backgroundColor: colors.ink }]} testID="analysis-sheet-total">
        <Text style={[styles.summaryLabel, { color: colors.bg }]}>{`${title} · al mes`}</Text>
        <MoneyText cents={totalCents} size={32} color={colors.bg} />
        <Text style={[styles.summaryDesc, { color: colors.bg }]}>{desc}</Text>
      </View>
      <SearchField
        value={query}
        onChange={setQuery}
        placeholder={`Buscar en ${title.toLowerCase()}`}
        testID="analysis-sheet-search"
      />
      {rows.length > 0 ? (
        rows
      ) : (
        <Text style={[styles.empty, { color: colors.muted }]}>
          {query ? `Nada coincide con "${query}"` : 'No hay gastos en esta lista'}
        </Text>
      )}
    </SheetLayout>
  );
}

const styles = StyleSheet.create({
  summary: { borderRadius: 22, paddingVertical: 16, paddingHorizontal: 18, marginBottom: 14 },
  summaryLabel: { fontSize: 13, fontWeight: '700', opacity: 0.7 },
  summaryDesc: { fontSize: 12.5, fontWeight: '600', opacity: 0.75, marginTop: 2 },
  empty: { textAlign: 'center', fontSize: 15, fontWeight: '600', paddingVertical: 30 },
});
