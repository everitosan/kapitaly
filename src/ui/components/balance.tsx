import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { INSTITUTION_CATALOG } from '@/data/institutions/catalog';
import type { CategoryView } from '@/domain/category';
import { duotoneFromBase } from '@/domain/color';
import type { ChargeState, MethodBreakdownEntry } from '@/domain/balance';
import { parseCivilDate, type CivilDate } from '@/domain/date';
import { resolveInstitution } from '@/domain/institution';
import { formatMXN, type Cents } from '@/domain/money';
import { methodLabel, type CardVariant, type PaymentMethod } from '@/domain/paymentMethod';

import { MONTH_SHORT, capitalize, MONTH_NAMES } from '../format';
import { CategoryIcon } from '../icons/categoryIcons';
import { methodGradient } from '../methodColor';
import type { Gradient } from '../theme';
import { useTheme } from '../ThemeProvider';
import { MoneyText, Pill } from './basics';
import { DuotoneBlock } from './DuotoneBlock';

/* ---------- SegmentedControl ---------- */

export function SegmentedControl<V extends string>({
  options,
  value,
  onChange,
  testID,
}: {
  options: readonly { value: V; label: string }[];
  value: V;
  onChange: (v: V) => void;
  testID?: string;
}) {
  const theme = useTheme();
  return (
    <View
      testID={testID}
      accessibilityRole="tablist"
      style={[styles.seg, { backgroundColor: theme.colors.card }]}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.value)}
            style={[styles.segItem, on ? { backgroundColor: theme.primary.to } : null]}
          >
            <Text style={[styles.segText, { color: on ? theme.primary.text : theme.colors.muted }]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------- MonthSwitcher ---------- */

/** Ícono de engrane (Ajustes). */
export function GearIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={2} />
    </Svg>
  );
}

/** Botón de ícono discreto, sin fondo (barra superior del balance). */
function GhostIconButton({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress?: () => void;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.ghost, pressed ? { backgroundColor: colors.card } : null]}
    >
      {children}
    </Pressable>
  );
}

/** Fila superior del balance: Métodos de pago y Ajustes, separados de las flechas del mes. */
export function BalanceTopBar({
  onOpenMethods,
  onOpenSettings,
}: {
  onOpenMethods: () => void;
  onOpenSettings: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.topBar} testID="balance-top-bar">
      <GhostIconButton label="Métodos de pago" onPress={onOpenMethods}>
        <CardIcon color={colors.muted} />
      </GhostIconButton>
      <GhostIconButton label="Ajustes" onPress={onOpenSettings}>
        <GearIcon color={colors.muted} />
      </GhostIconButton>
    </View>
  );
}

export function CardIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={16} viewBox="0 0 20 16" fill="none">
      <Rect x={1} y={1} width={18} height={14} rx={3} stroke={color} strokeWidth={2} />
      <Path d="M1 6h18" stroke={color} strokeWidth={2} />
    </Svg>
  );
}

export function RoundButton({
  label,
  onPress,
  children,
  testID,
}: {
  label: string;
  onPress?: () => void;
  children: React.ReactNode;
  testID?: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.round,
        { backgroundColor: colors.card, transform: [{ scale: pressed ? 0.94 : 1 }] },
      ]}
    >
      {children}
    </Pressable>
  );
}

export function MonthSwitcher({
  year,
  month,
  onPrev,
  onNext,
}: {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.month}>
      <View>
        <Text style={[styles.monthName, { color: colors.ink }]} accessibilityRole="header">
          {capitalize(MONTH_NAMES[month - 1])}
        </Text>
        <Text style={[styles.monthYear, { color: colors.muted }]}>{year}</Text>
      </View>
      <View style={styles.arrows}>
        <RoundButton label="Mes anterior" onPress={onPrev}>
          <Text style={[styles.arrow, { color: colors.ink }]}>‹</Text>
        </RoundButton>
        <RoundButton label="Mes siguiente" onPress={onNext}>
          <Text style={[styles.arrow, { color: colors.ink }]}>›</Text>
        </RoundButton>
      </View>
    </View>
  );
}

/* ---------- InstitutionBadge y píldora de método ---------- */

/**
 * Monograma de la institución sobre su color base (o el logo, cuando exista).
 * `onColor`: círculo blanco con letras del color de la institución, para ir sobre el propio bloque del método.
 */
export function InstitutionBadge({
  method,
  size = 18,
  onColor,
}: {
  method: Pick<PaymentMethod, 'institutionId' | 'kind' | 'name'> | null;
  size?: number;
  onColor?: boolean;
}) {
  const institution = resolveInstitution(INSTITUTION_CATALOG, method?.institutionId ?? null);
  const monogram = institution
    ? institution.monogram
    : method?.kind === 'cash'
      ? '$'
      : (method?.name[0] ?? '?');
  const bg = onColor ? 'rgba(255,255,255,0.94)' : (institution?.baseColor ?? '#2A2A2E');
  const fg = onColor
    ? (institution?.baseColor ?? '#141414')
    : institution
      ? duotoneFromBase(institution.baseColor).text
      : '#FFFFFF';
  return (
    <View
      accessibilityLabel={institution?.name}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontSize: Math.round(size * 0.42),
          fontWeight: '800',
          color: fg,
          letterSpacing: -0.3,
        }}
      >
        {monogram}
      </Text>
    </View>
  );
}

export function MethodPill({
  method,
  onBlock,
  cardVariant = null,
}: {
  method: PaymentMethod | null;
  onBlock?: boolean;
  /** Física o digital, si el gasto la registró. */
  cardVariant?: CardVariant | null;
}) {
  const { colors } = useTheme();
  const label = method ? methodLabel(method, cardVariant) : 'Método desconocido';
  return (
    <View style={[styles.mpill, { backgroundColor: onBlock ? colors.blockOverlay : colors.bg }]}>
      <InstitutionBadge method={method} size={18} />
      <Text
        style={[styles.mpillText, { color: onBlock ? colors.onBlock : colors.ink }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

/** Píldora con el ícono y el nombre de la categoría de un gasto. */
export function CategoryPill({ category, onBlock }: { category: CategoryView; onBlock?: boolean }) {
  const { colors } = useTheme();
  const color = onBlock ? colors.onBlock : colors.ink;
  return (
    <View
      testID={`category-pill-${category.id}`}
      style={[styles.cpill, { backgroundColor: onBlock ? colors.blockOverlay : colors.bg }]}
    >
      <CategoryIcon icon={category.icon} color={color} size={14} />
      <Text style={[styles.mpillText, { color }]} numberOfLines={1}>
        {category.name}
      </Text>
    </View>
  );
}

/* ---------- ExpenseRow ---------- */

const STATUS_LABEL: Record<ChargeState, string> = {
  charged: '',
  pending: ', por confirmar',
  future: ', por cobrar',
  skipped: ', no se cobró',
};

function DateBadge({ date, neutral }: { date: CivilDate; neutral?: boolean }) {
  const { colors } = useTheme();
  const { day, month } = parseCivilDate(date);
  const color = neutral ? colors.ink : colors.onBlock;
  return (
    <View style={[styles.date, { backgroundColor: neutral ? colors.bg : colors.blockOverlay }]}>
      <Text style={[styles.dateDay, { color }]}>{day}</Text>
      <Text style={[styles.dateMonth, { color }]}>{MONTH_SHORT[month - 1]}</Text>
    </View>
  );
}

type ExpenseRowProps =
  | {
      variant: 'recurring';
      gradient: Gradient;
      date: CivilDate;
      title: string;
      frequency: string;
      amountCents: Cents;
      method: PaymentMethod | null;
      cardVariant?: CardVariant | null;
      category?: CategoryView;
      /** Estado del cobro: "Por confirmar", "Por cobrar" (tenue) o "No se cobró" (neutro y tachado). */
      status?: ChargeState;
      /** Monto de la regla; si difiere de `amountCents` se muestra "esperado $X". */
      expectedCents?: Cents;
      onPress?: () => void;
    }
  | {
      variant: 'oneOff';
      date: CivilDate;
      title: string;
      amountCents: Cents;
      method: PaymentMethod | null;
      cardVariant?: CardVariant | null;
      category?: CategoryView;
      onPress?: () => void;
    }
  | {
      variant: 'average';
      gradient: Gradient;
      title: string;
      frequency: string;
      monthlyCents: Cents;
      /** Solo en intervalos > 1 mes: texto de la pista. */
      hint?: string;
      method: PaymentMethod | null;
      cardVariant?: CardVariant | null;
      category?: CategoryView;
      onPress?: () => void;
    };

export function ExpenseRow(props: ExpenseRowProps) {
  const theme = useTheme();
  const { colors, radii } = theme;

  if (props.variant === 'oneOff') {
    return (
      <Pressable
        onPress={props.onPress}
        accessibilityRole="button"
        accessibilityLabel={`${props.title}, gasto único, ${formatMXN(props.amountCents)}`}
        style={[styles.row, { backgroundColor: colors.card, borderRadius: radii.row }]}
      >
        <DateBadge date={props.date} neutral />
        <View style={styles.mid}>
          <Text style={[styles.name, { color: colors.ink }]} numberOfLines={1}>
            {props.title}
          </Text>
          <View style={styles.subRow}>
            {props.category ? <CategoryPill category={props.category} /> : null}
            <Pill background={colors.ink} color={colors.bg} style={styles.unique}>
              ÚNICO
            </Pill>
            <MethodPill method={props.method} cardVariant={props.cardVariant} />
          </View>
        </View>
        <MoneyText cents={props.amountCents} color={colors.ink} />
      </Pressable>
    );
  }

  if (props.variant === 'recurring') {
    const status = props.status ?? 'charged';
    const skipped = status === 'skipped';
    const ink = skipped ? colors.ink : colors.onBlock;
    const strike = skipped ? styles.strike : null;
    const showExpected =
      props.expectedCents !== undefined && props.expectedCents !== props.amountCents && !skipped;
    const inner = (
      <View style={styles.rowInner}>
        <DateBadge date={props.date} neutral={skipped} />
        <View style={styles.mid}>
          <Text style={[styles.name, { color: ink }, strike]} numberOfLines={1}>
            {props.title}
          </Text>
          <View style={styles.subRow}>
            {props.category ? <CategoryPill category={props.category} onBlock={!skipped} /> : null}
            <Text style={[styles.sub, { color: ink }]}>{props.frequency}</Text>
            {status === 'pending' ? (
              <Pill background={colors.onBlock} color="#F4F1EA" style={styles.unique}>
                POR CONFIRMAR
              </Pill>
            ) : null}
            {status === 'future' || skipped ? (
              <View style={[styles.dashed, { borderColor: ink }]}>
                <Text style={[styles.dashedText, { color: ink }]}>
                  {skipped ? 'NO SE COBRÓ' : 'POR COBRAR'}
                </Text>
              </View>
            ) : null}
            <MethodPill method={props.method} cardVariant={props.cardVariant} onBlock={!skipped} />
          </View>
        </View>
        <View style={styles.alignEnd}>
          <MoneyText cents={props.amountCents} color={ink} style={strike} />
          {showExpected ? (
            <Text style={[styles.perMonth, { color: ink }]}>
              {`esperado ${formatMXN(props.expectedCents!)}`}
            </Text>
          ) : null}
        </View>
      </View>
    );
    const label = `${props.title}${STATUS_LABEL[status]}`;
    return (
      <Pressable
        onPress={props.onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[styles.rowWrap, status === 'future' || skipped ? styles.faded : null]}
      >
        {skipped ? (
          <View style={{ backgroundColor: colors.card, borderRadius: radii.row }}>{inner}</View>
        ) : (
          <DuotoneBlock gradient={props.gradient} radius={radii.row}>
            {inner}
          </DuotoneBlock>
        )}
      </Pressable>
    );
  }

  const content = (
    <View style={styles.colInner}>
      <View style={styles.rowInnerFlat}>
        <View style={styles.mid}>
          <Text style={[styles.name, { color: colors.onBlock }]} numberOfLines={1}>
            {props.title}
          </Text>
          <View style={styles.subRow}>
            {props.category ? <CategoryPill category={props.category} onBlock /> : null}
            <Text style={[styles.sub, { color: colors.onBlock }]}>{props.frequency}</Text>
            <MethodPill method={props.method} cardVariant={props.cardVariant} onBlock />
          </View>
        </View>
        <View style={styles.alignEnd}>
          <MoneyText cents={props.monthlyCents} color={colors.onBlock} />
          <Text style={[styles.perMonth, { color: colors.onBlock }]}>al mes</Text>
        </View>
      </View>
      {props.hint ? (
        <View style={[styles.hint, { backgroundColor: colors.blockOverlay }]}>
          <View style={[styles.hintDot, { backgroundColor: colors.onBlock }]} />
          <Text style={[styles.hintText, { color: colors.onBlock }]}>{props.hint}</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <Pressable
      onPress={props.onPress}
      accessibilityRole="button"
      accessibilityLabel={props.title}
      style={styles.rowWrap}
    >
      <DuotoneBlock gradient={props.gradient} radius={radii.row}>
        {content}
      </DuotoneBlock>
    </Pressable>
  );
}

/* ---------- MethodBreakdownCard ---------- */

export function MethodBreakdownCard({
  entries,
  totalCents,
  caption,
  note,
}: {
  entries: MethodBreakdownEntry[];
  totalCents: Cents;
  /** Texto a la derecha del encabezado (p. ej. "al mes"); por defecto, el número de métodos. */
  caption?: string;
  /** Aclaración bajo el encabezado. */
  note?: string;
}) {
  const theme = useTheme();
  const { colors, radii } = theme;
  return (
    <View
      testID="method-breakdown"
      style={[styles.bd, { backgroundColor: colors.card, borderRadius: radii.row }]}
    >
      <View style={styles.bdHead}>
        <Text style={[styles.bdHeadText, { color: colors.muted }]}>POR MÉTODO</Text>
        <Text style={[styles.bdHeadText, { color: colors.muted }]}>
          {caption ?? entries.length}
        </Text>
      </View>
      {note ? <Text style={[styles.bdNote, { color: colors.muted }]}>{note}</Text> : null}
      {entries.map((e) => {
        const g = methodGradient(e.method, theme);
        const pct = totalCents > 0 ? (e.amountCents / totalCents) * 100 : 0;
        return (
          <View key={e.paymentMethodId} style={styles.bdItem}>
            <View style={styles.bdTop}>
              <InstitutionBadge method={e.method} size={24} />
              <Text style={[styles.bdName, { color: colors.ink }]} numberOfLines={1}>
                {e.method ? methodLabel(e.method) : 'Método desconocido'}
                {e.method?.archivedAt ? (
                  <Text style={{ color: colors.muted, fontSize: 12 }}>{'  archivado'}</Text>
                ) : null}
              </Text>
              <Text style={[styles.bdAmount, { color: colors.ink }]}>
                {formatMXN(e.amountCents)}
              </Text>
            </View>
            <View style={[styles.bdBar, { backgroundColor: colors.bg }]}>
              <DuotoneBlock
                gradient={g}
                radius={999}
                style={{ width: `${pct}%`, height: '100%' }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  seg: { flexDirection: 'row', borderRadius: 999, padding: 5 },
  segItem: {
    flex: 1,
    height: 42,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segText: { fontSize: 15, fontWeight: '700' },
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', gap: 4, paddingBottom: 6 },
  ghost: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  month: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 0,
    paddingHorizontal: 4,
    paddingBottom: 22,
  },
  monthName: { fontSize: 34, fontWeight: '800', letterSpacing: -1, lineHeight: 38 },
  monthYear: { fontSize: 15, fontWeight: '600', marginTop: 4 },
  arrows: { flexDirection: 'row', gap: 8 },
  round: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: { fontSize: 24, fontWeight: '600', lineHeight: 26 },
  total: { padding: 24, paddingBottom: 22, marginBottom: 26 },
  totalLabel: { fontSize: 14, fontWeight: '600', opacity: 0.85 },
  totalAmount: { marginTop: 6, marginBottom: 16, letterSpacing: -1.4 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mpill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 3,
    paddingLeft: 3,
    paddingRight: 9,
    borderRadius: 999,
    flexShrink: 1,
  },
  mpillText: { fontSize: 12, fontWeight: '700', flexShrink: 1 },
  cpill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 3,
    paddingLeft: 6,
    paddingRight: 9,
    borderRadius: 999,
    flexShrink: 1,
  },
  rowWrap: { marginBottom: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  rowInnerFlat: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  colInner: { paddingVertical: 16, paddingHorizontal: 18, gap: 12 },
  date: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dateDay: { fontSize: 20, fontWeight: '800', lineHeight: 22 },
  dateMonth: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', opacity: 0.7 },
  mid: { flex: 1, minWidth: 0 },
  name: { fontSize: 17, fontWeight: '700' },
  subRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 5 },
  sub: { fontSize: 13, fontWeight: '600', opacity: 0.65 },
  unique: { paddingHorizontal: 8, paddingVertical: 4 },
  alignEnd: { alignItems: 'flex-end' },
  perMonth: { fontSize: 12, fontWeight: '700', opacity: 0.6 },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  strike: { textDecorationLine: 'line-through' },
  faded: { opacity: 0.42 },
  dashed: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  dashedText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  hintDot: { width: 8, height: 8, borderRadius: 4 },
  hintText: { fontSize: 13, fontWeight: '600', flexShrink: 1 },
  bd: { paddingTop: 18, paddingHorizontal: 18, paddingBottom: 8, marginBottom: 26 },
  bdHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  bdHeadText: { fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  bdNote: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  bdItem: { paddingVertical: 10 },
  bdTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bdName: { flex: 1, fontSize: 15, fontWeight: '700' },
  bdAmount: { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
  bdBar: { height: 6, borderRadius: 999, marginTop: 8, marginLeft: 34, overflow: 'hidden' },
});
