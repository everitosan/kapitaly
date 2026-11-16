import { StyleSheet, Text, View } from 'react-native';

import type { BreakdownDetailItem } from '@/domain/balance';
import { formatMXN } from '@/domain/money';

import { formatDetailDate, formatLongDate } from '../format';
import { useTheme } from '../ThemeProvider';

function detailLabel(item: BreakdownDetailItem): string {
  const amount = formatMXN(item.amountCents);
  if (item.kind === 'prorated') {
    return item.date === null
      ? `${item.label}, ${amount} al mes, sin cobros próximos`
      : `${item.label}, ${amount} al mes, próximo cobro ${formatLongDate(item.date)}`;
  }
  return item.date === null
    ? `${item.label}, ${amount}, sin cobro en el mes`
    : `${item.label}, ${amount}, ${formatLongDate(item.date)}`;
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
          <Text style={[styles.detailDate, { color: colors.muted }]}>
            {formatDetailDate(item.date, year)}
          </Text>
          <Text style={[styles.detailLabel, { color: colors.ink }]} numberOfLines={1}>
            {item.label}
          </Text>
          <Text style={[styles.detailAmount, { color: colors.ink }]}>
            {formatMXN(item.amountCents)}
          </Text>
        </View>
      ))}
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
  detailRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, paddingVertical: 7 },
  detailDate: { width: 84, fontSize: 13.5, fontWeight: '600', fontVariant: ['tabular-nums'] },
  detailLabel: { flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: '600' },
  detailAmount: { fontSize: 13.5, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
