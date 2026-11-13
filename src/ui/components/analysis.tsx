import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { formatMXN, type Cents } from '@/domain/money';

import { useTheme } from '../ThemeProvider';
import { MoneyText } from './basics';
import { DuotoneBlock } from './DuotoneBlock';

const pct = (part: Cents, total: Cents) => (total > 0 ? Math.round((part / total) * 100) : 0);

/* ---------- MonthProgressCard ---------- */

/** Tarjeta de "Este mes": efectuado de proyectado, barra de avance y atajos a Análisis. */
export function MonthProgressCard({
  monthName,
  doneCents,
  pendingCents,
  futureCents,
  projectedCents,
  onByCategory,
  onByMethod,
}: {
  monthName: string;
  doneCents: Cents;
  pendingCents: Cents;
  futureCents: Cents;
  projectedCents: Cents;
  onByCategory: () => void;
  onByMethod: () => void;
}) {
  const theme = useTheme();
  const gradient = theme.totals.thisMonth;
  const fg = gradient.text;
  const share = (c: Cents) => (projectedCents > 0 ? (c / projectedCents) * 100 : 0);
  return (
    <DuotoneBlock
      gradient={gradient}
      radius={theme.radii.total}
      style={styles.card}
      testID="month-progress"
    >
      <Text style={[styles.label, { color: fg }]}>{`Cargos de ${monthName}`}</Text>
      <MoneyText cents={doneCents} size={44} color={fg} style={styles.amount} />
      <Text style={[styles.projected, { color: fg }]}>
        de <Text style={styles.bold}>{formatMXN(projectedCents)}</Text> proyectados
      </Text>
      <View
        style={styles.bar}
        accessibilityLabel={`Cobrado ${formatMXN(doneCents)}, por confirmar ${formatMXN(pendingCents)}, por cobrar ${formatMXN(futureCents)}`}
      >
        <View style={[styles.barDone, { width: `${share(doneCents)}%` }]} />
        <View style={[styles.barDue, { width: `${share(pendingCents)}%` }]} />
      </View>
      <View style={styles.legend}>
        <LegendDot color="#FFFFFF" text="Cobrado" fg={fg} />
        <LegendDot
          color="rgba(255,255,255,0.5)"
          text={`Por confirmar ${formatMXN(pendingCents)}`}
          fg={fg}
        />
        <Text style={[styles.legendText, { color: fg }]}>
          {`Por cobrar ${formatMXN(futureCents)}`}
        </Text>
      </View>
      <View style={styles.jump}>
        <JumpButton label="Por categoría" onPress={onByCategory} fg={fg} />
        <JumpButton label="Por método" onPress={onByMethod} fg={fg} />
      </View>
    </DuotoneBlock>
  );
}

function LegendDot({ color, text, fg }: { color: string; text: string; fg: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.legendText, { color: fg }]}>{text}</Text>
    </View>
  );
}

function JumpButton({ label, onPress, fg }: { label: string; onPress: () => void; fg: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.jumpButton, { opacity: pressed ? 0.7 : 1 }]}
    >
      <Text style={[styles.jumpText, { color: fg }]}>{`${label} ›`}</Text>
    </Pressable>
  );
}

/* ---------- AverageTotalCard ---------- */

export type AverageListKind = 'fixed' | 'prorated' | 'oneOff';

/** Tarjeta de "Análisis": costo mensual promedio con aclaración y subtotales tocables. */
export function AverageTotalCard({
  totalCents,
  fixedCents,
  proratedCents,
  oneOffCents,
  onOpen,
}: {
  totalCents: Cents;
  fixedCents: Cents;
  proratedCents: Cents;
  oneOffCents: Cents;
  onOpen: (kind: AverageListKind) => void;
}) {
  const theme = useTheme();
  const gradient = theme.totals.average;
  const fg = gradient.text;
  const [info, setInfo] = useState(false);
  const pills: [AverageListKind, string, Cents][] = [
    ['fixed', 'Fijos', fixedCents],
    ['prorated', 'Prorrateados', proratedCents],
    ['oneOff', 'Únicos', oneOffCents],
  ];
  return (
    <DuotoneBlock
      gradient={gradient}
      radius={theme.radii.total}
      style={styles.card}
      testID="average-total"
    >
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: fg }]}>Costo mensual promedio</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="¿Qué es el costo mensual promedio?"
          accessibilityState={{ expanded: info }}
          onPress={() => setInfo((v) => !v)}
          hitSlop={10}
          style={styles.info}
        >
          <Text style={[styles.infoText, { color: fg }]}>i</Text>
        </Pressable>
      </View>
      {info ? (
        <View style={[styles.tip, { backgroundColor: theme.colors.ink }]} testID="average-info">
          <Text style={[styles.tipTitle, { color: theme.colors.bg }]}>Tu costo de vida real</Text>
          <Text style={[styles.tipText, { color: theme.colors.bg }]}>
            No es lo que salió de tu cuenta este mes: suma tus fijos, la parte mensual de lo que
            pagas cada varios meses (un seguro anual de $9,600 cuenta $800 cada mes) y tus únicos
            del mes. Lo cobrado está en &quot;Este mes&quot;.
          </Text>
          <Pressable accessibilityRole="button" onPress={() => setInfo(false)} hitSlop={8}>
            <Text style={[styles.tipButton, { color: theme.colors.bg }]}>Entendido</Text>
          </Pressable>
        </View>
      ) : null}
      <MoneyText cents={totalCents} size={44} color={fg} style={styles.amount} />
      <View style={styles.pills}>
        {pills.map(([kind, name, cents]) => (
          <Pressable
            key={kind}
            accessibilityRole="button"
            accessibilityLabel={`${name} ${formatMXN(cents)}, ver lista`}
            onPress={() => onOpen(kind)}
            style={({ pressed }) => [styles.pill, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={[styles.pillText, { color: fg }]}>{`${name} ${formatMXN(cents)} ›`}</Text>
          </Pressable>
        ))}
      </View>
    </DuotoneBlock>
  );
}

/* ---------- CategoryDonut ---------- */

export interface DonutEntry {
  id: string;
  name: string;
  amountCents: Cents;
  color: string;
}

const SIZE = 200;
const R = 74;
const C = 2 * Math.PI * R;
const GAP = 3;

/** Dona del costo mensual por categoría con leyenda seleccionable. */
export function CategoryDonut({
  entries,
  totalCents,
  selectedId,
  onSelect,
}: {
  entries: DonutEntry[];
  totalCents: Cents;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const { colors } = useTheme();
  const toggle = (id: string) => onSelect(selectedId === id ? null : id);
  const selected = entries.find((e) => e.id === selectedId) ?? null;
  const lengths = entries.map((e) => (totalCents > 0 ? (e.amountCents / totalCents) * C : 0));
  const segments = entries.map((e, i) => ({
    e,
    len: lengths[i],
    offset: lengths.slice(0, i).reduce((a, b) => a + b, 0),
  }));
  return (
    <View>
      <View
        style={styles.donut}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {segments.map(({ e, len, offset: off }) => {
            const on = selectedId === e.id;
            return (
              <Circle
                key={e.id}
                testID={`donut-${e.id}`}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                fill="none"
                stroke={e.color}
                strokeWidth={on ? 34 : 26}
                opacity={selectedId && !on ? 0.35 : 1}
                strokeDasharray={`${Math.max(len - GAP, 1)} ${C}`}
                strokeDashoffset={-off}
                rotation={-90}
                origin={`${SIZE / 2}, ${SIZE / 2}`}
                onPress={() => toggle(e.id)}
              />
            );
          })}
        </Svg>
        <View style={styles.donutCenter} pointerEvents="none">
          <Text style={[styles.centerLabel, { color: colors.muted }]}>
            {selected ? selected.name : 'Al mes'}
          </Text>
          <Text style={[styles.centerAmount, { color: colors.ink }]}>
            {formatMXN(selected ? selected.amountCents : totalCents)}
          </Text>
          <Text style={[styles.centerLabel, { color: colors.muted }]}>
            {selected
              ? `${pct(selected.amountCents, totalCents)}% al mes`
              : `${entries.length} ${entries.length === 1 ? 'categoría' : 'categorías'}`}
          </Text>
        </View>
      </View>
      {entries.map((e) => {
        const on = selectedId === e.id;
        return (
          <Pressable
            key={e.id}
            testID={`legend-${e.id}`}
            accessibilityRole="button"
            accessibilityLabel={`${e.name}, ${formatMXN(e.amountCents)}, ${pct(e.amountCents, totalCents)} %`}
            accessibilityState={{ selected: on }}
            onPress={() => toggle(e.id)}
            style={[styles.leg, on ? { backgroundColor: colors.bg } : null]}
          >
            <View style={[styles.legSwatch, { backgroundColor: e.color }]} />
            <Text style={[styles.legName, { color: colors.ink }]} numberOfLines={1}>
              {e.name}
            </Text>
            <Text style={[styles.legAmount, { color: colors.ink }]}>
              {formatMXN(e.amountCents)}
            </Text>
            <Text style={[styles.legPct, { color: colors.muted }]}>
              {`${pct(e.amountCents, totalCents)}%`}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 22, paddingBottom: 20, marginBottom: 22 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 14, fontWeight: '600', opacity: 0.85 },
  amount: { marginTop: 6, marginBottom: 4, letterSpacing: -1.3 },
  projected: { fontSize: 15, fontWeight: '700', opacity: 0.9 },
  bold: { fontWeight: '800' },
  bar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginTop: 14,
    marginBottom: 6,
    overflow: 'hidden',
  },
  barDone: { height: '100%', backgroundColor: '#FFFFFF' },
  barDue: { height: '100%', backgroundColor: 'rgba(255,255,255,0.5)' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, fontWeight: '700', opacity: 0.85 },
  jump: { flexDirection: 'row', gap: 8, marginTop: 16 },
  jumpButton: {
    flex: 1,
    height: 40,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  jumpText: { fontSize: 14, fontWeight: '700' },
  info: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(20,20,20,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: { fontSize: 13, fontWeight: '800', fontStyle: 'italic' },
  tip: { borderRadius: 18, padding: 14, marginTop: 12, gap: 4 },
  tipTitle: { fontSize: 14, fontWeight: '800' },
  tipText: { fontSize: 13, fontWeight: '600', lineHeight: 19 },
  tipButton: { fontSize: 14, fontWeight: '800', marginTop: 6, opacity: 0.85 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(20,20,20,0.1)',
  },
  pillText: { fontSize: 13, fontWeight: '700' },
  donut: { alignItems: 'center', justifyContent: 'center', paddingTop: 6, paddingBottom: 14 },
  donutCenter: {
    position: 'absolute',
    top: 0,
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: { fontSize: 12, fontWeight: '700' },
  centerAmount: { fontSize: 19, fontWeight: '800', letterSpacing: -0.5 },
  leg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 12,
  },
  legSwatch: { width: 12, height: 12, borderRadius: 4 },
  legName: { flex: 1, minWidth: 0, fontSize: 14.5, fontWeight: '700' },
  legAmount: { fontSize: 14.5, fontWeight: '700', fontVariant: ['tabular-nums'] },
  legPct: { width: 40, textAlign: 'right', fontSize: 12.5, fontWeight: '700' },
});
