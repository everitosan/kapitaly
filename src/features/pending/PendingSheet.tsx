import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { validateConfirmation, type PendingCharge } from '@/domain/confirmations';
import { validateCardPayment } from '@/domain/creditCard';
import { parseCivilDate, type CivilDate } from '@/domain/date';
import { formatMXN } from '@/domain/money';
import { methodLabel, type PaymentMethod } from '@/domain/paymentMethod';
import { frequencyLabel, monthsPerInterval } from '@/domain/recurringExpense';
import { FieldRow, PrimaryButton, SecondaryButton, Switch } from '@/ui/components/basics';
import { InstitutionBadge } from '@/ui/components/balance';
import { DuotoneBlock } from '@/ui/components/DuotoneBlock';
import { SheetLayout } from '@/ui/components/layout';
import { formatShortDate, MONTH_SHORT } from '@/ui/format';
import { frequencyKeyForMonths } from '@/ui/theme';
import { useTheme } from '@/ui/ThemeProvider';

import { errorMessage } from '../messages';
import { useRepositories } from '../repositories';
import { chargeKey, paymentKey, pendingSession } from './session';
import type { PendingPayment } from './usePending';

export interface PendingSheetProps {
  charges: PendingCharge[];
  cardPayments: PendingPayment[];
  methods: readonly PaymentMethod[];
  today: CivilDate;
  onClose: () => void;
  /** Avisa que algo se pospuso ("Aún no"), para volver a calcular la lista. */
  onSnooze: () => void;
}

const centsText = (c: number) => (c / 100).toFixed(2);

function ChargeCard({
  charge,
  method,
  onSnooze,
}: {
  charge: PendingCharge;
  method: PaymentMethod | null;
  onSnooze: () => void;
}) {
  const theme = useTheme();
  const { colors } = theme;
  const repos = useRepositories();
  const [amountText, setAmountText] = useState(centsText(charge.expense.amountCents));
  const [error, setError] = useState<string>();
  const [addsToCard, setAddsToCard] = useState(true);
  const isCredit = method?.kind === 'credit';
  const { day, month } = parseCivilDate(charge.date);
  const months = monthsPerInterval(charge.expense.intervalUnit, charge.expense.intervalCount);

  const answer = async (status: 'charged' | 'skipped') => {
    const r = validateConfirmation(
      { status, amountText, addsToCardBalance: isCredit ? addsToCard : true },
      charge,
    );
    if (!r.ok) return setError(errorMessage('amount', r.errors.amount));
    await repos.chargeConfirmations.upsert(r.value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View
      testID={`pending-charge-${charge.expense.id}`}
      style={[styles.card, { backgroundColor: colors.card }]}
    >
      <View style={styles.head}>
        <DuotoneBlock
          gradient={theme.frequency[frequencyKeyForMonths(months)]}
          radius={16}
          style={styles.date}
        >
          <Text style={[styles.dateDay, { color: colors.onBlock }]}>{day}</Text>
          <Text style={[styles.dateMonth, { color: colors.onBlock }]}>
            {MONTH_SHORT[month - 1]}
          </Text>
        </DuotoneBlock>
        <View style={styles.flex}>
          <Text
            style={[styles.title, { color: colors.ink }]}
          >{`¿Ya se cobró ${charge.expense.name}?`}</Text>
          <Text style={[styles.sub, { color: colors.muted }]}>
            {`${frequencyLabel(charge.expense.intervalUnit, charge.expense.intervalCount)} · ${method ? methodLabel(method, charge.expense.cardVariant) : 'Método desconocido'}`}
          </Text>
        </View>
      </View>
      <View style={[styles.amount, { backgroundColor: colors.bg }]}>
        <Text style={[styles.amountLabel, { color: colors.ink }]}>Monto cobrado</Text>
        <TextInput
          accessibilityLabel={`Monto cobrado de ${charge.expense.name}`}
          value={amountText}
          onChangeText={setAmountText}
          keyboardType="decimal-pad"
          style={[styles.amountInput, { color: colors.ink }]}
        />
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
          {error}
        </Text>
      ) : null}
      {isCredit ? (
        <FieldRow label="Sumar al saldo de la tarjeta" muted>
          <Switch
            label={`Sumar ${charge.expense.name} al saldo de la tarjeta`}
            value={addsToCard}
            onValueChange={setAddsToCard}
            testID={`adds-to-card-${charge.expense.id}`}
          />
        </FieldRow>
      ) : null}
      <PrimaryButton label="Sí, se cobró" onPress={() => answer('charged')} />
      <View style={styles.row}>
        <SecondaryButton
          label="Aún no"
          style={[styles.flex, { backgroundColor: colors.bg }]}
          onPress={() => {
            pendingSession.snooze(chargeKey(charge.expense.id, charge.date));
            onSnooze();
          }}
        />
        <SecondaryButton
          label="No se cobró"
          style={[styles.flex, { backgroundColor: colors.bg }]}
          onPress={() => answer('skipped')}
        />
      </View>
    </View>
  );
}

function PaymentCard({
  pending,
  today,
  onSnooze,
}: {
  pending: PendingPayment;
  today: CivilDate;
  onSnooze: () => void;
}) {
  const { colors } = useTheme();
  const repos = useRepositories();
  const [amountText, setAmountText] = useState(centsText(pending.suggestedCents));
  const [error, setError] = useState<string>();

  const paid = async () => {
    const r = validateCardPayment(
      { amountText, date: today, forDueDate: pending.dueDate },
      pending.method,
    );
    if (!r.ok) return setError(errorMessage('amount', r.errors.amount));
    await repos.cardPayments.create(r.value);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View
      testID={`pending-payment-${pending.method.id}`}
      style={[styles.card, { backgroundColor: colors.card }]}
    >
      <View style={styles.head}>
        <InstitutionBadge method={pending.method} size={44} />
        <View style={styles.flex}>
          <Text
            style={[styles.title, { color: colors.ink }]}
          >{`¿Ya pagaste ${pending.method.name}?`}</Text>
          <Text
            style={[styles.sub, { color: colors.muted }]}
          >{`Vencía el ${formatShortDate(pending.dueDate)} · usado ${formatMXN(pending.suggestedCents)}`}</Text>
        </View>
      </View>
      <View style={[styles.amount, { backgroundColor: colors.bg }]}>
        <Text style={[styles.amountLabel, { color: colors.ink }]}>Monto pagado</Text>
        <TextInput
          accessibilityLabel={`Monto pagado de ${pending.method.name}`}
          value={amountText}
          onChangeText={setAmountText}
          keyboardType="decimal-pad"
          style={[styles.amountInput, { color: colors.ink }]}
        />
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
          {error}
        </Text>
      ) : null}
      <View style={styles.row}>
        <PrimaryButton label="Sí, pagué" style={styles.flex} onPress={paid} />
        <SecondaryButton
          label="Aún no"
          style={[styles.flex, { backgroundColor: colors.bg }]}
          onPress={() => {
            pendingSession.snooze(paymentKey(pending.method.id, pending.dueDate));
            onSnooze();
          }}
        />
      </View>
    </View>
  );
}

/** Hoja "Pendientes": cobros por confirmar y pagos de tarjeta vencidos. */
export function PendingSheet({
  charges,
  cardPayments,
  methods,
  today,
  onClose,
  onSnooze,
}: PendingSheetProps) {
  const { colors } = useTheme();
  const methodById = new Map(methods.map((m) => [m.id, m]));
  const empty = charges.length === 0 && cardPayments.length === 0;
  return (
    <SheetLayout title="Pendientes" leftLabel="Cerrar" onLeft={onClose}>
      {empty ? (
        <View style={[styles.card, styles.empty, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.muted }]}>Todo al día</Text>
        </View>
      ) : null}
      {charges.map((c) => (
        <ChargeCard
          key={chargeKey(c.expense.id, c.date)}
          charge={c}
          method={methodById.get(c.expense.paymentMethodId) ?? null}
          onSnooze={onSnooze}
        />
      ))}
      {cardPayments.map((p) => (
        <PaymentCard
          key={paymentKey(p.method.id, p.dueDate)}
          pending={p}
          today={today}
          onSnooze={onSnooze}
        />
      ))}
    </SheetLayout>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { borderRadius: 22, padding: 16, gap: 12 },
  empty: { alignItems: 'center', paddingVertical: 30 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  date: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  dateDay: { fontSize: 20, fontWeight: '800', lineHeight: 22 },
  dateMonth: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', opacity: 0.7 },
  title: { fontSize: 16, fontWeight: '800' },
  sub: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  amount: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  amountLabel: { fontSize: 15, fontWeight: '700' },
  amountInput: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'right',
    minWidth: 120,
    fontVariant: ['tabular-nums'],
  },
  error: { fontSize: 13, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 8 },
});
