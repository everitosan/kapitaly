import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { INSTITUTION_CATALOG } from '@/data/institutions/catalog';
import { usedCents } from '@/domain/creditCard';
import { civilDateFromLocal } from '@/domain/date';
import { formatMXN } from '@/domain/money';
import { LastActiveMethodError, PaymentMethodInUseError } from '@/data/repositories/shared';
import { institutionsFor, isPayInstitution, resolveInstitution } from '@/domain/institution';
import {
  canArchive,
  canRemove,
  countMethodUses,
  PALETTE_COLOR_KEYS,
  PAYMENT_METHOD_KINDS,
  supportsDigital,
  validatePaymentMethodInput,
  type PaletteColorKey,
  type PaymentMethod,
  type PaymentMethodField,
  type PaymentMethodKind,
} from '@/domain/paymentMethod';
import {
  Chip,
  DangerButton,
  Field,
  FieldRow,
  PrimaryButton,
  SecondaryButton,
  Switch,
  TextField,
} from '@/ui/components/basics';
import { DuotoneBlock } from '@/ui/components/DuotoneBlock';
import { InstitutionPicker, KIND_LABELS, MethodCard } from '@/ui/components/forms';
import { SheetLayout } from '@/ui/components/layout';
import { formatShortDate } from '@/ui/format';
import { methodGradient } from '@/ui/methodColor';
import { PALETTE_NAMES } from '@/ui/theme';
import { useTheme } from '@/ui/ThemeProvider';

import { errorMessage, LAST_ACTIVE_MESSAGE } from '../messages';
import {
  useCardPayments,
  useChargeConfirmations,
  useOneOffExpenses,
  usePaymentMethods,
  useRecurringExpenses,
  useRepositories,
} from '../repositories';
import { CardPaymentSheet } from './CardPaymentSheet';

export interface PaymentMethodFormProps {
  /** Método a editar; `null` para alta. */
  method: PaymentMethod | null;
  /** `inline`: alta desde el formulario de gasto ("+ Nuevo"). */
  mode?: 'edit' | 'new' | 'inline';
  /** Resumen del gasto en curso (solo en modo `inline`). */
  context?: string;
  onDone: (saved?: PaymentMethod) => void;
}

interface FormState {
  name: string;
  kind: PaymentMethodKind;
  institutionId: string | null;
  last4: string;
  color: PaletteColorKey | null;
  /** El nombre actual lo propuso la app a partir de la institución. */
  autoName: boolean;
  /** Tarjeta de crédito */
  openingText: string;
  limitText: string;
  dueDay: number | null;
  /** Tarjeta digital (crédito o débito) */
  hasDigital: boolean;
  digitalLast4: string;
}

const centsText = (c: number | null) => (c === null ? '' : (c / 100).toFixed(2));

const initialState = (m: PaymentMethod | null): FormState =>
  m
    ? {
        name: m.name,
        kind: m.kind,
        institutionId: m.institutionId,
        last4: m.last4 ?? '',
        color: m.color,
        autoName: false,
        openingText: centsText(m.openingBalanceCents),
        limitText: centsText(m.creditLimitCents),
        dueDay: m.paymentDueDay,
        hasDigital: m.hasDigital,
        digitalLast4: m.digitalLast4 ?? '',
      }
    : {
        name: '',
        kind: 'debit',
        institutionId: null,
        last4: '',
        color: 'cobalt',
        autoName: true,
        openingText: '',
        limitText: '',
        dueDay: null,
        hasDigital: false,
        digitalLast4: '',
      };

const isPay = (id: string) => isPayInstitution(INSTITUTION_CATALOG, id);

export function PaymentMethodForm({
  method,
  mode = method ? 'edit' : 'new',
  context,
  onDone,
}: PaymentMethodFormProps) {
  const theme = useTheme();
  const { colors } = theme;
  const repos = useRepositories();
  const methods = usePaymentMethods();
  const recurring = useRecurringExpenses();
  const oneOffs = useOneOffExpenses();
  const payments = useCardPayments();
  const confirmations = useChargeConfirmations();
  const [payOpen, setPayOpen] = useState(false);
  const [showLimit, setShowLimit] = useState(false);
  const [state, setState] = useState<FormState>(() => initialState(method));
  const [errors, setErrors] = useState<Partial<Record<PaymentMethodField, string>>>({});
  const [saving, setSaving] = useState(false);

  const isCash = state.kind === 'cash';
  const institution = resolveInstitution(INSTITUTION_CATALOG, isCash ? null : state.institutionId);
  const payInstitutions = useMemo(() => institutionsFor(INSTITUTION_CATALOG, 'pay'), []);
  const preview = {
    id: method?.id,
    name: state.name.trim() || institution?.name || '',
    kind: state.kind,
    last4: isCash ? null : state.last4.trim() || null,
    institutionId: institution?.id ?? null,
    color: state.color,
    archivedAt: method?.archivedAt ?? null,
  };

  const update = (patch: Partial<FormState>) => setState((s) => ({ ...s, ...patch }));

  const selectInstitution = (id: string | null) => {
    setState((s) => {
      const next = resolveInstitution(INSTITUTION_CATALOG, id);
      const proposeName = s.name.trim() === '' || s.autoName;
      return {
        ...s,
        institutionId: id,
        name: proposeName ? (next?.name ?? '') : s.name,
        autoName: proposeName && next !== null,
        // Sin institución, el color de la paleta es obligatorio.
        color: id === null && s.color === null ? 'cobalt' : s.color,
      };
    });
  };

  const selectKind = (kind: PaymentMethodKind) =>
    setState((s) => ({
      ...s,
      kind,
      color: kind === 'cash' && s.color === null ? 'mint' : s.color,
    }));

  const save = async () => {
    const result = validatePaymentMethodInput(
      {
        name: state.name,
        kind: state.kind,
        institutionId: state.institutionId,
        last4: state.last4,
        color: state.color,
        openingBalanceText: state.openingText,
        openingBalanceDate: method?.openingBalanceDate ?? null,
        creditLimitText: state.limitText,
        paymentDueDay: state.dueDay,
        hasDigital: state.hasDigital,
        digitalLast4: state.digitalLast4,
      },
      { isPayInstitution: isPay, today: civilDateFromLocal(new Date()) },
    );
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const saved = method
        ? await repos.paymentMethods.update(method.id, result.value)
        : await repos.paymentMethods.create(result.value);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onDone(saved);
    } finally {
      setSaving(false);
    }
  };

  // Reglas de archivado y eliminación (solo en edición).
  const refs = [...recurring.data, ...oneOffs.data];
  const uses = method ? countMethodUses(method.id, refs) : 0;
  const removeRule = method ? canRemove(method.id, methods.data, refs) : null;
  const archiveRule = method ? canArchive(method.id, methods.data) : null;
  const isArchived = method?.archivedAt != null;

  const confirmRemove = () => {
    if (!method) return;
    Alert.alert(
      `¿Eliminar "${method.name}"?`,
      'Ningún gasto lo usa. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar método',
          style: 'destructive',
          onPress: async () => {
            try {
              await repos.paymentMethods.remove(method.id);
              onDone();
            } catch (e) {
              if (e instanceof PaymentMethodInUseError || e instanceof LastActiveMethodError)
                Alert.alert(e.message);
              else throw e;
            }
          },
        },
      ],
    );
  };

  const offerArchive = () => {
    if (!method) return;
    Alert.alert(
      `"${method.name}" está en uso`,
      `Lo usan ${uses} ${uses === 1 ? 'gasto' : 'gastos'}. Puedes archivarlo para que no se ofrezca en gastos nuevos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Archivar método', onPress: archive },
      ],
    );
  };

  const archive = async () => {
    if (!method) return;
    try {
      await repos.paymentMethods.archive(method.id);
      onDone();
    } catch (e) {
      if (e instanceof LastActiveMethodError) Alert.alert(LAST_ACTIVE_MESSAGE);
      else throw e;
    }
  };

  const unarchive = async () => {
    if (!method) return;
    await repos.paymentMethods.unarchive(method.id);
    onDone();
  };

  const today = civilDateFromLocal(new Date());
  const cardPayments = method
    ? payments.data
        .filter((p) => p.paymentMethodId === method.id)
        .sort((a, b) => b.date.localeCompare(a.date))
    : [];
  const used =
    method && method.kind === 'credit'
      ? usedCents(method, oneOffs.data, confirmations.data, payments.data)
      : 0;

  const confirmRemovePayment = (id: string, amount: number) => {
    Alert.alert(
      `¿Eliminar el pago de ${formatMXN(amount)}?`,
      'Dejará de restarse de lo usado de la tarjeta.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar pago',
          style: 'destructive',
          onPress: () => repos.cardPayments.remove(id),
        },
      ],
    );
  };

  const title = mode === 'edit' ? 'Editar método' : 'Nuevo método';
  const lastActive = removeRule?.ok === false && removeRule.reason === 'last_active';
  const inUse = removeRule?.ok === false && removeRule.reason === 'in_use';

  return (
    <>
      <SheetLayout
        title={title}
        leftLabel={mode === 'inline' ? '‹ Gasto' : 'Cancelar'}
        onLeft={() => onDone()}
        footer={
          <PrimaryButton
            label={mode === 'inline' ? 'Guardar y usar' : 'Guardar'}
            onPress={save}
            disabled={saving}
            testID="save-method"
          />
        }
      >
        {context ? (
          <View style={[styles.ctx, { backgroundColor: colors.card }]}>
            <Text style={[styles.ctxText, { color: colors.muted }]}>Para el gasto</Text>
            <Text style={[styles.ctxText, { color: colors.ink }]}>{context}</Text>
          </View>
        ) : null}

        <MethodCard method={preview} big />

        <Field label="Tipo">
          <View style={styles.chips}>
            {PAYMENT_METHOD_KINDS.map((k) => (
              <Chip
                key={k}
                label={KIND_LABELS[k]}
                selected={state.kind === k}
                onPress={() => selectKind(k)}
                background={state.kind === k ? colors.ink : colors.bg}
                color={state.kind === k ? colors.bg : colors.ink}
              />
            ))}
          </View>
        </Field>

        {isCash ? null : (
          <InstitutionPicker
            institutions={payInstitutions}
            selectedId={state.institutionId}
            onSelect={selectInstitution}
          />
        )}

        <TextField
          label="Nombre"
          value={state.name}
          onChangeText={(name) => update({ name, autoName: false })}
          placeholder={institution?.name ?? 'Nombre del método'}
          error={errorMessage('name', errors.name)}
          testID="method-name"
        />

        {isCash ? null : (
          <TextField
            label="Últimos 4 dígitos · opcional"
            value={state.last4}
            onChangeText={(last4) => update({ last4 })}
            keyboardType="number-pad"
            maxLength={4}
            error={errorMessage('last4', errors.last4)}
            testID="method-last4"
          />
        )}

        {state.kind === 'credit' ? (
          <>
            <TextField
              label={`Saldo inicial · al ${formatShortDate(method?.openingBalanceDate ?? today)}`}
              value={state.openingText}
              onChangeText={(openingText) => update({ openingText })}
              placeholder="0.00"
              keyboardType="decimal-pad"
              error={errorMessage('openingBalance', errors.openingBalance)}
              testID="opening-balance"
            />
            <TextField
              label="Límite de crédito · opcional"
              value={state.limitText}
              onChangeText={(limitText) => update({ limitText })}
              keyboardType="decimal-pad"
              secure={!showLimit}
              error={errorMessage('creditLimit', errors.creditLimit)}
              testID="credit-limit"
              right={
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setShowLimit((v) => !v)}
                  hitSlop={8}
                >
                  <Text style={[styles.reveal, { color: colors.muted }]}>
                    {showLimit ? 'Ocultar' : 'Mostrar'}
                  </Text>
                </Pressable>
              }
            />
            <Field error={errorMessage('paymentDueDay', errors.paymentDueDay)}>
              <FieldRow label="Día de pago">
                <View style={[styles.stepper, { backgroundColor: colors.bg }]}>
                  <Pressable
                    accessibilityLabel="Día anterior"
                    onPress={() =>
                      update({
                        dueDay:
                          state.dueDay === null || state.dueDay <= 1 ? null : state.dueDay - 1,
                      })
                    }
                    style={[styles.stepBtn, { backgroundColor: colors.card }]}
                  >
                    <Text style={[styles.stepText, { color: colors.ink }]}>–</Text>
                  </Pressable>
                  <Text testID="due-day" style={[styles.stepValue, { color: colors.ink }]}>
                    {state.dueDay ?? 'Sin día'}
                  </Text>
                  <Pressable
                    accessibilityLabel="Día siguiente"
                    onPress={() => update({ dueDay: Math.min(31, (state.dueDay ?? 0) + 1) })}
                    style={[styles.stepBtn, { backgroundColor: colors.card }]}
                  >
                    <Text style={[styles.stepText, { color: colors.ink }]}>+</Text>
                  </Pressable>
                </View>
              </FieldRow>
            </Field>
          </>
        ) : null}

        {supportsDigital(state.kind) ? (
          <Field error={errorMessage('digitalLast4', errors.digitalLast4)}>
            <FieldRow label="Tiene tarjeta digital">
              <Switch
                label="Tiene tarjeta digital"
                value={state.hasDigital}
                onValueChange={(hasDigital) => update({ hasDigital })}
                testID="has-digital"
              />
            </FieldRow>
            {state.hasDigital ? (
              <>
                <TextInputRow
                  label="Últimos 4 dígitos de la digital · opcional"
                  value={state.digitalLast4}
                  onChangeText={(digitalLast4) => update({ digitalLast4 })}
                />
                <Text style={[styles.hintText, { color: colors.muted }]}>
                  Misma cuenta y mismo saldo que la física.
                </Text>
              </>
            ) : null}
          </Field>
        ) : null}

        <Field
          label={`Color · ${state.color ? PALETTE_NAMES[state.color] : 'de la institución'}`}
          error={errorMessage('color', errors.color)}
        >
          {institution ? (
            <Pressable
              testID="color-institution"
              accessibilityRole="button"
              accessibilityState={{ selected: state.color === null }}
              onPress={() => update({ color: null })}
              style={[
                styles.instColor,
                {
                  backgroundColor: colors.bg,
                  borderColor: state.color === null ? colors.ink : 'transparent',
                },
              ]}
            >
              <DuotoneBlock
                gradient={methodGradient({ color: null, institutionId: institution.id }, theme)}
                radius={18}
                style={styles.instSwatch}
              />
              <View>
                <Text
                  style={[styles.instColorTitle, { color: colors.ink }]}
                >{`Usar el color de ${institution.name}`}</Text>
                <Text style={[styles.instColorSub, { color: colors.muted }]}>
                  Base de la institución, en duotono
                </Text>
              </View>
            </Pressable>
          ) : null}
          <View style={styles.swatches}>
            {PALETTE_COLOR_KEYS.map((key) => (
              <Pressable
                key={key}
                testID={`color-${key}`}
                accessibilityRole="button"
                accessibilityLabel={PALETTE_NAMES[key]}
                accessibilityState={{ selected: state.color === key }}
                onPress={() => update({ color: key })}
                style={[
                  styles.swatchRing,
                  { borderColor: state.color === key ? colors.ink : 'transparent' },
                ]}
              >
                <DuotoneBlock gradient={theme.palette[key]} radius={999} style={styles.swatch} />
              </Pressable>
            ))}
          </View>
        </Field>

        {mode === 'edit' && method && method.kind === 'credit' ? (
          <>
            <PrimaryButton
              label="Pagar tarjeta"
              onPress={() => setPayOpen(true)}
              testID="pay-card"
            />
            <Field label="Pagos registrados">
              {cardPayments.length === 0 ? (
                <Text style={[styles.hintText, { color: colors.muted }]}>Sin pagos todavía.</Text>
              ) : (
                cardPayments.map((p) => (
                  <View key={p.id} style={[styles.payRow, { borderColor: colors.line }]}>
                    <View>
                      <Text style={[styles.payAmount, { color: colors.ink }]}>
                        {formatMXN(p.amountCents)}
                      </Text>
                      <Text style={[styles.hintText, { color: colors.muted }]}>
                        {formatShortDate(p.date)}
                        {p.forDueDate ? ` · cubre el ${formatShortDate(p.forDueDate)}` : ''}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Eliminar pago de ${formatMXN(p.amountCents)}`}
                      onPress={() => confirmRemovePayment(p.id, p.amountCents)}
                    >
                      <Text style={[styles.payDelete, { color: colors.danger }]}>Eliminar</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </Field>
          </>
        ) : null}

        {mode === 'edit' && method ? (
          <>
            {inUse ? (
              <Notice>{`Lo usan ${uses} ${uses === 1 ? 'gasto' : 'gastos'}, así que no se puede eliminar. Si lo archivas, dejará de ofrecerse en gastos nuevos y los existentes lo conservan.`}</Notice>
            ) : null}
            {lastActive && !isArchived ? <Notice>{LAST_ACTIVE_MESSAGE}</Notice> : null}
            <View style={styles.actions}>
              {isArchived ? (
                <SecondaryButton label="Reactivar" onPress={unarchive} style={styles.action} />
              ) : (
                <SecondaryButton
                  label="Archivar"
                  onPress={archive}
                  disabled={archiveRule?.ok === false}
                  style={styles.action}
                />
              )}
              <DangerButton
                label="Eliminar"
                onPress={inUse ? offerArchive : confirmRemove}
                disabled={lastActive}
                style={styles.action}
              />
            </View>
          </>
        ) : null}
      </SheetLayout>
      <Modal
        visible={payOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPayOpen(false)}
      >
        {payOpen && method ? (
          <CardPaymentSheet method={method} usedCents={used} onDone={() => setPayOpen(false)} />
        ) : null}
      </Modal>
    </>
  );
}

function TextInputRow({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.subField}>
      <Text style={[styles.subLabel, { color: colors.muted }]}>{label}</Text>
      <TextInput
        testID="digital-last4"
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        keyboardType="number-pad"
        maxLength={4}
        style={[styles.subInput, { color: colors.ink }]}
      />
    </View>
  );
}

function Notice({ children }: { children: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.notice, { backgroundColor: colors.card }]}>
      <View style={[styles.noticeIcon, { backgroundColor: colors.ink }]}>
        <Text style={{ color: colors.bg, fontWeight: '800', fontSize: 13 }}>i</Text>
      </View>
      <Text style={[styles.noticeText, { color: colors.muted }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ctx: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  ctxText: { fontSize: 13, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  instColor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 8,
    borderRadius: 16,
    borderWidth: 2,
    marginTop: 10,
  },
  instSwatch: { width: 36, height: 36 },
  instColorTitle: { fontSize: 14, fontWeight: '700' },
  instColorSub: { fontSize: 12, fontWeight: '600' },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  swatchRing: { borderWidth: 3, borderRadius: 999, padding: 3 },
  swatch: { width: 40, height: 40 },
  notice: { flexDirection: 'row', gap: 10, borderRadius: 16, padding: 14 },
  noticeIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeText: { flex: 1, fontSize: 14, fontWeight: '600', lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 10 },
  reveal: { fontSize: 13, fontWeight: '700' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, padding: 3 },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontSize: 18, fontWeight: '800' },
  stepValue: { minWidth: 56, textAlign: 'center', fontWeight: '800', fontSize: 15 },
  hintText: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  subField: { marginTop: 10 },
  subLabel: { fontSize: 12, fontWeight: '700' },
  subInput: { fontSize: 17, fontWeight: '600', paddingVertical: 4 },
  payRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  payAmount: { fontSize: 16, fontWeight: '800' },
  payDelete: { fontSize: 14, fontWeight: '700' },
  action: { flex: 1 },
});
