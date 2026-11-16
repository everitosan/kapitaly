import { StyleSheet, Text, View } from 'react-native';

import type { BreakdownDetailItem, DetailStatus } from '@/domain/balance';
import { formatMXN } from '@/domain/money';

import { formatDetailDate, formatLongDate } from '../format';
import { useTheme } from '../ThemeProvider';

/** Marca de cada estado, con el mismo lenguaje de "Tus gastos". `none` no lleva marca. */
const MARK: Record<
  Exclude<DetailStatus, 'none'>,
  { text: string; spoken: string; solid: boolean }
> = {
  pending: { text: 'POR CONFIRMAR', spoken: 'por confirmar', solid: true },
  future: { text: 'POR COBRAR', spoken: 'por cobrar', solid: false },
  skipped: { text: 'NO SE COBRÓ', spoken: 'no se cobró', solid: false },
  prorated: { text: 'PRORRATEO', spoken: 'prorrateo', solid: false },
};

/** Tenues: lo que aún no sale o no salió este mes. "Por confirmar" se ve normal: hay que atenderlo. */
const isFaded = (status: DetailStatus) =>
  status === 'future' || status === 'skipped' || status === 'prorated';

function detailLabel(item: BreakdownDetailItem): string {
  const amount = formatMXN(item.amountCents);
  const base =
    item.kind === 'prorated'
      ? item.date === null
        ? `${item.label}, ${amount} al mes, sin cobros próximos`
        : `${item.label}, ${amount} al mes, próximo cobro ${formatLongDate(item.date)}`
      : item.date === null
        ? `${item.label}, ${amount}, sin cobro en el mes`
        : `${item.label}, ${amount}, ${formatLongDate(item.date)}`;
  return item.status === 'none' ? base : `${base}, ${MARK[item.status].spoken}`;
}

/**
 * Detalle de solo lectura de una categoría o un método de Análisis: fecha, concepto y monto de
 * cada gasto que forma su cifra. Se pinta justo debajo de la fila activa.
 */
export function BreakdownDetail({
  items,
  year,
  color,
  testID = 'category-detail',
  rowTestIDPrefix = 'detail',
}: {
  items: BreakdownDetailItem[];
  /** Año del mes consultado: las fechas de otro año muestran el año. */
  year: number;
  /** Color del borde izquierdo: el de la categoría o el del método. */
  color: string;
  testID?: string;
  /** Prefijo del testID de cada fila (`<prefijo>-<key>`). */
  rowTestIDPrefix?: string;
}) {
  const { colors } = useTheme();
  return (
    <View testID={testID} style={[styles.detail, { borderLeftColor: color }]}>
      {items.map((item, i) => (
        <View
          key={item.key}
          testID={`${rowTestIDPrefix}-${item.key}`}
          accessible
          accessibilityLabel={detailLabel(item)}
          style={[
            styles.detailRow,
            i > 0
              ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line }
              : null,
          ]}
        >
          <View style={[styles.detailRowInner, isFaded(item.status) ? styles.faded : null]}>
            <Text style={[styles.detailDate, { color: colors.muted }]}>
              {formatDetailDate(item.date, year)}
            </Text>
            <View style={styles.detailMid}>
              <Text style={[styles.detailLabel, { color: colors.ink }]} numberOfLines={1}>
                {item.label}
              </Text>
              {item.status === 'none' ? null : (
                <StatusMark status={item.status} ink={colors.ink} bg={colors.bg} />
              )}
            </View>
            <Text style={[styles.detailAmount, { color: colors.ink }]}>
              {formatMXN(item.amountCents)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function StatusMark({
  status,
  ink,
  bg,
}: {
  status: Exclude<DetailStatus, 'none'>;
  ink: string;
  bg: string;
}) {
  const mark = MARK[status];
  return (
    <View
      testID={`detail-mark-${status}`}
      style={[
        styles.mark,
        mark.solid
          ? { backgroundColor: ink }
          : { borderWidth: 1, borderStyle: 'dashed', borderColor: ink },
      ]}
    >
      <Text style={[styles.markText, { color: mark.solid ? bg : ink }]}>{mark.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  detail: {
    marginTop: 2,
    marginBottom: 8,
    marginLeft: 11,
    paddingLeft: 14,
    paddingRight: 6,
    borderLeftWidth: 2,
  },
  detailRow: { paddingVertical: 7 },
  detailRowInner: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  faded: { opacity: 0.42 },
  detailMid: { flex: 1, minWidth: 0, alignItems: 'flex-start' },
  mark: { marginTop: 4, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 999 },
  markText: { fontSize: 9.5, fontWeight: '800', letterSpacing: 0.6 },
  detailDate: { width: 84, fontSize: 13.5, fontWeight: '600', fontVariant: ['tabular-nums'] },
  detailLabel: { alignSelf: 'stretch', fontSize: 13.5, fontWeight: '600' },
  detailAmount: { fontSize: 13.5, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
