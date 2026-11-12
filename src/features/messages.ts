/** Textos de los códigos de error que devuelven los validadores del dominio. */
const MESSAGES: Record<string, Record<string, string>> = {
  name: {
    required: 'El nombre es obligatorio',
    duplicate: 'Ya existe una categoría con ese nombre',
    locked: 'Las categorías de inicio no se pueden renombrar',
  },
  icon: { invalid: 'Elige un ícono', locked: 'Este ícono no se puede cambiar' },
  description: { required: 'La descripción es obligatoria' },
  amount: {
    required: 'Captura un monto',
    not_positive: 'El monto debe ser mayor que cero',
    too_many_decimals: 'El monto admite hasta dos decimales',
    invalid: 'Monto inválido',
  },
  interval: { invalid: 'El intervalo debe ser un número entero de 1 o más meses' },
  anchorDate: { required: 'Elige la fecha de cobro', invalid: 'Fecha inválida' },
  date: { required: 'Elige la fecha', invalid: 'Fecha inválida' },
  endDate: {
    before_anchor: 'La fecha de fin no puede ser anterior a la fecha de cobro',
    invalid: 'Fecha inválida',
  },
  paymentMethodId: { required: 'El método de pago es obligatorio' },
  last4: { four_digits: 'Deben ser 4 números' },
  color: { required: 'Elige un color', invalid: 'Color inválido' },
  institutionId: { not_for_payments: 'Esta institución no sirve para pagar gastos' },
  kind: { invalid: 'Tipo inválido' },
  openingBalance: {
    too_many_decimals: 'El saldo admite hasta dos decimales',
    invalid: 'Saldo inválido',
    date_required: 'Falta la fecha del saldo inicial',
  },
  creditLimit: {
    not_positive: 'El límite debe ser mayor que cero',
    too_many_decimals: 'El límite admite hasta dos decimales',
    invalid: 'Límite inválido',
  },
  paymentDueDay: { invalid: 'El día debe estar entre 1 y 31' },
  digitalLast4: { four_digits: 'Deben ser 4 números' },
};

export function errorMessage(field: string, code: string | undefined): string | undefined {
  if (!code) return undefined;
  return MESSAGES[field]?.[code] ?? 'Valor inválido';
}

export const LAST_ACTIVE_MESSAGE =
  'Debe existir al menos un método activo. Agrega otro antes de archivar o eliminar este.';
