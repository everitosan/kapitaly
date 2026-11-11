import { INSTITUTION_CATALOG } from '@/data/institutions/catalog';

import { AA_MIN, contrastRatio, duotoneFromBase, meetsAAOnBoth } from '../color';
import {
  effectiveColor,
  institutionsFor,
  isPayInstitution,
  resolveInstitution,
  type InstitutionCatalog,
} from '../institution';

describe('catálogo de instituciones', () => {
  it('incluye las 15 instituciones iniciales con ids únicos', () => {
    const ids = INSTITUTION_CATALOG.institutions.map((i) => i.id);
    expect(ids).toHaveLength(15);
    expect(new Set(ids).size).toBe(15);
    for (const i of INSTITUTION_CATALOG.institutions) {
      expect(i.id).toMatch(/^[a-z0-9]+-mx$/);
      expect(i.uses.length).toBeGreaterThan(0);
      expect(i.monogram.length).toBeGreaterThanOrEqual(1);
      expect(i.monogram.length).toBeLessThanOrEqual(2);
    }
  });

  it('Cetesdirecto no sirve para pagar; Nu sí', () => {
    const pay = institutionsFor(INSTITUTION_CATALOG, 'pay').map((i) => i.id);
    expect(pay).not.toContain('cetes-mx');
    expect(pay).toContain('nu-mx');
    expect(isPayInstitution(INSTITUTION_CATALOG, 'cetes-mx')).toBe(false);
    expect(institutionsFor(INSTITUTION_CATALOG, 'receive').map((i) => i.id)).toContain('cetes-mx');
  });

  it('una institución retirada se resuelve pero no se ofrece', () => {
    const catalog: InstitutionCatalog = {
      version: 2,
      institutions: INSTITUTION_CATALOG.institutions.map((i) =>
        i.id === 'klar-mx' ? { ...i, retired: true } : i,
      ),
    };
    expect(resolveInstitution(catalog, 'klar-mx')?.name).toBe('Klar');
    expect(institutionsFor(catalog, 'pay').map((i) => i.id)).not.toContain('klar-mx');
  });

  it('cada duotono derivado conserva el color de marca y cumple AA en ambos extremos', () => {
    for (const i of INSTITUTION_CATALOG.institutions) {
      const d = duotoneFromBase(i.baseColor);
      expect(d.from).toBe(i.baseColor.toUpperCase());
      expect(contrastRatio(d.text, d.from)).toBeGreaterThanOrEqual(AA_MIN);
      expect(contrastRatio(d.text, d.to)).toBeGreaterThanOrEqual(AA_MIN);
    }
  });

  it('el último recurso oscurece colores intermedios hasta cumplir', () => {
    // Un gris medio no cumple ni con blanco ni con texto oscuro sin ajustes.
    const d = duotoneFromBase('#8A8A8A');
    expect(meetsAAOnBoth(d.text, d.from, d.to)).toBe(true);
  });
});

describe('effectiveColor', () => {
  it('usa el color base de la institución por defecto', () => {
    const c = effectiveColor({ color: null, institutionId: 'santander-mx' }, INSTITUTION_CATALOG);
    expect(c.kind).toBe('brand');
    if (c.kind === 'brand') expect(c.duotone.from).toBe('#EC0000');
  });

  it('el override de paleta tiene prioridad y se puede restablecer', () => {
    expect(effectiveColor({ color: 'lime', institutionId: 'nu-mx' }, INSTITUTION_CATALOG)).toEqual({
      kind: 'palette',
      key: 'lime',
    });
    expect(effectiveColor({ color: null, institutionId: 'nu-mx' }, INSTITUTION_CATALOG).kind).toBe(
      'brand',
    );
  });

  it('sin institución ni color cae en tinta', () => {
    expect(effectiveColor({ color: null, institutionId: null }, INSTITUTION_CATALOG)).toEqual({
      kind: 'palette',
      key: 'ink',
    });
  });
});

describe('usos confirmados del catálogo', () => {
  it('Bitso ya no sirve para pagar; Finsus sí (tarjeta de débito)', () => {
    const pay = institutionsFor(INSTITUTION_CATALOG, 'pay').map((i) => i.id);
    expect(pay).not.toContain('bitso-mx');
    expect(pay).toContain('finsus-mx');
    expect(institutionsFor(INSTITUTION_CATALOG, 'invest').map((i) => i.id)).toContain('bitso-mx');
  });

  it('Invex no es de inversión; Dinn sí', () => {
    expect(institutionsFor(INSTITUTION_CATALOG, 'invest').map((i) => i.id)).not.toContain(
      'invex-mx',
    );
    expect(institutionsFor(INSTITUTION_CATALOG, 'invest').map((i) => i.id)).toContain('dinn-mx');
  });
});
