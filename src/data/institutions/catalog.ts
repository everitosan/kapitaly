import type { InstitutionCatalog } from '@/domain/institution';

/**
 * Catálogo de instituciones financieras de la suite Kapitaly (v1: incluido en la app).
 * En la v2 vendrá de PocketBase y este archivo quedará como respaldo sin conexión.
 *
 * Reglas: los ids no cambian ni se reutilizan; una institución que sale del catálogo se marca
 * `retired: true` en lugar de borrarse. Cualquier cambio sube `version`.
 *
 * Usos confirmados con el usuario: Invex solo tarjeta de crédito; Dinn recibe e invierte; Kubo y
 * Finsus con tarjeta de débito; Bitso sin tarjeta desde 2025. PENDIENTE: los colores de marca son
 * aproximados y deben validarse.
 */
export const INSTITUTION_CATALOG: InstitutionCatalog = {
  version: 1,
  institutions: [
    {
      id: 'bbva-mx',
      name: 'BBVA',
      kind: 'bank',
      uses: ['pay', 'receive', 'invest'],
      baseColor: '#004481',
      monogram: 'BB',
    },
    {
      id: 'santander-mx',
      name: 'Santander',
      kind: 'bank',
      uses: ['pay', 'receive', 'invest'],
      baseColor: '#EC0000',
      monogram: 'S',
    },
    {
      id: 'banamex-mx',
      name: 'Banamex',
      kind: 'bank',
      uses: ['pay', 'receive', 'invest'],
      baseColor: '#056DAE',
      monogram: 'B',
    },
    {
      id: 'nu-mx',
      name: 'Nu',
      kind: 'fintech',
      uses: ['pay', 'receive', 'invest'],
      baseColor: '#820AD1',
      monogram: 'Nu',
    },
    {
      id: 'mercadopago-mx',
      name: 'Mercado Pago',
      kind: 'fintech',
      uses: ['pay', 'receive', 'invest'],
      baseColor: '#00B1EA',
      monogram: 'MP',
    },
    {
      id: 'klar-mx',
      name: 'Klar',
      kind: 'fintech',
      uses: ['pay', 'receive', 'invest'],
      baseColor: '#1A1A1A',
      monogram: 'K',
    },
    {
      id: 'stori-mx',
      name: 'Stori',
      kind: 'fintech',
      uses: ['pay', 'receive', 'invest'],
      baseColor: '#00A88E',
      monogram: 'St',
    },
    {
      id: 'openbank-mx',
      name: 'Openbank',
      kind: 'bank',
      uses: ['pay', 'receive', 'invest'],
      baseColor: '#E4002B',
      monogram: 'O',
    },
    {
      id: 'mifel-mx',
      name: 'Mifel',
      kind: 'bank',
      uses: ['pay', 'receive', 'invest'],
      baseColor: '#00594F',
      monogram: 'Mi',
    },
    {
      id: 'invex-mx',
      name: 'Invex',
      kind: 'bank',
      uses: ['pay'], // solo tarjeta de crédito
      baseColor: '#E30613',
      monogram: 'I',
    },
    {
      id: 'cetes-mx',
      name: 'Cetesdirecto',
      kind: 'investment',
      uses: ['receive', 'invest'],
      baseColor: '#0B5E3C',
      monogram: 'C',
    },
    {
      id: 'dinn-mx',
      name: 'Dinn',
      kind: 'investment',
      uses: ['receive', 'invest'],
      baseColor: '#5B2EFF',
      monogram: 'D',
    },
    {
      id: 'kubo-mx',
      name: 'Kubo',
      kind: 'investment',
      uses: ['pay', 'receive', 'invest'],
      baseColor: '#00B2A9',
      monogram: 'Ku',
    },
    {
      id: 'bitso-mx',
      name: 'Bitso',
      kind: 'investment',
      // Su tarjeta (Bitso Card) se desactivó el 26/05/2025: hoy no sirve para pagar gastos.
      uses: ['receive', 'invest'],
      baseColor: '#1AC37F',
      monogram: 'Bi',
    },
    {
      id: 'finsus-mx',
      name: 'Finsus',
      kind: 'investment',
      uses: ['pay', 'receive', 'invest'],
      baseColor: '#2D2A7B',
      monogram: 'F',
    },
  ],
};
