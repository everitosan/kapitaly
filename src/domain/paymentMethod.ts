import { isDeleted, type SyncMeta, type Validation } from './common';
import { isValidCivilDate, type CivilDate } from './date';
import { parseMoneyToCents, type Cents } from './money';

export type PaymentMethodKind = 'credit' | 'debit' | 'cash' | 'transfer';

export const PAYMENT_METHOD_KINDS: readonly PaymentMethodKind[] = [
  'credit',
  'debit',
  'cash',
  'transfer',
];

/** Claves de la paleta de la app; cada tema las pinta con sus propios colores. */
export type PaletteColorKey =
  'cobalt' | 'violet' | 'ink' | 'lime' | 'sky' | 'lilac' | 'peach' | 'pink' | 'mint';

export const PALETTE_COLOR_KEYS: readonly PaletteColorKey[] = [
  'cobalt',
  'violet',
  'ink',
  'lime',
  'sky',
  'lilac',
  'peach',
  'pink',
  'mint',
];

export interface PaymentMethod extends SyncMeta {
  name: string;
  kind: PaymentMethodKind;
  /** Id estable del catálogo de instituciones; `null` para efectivo o instituciones fuera del catálogo. */
  institutionId: string | null;
  last4: string | null;
  /** Override de la paleta; `null` = usar el color de la institución. */
  color: PaletteColorKey | null;
  /** Solo crédito: lo usado al inicio del día `openingBalanceDate`. */
  openingBalanceCents: Cents | null;
  openingBalanceDate: CivilDate | null;
  /** Solo crédito: límite de crédito (dato privado; la UI lo oculta). */
  creditLimitCents: Cents | null;
  /** Solo crédito: día del mes de la fecha límite de pago (1–31). */
  paymentDueDay: number | null;
  /** Crédito o débito: tiene versión digital (mismo método y mismo saldo). */
  hasDigital: boolean;
  /** Últimos 4 dígitos de la tarjeta digital (opcional). */
  digitalLast4: string | null;
  archivedAt: string | null;
}

export interface PaymentMethodInput {
  name: string;
  kind: PaymentMethodKind;
  institutionId: string | null;
  last4: string | null;
  color: PaletteColorKey | null;
  /** Solo crédito: lo usado al inicio del día `openingBalanceDate`. */
  openingBalanceCents: Cents | null;
  openingBalanceDate: CivilDate | null;
  /** Solo crédito: límite de crédito (dato privado; la UI lo oculta). */
  creditLimitCents: Cents | null;
  /** Solo crédito: día del mes de la fecha límite de pago (1–31). */
  paymentDueDay: number | null;
  /** Crédito o débito: tiene versión digital (mismo método y mismo saldo). */
  hasDigital: boolean;
  /** Últimos 4 dígitos de la tarjeta digital (opcional). */
  digitalLast4: string | null;
}

/** Id fijo del método inicial "Efectivo": igual en todas las instalaciones, para que el sync no lo duplique. */
export const CASH_METHOD_ID = '00000000-0000-4000-8000-000000000001';

export const INITIAL_CASH_METHOD: PaymentMethodInput = {
  name: 'Efectivo',
  kind: 'cash',
  institutionId: null,
  last4: null,
  color: 'mint',
  openingBalanceCents: null,
  openingBalanceDate: null,
  creditLimitCents: null,
  paymentDueDay: null,
  hasDigital: false,
  digitalLast4: null,
};

/** Datos de tarjeta vacíos, para métodos que no son de crédito. */
export const NO_CARD_DATA = {
  openingBalanceCents: null,
  openingBalanceDate: null,
  creditLimitCents: null,
  paymentDueDay: null,
  hasDigital: false,
  digitalLast4: null,
} as const;

/** Con cuál tarjeta se pagó un gasto, si el método tiene versión digital. */
export type CardVariant = 'physical' | 'digital';

/** Tipos de método que pueden tener versión digital. */
export const supportsDigital = (kind: PaymentMethodKind): boolean =>
  kind === 'credit' || kind === 'debit';

export type PaymentMethodField =
  | 'name'
  | 'kind'
  | 'institutionId'
  | 'last4'
  | 'color'
  | 'openingBalance'
  | 'creditLimit'
  | 'paymentDueDay'
  | 'digitalLast4';

export interface PaymentMethodDraft {
  name: string;
  kind: PaymentMethodKind;
  institutionId?: string | null;
  last4?: string | null;
  color?: PaletteColorKey | null;
  /** Solo crédito: texto capturado; vacío = $0.00. */
  openingBalanceText?: string;
  /** Solo crédito: fecha del saldo inicial; si falta, se usa `ctx.today`. */
  openingBalanceDate?: CivilDate | null;
  /** Solo crédito: texto capturado; vacío = sin límite registrado. */
  creditLimitText?: string;
  /** Solo crédito: día de pago; `null` = sin día registrado. */
  paymentDueDay?: number | null;
  /** Crédito o débito: tiene versión digital. */
  hasDigital?: boolean;
  digitalLast4?: string | null;
}

export interface PaymentMethodValidationContext {
  /** Indica si la institución existe y sirve para pagar (uso `pay`). */
  isPayInstitution: (institutionId: string) => boolean;
  /** Fecha de hoy, para el saldo inicial de una tarjeta nueva. */
  today?: CivilDate;
}

/**
 * Valida y normaliza un método de pago.
 * - nombre obligatorio (se recorta);
 * - últimos 4 dígitos opcionales, exactamente 4 números;
 * - el efectivo no lleva institución ni dígitos;
 * - sin institución, el color de la paleta es obligatorio.
 */
export function validatePaymentMethodInput(
  draft: PaymentMethodDraft,
  ctx: PaymentMethodValidationContext,
): Validation<PaymentMethodInput, PaymentMethodField> {
  const errors: Partial<Record<PaymentMethodField, string>> = {};
  const name = draft.name.trim();
  if (name === '') errors.name = 'required';
  if (!PAYMENT_METHOD_KINDS.includes(draft.kind)) errors.kind = 'invalid';

  const isCash = draft.kind === 'cash';
  const institutionId = isCash ? null : (draft.institutionId ?? null);
  if (institutionId !== null && !ctx.isPayInstitution(institutionId))
    errors.institutionId = 'not_for_payments';

  const rawLast4 = isCash ? '' : (draft.last4 ?? '').trim();
  if (rawLast4 !== '' && !/^\d{4}$/.test(rawLast4)) errors.last4 = 'four_digits';

  const color = draft.color ?? null;
  if (color !== null && !PALETTE_COLOR_KEYS.includes(color)) errors.color = 'invalid';
  if (color === null && institutionId === null) errors.color = 'required';

  let card: Pick<PaymentMethodInput, keyof typeof NO_CARD_DATA> = { ...NO_CARD_DATA };
  if (draft.kind === 'credit') {
    const balanceText = (draft.openingBalanceText ?? '').trim();
    const balance =
      balanceText === '' ? ({ ok: true, cents: 0 } as const) : parseMoneyToCents(balanceText);
    if (!balance.ok) errors.openingBalance = balance.error;

    const limitText = (draft.creditLimitText ?? '').trim();
    const limit = limitText === '' ? null : parseMoneyToCents(limitText);
    if (limit && !limit.ok) errors.creditLimit = limit.error;
    else if (limit && limit.ok && limit.cents <= 0) errors.creditLimit = 'not_positive';

    const day = draft.paymentDueDay ?? null;
    if (day !== null && (!Number.isInteger(day) || day < 1 || day > 31))
      errors.paymentDueDay = 'invalid';

    const date = draft.openingBalanceDate ?? ctx.today ?? null;
    if (date === null || !isValidCivilDate(date))
      errors.openingBalance = errors.openingBalance ?? 'date_required';

    if (balance.ok && (!limit || limit.ok)) {
      card = {
        ...NO_CARD_DATA,
        openingBalanceCents: balance.cents,
        openingBalanceDate: date,
        creditLimitCents: limit && limit.ok ? limit.cents : null,
        paymentDueDay: day,
      };
    }
  }

  const hasDigital = supportsDigital(draft.kind) && draft.hasDigital === true;
  const rawDigital = hasDigital ? (draft.digitalLast4 ?? '').trim() : '';
  if (rawDigital !== '' && !/^\d{4}$/.test(rawDigital)) errors.digitalLast4 = 'four_digits';

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      name,
      kind: draft.kind,
      institutionId,
      last4: rawLast4 === '' ? null : rawLast4,
      color,
      ...card,
      hasDigital,
      digitalLast4: rawDigital === '' ? null : rawDigital,
    },
  };
}

export const isActiveMethod = (m: PaymentMethod): boolean => m.archivedAt === null && !isDeleted(m);

/** Lo mínimo de un gasto que necesitan las reglas de métodos. */
export interface ExpenseRef {
  paymentMethodId: string;
  createdAt: string;
  deletedAt: string | null;
}

/** Cuántos gastos vigentes (recurrentes y únicos) usan el método. */
export function countMethodUses(methodId: string, expenses: readonly ExpenseRef[]): number {
  return expenses.filter((e) => e.paymentMethodId === methodId && !isDeleted(e)).length;
}

export type MethodRuleResult =
  | { ok: true }
  | { ok: false; reason: 'in_use'; uses: number }
  | { ok: false; reason: 'last_active' }
  | { ok: false; reason: 'not_found' };

function isLastActive(methodId: string, methods: readonly PaymentMethod[]): boolean {
  const active = methods.filter(isActiveMethod);
  return active.length === 1 && active[0].id === methodId;
}

/** Solo se elimina un método que no usa ningún gasto y que no es el último activo. */
export function canRemove(
  methodId: string,
  methods: readonly PaymentMethod[],
  expenses: readonly ExpenseRef[],
): MethodRuleResult {
  const method = methods.find((m) => m.id === methodId && !isDeleted(m));
  if (!method) return { ok: false, reason: 'not_found' };
  const uses = countMethodUses(methodId, expenses);
  if (uses > 0) return { ok: false, reason: 'in_use', uses };
  if (isLastActive(methodId, methods)) return { ok: false, reason: 'last_active' };
  return { ok: true };
}

/** Archivar se permite aunque el método esté en uso, salvo que sea el último activo. */
export function canArchive(methodId: string, methods: readonly PaymentMethod[]): MethodRuleResult {
  const method = methods.find((m) => m.id === methodId && !isDeleted(m));
  if (!method) return { ok: false, reason: 'not_found' };
  if (isLastActive(methodId, methods)) return { ok: false, reason: 'last_active' };
  return { ok: true };
}

/**
 * Método a preseleccionar en un gasto nuevo: el del gasto vigente registrado más recientemente
 * cuyo método siga activo; si no hay, "Efectivo" si está activo; si no, el primer activo (por alta).
 */
export function suggestPaymentMethod(
  methods: readonly PaymentMethod[],
  expenses: readonly ExpenseRef[],
): string | null {
  const active = new Map(methods.filter(isActiveMethod).map((m) => [m.id, m]));
  const recent = expenses
    .filter((e) => !isDeleted(e) && active.has(e.paymentMethodId))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))[0];
  if (recent) return recent.paymentMethodId;
  if (active.has(CASH_METHOD_ID)) return CASH_METHOD_ID;
  const first = [...active.values()].sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))[0];
  return first?.id ?? null;
}

/** Etiqueta corta: `BBVA Azul ••4521`, o con la digital: `BBVA Azul ••7788 · digital`. */
export function methodLabel(
  m: Pick<PaymentMethod, 'name' | 'last4'> & Partial<Pick<PaymentMethod, 'digitalLast4'>>,
  variant: CardVariant | null = null,
): string {
  if (variant === 'digital')
    return `${m.name}${m.digitalLast4 ? ` ••${m.digitalLast4}` : ''} · digital`;
  return m.last4 ? `${m.name} ••${m.last4}` : m.name;
}

/** Variante a preseleccionar: la del gasto vigente más reciente con ese método, o "Física". */
export function suggestCardVariant(
  methodId: string,
  expenses: readonly (ExpenseRef & { cardVariant: CardVariant | null })[],
): CardVariant {
  const recent = expenses
    .filter((e) => e.paymentMethodId === methodId && !isDeleted(e))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))[0];
  return recent?.cardVariant ?? 'physical';
}
