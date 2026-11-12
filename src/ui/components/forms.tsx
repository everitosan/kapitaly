import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { INSTITUTION_CATALOG } from '@/data/institutions/catalog';
import { formatCivilDate, parseCivilDate, type CivilDate } from '@/domain/date';
import { resolveInstitution, type Institution } from '@/domain/institution';
import { divideRoundHalfUp, formatMXN, type Cents } from '@/domain/money';
import {
  isActiveMethod,
  methodLabel,
  type PaymentMethod,
  type PaymentMethodKind,
} from '@/domain/paymentMethod';
import {
  FREQUENCY_PRESETS,
  monthsPerInterval,
  presetFor,
  type IntervalUnit,
} from '@/domain/recurringExpense';

import { formatShortDate } from '../format';
import { methodGradient } from '../methodColor';
import { frequencyKeyForMonths, type Gradient } from '../theme';
import { useTheme } from '../ThemeProvider';
import { Chip, Field, FieldRow } from './basics';
import { InstitutionBadge } from './balance';
import { DuotoneBlock } from './DuotoneBlock';

export const KIND_LABELS: Record<PaymentMethodKind, string> = {
  credit: 'Crédito',
  debit: 'Débito',
  cash: 'Efectivo',
  transfer: 'Transferencia',
};

/* ---------- Bloque de monto del formulario ---------- */

export function AmountBlock({
  amountText,
  onChangeText,
  caption,
  gradient,
  error,
  autoFocus,
}: {
  amountText: string;
  onChangeText: (v: string) => void;
  caption: string;
  /** Abre el teclado en el monto al mostrarse (modo de captura rápida). */
  autoFocus?: boolean;
  /** Duotono de la frecuencia (recurrente) o `undefined` para el bloque neutro (único). */
  gradient?: Gradient;
  error?: string;
}) {
  const { colors, radii } = useTheme();
  const color = gradient ? colors.onBlock : colors.ink;
  const body = (
    <View style={styles.amountInner}>
      <Text style={[styles.amountLabel, { color }]}>Monto</Text>
      <View style={styles.amountRow}>
        <Text style={[styles.amountSign, { color }]}>$</Text>
        <TextInput
          testID="amount-input"
          accessibilityLabel="Monto"
          value={amountText}
          onChangeText={onChangeText}
          placeholder="0.00"
          placeholderTextColor={gradient ? 'rgba(20,20,20,0.35)' : colors.muted}
          keyboardType="decimal-pad"
          autoFocus={autoFocus}
          style={[styles.amountInput, { color }]}
        />
      </View>
      <Text style={[styles.amountCaption, { color }]}>{caption}</Text>
      {error ? (
        <Text
          accessibilityRole="alert"
          style={[styles.amountError, { color: gradient ? colors.onBlock : colors.danger }]}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
  const border = error ? { borderWidth: 2, borderColor: colors.danger } : null;
  return gradient ? (
    <DuotoneBlock gradient={gradient} radius={radii.total} style={border}>
      {body}
    </DuotoneBlock>
  ) : (
    <View style={[{ backgroundColor: colors.card, borderRadius: radii.total }, border]}>
      {body}
    </View>
  );
}

/* ---------- FrequencyChips ---------- */

export function FrequencyChips({
  unit,
  count,
  onChange,
  error,
}: {
  unit: IntervalUnit;
  count: number;
  onChange: (unit: IntervalUnit, count: number) => void;
  error?: string;
}) {
  const theme = useTheme();
  const current = presetFor(unit, count);
  const custom = current === 'custom';
  const months = monthsPerInterval(unit, count);
  return (
    <Field label="Frecuencia" error={error}>
      <View style={styles.chips}>
        {FREQUENCY_PRESETS.map((p) => {
          const g = theme.frequency[frequencyKeyForMonths(monthsPerInterval(p.unit, p.count))];
          return (
            <Pressable
              key={p.key}
              accessibilityRole="button"
              accessibilityState={{ selected: current === p.key }}
              onPress={() => onChange(p.unit, p.count)}
              style={[
                styles.freqChip,
                { borderColor: current === p.key ? theme.colors.ink : 'transparent' },
              ]}
            >
              <DuotoneBlock gradient={g} radius={999} style={styles.freqChipInner}>
                <Text style={[styles.chipText, { color: theme.colors.onBlock }]}>{p.label}</Text>
              </DuotoneBlock>
            </Pressable>
          );
        })}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: custom }}
          onPress={() => onChange('month', custom ? count : 4)}
          style={[styles.freqChip, { borderColor: custom ? theme.colors.ink : 'transparent' }]}
        >
          <DuotoneBlock gradient={theme.frequency.custom} radius={999} style={styles.freqChipInner}>
            <Text style={[styles.chipText, { color: theme.colors.onBlock }]}>Cada N meses</Text>
          </DuotoneBlock>
        </Pressable>
      </View>
      {custom ? (
        <View style={styles.stepperRow}>
          <FieldRow label="Cada">
            <View style={[styles.stepper, { backgroundColor: theme.colors.bg }]}>
              <Pressable
                accessibilityLabel="Menos meses"
                onPress={() => onChange('month', Math.max(1, months - 1))}
                style={[styles.stepBtn, { backgroundColor: theme.colors.card }]}
              >
                <Text style={[styles.stepText, { color: theme.colors.ink }]}>–</Text>
              </Pressable>
              <Text
                testID="interval-months"
                style={[styles.stepValue, { color: theme.colors.ink }]}
              >
                {months}
              </Text>
              <Pressable
                accessibilityLabel="Más meses"
                onPress={() => onChange('month', months + 1)}
                style={[styles.stepBtn, { backgroundColor: theme.colors.card }]}
              >
                <Text style={[styles.stepText, { color: theme.colors.ink }]}>+</Text>
              </Pressable>
            </View>
          </FieldRow>
        </View>
      ) : null}
    </Field>
  );
}

/* ---------- PaymentMethodPicker ---------- */

export function PaymentMethodPicker({
  methods,
  selectedId,
  onSelect,
  onNew,
  error,
}: {
  methods: readonly PaymentMethod[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew?: () => void;
  error?: string;
}) {
  const theme = useTheme();
  const active = methods.filter(isActiveMethod);
  return (
    <Field label="Método de pago" error={error}>
      <View style={styles.chips}>
        {active.map((m) => {
          const g = methodGradient(m, theme);
          const on = m.id === selectedId;
          return (
            <Pressable
              key={m.id}
              testID={`method-${m.id}`}
              accessibilityRole="button"
              accessibilityLabel={methodLabel(m)}
              accessibilityState={{ selected: on }}
              onPress={() => onSelect(m.id)}
              style={[styles.freqChip, { borderColor: on ? theme.colors.ink : 'transparent' }]}
            >
              <DuotoneBlock
                gradient={g}
                radius={999}
                style={[styles.freqChipInner, styles.methodChip]}
              >
                <InstitutionBadge method={m} size={26} onColor />
                <Text style={[styles.chipText, { color: g.text }]}>{methodLabel(m)}</Text>
              </DuotoneBlock>
            </Pressable>
          );
        })}
        {onNew ? <Chip label="+ Nuevo" dashed onPress={onNew} testID="new-method" /> : null}
      </View>
    </Field>
  );
}

/* ---------- InstitutionPicker ---------- */

export function InstitutionPicker({
  institutions,
  selectedId,
  onSelect,
}: {
  institutions: readonly Institution[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('es');
    return q
      ? institutions.filter((i) => i.name.toLocaleLowerCase('es').includes(q))
      : institutions;
  }, [institutions, query]);
  return (
    <Field label="Institución · opcional">
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="⌕ Buscar institución"
        placeholderTextColor={colors.muted}
        accessibilityLabel="Buscar institución"
        style={[styles.search, { backgroundColor: colors.bg, color: colors.ink }]}
      />
      <View style={styles.instGrid}>
        {filtered.map((i) => {
          const on = i.id === selectedId;
          return (
            <Pressable
              key={i.id}
              testID={`institution-${i.id}`}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => onSelect(i.id)}
              style={[
                styles.inst,
                { backgroundColor: colors.bg, borderColor: on ? colors.ink : 'transparent' },
              ]}
            >
              <InstitutionBadge
                method={{ institutionId: i.id, kind: 'debit', name: i.name }}
                size={28}
              />
              <Text style={[styles.instName, { color: colors.ink }]} numberOfLines={1}>
                {i.name}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          testID="institution-none"
          accessibilityRole="button"
          accessibilityState={{ selected: selectedId === null }}
          onPress={() => onSelect(null)}
          style={[
            styles.inst,
            {
              backgroundColor: colors.bg,
              borderColor: selectedId === null ? colors.ink : 'transparent',
            },
          ]}
        >
          <View style={[styles.noneBadge, { backgroundColor: colors.line }]}>
            <Text style={{ color: colors.muted, fontWeight: '800' }}>–</Text>
          </View>
          <Text style={[styles.instName, { color: colors.ink }]}>Sin institución</Text>
        </Pressable>
      </View>
    </Field>
  );
}

/* ---------- DateField ---------- */

const toDate = (c: CivilDate) => {
  const { year, month, day } = parseCivilDate(c);
  return new Date(year, month - 1, day);
};

export function DateField({
  label,
  value,
  onChange,
  prefix,
  error,
  testID,
}: {
  label: string;
  value: CivilDate;
  onChange: (date: CivilDate) => void;
  prefix?: string;
  error?: string;
  testID?: string;
}) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const handle = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS !== 'ios') setOpen(false);
    if (event.type === 'set' && date)
      onChange(formatCivilDate(date.getFullYear(), date.getMonth() + 1, date.getDate()));
  };
  return (
    <Field error={error}>
      <FieldRow label={label}>
        <Pressable
          testID={testID}
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${formatShortDate(value)}`}
          onPress={() => setOpen((v) => !v)}
          style={[styles.datePill, { backgroundColor: colors.bg }]}
        >
          <Text style={[styles.datePillText, { color: colors.ink }]}>
            {prefix ? `${prefix} · ` : ''}
            {formatShortDate(value)}
          </Text>
        </Pressable>
      </FieldRow>
      {open ? (
        <DateTimePicker
          testID="date-picker"
          value={toDate(value)}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={handle}
        />
      ) : null}
    </Field>
  );
}

/* ---------- Tarjeta de método ---------- */

export interface CreditSummary {
  usedCents: Cents;
  /** Próxima fecha de pago, si la tarjeta tiene día de pago. */
  nextDue: CivilDate | null;
  limitCents: Cents | null;
}

const MASK = '••••••';

/** Usado visible; límite y disponible ocultos hasta tocarlos (se vuelven a ocultar al desmontar). */
function CreditStats({ credit, color }: { credit: CreditSummary; color: string }) {
  const [reveal, setReveal] = useState(false);
  const used = credit.usedCents;
  const usedText = used >= 0 ? formatMXN(used) : `${formatMXN(-used)} a favor`;
  return (
    <View style={styles.ccStats}>
      <View style={styles.ccStat}>
        <Text style={[styles.ccLabel, { color }]}>{used >= 0 ? 'USADO' : 'SALDO A FAVOR'}</Text>
        <Text style={[styles.ccValue, { color }]}>{used >= 0 ? usedText : formatMXN(-used)}</Text>
      </View>
      <View style={styles.ccStat}>
        <Text style={[styles.ccLabel, { color }]}>PRÓXIMO PAGO</Text>
        <Text style={[styles.ccValue, { color }]}>
          {credit.nextDue ? formatShortDate(credit.nextDue) : '—'}
        </Text>
      </View>
      {credit.limitCents !== null ? (
        <Pressable
          testID="reveal-limit"
          accessibilityRole="button"
          accessibilityLabel={reveal ? 'Ocultar límite' : 'Mostrar límite'}
          onPress={() => setReveal((v) => !v)}
          style={[styles.ccStat, styles.ccWide]}
        >
          <View>
            <Text style={[styles.ccLabel, { color }]}>LÍMITE · DISPONIBLE</Text>
            <Text style={[styles.ccValue, { color }, reveal ? null : styles.ccMask]}>
              {reveal
                ? `${formatMXN(credit.limitCents)} · ${formatMXN(credit.limitCents - used)}`
                : `${MASK} · ${MASK}`}
            </Text>
          </View>
          <Text style={[styles.ccToggle, { color }]}>{reveal ? 'Ocultar' : 'Mostrar'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function MethodCard({
  method,
  uses,
  big,
  onPress,
  credit,
}: {
  method: Pick<
    PaymentMethod,
    'name' | 'kind' | 'last4' | 'institutionId' | 'color' | 'archivedAt'
  > &
    Partial<Pick<PaymentMethod, 'hasDigital' | 'digitalLast4'>> & { id?: string };
  uses?: number;
  big?: boolean;
  onPress?: () => void;
  /** Solo tarjetas de crédito. */
  credit?: CreditSummary;
}) {
  const theme = useTheme();
  const g = methodGradient(method, theme);
  const institution = resolveInstitution(INSTITUTION_CATALOG, method.institutionId);
  const note = method.archivedAt
    ? 'Archivado'
    : method.id === '00000000-0000-4000-8000-000000000001'
      ? 'Método inicial'
      : '';
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={method.name}
      style={[styles.mcardWrap, method.archivedAt ? { opacity: 0.55 } : null]}
    >
      <DuotoneBlock
        gradient={g}
        radius={theme.radii.card}
        style={[styles.mcard, big ? styles.mcardBig : null]}
      >
        <View style={styles.mcardTop}>
          <View style={styles.mcardTopLeft}>
            <InstitutionBadge method={method} size={34} onColor />
            <Text style={[styles.mcardKind, { color: g.text }]}>
              {institution ? `${institution.name} · ` : ''}
              {KIND_LABELS[method.kind]}
            </Text>
          </View>
          {uses !== undefined ? (
            <Text
              style={[styles.mcardKind, { color: g.text }]}
            >{`${uses} ${uses === 1 ? 'gasto' : 'gastos'}`}</Text>
          ) : null}
        </View>
        <Text
          style={[styles.mcardName, big ? { fontSize: 28 } : null, { color: g.text }]}
          numberOfLines={1}
        >
          {method.name || 'Nuevo método'}
        </Text>
        {credit ? <CreditStats credit={credit} color={g.text} /> : null}
        <View style={styles.mcardFoot}>
          <Text style={[styles.mcardNote, { color: g.text }]}>
            {note ||
              (method.hasDigital
                ? `+ digital${method.digitalLast4 ? ` ••${method.digitalLast4}` : ''}`
                : '')}
          </Text>
          <Text style={[styles.mcardDigits, { color: g.text }]}>
            {method.last4 ? `•••• ${method.last4}` : ''}
          </Text>
        </View>
      </DuotoneBlock>
    </Pressable>
  );
}

/** Texto bajo el monto del formulario recurrente. */
export function recurringCaption(amountCents: Cents | null, months: number): string {
  if (months === 1) return 'Se cobra cada mes';
  if (amountCents === null) return `Se cobra cada ${months} meses`;
  return `${formatMXN(divideRoundHalfUp(amountCents, months))} al mes en promedio`;
}

const styles = StyleSheet.create({
  amountInner: { padding: 22, alignItems: 'center' },
  amountLabel: { fontSize: 13, fontWeight: '700', opacity: 0.65 },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  amountSign: { fontSize: 44, fontWeight: '800' },
  amountInput: {
    fontSize: 52,
    fontWeight: '800',
    letterSpacing: -1.5,
    minWidth: 120,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    padding: 0,
  },
  amountCaption: { fontSize: 14, fontWeight: '700', opacity: 0.7 },
  amountError: { fontSize: 13, fontWeight: '700', marginTop: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  freqChip: { borderRadius: 999, borderWidth: 2, padding: 2 },
  freqChipInner: {
    height: 36,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodChip: { flexDirection: 'row', gap: 8, paddingLeft: 5 },
  chipText: { fontSize: 14, fontWeight: '700' },
  stepperRow: { marginTop: 10 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, padding: 3 },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontSize: 18, fontWeight: '800' },
  stepValue: { minWidth: 28, textAlign: 'center', fontWeight: '800', fontSize: 16 },
  search: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '600',
    marginTop: 8,
  },
  instGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  inst: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 2,
  },
  instName: { fontSize: 14, fontWeight: '700', flexShrink: 1 },
  noneBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePill: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  datePillText: { fontSize: 15, fontWeight: '700' },
  mcardWrap: { marginBottom: 12 },
  mcard: {
    padding: 20,
    paddingVertical: 18,
    minHeight: 124,
    justifyContent: 'space-between',
    gap: 10,
  },
  mcardBig: { minHeight: 168 },
  mcardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mcardTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  mcardKind: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  mcardName: { fontSize: 23, fontWeight: '800', letterSpacing: -0.5 },
  mcardFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  mcardNote: { fontSize: 13, fontWeight: '700', opacity: 0.85 },
  ccStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ccStat: {
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 11,
  },
  ccWide: {
    flexBasis: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ccLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6, opacity: 0.75 },
  ccValue: { fontSize: 16, fontWeight: '800', fontVariant: ['tabular-nums'] },
  ccMask: { letterSpacing: 2.5 },
  ccToggle: { fontSize: 12, fontWeight: '800', opacity: 0.85 },
  mcardDigits: { fontSize: 17, fontWeight: '700', letterSpacing: 2 },
});
