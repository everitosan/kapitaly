import { duotoneFromBase, type Duotone, type Hex } from './color';
import type { PaletteColorKey, PaymentMethod } from './paymentMethod';

export type InstitutionKind = 'bank' | 'fintech' | 'investment';

/** Para qué sirve una institución: pagar gastos, recibir ingresos o invertir. */
export type InstitutionUse = 'pay' | 'receive' | 'invest';

/** Entrada del catálogo compartido de la suite. Es de solo lectura para el usuario. */
export interface Institution {
  /** Estable y legible (`'nu-mx'`); nunca se reutiliza. */
  id: string;
  name: string;
  kind: InstitutionKind;
  uses: readonly InstitutionUse[];
  baseColor: Hex;
  /** 1 o 2 letras que se muestran mientras no haya logo. */
  monogram: string;
  /** Clave de un recurso de logo; vacío en la v1. */
  logo?: string;
  /** Retirada del catálogo: se sigue resolviendo, pero no se ofrece para métodos nuevos. */
  retired?: boolean;
}

export interface InstitutionCatalog {
  version: number;
  institutions: readonly Institution[];
}

/** Instituciones vigentes que sirven para un uso, ordenadas por nombre. */
export function institutionsFor(catalog: InstitutionCatalog, use: InstitutionUse): Institution[] {
  return catalog.institutions
    .filter((i) => !i.retired && i.uses.includes(use))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

/** Busca una institución por id, incluidas las retiradas (para mostrar métodos existentes). */
export function resolveInstitution(
  catalog: InstitutionCatalog,
  id: string | null,
): Institution | null {
  if (!id) return null;
  return catalog.institutions.find((i) => i.id === id) ?? null;
}

export const isPayInstitution = (catalog: InstitutionCatalog, id: string): boolean =>
  institutionsFor(catalog, 'pay').some((i) => i.id === id);

/** Color con el que se pinta un método: override de paleta, duotono de su institución o tinta por defecto. */
export type EffectiveColor =
  | { kind: 'palette'; key: PaletteColorKey }
  | { kind: 'brand'; institutionId: string; duotone: Duotone };

export function effectiveColor(
  method: Pick<PaymentMethod, 'color' | 'institutionId'>,
  catalog: InstitutionCatalog,
): EffectiveColor {
  if (method.color) return { kind: 'palette', key: method.color };
  const institution = resolveInstitution(catalog, method.institutionId);
  if (institution)
    return {
      kind: 'brand',
      institutionId: institution.id,
      duotone: duotoneFromBase(institution.baseColor),
    };
  return { kind: 'palette', key: 'ink' };
}
