import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { dueDateCoveredBy, validateCardPayment, type CardPaymentField } from '@/domain/creditCard';
import { civilDateFromLocal, type CivilDate } from '@/domain/date';
import type { Cents } from '@/domain/money';
import type { PaymentMethod } from '@/domain/paymentMethod';
import { PrimaryButton } from '@/ui/components/basics';
import { AmountBlock, DateField } from '@/ui/components/forms';
import { SheetLayout } from '@/ui/components/layout';
import { formatShortDate } from '@/ui/format';
import { methodGradient } from '@/ui/methodColor';
import { useTheme } from '@/ui/ThemeProvider';

import { errorMessage } from '../messages';
import { useRepositories } from '../repositories';

export interface CardPaymentSheetProps {
  method: PaymentMethod;
  usedCents: Cents;
  onDone: () => void;
  today?: CivilDate;
}

/** "Pagar tarjeta": monto propuesto = lo usado; el pago cubre la fecha de pago más cercana. */
export function CardPaymentSheet({
  method,
  usedCents,
  onDone,
  today = civilDateFromLocal(new Date()),
}: CardPaymentSheetProps) {
  const theme = useTheme();
  const repos = useRepositories();
  const [amountText, setAmountText] = useState(usedCents > 0 ? (usedCents / 100).toFixed(2) : '');
  const [date, setDate] = useState<CivilDate>(today);
  const [errors, setErrors] = useState<Partial<Record<CardPaymentField, string>>>({});
  const covered = dueDateCoveredBy(method, date);

  const save = async () => {
    const r = validateCardPayment({ amountText, date }, method);
    if (!r.ok) return setErrors(r.errors);
    await repos.cardPayments.create(r.value);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onDone();
  };

  return (
    <SheetLayout
      title="Pagar tarjeta"
      onLeft={onDone}
      footer={<PrimaryButton label="Registrar pago" onPress={save} testID="save-payment" />}
    >
      <AmountBlock
        amountText={amountText}
        onChangeText={setAmountText}
        caption="Propuesto: todo lo usado · puedes pagar menos"
        gradient={methodGradient(method, theme)}
        error={errorMessage('amount', errors.amount)}
      />
      <DateField
        label="Fecha"
        prefix={date === today ? 'Hoy' : undefined}
        value={date}
        onChange={setDate}
        testID="payment-date"
      />
      <View style={[styles.notice, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.noticeText, { color: theme.colors.muted }]}>
          {covered
            ? `Este pago cubre la fecha de pago del ${formatShortDate(covered)}, así que ese día no te preguntaremos. `
            : ''}
          Los pagos no cuentan como gastos del mes.
        </Text>
      </View>
    </SheetLayout>
  );
}

const styles = StyleSheet.create({
  notice: { borderRadius: 16, padding: 14 },
  noticeText: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
});
