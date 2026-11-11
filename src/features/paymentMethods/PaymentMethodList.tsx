import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { nextDueOnOrAfter, usedCents } from '@/domain/creditCard';
import { civilDateFromLocal, type CivilDate } from '@/domain/date';
import { countMethodUses, type ExpenseRef, type PaymentMethod } from '@/domain/paymentMethod';
import { PrimaryButton } from '@/ui/components/basics';
import { RoundButton } from '@/ui/components/balance';
import { MethodCard, type CreditSummary } from '@/ui/components/forms';
import { ScreenLayout } from '@/ui/components/layout';
import { useTheme } from '@/ui/ThemeProvider';

import {
  useCardPayments,
  useChargeConfirmations,
  useOneOffExpenses,
  usePaymentMethods,
  useRecurringExpenses,
} from '../repositories';

export interface PaymentMethodListProps {
  onBack: () => void;
  onOpen: (id: string) => void;
  onAdd: () => void;
  /** Fecha de hoy (zona local). Se inyecta en pruebas. */
  today?: CivilDate;
}

/** Lista de métodos: activos como tarjetas, archivados en una sección plegable. */
export function PaymentMethodList({
  onBack,
  onOpen,
  onAdd,
  today = civilDateFromLocal(new Date()),
}: PaymentMethodListProps) {
  const { colors } = useTheme();
  const methods = usePaymentMethods();
  const recurring = useRecurringExpenses();
  const oneOffs = useOneOffExpenses();
  const payments = useCardPayments();
  const confirmations = useChargeConfirmations();
  const [showArchived, setShowArchived] = useState(false);

  const creditOf = (m: PaymentMethod): CreditSummary | undefined =>
    m.kind !== 'credit'
      ? undefined
      : {
          usedCents: usedCents(m, oneOffs.data, confirmations.data, payments.data),
          nextDue: m.paymentDueDay !== null ? nextDueOnOrAfter(m.paymentDueDay, today) : null,
          limitCents: m.creditLimitCents,
        };

  const refs: ExpenseRef[] = [...recurring.data, ...oneOffs.data];
  const active = methods.data
    .filter((m) => m.archivedAt === null)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const archived = methods.data.filter((m) => m.archivedAt !== null);

  return (
    <ScreenLayout
      header={
        <View style={styles.topnav}>
          <RoundButton label="Volver" onPress={onBack}>
            <Text style={[styles.arrow, { color: colors.ink }]}>‹</Text>
          </RoundButton>
        </View>
      }
      footer={<PrimaryButton label="Agregar método" plus onPress={onAdd} />}
    >
      <Text accessibilityRole="header" style={[styles.title, { color: colors.ink }]}>
        Métodos de pago
      </Text>
      <Text style={[styles.desc, { color: colors.muted }]}>
        {`${active.length} ${active.length === 1 ? 'activo' : 'activos'} · de dónde sale cada gasto`}
      </Text>
      {active.map((m) => (
        <MethodCard
          key={m.id}
          method={m}
          uses={countMethodUses(m.id, refs)}
          credit={creditOf(m)}
          onPress={() => onOpen(m.id)}
        />
      ))}
      {archived.length > 0 ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: showArchived }}
            onPress={() => setShowArchived((v) => !v)}
            style={styles.archHeader}
          >
            <Text
              style={[styles.archText, { color: colors.muted }]}
            >{`ARCHIVADOS · ${archived.length}`}</Text>
            <Text style={[styles.archText, { color: colors.muted }]}>
              {showArchived ? '▴' : '▾'}
            </Text>
          </Pressable>
          {showArchived
            ? archived.map((m) => (
                <MethodCard
                  key={m.id}
                  method={m}
                  uses={countMethodUses(m.id, refs)}
                  credit={creditOf(m)}
                  onPress={() => onOpen(m.id)}
                />
              ))
            : null}
        </>
      ) : null}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  topnav: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12, flexDirection: 'row' },
  arrow: { fontSize: 24, fontWeight: '600' },
  title: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    paddingHorizontal: 4,
    paddingBottom: 6,
  },
  desc: { fontSize: 15, fontWeight: '600', paddingHorizontal: 4, paddingBottom: 20 },
  archHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  archText: { fontSize: 13, fontWeight: '700', letterSpacing: 1 },
});
