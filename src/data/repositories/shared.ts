import { validateCategoryInput, type Category, type CategoryInput } from '@/domain/category';
import type { MethodRuleResult } from '@/domain/paymentMethod';

export class NotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} no encontrado: ${id}`);
    this.name = 'NotFoundError';
  }
}

export class PaymentMethodInUseError extends Error {
  constructor(readonly uses: number) {
    super(`El método de pago está en uso por ${uses} gasto(s); solo se puede archivar.`);
    this.name = 'PaymentMethodInUseError';
  }
}

export class LastActiveMethodError extends Error {
  constructor() {
    super('Debe existir al menos un método de pago activo.');
    this.name = 'LastActiveMethodError';
  }
}

/** Una regla de categorías impide el cambio (nombre vacío o repetido, categoría fija, etc.). */
export class CategoryRuleError extends Error {
  constructor(readonly errors: Partial<Record<'name' | 'icon' | 'category', string>>) {
    super(`Cambio de categoría no permitido: ${JSON.stringify(errors)}`);
    this.name = 'CategoryRuleError';
  }
}

/** Valida contra las reglas del dominio y lanza `CategoryRuleError` si no pasan. */
export function assertCategoryInput(
  input: CategoryInput,
  all: readonly Category[],
  current: Category | null,
): CategoryInput {
  const r = validateCategoryInput(input, all, current);
  if (!r.ok) throw new CategoryRuleError(r.errors);
  return r.value;
}

/** Convierte el resultado de una regla de dominio en el error correspondiente. */
export function assertRule(result: MethodRuleResult, id: string): void {
  if (result.ok) return;
  if (result.reason === 'in_use') throw new PaymentMethodInUseError(result.uses);
  if (result.reason === 'last_active') throw new LastActiveMethodError();
  throw new NotFoundError('Método de pago', id);
}

/**
 * Marca de tiempo estrictamente posterior a `previous`, para que `updatedAt` siempre avance aunque
 * dos cambios caigan en el mismo milisegundo.
 */
export function nextTimestamp(now: string, previous?: string): string {
  if (!previous || now > previous) return now;
  return new Date(new Date(previous).getTime() + 1).toISOString();
}

/** Emisor mínimo de cambios para `subscribe`. */
export class ChangeEmitter {
  private listeners = new Set<() => void>();

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(): void {
    for (const l of [...this.listeners]) l();
  }
}

export const defaultNow = (): string => new Date().toISOString();
