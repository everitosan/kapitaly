import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { OTHER_CATEGORY_ID, resolveCategory } from '@/domain/category';
import { civilDateFromLocal, type CivilDate } from '@/domain/date';
import { formatMXN, parseMoneyToCents } from '@/domain/money';
import {
  validateOneOffExpenseInput,
  type OneOffExpense,
  type OneOffExpenseField,
} from '@/domain/oneOffExpense';
import {
  isActiveMethod,
  suggestCardVariant,
  suggestPaymentMethod,
  type CardVariant,
  type PaymentMethod,
} from '@/domain/paymentMethod';
import {
  monthsPerInterval,
  validateRecurringExpenseInput,
  type IntervalUnit,
  type RecurringExpense,
  type RecurringExpenseField,
} from '@/domain/recurringExpense';
import {
  DangerButton,
  Field,
  FieldRow,
  PrimaryButton,
  Switch,
  TextField,
} from '@/ui/components/basics';
import { SegmentedControl } from '@/ui/components/balance';
import {
  AmountBlock,
  DateField,
  FrequencyChips,
  PaymentMethodPicker,
  recurringCaption,
} from '@/ui/components/forms';
import { SheetLayout } from '@/ui/components/layout';
import { CategoryIcon } from '@/ui/icons/categoryIcons';
import { frequencyKeyForMonths } from '@/ui/theme';
import { useTheme } from '@/ui/ThemeProvider';

import { CategoryPicker } from '../categories/CategoryPicker';
import { errorMessage } from '../messages';
import { PaymentMethodForm } from '../paymentMethods/PaymentMethodForm';
import {
  useCategories,
  useOneOffExpenses,
  usePaymentMethods,
  useRecurringExpenses,
  useRepositories,
} from '../repositories';

export type ExpenseFormTarget =
  | { kind: 'new' }
  | { kind: 'oneOff'; expense: OneOffExpense }
  | { kind: 'recurring'; expense: RecurringExpense };

type ExpenseType = 'oneOff' | 'recurring';

interface Draft {
  type: ExpenseType;
  /** Descripción (único) o nombre (recurrente). */
  title: string;
  amountText: string;
  date: CivilDate;
  unit: IntervalUnit;
  count: number;
  hasEnd: boolean;
  endDate: CivilDate;
  methodId: string | null;
  /** `null` = aún no elegida: se usa la sugerida para el método. */
  cardVariant: CardVariant | null;
  /** Solo gasto único con tarjeta de crédito: falso = ya venía en el saldo inicial. */
  addsToCard: boolean;
  categoryId: string;
}

const centsToText = (cents: number) => (cents / 100).toFixed(2);

function initialDraft(target: ExpenseFormTarget, today: CivilDate): Draft {
  const base: Draft = {
    type: 'oneOff',
    title: '',
    amountText: '',
    date: today,
    unit: 'month',
    count: 1,
    hasEnd: false,
    endDate: today,
    methodId: null,
    cardVariant: null,
    addsToCard: true,
    categoryId: OTHER_CATEGORY_ID,
  };
  if (target.kind === 'oneOff') {
    const e = target.expense;
    return {
      ...base,
      title: e.description,
      amountText: centsToText(e.amountCents),
      date: e.date,
      methodId: e.paymentMethodId,
      cardVariant: e.cardVariant,
      addsToCard: e.addsToCardBalance,
      categoryId: e.categoryId,
    };
  }
  if (target.kind === 'recurring') {
    const e = target.expense;
    return {
      ...base,
      type: 'recurring',
      title: e.name,
      amountText: centsToText(e.amountCents),
      date: e.anchorDate,
      unit: e.intervalUnit,
      count: e.intervalCount,
      hasEnd: e.endDate !== null,
      endDate: e.endDate ?? e.anchorDate,
      methodId: e.paymentMethodId,
      cardVariant: e.cardVariant,
      categoryId: e.categoryId,
    };
  }
  return base;
}

export interface ExpenseFormProps {
  target: ExpenseFormTarget;
  onDone: () => void;
  /** Fecha de hoy (zona local). Se inyecta en pruebas. */
  today?: CivilDate;
  /** Captura rápida (acceso directo): el teclado se abre en el monto. */
  autoFocusAmount?: boolean;
}

export function ExpenseForm({
  target,
  autoFocusAmount = false,
  onDone,
  today = civilDateFromLocal(new Date()),
}: ExpenseFormProps) {
  const theme = useTheme();
  const repos = useRepositories();
  const methods = usePaymentMethods();
  const recurring = useRecurringExpenses();
  const oneOffs = useOneOffExpenses();
  const [draft, setDraft] = useState<Draft>(() => initialDraft(target, today));
  const [errors, setErrors] = useState<
    Partial<Record<OneOffExpenseField | RecurringExpenseField, string>>
  >({});
  const [creatingMethod, setCreatingMethod] = useState(false);
  const [pickingCategory, setPickingCategory] = useState(false);
  const categories = useCategories();
  const category = resolveCategory(draft.categoryId, categories.data);
  const [saving, setSaving] = useState(false);

  // Método efectivo: el elegido o, en altas, el último usado (derivado, sin efectos).
  const loaded = !methods.loading && !recurring.loading && !oneOffs.loading;
  const suggestedMethodId =
    target.kind === 'new' && loaded
      ? suggestPaymentMethod(methods.data, [...recurring.data, ...oneOffs.data])
      : null;
  const methodId = draft.methodId ?? suggestedMethodId;

  const update = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const isActive = (id: string) => methods.data.some((m) => m.id === id && isActiveMethod(m));
  const selectedMethod = methods.data.find((m) => m.id === methodId) ?? null;
  const hasDigital = (id: string) => methods.data.some((m) => m.id === id && m.hasDigital);
  const cardVariant: CardVariant | null =
    methodId && hasDigital(methodId)
      ? (draft.cardVariant ?? suggestCardVariant(methodId, [...recurring.data, ...oneOffs.data]))
      : null;
  const ctx = { isActiveMethod: isActive, methodHasDigital: hasDigital };

  const months = monthsPerInterval(draft.unit, draft.count);
  const parsed = parseMoneyToCents(draft.amountText);
  const cents = parsed.ok ? parsed.cents : null;

  const save = async () => {
    setSaving(true);
    try {
      if (draft.type === 'oneOff') {
        const r = validateOneOffExpenseInput(
          {
            description: draft.title,
            amountText: draft.amountText,
            date: draft.date,
            paymentMethodId: methodId,
            cardVariant,
            addsToCardBalance: selectedMethod?.kind === 'credit' ? draft.addsToCard : true,
            categoryId: category.id,
          },
          ctx,
        );
        if (!r.ok) return setErrors(r.errors);
        if (target.kind === 'oneOff') await repos.oneOffExpenses.update(target.expense.id, r.value);
        else await repos.oneOffExpenses.create(r.value);
      } else {
        const r = validateRecurringExpenseInput(
          {
            name: draft.title,
            amountText: draft.amountText,
            intervalUnit: draft.unit,
            intervalCount: draft.count,
            anchorDate: draft.date,
            endDate: draft.hasEnd ? draft.endDate : null,
            paymentMethodId: methodId,
            cardVariant,
            categoryId: category.id,
          },
          ctx,
        );
        if (!r.ok) return setErrors(r.errors);
        if (target.kind === 'recurring')
          await repos.recurringExpenses.update(target.expense.id, r.value);
        else await repos.recurringExpenses.create(r.value);
      }
      setErrors({});
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onDone();
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (target.kind === 'new') return;
    const label = target.kind === 'oneOff' ? target.expense.description : target.expense.name;
    Alert.alert(`¿Eliminar "${label}"?`, 'Dejará de mostrarse y de contarse en todos los meses.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar gasto',
        style: 'destructive',
        onPress: async () => {
          if (target.kind === 'oneOff') await repos.oneOffExpenses.remove(target.expense.id);
          else await repos.recurringExpenses.remove(target.expense.id);
          onDone();
        },
      },
    ]);
  };

  const onMethodCreated = (saved?: PaymentMethod) => {
    setCreatingMethod(false);
    if (saved) update({ methodId: saved.id });
  };

  const title = target.kind === 'new' ? 'Nuevo gasto' : 'Editar gasto';
  const isOneOff = draft.type === 'oneOff';
  const contextLabel = `${draft.title.trim() || (isOneOff ? 'Gasto único' : 'Gasto recurrente')}${cents !== null ? ` · ${formatMXN(cents)}` : ''}`;

  return (
    <>
      <SheetLayout
        title={title}
        onLeft={onDone}
        footer={
          <PrimaryButton label="Guardar" onPress={save} disabled={saving} testID="save-expense" />
        }
      >
        {target.kind === 'new' ? (
          <SegmentedControl
            testID="expense-type"
            options={[
              { value: 'oneOff', label: 'Único' },
              { value: 'recurring', label: 'Recurrente' },
            ]}
            value={draft.type}
            onChange={(type) => {
              update({ type });
              setErrors({});
            }}
          />
        ) : null}

        {isOneOff ? (
          <>
            <AmountBlock
              amountText={draft.amountText}
              onChangeText={(amountText) => update({ amountText })}
              caption="Gasto único · no se repite"
              error={errorMessage('amount', errors.amount)}
              autoFocus={autoFocusAmount}
            />
            <TextField
              label="Descripción"
              value={draft.title}
              onChangeText={(t) => update({ title: t })}
              placeholder="Ej. Recarga metro"
              error={errorMessage('description', errors.description)}
              testID="expense-title"
            />
            <DateField
              label="Fecha"
              prefix={draft.date === today ? 'Hoy' : undefined}
              value={draft.date}
              onChange={(date) => update({ date })}
              error={errorMessage('date', errors.date)}
              testID="expense-date"
            />
          </>
        ) : (
          <>
            <AmountBlock
              amountText={draft.amountText}
              onChangeText={(amountText) => update({ amountText })}
              caption={recurringCaption(cents, months)}
              gradient={theme.frequency[frequencyKeyForMonths(months)]}
              error={errorMessage('amount', errors.amount)}
            />
            <TextField
              label="Nombre"
              value={draft.title}
              onChangeText={(t) => update({ title: t })}
              placeholder="Ej. Netflix"
              error={errorMessage('name', errors.name)}
              testID="expense-title"
            />
            <FrequencyChips
              unit={draft.unit}
              count={draft.count}
              onChange={(unit, count) => update({ unit, count })}
              error={errorMessage('interval', errors.interval)}
            />
            <DateField
              label="Fecha de cobro"
              value={draft.date}
              onChange={(date) => update({ date })}
              error={errorMessage('anchorDate', errors.anchorDate)}
              testID="expense-date"
            />
            <Field error={errorMessage('endDate', errors.endDate)}>
              <FieldRow label="Fecha de fin">
                <Switch
                  label="Fecha de fin"
                  value={draft.hasEnd}
                  onValueChange={(hasEnd) => update({ hasEnd })}
                  testID="has-end"
                />
              </FieldRow>
              {draft.hasEnd ? (
                <View style={{ marginTop: 8 }}>
                  <DateField
                    label="Termina"
                    value={draft.endDate}
                    onChange={(endDate) => update({ endDate })}
                    testID="expense-end"
                  />
                </View>
              ) : null}
            </Field>
          </>
        )}

        <Field>
          <Pressable
            testID="expense-category"
            accessibilityRole="button"
            accessibilityLabel={`Categoría: ${category.name}`}
            onPress={() => setPickingCategory(true)}
            style={styles.categoryRow}
          >
            <Text style={[styles.categoryLabel, { color: theme.colors.ink }]}>Categoría</Text>
            <View style={[styles.categoryValue, { backgroundColor: theme.colors.bg }]}>
              <CategoryIcon icon={category.icon} color={theme.colors.ink} size={18} />
              <Text style={[styles.categoryName, { color: theme.colors.ink }]}>
                {category.name}
              </Text>
            </View>
            <Text style={[styles.chev, { color: theme.colors.muted }]}>›</Text>
          </Pressable>
        </Field>

        <PaymentMethodPicker
          methods={methods.data}
          selectedId={methodId}
          onSelect={(methodId) => update({ methodId, cardVariant: null })}
          onNew={() => setCreatingMethod(true)}
          error={errorMessage('paymentMethodId', errors.paymentMethodId)}
        />

        {selectedMethod?.hasDigital && cardVariant ? (
          <SegmentedControl
            testID="card-variant"
            options={[
              {
                value: 'physical',
                label: `Física${selectedMethod.last4 ? ` ••${selectedMethod.last4}` : ''}`,
              },
              {
                value: 'digital',
                label: `Digital${selectedMethod.digitalLast4 ? ` ••${selectedMethod.digitalLast4}` : ''}`,
              },
            ]}
            value={cardVariant}
            onChange={(v) => update({ cardVariant: v })}
          />
        ) : null}

        {isOneOff && selectedMethod?.kind === 'credit' ? (
          <FieldRow label="Sumar al saldo de la tarjeta" muted>
            <Switch
              label="Sumar al saldo de la tarjeta"
              value={draft.addsToCard}
              onValueChange={(addsToCard) => update({ addsToCard })}
              testID="adds-to-card"
            />
          </FieldRow>
        ) : null}

        {target.kind !== 'new' ? (
          <DangerButton label="Eliminar gasto" onPress={confirmDelete} />
        ) : null}
      </SheetLayout>

      <Modal
        visible={creatingMethod}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCreatingMethod(false)}
      >
        {creatingMethod ? (
          <PaymentMethodForm
            method={null}
            mode="inline"
            context={contextLabel}
            onDone={onMethodCreated}
          />
        ) : null}
      </Modal>

      <Modal
        visible={pickingCategory}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPickingCategory(false)}
      >
        {pickingCategory ? (
          <CategoryPicker
            selectedId={draft.categoryId}
            context={contextLabel}
            onDone={(categoryId) => {
              setPickingCategory(false);
              if (categoryId) update({ categoryId });
            }}
          />
        ) : null}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 34 },
  categoryLabel: { flex: 1, fontSize: 16, fontWeight: '600' },
  categoryValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    paddingVertical: 6,
    paddingLeft: 8,
    paddingRight: 10,
  },
  categoryName: { fontSize: 15, fontWeight: '700' },
  chev: { fontSize: 20, fontWeight: '600' },
});
