/**
 * Dinero como enteros en centavos (MXN). Nunca se usa `float` para montos.
 */

export type Cents = number;

export type MoneyParseError = 'empty' | 'invalid' | 'too_many_decimals';

export type MoneyParseResult = { ok: true; cents: Cents } | { ok: false; error: MoneyParseError };

// Parte entera: dígitos sueltos (1500) o agrupados por miles con coma (1,500 / 12,345,678).
const INTEGER = /^(\d+|\d{1,3}(,\d{3})+)$/;

/**
 * Convierte el texto capturado por el usuario a centavos, sin pasar por números de punto flotante.
 * Acepta `1500`, `1,500.50`, `1500.5`, `$ 219`, `.5`. Rechaza más de dos decimales.
 * No valida el signo ni que sea mayor que cero: eso lo hacen los validadores de cada entidad.
 */
export function parseMoneyToCents(text: string): MoneyParseResult {
  const cleaned = text
    .trim()
    .replace(/^\$\s*/, '')
    .replace(/\s+/g, '');
  if (cleaned === '') return { ok: false, error: 'empty' };

  const [intPart, decPart, ...rest] = cleaned.split('.');
  if (rest.length > 0) return { ok: false, error: 'invalid' };
  if (intPart === '' && (decPart === undefined || decPart === ''))
    return { ok: false, error: 'invalid' };
  if (intPart !== '' && !INTEGER.test(intPart)) return { ok: false, error: 'invalid' };
  if (decPart !== undefined && !/^\d*$/.test(decPart)) return { ok: false, error: 'invalid' };
  if (decPart !== undefined && decPart.length > 2) return { ok: false, error: 'too_many_decimals' };

  const pesos = intPart === '' ? 0 : Number(intPart.replace(/,/g, ''));
  const centavos = Number((decPart ?? '').padEnd(2, '0') || '0');
  const cents = pesos * 100 + centavos;
  if (!Number.isSafeInteger(cents)) return { ok: false, error: 'invalid' };
  return { ok: true, cents };
}

/** División entera con redondeo a la mitad hacia arriba (lejos de cero). */
export function divideRoundHalfUp(cents: Cents, divisor: number): Cents {
  if (!Number.isInteger(cents) || !Number.isInteger(divisor) || divisor <= 0) {
    throw new Error('divideRoundHalfUp requiere enteros y un divisor positivo');
  }
  const sign = cents < 0 ? -1 : 1;
  const abs = Math.abs(cents);
  return sign * Math.floor((2 * abs + divisor) / (2 * divisor));
}

export function sumCents(values: readonly Cents[]): Cents {
  return values.reduce((total, v) => total + v, 0);
}

/** Formato manual `$1,500.50`, usado si `Intl` no está disponible. */
export function formatCentsManual(cents: Cents): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  const pesos = Math.floor(abs / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const centavos = String(abs % 100).padStart(2, '0');
  return `${sign}$${pesos}.${centavos}`;
}

let formatter: Intl.NumberFormat | null | undefined;

function getFormatter(): Intl.NumberFormat | null {
  if (formatter === undefined) {
    try {
      formatter = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      // Algunos motores con Intl incompleto formatean sin símbolo o con otro separador.
      if (formatter.format(1500.5) !== '$1,500.50') formatter = null;
    } catch {
      formatter = null;
    }
  }
  return formatter;
}

/** Formato de moneda MXN en es-MX: `$1,500.50`. */
export function formatMXN(cents: Cents): string {
  const f = getFormatter();
  return f ? f.format(cents / 100) : formatCentsManual(cents);
}

/** Separa el monto en parte entera y centavos para mostrarlos con tamaños distintos: [`$1,500`, `.50`]. */
export function formatMXNParts(cents: Cents): [string, string] {
  const text = formatMXN(cents);
  const dot = text.lastIndexOf('.');
  return [text.slice(0, dot), text.slice(dot)];
}
