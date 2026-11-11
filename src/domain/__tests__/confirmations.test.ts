import { isPending, pendingConfirmations, validateConfirmation } from '../confirmations';
import type { RecurringExpense } from '../recurringExpense';

const registeredOn = (iso: string) => iso.slice(0, 10);

const rec = (over: Partial<RecurringExpense> = {}): RecurringExpense => ({
  id: 'netflix',
  name: 'Netflix',
  amountCents: 21900,
  intervalUnit: 'month',
  intervalCount: 1,
  anchorDate: '2026-01-15',
  endDate: null,
  paymentMethodId: 'bbva',
  cardVariant: null,
  createdAt: '2026-11-01T12:00:00Z',
  updatedAt: '2026-11-01T12:00:00Z',
  deletedAt: null,
  ...over,
});

const confirmation = (occurrenceDate: string, deletedAt: string | null = null) => ({
  recurringExpenseId: 'netflix',
  occurrenceDate,
  deletedAt,
});

describe('pendingConfirmations', () => {
  it('pregunta por el cobro vencido desde el registro', () => {
    expect(
      pendingConfirmations([rec()], [], '2026-11-16', registeredOn).map((p) => p.date),
    ).toEqual(['2026-11-15']);
  });

  it('nada antes del registro, aunque el ancla sea anterior', () => {
    const r = rec({ createdAt: '2026-11-11T12:00:00Z' });
    expect(pendingConfirmations([r], [], '2026-11-11', registeredOn)).toEqual([]);
    expect(pendingConfirmations([r], [], '2026-11-15', registeredOn).map((p) => p.date)).toEqual([
      '2026-11-15',
    ]);
  });

  it('acumula varios meses sin abrir la app y excluye los ya respondidos', () => {
    const p = pendingConfirmations(
      [rec()],
      [confirmation('2026-12-15')],
      '2027-01-20',
      registeredOn,
    );
    expect(p.map((x) => x.date)).toEqual(['2026-11-15', '2027-01-15']);
  });

  it('una confirmación eliminada vuelve a dejarlo pendiente', () => {
    expect(
      pendingConfirmations(
        [rec()],
        [confirmation('2026-11-15', '2026-11-20')],
        '2026-11-20',
        registeredOn,
      ),
    ).toHaveLength(1);
  });

  it('ignora gastos eliminados, cobros futuros y respeta intervalos', () => {
    expect(
      pendingConfirmations([rec({ deletedAt: '2026-11-10' })], [], '2026-11-20', registeredOn),
    ).toEqual([]);
    expect(pendingConfirmations([rec()], [], '2026-11-14', registeredOn)).toEqual([]);
    const bim = rec({
      id: 'internet',
      name: 'Internet',
      intervalCount: 2,
      anchorDate: '2026-09-28',
    });
    expect(pendingConfirmations([bim], [], '2027-01-30', registeredOn).map((p) => p.date)).toEqual([
      '2026-11-28',
      '2027-01-28',
    ]);
  });

  it('usa el día local de registro inyectado', () => {
    // Registrado el 15 nov a las 20:00 en México = 16 nov 02:00 UTC: el cobro del 15 sí cuenta.
    const r = rec({ createdAt: '2026-11-16T02:00:00Z' });
    expect(
      pendingConfirmations([r], [], '2026-11-16', () => '2026-11-15').map((p) => p.date),
    ).toEqual(['2026-11-15']);
  });

  it('isPending identifica un cobro concreto', () => {
    const p = pendingConfirmations([rec()], [], '2026-11-16', registeredOn);
    expect(isPending(p, 'netflix', '2026-11-15')).toBe(true);
    expect(isPending(p, 'netflix', '2026-12-15')).toBe(false);
  });
});

describe('validateConfirmation', () => {
  const charge = { expense: rec(), date: '2026-11-15' };

  it('confirmar con otro monto', () => {
    expect(validateConfirmation({ status: 'charged', amountText: '249' }, charge)).toEqual({
      ok: true,
      value: {
        recurringExpenseId: 'netflix',
        occurrenceDate: '2026-11-15',
        paymentMethodId: 'bbva',
        status: 'charged',
        amountCents: 24900,
      },
    });
  });

  it('descartar no lleva monto', () => {
    const r = validateConfirmation({ status: 'skipped' }, charge);
    expect(r.ok && r.value).toMatchObject({ status: 'skipped', amountCents: null });
  });

  it('confirmar exige un monto positivo', () => {
    expect(validateConfirmation({ status: 'charged', amountText: '0' }, charge)).toEqual({
      ok: false,
      errors: { amount: 'not_positive' },
    });
    expect(validateConfirmation({ status: 'charged', amountText: '' }, charge)).toEqual({
      ok: false,
      errors: { amount: 'required' },
    });
  });
});
