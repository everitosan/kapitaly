/**
 * Pantalla de muestra de desarrollo: todos los componentes del sistema de diseño, en claro y oscuro,
 * para compararlos con design/propose/a-1-duotono.html. Solo se enlaza en modo desarrollo.
 */
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { INSTITUTION_CATALOG } from '@/data/institutions/catalog';
import { institutionsFor } from '@/domain/institution';
import {
  CASH_METHOD_ID,
  NO_CARD_DATA,
  PALETTE_COLOR_KEYS,
  type PaymentMethod,
} from '@/domain/paymentMethod';
import {
  DangerButton,
  PrimaryButton,
  SecondaryButton,
  SectionLabel,
  Switch,
  TextField,
} from '@/ui/components/basics';
import {
  ExpenseRow,
  MethodBreakdownCard,
  MonthSwitcher,
  SegmentedControl,
  TotalCard,
} from '@/ui/components/balance';
import {
  AmountBlock,
  DateField,
  FrequencyChips,
  InstitutionPicker,
  MethodCard,
  PaymentMethodPicker,
  recurringCaption,
} from '@/ui/components/forms';
import { DuotoneBlock } from '@/ui/components/DuotoneBlock';
import type { ColorSchemeName } from '@/ui/theme';
import { PALETTE_NAMES } from '@/ui/theme';
import { ThemeProvider, useTheme } from '@/ui/ThemeProvider';

const meta = {
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  deletedAt: null,
  ...NO_CARD_DATA,
};
const cash: PaymentMethod = {
  ...meta,
  id: CASH_METHOD_ID,
  name: 'Efectivo',
  kind: 'cash',
  institutionId: null,
  last4: null,
  color: 'mint',
  archivedAt: null,
};
const bbva: PaymentMethod = {
  ...meta,
  id: 'bbva',
  name: 'BBVA Azul',
  kind: 'credit',
  institutionId: 'bbva-mx',
  last4: '4521',
  color: null,
  archivedAt: null,
};
const nu: PaymentMethod = {
  ...meta,
  id: 'nu',
  name: 'Nu Débito',
  kind: 'debit',
  institutionId: 'nu-mx',
  last4: '8830',
  color: null,
  archivedAt: null,
};
const old: PaymentMethod = {
  ...meta,
  id: 'old',
  name: 'Banamex Clásica',
  kind: 'credit',
  institutionId: 'banamex-mx',
  last4: '3310',
  color: null,
  archivedAt: '2026-10-01T00:00:00Z',
};

function Catalog() {
  const theme = useTheme();
  const [view, setView] = useState<'this' | 'avg'>('this');
  const [freq, setFreq] = useState<{ unit: 'month' | 'year'; count: number }>({
    unit: 'month',
    count: 1,
  });
  const [method, setMethod] = useState<string>(bbva.id);
  const [inst, setInst] = useState<string | null>('nu-mx');
  const [end, setEnd] = useState(false);
  const [date, setDate] = useState('2026-11-11');
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <SectionLabel>Botones</SectionLabel>
      <View style={styles.stack}>
        <PrimaryButton label="Agregar gasto" plus />
        <SecondaryButton label="Cancelar" />
        <DangerButton label="Eliminar gasto" />
      </View>
      <SectionLabel>SegmentedControl · MonthSwitcher</SectionLabel>
      <SegmentedControl
        options={[
          { value: 'this', label: 'Este mes' },
          { value: 'avg', label: 'Promedio' },
        ]}
        value={view}
        onChange={setView}
      />
      <MonthSwitcher
        year={2026}
        month={11}
        onPrev={() => {}}
        onNext={() => {}}
        onMethods={() => {}}
      />
      <SectionLabel>Tarjetas de total</SectionLabel>
      <TotalCard
        variant="thisMonth"
        label="Cargos de noviembre"
        cents={785650}
        pills={['10 cargos', 'Recurrentes $6,968.00', 'Únicos $888.50']}
      />
      <TotalCard
        variant="average"
        label="Costo mensual promedio"
        cents={493150}
        pills={['Fijos $2,318.00', 'Prorrateados $1,725.00', 'Únicos $888.50']}
      />
      <MethodBreakdownCard
        totalCents={785650}
        entries={[
          { paymentMethodId: 'bbva', method: bbva, amountCents: 285650 },
          { paymentMethodId: 'old', method: old, amountCents: 240000 },
          { paymentMethodId: 'nu', method: nu, amountCents: 240000 },
          { paymentMethodId: cash.id, method: cash, amountCents: 20000 },
        ]}
      />
      <SectionLabel>Filas</SectionLabel>
      <ExpenseRow
        variant="recurring"
        gradient={theme.frequency.monthly}
        date="2026-11-15"
        title="Netflix"
        frequency="Mensual"
        amountCents={21900}
        method={bbva}
      />
      <ExpenseRow
        variant="oneOff"
        date="2026-11-03"
        title="Recarga metro"
        amountCents={10000}
        method={cash}
      />
      <ExpenseRow
        variant="average"
        gradient={theme.frequency.annual}
        title="Seguro del auto"
        frequency="Anual"
        monthlyCents={50000}
        hint="$6,000.00 · próximo cobro 15 mar 2027"
        method={bbva}
      />
      <SectionLabel>Formulario</SectionLabel>
      <View style={styles.stack}>
        <AmountBlock
          amountText="219.00"
          onChangeText={() => {}}
          caption={recurringCaption(21900, freq.unit === 'year' ? 12 : freq.count)}
          gradient={theme.frequency.monthly}
        />
        <AmountBlock
          amountText="100.00"
          onChangeText={() => {}}
          caption="Gasto único · no se repite"
        />
        <TextField label="Descripción" value="Recarga metro" onChangeText={() => {}} />
        <TextField
          label="Monto"
          value="10.555"
          onChangeText={() => {}}
          error="El monto admite hasta dos decimales"
        />
        <FrequencyChips
          unit={freq.unit}
          count={freq.count}
          onChange={(unit, count) => setFreq({ unit, count })}
        />
        <PaymentMethodPicker
          methods={[cash, bbva, nu, old]}
          selectedId={method}
          onSelect={setMethod}
          onNew={() => {}}
        />
        <InstitutionPicker
          institutions={institutionsFor(INSTITUTION_CATALOG, 'pay')}
          selectedId={inst}
          onSelect={setInst}
        />
        <DateField label="Fecha" prefix="Hoy" value={date} onChange={setDate} />
        <View style={[styles.switchRow, { backgroundColor: theme.colors.card }]}>
          <Text style={{ color: theme.colors.ink, fontWeight: '600', fontSize: 16 }}>
            Fecha de fin
          </Text>
          <Switch label="Fecha de fin" value={end} onValueChange={setEnd} />
        </View>
      </View>
      <SectionLabel>Tarjetas de método</SectionLabel>
      <MethodCard method={nu} uses={3} />
      <MethodCard method={old} uses={1} />
      <SectionLabel>Paleta de métodos</SectionLabel>
      <View style={styles.swatches}>
        {PALETTE_COLOR_KEYS.map((k) => (
          <DuotoneBlock key={k} gradient={theme.palette[k]} radius={18} style={styles.swatch}>
            <Text style={{ color: theme.palette[k].text, fontWeight: '700', fontSize: 12 }}>
              {PALETTE_NAMES[k]}
            </Text>
          </DuotoneBlock>
        ))}
      </View>
    </ScrollView>
  );
}

export default function ComponentsScreen() {
  const [scheme, setScheme] = useState<ColorSchemeName>('light');
  return (
    <ThemeProvider scheme={scheme}>
      <Screen scheme={scheme} setScheme={setScheme} />
    </ThemeProvider>
  );
}

function Screen({
  scheme,
  setScheme,
}: {
  scheme: ColorSchemeName;
  setScheme: (s: ColorSchemeName) => void;
}) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <SegmentedControl
          options={[
            { value: 'light', label: '☀︎ Claro' },
            { value: 'dark', label: '☾ Oscuro' },
          ]}
          value={scheme}
          onChange={setScheme}
        />
      </View>
      <Catalog />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  content: { padding: 20, paddingBottom: 60, gap: 4 },
  stack: { gap: 12, marginBottom: 20 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: { width: '31%', minHeight: 70, padding: 12, justifyContent: 'flex-end' },
});
