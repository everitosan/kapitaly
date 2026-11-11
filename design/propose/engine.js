/* Datos de ejemplo y cálculo del balance compartidos por las tres propuestas.
   Reproduce las reglas de los specs (fechas desde el ancla, ajuste a fin de mes,
   proporcional redondeado, pista con fecha de referencia). Solo para maquetas. */
window.K = (() => {
  const TODAY = { y: 2026, m: 11, d: 11 };
  const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const MON = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  const EXPENSES = [
    { id: 'renta', name: 'Renta', cents: 150000, unit: 'month', count: 1, anchor: [2025, 8, 20], method: 'nu' },
    { id: 'netflix', name: 'Netflix', cents: 21900, unit: 'month', count: 1, anchor: [2026, 1, 15], method: 'bbva', variant: 'digital' },
    { id: 'gym', name: 'Gimnasio', cents: 59900, unit: 'month', count: 1, anchor: [2026, 2, 1], method: 'bbva' },
    { id: 'internet', name: 'Internet', cents: 45000, unit: 'month', count: 2, anchor: [2026, 9, 28], method: 'nu' },
    { id: 'medico', name: 'Seguro médico', cents: 180000, unit: 'month', count: 3, anchor: [2026, 2, 5], method: 'bbva' },
    { id: 'servicio', name: 'Servicio del auto', cents: 240000, unit: 'month', count: 6, anchor: [2026, 5, 10], method: 'banamex' },
    { id: 'seguro', name: 'Seguro del auto', cents: 600000, unit: 'year', count: 1, anchor: [2026, 3, 15], method: 'bbva' },
  ];

  const METHODS = [
    { id: 'efectivo', name: 'Efectivo', kind: 'cash', color: 'mint' },
    { id: 'bbva', name: 'BBVA Azul', kind: 'credit', last4: '4521', institution: 'bbva-mx', color: null,
      openingCents: 1200000, openingDate: [2026, 11, 1], limitCents: 5000000, dueDay: 5, hasDigital: true, digitalLast4: '7788' },
    { id: 'nu', name: 'Nu Débito', kind: 'debit', last4: '8830', institution: 'nu-mx', color: null },
    { id: 'banamex', name: 'Banamex Clásica', kind: 'credit', last4: '3310', institution: 'banamex-mx', color: null, archived: true },
  ];

  /* Catálogo de instituciones (propuesta). Colores aproximados; '?' = uso por confirmar. */
  const INSTITUTIONS = [
    { id: 'bbva-mx', name: 'BBVA', kind: 'bank', uses: ['pay', 'receive', 'invest'], baseColor: '#004481', monogram: 'BB' },
    { id: 'santander-mx', name: 'Santander', kind: 'bank', uses: ['pay', 'receive', 'invest'], baseColor: '#EC0000', monogram: 'S' },
    { id: 'banamex-mx', name: 'Banamex', kind: 'bank', uses: ['pay', 'receive', 'invest'], baseColor: '#056DAE', monogram: 'B' },
    { id: 'nu-mx', name: 'Nu', kind: 'fintech', uses: ['pay', 'receive', 'invest'], baseColor: '#820AD1', monogram: 'Nu' },
    { id: 'mercadopago-mx', name: 'Mercado Pago', kind: 'fintech', uses: ['pay', 'receive', 'invest'], baseColor: '#00B1EA', monogram: 'MP' },
    { id: 'klar-mx', name: 'Klar', kind: 'fintech', uses: ['pay', 'receive', 'invest'], baseColor: '#1A1A1A', monogram: 'K' },
    { id: 'stori-mx', name: 'Stori', kind: 'fintech', uses: ['pay', 'receive', 'invest'], baseColor: '#00A88E', monogram: 'St' },
    { id: 'openbank-mx', name: 'Openbank', kind: 'bank', uses: ['pay', 'receive', 'invest'], baseColor: '#E4002B', monogram: 'O' },
    { id: 'mifel-mx', name: 'Mifel', kind: 'bank', uses: ['pay', 'receive', 'invest'], baseColor: '#00594F', monogram: 'Mi' },
    { id: 'invex-mx', name: 'Invex', kind: 'bank', uses: ['pay', 'receive'], unsure: ['receive'], baseColor: '#E30613', monogram: 'I' },
    { id: 'cetes-mx', name: 'Cetesdirecto', kind: 'investment', uses: ['receive', 'invest'], baseColor: '#0B5E3C', monogram: 'C' },
    { id: 'dinn-mx', name: 'Dinn', kind: 'investment', uses: ['receive', 'invest'], unsure: ['receive'], baseColor: '#5B2EFF', monogram: 'D' },
    { id: 'kubo-mx', name: 'Kubo', kind: 'investment', uses: ['pay', 'receive', 'invest'], unsure: ['pay'], baseColor: '#00B2A9', monogram: 'Ku' },
    { id: 'bitso-mx', name: 'Bitso', kind: 'fintech', uses: ['pay', 'receive', 'invest'], unsure: ['pay'], baseColor: '#1AC37F', monogram: 'Bi' },
    { id: 'finsus-mx', name: 'Finsus', kind: 'investment', uses: ['pay', 'receive', 'invest'], unsure: ['pay'], baseColor: '#2D2A7B', monogram: 'F' },
  ];
  const institution = (id) => INSTITUTIONS.find((i) => i.id === id) || null;
  const institutionsFor = (use) => INSTITUTIONS.filter((i) => i.uses.includes(use) && !i.retired);

  /* duotoneFromBase: segundo tono = luminosidad -12 y tono +12°; texto blanco u oscuro según contraste AA en ambos extremos. */
  const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lum = (h) => { const c = hexToRgb(h).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  function rgbToHsl([r, g, b]) {
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2;
    if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
    return [h, s * 100, l * 100];
  }
  function hslToHex(h, s, l) {
    s /= 100; l /= 100; const k = (n) => (n + h / 30) % 12; const a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return '#' + [f(0), f(8), f(4)].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
  }
  function duotoneFromBase(hex) {
    const [h, s, l] = rgbToHsl(hexToRgb(hex));
    const DARK = '#141414', WHITE = '#FFFFFF';
    const ok = (fg, from, to) => contrast(fg, from) >= 4.5 && contrast(fg, to) >= 4.5;
    const darker = hslToHex((h + 12) % 360, s, Math.max(6, l - 12));
    const lighter = hslToHex((h + 12) % 360, s, Math.min(94, l + 10));
    // Conserva el color de marca: primero texto blanco con 2º tono más oscuro; si la marca es clara, texto oscuro con 2º tono más claro.
    if (ok(WHITE, hex, darker)) return { from: hex, to: darker, fg: WHITE };
    if (ok(DARK, hex, lighter)) return { from: hex, to: lighter, fg: DARK };
    if (ok(DARK, hex, darker)) return { from: hex, to: darker, fg: DARK };
    // Último recurso: oscurecer ambos tonos hasta que el blanco cumpla.
    let ll = l, from = hex, to = darker;
    for (let i = 0; i < 14 && !ok(WHITE, from, to); i++) { ll -= 3; from = hslToHex(h, s, Math.max(4, ll)); to = hslToHex((h + 12) % 360, s, Math.max(4, ll - 12)); }
    return { from, to, fg: WHITE };
  }
  const ONE_OFFS = [
    { id: 'o1', desc: 'Recarga metro', cents: 10000, date: [2026, 11, 3], method: 'efectivo' },
    { id: 'o2', desc: 'Comida con amigos', cents: 45000, date: [2026, 11, 7], method: 'nu' },
    { id: 'o3', desc: 'Farmacia', cents: 23850, date: [2026, 11, 9], method: 'bbva' },
    { id: 'o4', desc: 'Recarga metro', cents: 10000, date: [2026, 11, 10], method: 'efectivo' },
    { id: 'o5', desc: 'Cine', cents: 18000, date: [2026, 10, 25], method: 'bbva' },
  ];
  /* Tarjetas de crédito: pagos y cobros confirmados (maqueta) */
  const CARD_PAYMENTS = [{ id: 'p1', method: 'bbva', cents: 300000, date: [2026, 11, 5] }];
  const CONFIRMED = new Set(['gym|2026-11-01']); // cobros ya confirmados (gasto|fecha)
  const iso = (d) => `${d[0]}-${String(d[1]).padStart(2, '0')}-${String(d[2]).padStart(2, '0')}`;
  const cardUsed = (m) => {
    if (m.kind !== 'credit') return null;
    const from = iso(m.openingDate);
    const ones = ONE_OFFS.filter((o) => o.method === m.id && iso(o.date) >= from).reduce((s, o) => s + o.cents, 0);
    const conf = EXPENSES.filter((e) => e.method === m.id).reduce((s, e) => {
      let t = 0;
      for (let mm = 11; mm <= 11; mm++) { const d = occ(e, 2026, mm); if (d && CONFIRMED.has(`${e.id}|${iso([2026, mm, d])}`)) t += e.cents; }
      return s + t;
    }, 0);
    const paid = CARD_PAYMENTS.filter((p) => p.method === m.id).reduce((s, p) => s + p.cents, 0);
    return m.openingCents + ones + conf - paid;
  };
  /* Cobros recurrentes de noviembre con fecha ≤ hoy sin confirmar */
  const pendingCharges = () => EXPENSES.map((e) => ({ e, day: occ(e, TODAY.y, TODAY.m) }))
    .filter((x) => x.day && x.day <= TODAY.d && !CONFIRMED.has(`${x.e.id}|${iso([TODAY.y, TODAY.m, x.day])}`));

  const method = (id) => METHODS.find((m) => m.id === id) || { id, name: 'Método desconocido', kind: 'cash', color: 'ink' };
  const methodLabel = (m, variant) => variant === 'digital'
    ? `${m.name}${m.digitalLast4 ? ` ••${m.digitalLast4}` : ''} · digital`
    : (m.last4 ? `${m.name} ••${m.last4}` : m.name);
  const methodUses = (id) => EXPENSES.filter((e) => e.method === id).length + ONE_OFFS.filter((o) => o.method === id).length;

  const months = (e) => (e.unit === 'year' ? 12 * e.count : e.count);
  const dim = (y, m) => new Date(y, m, 0).getDate();
  const LABELS = { 1: 'Mensual', 2: 'Bimestral', 3: 'Trimestral', 6: 'Semestral', 12: 'Anual' };
  const freqLabel = (e) => LABELS[months(e)] || `Cada ${months(e)} meses`;

  function occ(e, y, m) {
    const d = (y - e.anchor[0]) * 12 + (m - e.anchor[1]);
    const k = months(e);
    if (d < 0 || d % k !== 0) return null;
    return Math.min(e.anchor[2], dim(y, m));
  }

  function nextOcc(e, ref) {
    let y = ref.y, m = ref.m;
    for (let i = 0; i < 60; i++) {
      const day = occ(e, y, m);
      const sameMonth = y === ref.y && m === ref.m;
      if (day !== null && (!sameMonth || day >= ref.d)) {
        if (e.end && cmp([y, m, day], e.end) > 0) return null;
        return [y, m, day];
      }
      m++; if (m > 12) { m = 1; y++; }
    }
    return null;
  }

  const cmp = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
  const vigente = (e, y, m) => cmp(e.anchor, [y, m, dim(y, m)]) <= 0 && (!e.end || cmp(e.end, [y, m, 1]) >= 0);
  const isPastOrCurrent = (y, m) => y < TODAY.y || (y === TODAY.y && m <= TODAY.m);

  function thisMonth(y, m) {
    const items = EXPENSES
      .map((e) => { const day = occ(e, y, m); return day === null ? null : { e, day }; })
      .filter(Boolean)
      .sort((a, b) => a.day - b.day || a.e.name.localeCompare(b.e.name, 'es'));
    return { items, count: items.length, total: items.reduce((s, it) => s + it.e.cents, 0) };
  }

  function average(y, m) {
    const ref = isPastOrCurrent(y, m) ? TODAY : { y, m, d: 1 };
    const items = EXPENSES.filter((e) => vigente(e, y, m)).map((e) => {
      const k = months(e);
      return { e, k, monthly: Math.round(e.cents / k), next: k > 1 ? nextOcc(e, ref) : undefined };
    });
    const fixed = items.filter((i) => i.k === 1).reduce((s, i) => s + i.monthly, 0);
    const prorated = items.filter((i) => i.k > 1).reduce((s, i) => s + i.monthly, 0);
    return { items, total: fixed + prorated, fixed, prorated };
  }

  function nextInMonth(y, m) {
    const ref = isPastOrCurrent(y, m) ? TODAY : { y, m, d: 1 };
    const list = thisMonth(y, m).items;
    if (y !== ref.y || m !== ref.m) return y < ref.y || (y === ref.y && m < ref.m) ? null : list[0] || null;
    return list.find((it) => it.day >= ref.d) || null;
  }

  /* Vista Este mes con recurrentes + únicos y desglose por método */
  function monthAll(y, m) {
    const rec = thisMonth(y, m).items.map((it) => ({ kind: 'rec', day: it.day, label: it.e.name, cents: it.e.cents, method: it.e.method, e: it.e }));
    const one = ONE_OFFS.filter((o) => o.date[0] === y && o.date[1] === m)
      .map((o) => ({ kind: 'one', day: o.date[2], label: o.desc, cents: o.cents, method: o.method, o }));
    const items = [...rec, ...one].sort((a, b) => a.day - b.day || a.label.localeCompare(b.label, 'es'));
    const sum = (l) => l.reduce((s, i) => s + i.cents, 0);
    const by = {};
    items.forEach((i) => { by[i.method] = (by[i.method] || 0) + i.cents; });
    const breakdown = Object.entries(by).filter(([, c]) => c > 0)
      .map(([id, c]) => ({ m: method(id), cents: c }))
      .sort((a, b) => b.cents - a.cents || a.m.name.localeCompare(b.m.name, 'es'));
    return { items, count: items.length, total: sum(items), recTotal: sum(rec), oneTotal: sum(one), ones: one, breakdown };
  }
  function averageAll(y, m) {
    const a = average(y, m);
    const ones = monthAll(y, m).ones;
    const oneTotal = ones.reduce((s, i) => s + i.cents, 0);
    return { ...a, ones, oneTotal, total: a.total + oneTotal };
  }

  const nf = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
  const fmt = (c) => nf.format(c / 100);
  const fmtParts = (c) => { const s = fmt(c); const i = s.lastIndexOf('.'); return [s.slice(0, i), s.slice(i)]; };
  const dateLabel = (d) => `${d[2]} ${MON[d[1] - 1]} ${d[0]}`;
  const shift = (y, m, delta) => { let n = y * 12 + (m - 1) + delta; return [Math.floor(n / 12), (n % 12) + 1]; };
  const cap = (s) => s[0].toUpperCase() + s.slice(1);

  return { TODAY, MONTHS, MON, EXPENSES, METHODS, ONE_OFFS, CARD_PAYMENTS, CONFIRMED, cardUsed, pendingCharges, iso, INSTITUTIONS, institution, institutionsFor, duotoneFromBase, contrast, method, methodLabel, methodUses, monthAll, averageAll, months, freqLabel, thisMonth, average, nextInMonth, fmt, fmtParts, dateLabel, shift, cap };
})();

/* Monta un teléfono interactivo: data-view inicial, flechas de mes y control de vista. */
window.mountPhone = (el, render, initial = {}) => {
  const st = { y: K.TODAY.y, m: K.TODAY.m, view: initial.view || 'this' };
  const draw = () => {
    const scroller = el.querySelector('[data-scroll]');
    const top = scroller ? scroller.scrollTop : 0;
    el.innerHTML = render(st);
    const s2 = el.querySelector('[data-scroll]'); if (s2) s2.scrollTop = top;
  };
  el.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-act]'); if (!b) return;
    const a = b.dataset.act;
    if (a === 'prev' || a === 'next') [st.y, st.m] = K.shift(st.y, st.m, a === 'prev' ? -1 : 1);
    if (a === 'view') st.view = b.dataset.v;
    if (a === 'today') { st.y = K.TODAY.y; st.m = K.TODAY.m; }
    draw();
  });
  draw();
};

window.STATUS_BAR = (color = 'currentColor') => `
  <div class="sb" style="color:${color}">
    <span class="sb-time">9:41</span>
    <span class="sb-island"></span>
    <span class="sb-icons">
      <svg width="18" height="12" viewBox="0 0 18 12" fill="${color}"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
      <svg width="26" height="12" viewBox="0 0 26 12" fill="none"><rect x=".5" y=".5" width="22" height="11" rx="3.5" stroke="${color}" opacity=".4"/><rect x="2" y="2" width="17" height="8" rx="2" fill="${color}"/><rect x="24" y="4" width="1.6" height="4" rx=".8" fill="${color}" opacity=".5"/></svg>
    </span>
  </div>`;
