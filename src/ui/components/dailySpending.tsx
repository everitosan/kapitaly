import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type AccessibilityActionEvent,
  type GestureResponderEvent,
} from 'react-native';
import Svg, {
  Defs,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import type { CivilDate } from '@/domain/date';
import type { DailyDay, DailySpendingView } from '@/domain/dailySpending';
import { formatMXN, formatMXNWhole } from '@/domain/money';

import { formatDayMonth, formatWeekdayDate } from '../format';
import { useTheme } from '../ThemeProvider';
import { Switch } from './basics';

const CHART_HEIGHT = 150;
const TOP = 26;
const BASE = 128;
const RADIUS = 4;

/** Etiqueta del lector de pantalla para un día: fecha, monto y lo domiciliado. */
export function dailyDayLabel(day: DailyDay): string {
  const total = day.oneOffCents + day.recurringCents;
  if (total === 0) return `${formatDayMonth(day.date)}, sin registros`;
  const rec = day.recurringCents > 0 ? `, ${formatMXN(day.recurringCents)} domiciliado` : '';
  return `${formatDayMonth(day.date)}, ${formatMXN(total)}${rec}`;
}

/** Barra con la esquina de arriba redondeada y la base recta. */
function roundedTop(x: number, w: number, top: number, bottom: number): string {
  const r = Math.min(RADIUS, w / 2, (bottom - top) / 2);
  return `M${x},${bottom} V${top + r} Q${x},${top} ${x + r},${top} H${x + w - r} Q${x + w},${top} ${x + w},${top + r} V${bottom} Z`;
}

/**
 * Barras del gasto por día. Se elige el día tocando o deslizando el dedo (vibra al cambiar de día);
 * para el lector de pantalla es un solo elemento ajustable.
 */
export function DailyBars({
  days,
  maxCents,
  selected,
  today,
  onSelectDay,
}: {
  days: DailyDay[];
  maxCents: number;
  selected: CivilDate | null;
  today: CivilDate;
  onSelectDay: (date: CivilDate) => void;
}) {
  const theme = useTheme();
  const { colors } = theme;
  const [width, setWidth] = useState(0);
  const count = days.length;
  const slot = width / count;
  const barW = Math.max(2, Math.min(24, slot - 2));
  const scale = maxCents > 0 ? (BASE - TOP) / maxCents : 0;
  const selectedIndex = selected === null ? -1 : days.findIndex((d) => d.date === selected);
  // Último día elegido durante un deslizamiento: solo se vibra y avisa al cambiar de día.
  const lastPicked = useRef(-1);

  const pickAt = (x: number) => {
    if (width <= 0) return;
    const index = Math.max(0, Math.min(count - 1, Math.floor((x / width) * count)));
    if (index === lastPicked.current) return;
    lastPicked.current = index;
    Haptics.selectionAsync();
    onSelectDay(days[index].date);
  };
  const onGrant = (e: GestureResponderEvent) => {
    lastPicked.current = selectedIndex;
    pickAt(e.nativeEvent.locationX);
  };
  const onMove = (e: GestureResponderEvent) => pickAt(e.nativeEvent.locationX);
  const step = (delta: number) => {
    const from = selectedIndex === -1 ? days.findIndex((d) => d.date === today) : selectedIndex;
    const next = Math.max(0, Math.min(count - 1, (from === -1 ? 0 : from) + delta));
    if (next !== selectedIndex) onSelectDay(days[next].date);
  };
  const onAction = (e: AccessibilityActionEvent) => {
    if (e.nativeEvent.actionName === 'increment') step(1);
    if (e.nativeEvent.actionName === 'decrement') step(-1);
  };

  const marks: React.ReactNode[] = [];
  let tip = null as { x: number; y: number; text: string } | null;
  days.forEach((d, i) => {
    const x = i * slot + (slot - barW) / 2;
    const cx = i * slot + slot / 2;
    const isSel = i === selectedIndex;
    const opacity = selectedIndex === -1 || isSel ? 1 : 0.85;
    const fill = isSel ? 'url(#dailySelected)' : colors.ink;
    let top = BASE;
    if (d.oneOffCents > 0) {
      const y = BASE - Math.max(3, d.oneOffCents * scale);
      marks.push(
        d.recurringCents > 0 ? (
          <Rect
            key={`o${i}`}
            x={x}
            y={y}
            width={barW}
            height={BASE - y}
            fill={fill}
            opacity={opacity}
          />
        ) : (
          <Path key={`o${i}`} d={roundedTop(x, barW, y, BASE)} fill={fill} opacity={opacity} />
        ),
      );
      top = y;
    }
    if (d.recurringCents > 0) {
      const bottom = d.oneOffCents > 0 ? top - 2 : BASE;
      const y = bottom - Math.max(3, d.recurringCents * scale);
      marks.push(
        <Path
          key={`r${i}`}
          d={roundedTop(x, barW, y, bottom)}
          fill={theme.chart.recurring}
          opacity={opacity}
        />,
      );
      top = y;
    }
    if (d.upcomingCents > 0) {
      const gap = d.oneOffCents + d.recurringCents > 0 ? 2 : 0;
      const y = top - gap - d.upcomingCents * scale;
      marks.push(
        <Rect
          key={`u${i}`}
          x={x + 0.5}
          y={y}
          width={Math.max(1, barW - 1)}
          height={Math.max(1, top - gap - y)}
          rx={Math.min(RADIUS, barW / 2)}
          fill="none"
          stroke={colors.muted}
          strokeWidth={1}
          strokeDasharray="2 2"
        />,
      );
    } else if (d.date > today && d.oneOffCents + d.recurringCents === 0) {
      marks.push(
        <Line
          key={`f${i}`}
          x1={cx}
          x2={cx}
          y1={BASE - 10}
          y2={BASE}
          stroke={colors.muted}
          strokeWidth={1.5}
          strokeDasharray="2 2"
        />,
      );
    }
    if (isSel) {
      const total = d.oneOffCents + d.recurringCents;
      tip = { x: cx, y: total > 0 ? top : BASE - 10, text: formatMXN(total) };
    }
  });

  const labels = days
    .map((d, i) => ({ d, i }))
    .filter(({ d }) => d.day === 1 || d.day % 5 === 0 || d.day === count);
  const todayIndex = days.findIndex((d) => d.date === today);
  const selectedDay = selectedIndex === -1 ? null : days[selectedIndex];

  return (
    <View style={styles.chart}>
      {width > 0 ? (
        <Svg width={width} height={CHART_HEIGHT}>
          <Defs>
            <LinearGradient id="dailySelected" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={theme.totals.thisMonth.from} />
              <Stop offset="1" stopColor={theme.totals.thisMonth.to} />
            </LinearGradient>
          </Defs>
          <Line x1={0} x2={width} y1={BASE} y2={BASE} stroke={colors.line} strokeWidth={1} />
          {todayIndex !== -1 ? (
            <SvgText
              x={todayIndex * slot + slot / 2}
              y={TOP - 10}
              fontSize={9.5}
              fontWeight="800"
              fill={colors.muted}
              textAnchor="middle"
            >
              HOY
            </SvgText>
          ) : null}
          {marks}
          {labels.map(({ d, i }) => (
            <SvgText
              key={d.date}
              x={i * slot + slot / 2}
              y={CHART_HEIGHT - 6}
              fontSize={10}
              fontWeight="700"
              fill={colors.muted}
              textAnchor="middle"
            >
              {String(d.day)}
            </SvgText>
          ))}
        </Svg>
      ) : null}
      {tip !== null ? (
        <View
          pointerEvents="none"
          style={[styles.tipWrap, { left: tip.x - 50, top: tip.y - 30 }]}
          testID="daily-tip"
        >
          <View style={[styles.tip, { backgroundColor: colors.ink }]}>
            <Text style={[styles.tipText, { color: colors.bg }]}>{tip.text}</Text>
          </View>
        </View>
      ) : null}
      <View
        testID="daily-bars"
        style={StyleSheet.absoluteFill}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={onGrant}
        onResponderMove={onMove}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={
          selectedDay === null ? 'Gasto por día, elige un día' : dailyDayLabel(selectedDay)
        }
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={onAction}
      />
    </View>
  );
}

/** Tarjeta "Gasto del día a día" de Análisis. */
export function DailySpendingCard({
  view,
  monthName,
  selected,
  today,
  includeRecurring,
  onToggleRecurring,
  onSelectDay,
}: {
  view: DailySpendingView;
  monthName: string;
  selected: CivilDate | null;
  today: CivilDate;
  includeRecurring: boolean;
  onToggleRecurring: (value: boolean) => void;
  onSelectDay: (date: CivilDate) => void;
}) {
  const theme = useTheme();
  const { colors } = theme;
  const empty = view.totalCents === 0 && view.maxCents === 0;
  const index = selected === null ? -1 : view.days.findIndex((d) => d.date === selected);
  const day = index === -1 ? null : view.days[index];
  const n = view.daysWithoutRecords;
  const habit: [string, string] =
    n === 0
      ? ['✓', 'Registraste todos los días']
      : [String(n), n === 1 ? 'día sin registros' : 'días sin registros'];

  return (
    <View
      testID="daily-card"
      style={[styles.card, { backgroundColor: colors.card, borderRadius: theme.radii.row }]}
    >
      <View style={styles.head}>
        <Text style={[styles.headText, { color: colors.muted }]}>GASTO DEL DÍA A DÍA</Text>
        <Text style={[styles.headMonth, { color: colors.muted }]}>{monthName}</Text>
      </View>
      <Text style={[styles.note, { color: colors.muted }]}>
        {includeRecurring
          ? 'Gastos únicos y domiciliados'
          : 'Solo gastos únicos: lo que decides cada día'}
      </Text>
      <View style={styles.stats}>
        {[
          [formatMXNWhole(view.totalCents), 'en el mes'],
          [`~${formatMXNWhole(view.averageCents)}`, 'al día'],
          habit,
        ].map(([value, label]) => (
          <View key={label} style={[styles.stat, { backgroundColor: colors.bg }]}>
            <Text style={[styles.statValue, { color: colors.ink }]}>{value}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
          </View>
        ))}
      </View>
      <View style={[styles.switchRow, { backgroundColor: colors.bg }]}>
        <Text style={[styles.switchText, { color: colors.ink }]}>Incluir domiciliados</Text>
        <Switch
          label="Incluir domiciliados"
          value={includeRecurring}
          onValueChange={onToggleRecurring}
          testID="daily-include-recurring"
        />
      </View>
      {empty ? (
        <Text style={[styles.invite, { color: colors.muted }]}>
          Aún no hay gastos únicos este mes. Registra tus gastos del día para ver tus hábitos.
        </Text>
      ) : (
        <>
          {includeRecurring ? (
            <View style={styles.legend} testID="daily-legend">
              <View style={styles.legendItem}>
                <View style={[styles.swatch, { backgroundColor: colors.ink }]} />
                <Text style={[styles.legendText, { color: colors.muted }]}>Únicos</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.swatch, { backgroundColor: theme.chart.recurring }]} />
                <Text style={[styles.legendText, { color: colors.muted }]}>Domiciliados</Text>
              </View>
            </View>
          ) : null}
          <DailyBars
            days={view.days}
            maxCents={view.maxCents}
            selected={selected}
            today={today}
            onSelectDay={onSelectDay}
          />
          <Text style={[styles.hint, { color: colors.muted }]}>
            Toca o desliza el dedo sobre las barras
          </Text>
          {day !== null ? (
            <DayList
              day={day}
              isFirst={index === 0}
              isLast={index === view.days.length - 1}
              onStep={(delta) => onSelectDay(view.days[index + delta].date)}
            />
          ) : null}
        </>
      )}
    </View>
  );
}

function DayList({
  day,
  isFirst,
  isLast,
  onStep,
}: {
  day: DailyDay;
  isFirst: boolean;
  isLast: boolean;
  onStep: (delta: number) => void;
}) {
  const { colors } = useTheme();
  const total = day.oneOffCents + day.recurringCents;
  const arrow = (label: string, glyph: string, delta: number, disabled: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => onStep(delta)}
      hitSlop={8}
      style={[styles.step, { backgroundColor: colors.bg, opacity: disabled ? 0.3 : 1 }]}
    >
      <Text style={[styles.stepText, { color: colors.ink }]}>{glyph}</Text>
    </Pressable>
  );
  return (
    <View testID="daily-day" style={[styles.dayList, { borderTopColor: colors.line }]}>
      <View style={styles.dayHead}>
        {arrow('Día anterior', '‹', -1, isFirst)}
        <View style={styles.dayHeadMid}>
          <Text style={[styles.dayTitle, { color: colors.ink }]}>
            {formatWeekdayDate(day.date)}
          </Text>
          {total > 0 ? (
            <Text style={[styles.dayTitle, { color: colors.ink }]}>{formatMXN(total)}</Text>
          ) : null}
        </View>
        {arrow('Día siguiente', '›', 1, isLast)}
      </View>
      {day.items.length === 0 ? (
        <Text style={[styles.dayEmpty, { color: colors.muted }]}>Sin registros este día</Text>
      ) : (
        day.items.map((item, i) => (
          <View
            key={item.key}
            testID={`daily-item-${item.key}`}
            accessible
            accessibilityLabel={`${item.label}, ${formatMXN(item.amountCents)}${
              item.kind === 'recurring' ? (item.upcoming ? ', por cobrar' : ', domiciliado') : ''
            }`}
            style={[
              styles.itemRow,
              item.upcoming ? styles.faded : null,
              i > 0
                ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line }
                : null,
            ]}
          >
            <View style={styles.itemLabel}>
              <Text style={[styles.itemText, { color: colors.ink }]} numberOfLines={1}>
                {item.label}
              </Text>
              {item.kind === 'recurring' ? (
                <View
                  style={[
                    styles.mark,
                    { borderColor: colors.ink, borderStyle: item.upcoming ? 'dashed' : 'solid' },
                  ]}
                >
                  <Text style={[styles.markText, { color: colors.ink }]}>
                    {item.upcoming ? 'POR COBRAR' : 'DOMICILIADO'}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.itemAmount, { color: colors.ink }]}>
              {formatMXN(item.amountCents)}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 18, marginBottom: 22 },
  head: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  headText: { fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  headMonth: { fontSize: 12, fontWeight: '700' },
  note: { fontSize: 13, fontWeight: '600' },
  stats: { flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 12 },
  stat: { flex: 1, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 9 },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
  },
  statLabel: { fontSize: 11.5, fontWeight: '700', marginTop: 3 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 999,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 2,
    marginBottom: 12,
  },
  switchText: { fontSize: 13.5, fontWeight: '700' },
  legend: { flexDirection: 'row', gap: 14, marginBottom: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontSize: 12, fontWeight: '700' },
  chart: { height: CHART_HEIGHT, marginHorizontal: -2 },
  tipWrap: { position: 'absolute', width: 100, alignItems: 'center' },
  tip: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  tipText: { fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] },
  hint: { fontSize: 11.5, fontWeight: '700', textAlign: 'center', marginTop: 2 },
  invite: { fontSize: 13.5, fontWeight: '600', textAlign: 'center', paddingVertical: 18 },
  dayList: { marginTop: 12, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  dayHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  dayHeadMid: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  dayTitle: { fontSize: 14.5, fontWeight: '800', fontVariant: ['tabular-nums'] },
  step: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 18, fontWeight: '800', marginTop: -2 },
  dayEmpty: { fontSize: 13.5, fontWeight: '600', paddingVertical: 4 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
    gap: 10,
  },
  faded: { opacity: 0.55 },
  itemLabel: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemText: { flexShrink: 1, fontSize: 13.5, fontWeight: '600' },
  itemAmount: { fontSize: 13.5, fontWeight: '700', fontVariant: ['tabular-nums'] },
  mark: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1 },
  markText: { fontSize: 9.5, fontWeight: '800', letterSpacing: 0.6 },
});
