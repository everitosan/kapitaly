import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { isSelectableCategory } from '@/domain/category';
import { isActiveMethod } from '@/domain/paymentMethod';
import { activeReminderCount } from '@/domain/reminderSettings';
import { BellIcon, CardIcon, RoundButton } from '@/ui/components/balance';
import { DuotoneBlock } from '@/ui/components/DuotoneBlock';
import { ScreenLayout } from '@/ui/components/layout';
import { SectionLabel } from '@/ui/components/basics';
import { CategoryIcon } from '@/ui/icons/categoryIcons';
import { ShortcutIcon } from '@/ui/icons/ShortcutIcon';
import type { Gradient } from '@/ui/theme';
import { useTheme } from '@/ui/ThemeProvider';

import { isPinSupported, requestPinNewExpense } from '../../../modules/kapitaly-shortcuts';
import { useCategories, usePaymentMethods, useReminderSettings } from '../repositories';

function ChatIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z"
        stroke={color}
        strokeWidth={2.1}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M8.5 11h7M8.5 14.5h4.5" stroke={color} strokeWidth={2.1} strokeLinecap="round" />
    </Svg>
  );
}

const addShortcut = () => {
  if (!requestPinNewExpense())
    Alert.alert('No se pudo agregar', 'Tu pantalla de inicio no permite agregar accesos directos.');
};

export interface SettingsScreenProps {
  onBack: () => void;
  onOpenMethods: () => void;
  onOpenCategories: () => void;
  onOpenNotifications: () => void;
  onOpenFeedback: () => void;
}

/** Resumen de Notificaciones en Ajustes: "Apagadas", "1 activa", "N activas". */
export function remindersSummary(active: number): string {
  if (active === 0) return 'Apagadas';
  return active === 1 ? '1 activa' : `${active} activas`;
}

function SettingsRow({
  label,
  detail,
  count,
  gradient,
  icon,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  detail: string;
  count?: number;
  /** Etiqueta accesible propia; por omisión, el nombre y el conteo. */
  accessibilityLabel?: string;
  /** Ícono sobre un bloque duotono; se omite si `icon` ya trae su propio fondo. */
  gradient?: Gradient;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        accessibilityLabel ?? (count === undefined ? label : `${label}, ${count}`)
      }
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
    >
      {gradient ? (
        <DuotoneBlock gradient={gradient} radius={14} style={styles.icon}>
          {icon}
        </DuotoneBlock>
      ) : (
        <View style={styles.icon}>{icon}</View>
      )}
      <View style={styles.flex}>
        <Text style={[styles.label, { color: colors.ink }]}>{label}</Text>
        <Text style={[styles.detail, { color: colors.muted }]}>{detail}</Text>
      </View>
      {count === undefined ? null : (
        <Text style={[styles.count, { color: colors.muted }]}>{count}</Text>
      )}
      <Text style={[styles.chev, { color: colors.muted }]}>›</Text>
    </Pressable>
  );
}

/** Ajustes: punto de entrada a la configuración de la app desde el balance. */
export function SettingsScreen({
  onBack,
  onOpenMethods,
  onOpenCategories,
  onOpenNotifications,
  onOpenFeedback,
}: SettingsScreenProps) {
  const theme = useTheme();
  const { colors } = theme;
  const methods = usePaymentMethods();
  const categories = useCategories();
  const reminders = useReminderSettings();
  const summary = remindersSummary(reminders.data ? activeReminderCount(reminders.data) : 0);
  // No cambia durante la vida de la app; se consulta una vez por pantalla.
  const [pinSupported] = useState(isPinSupported);

  return (
    <ScreenLayout
      header={
        <View style={styles.topnav}>
          <RoundButton label="Volver" onPress={onBack}>
            <Text style={[styles.arrow, { color: colors.ink }]}>‹</Text>
          </RoundButton>
        </View>
      }
    >
      <Text accessibilityRole="header" style={[styles.title, { color: colors.ink }]}>
        Ajustes
      </Text>
      <Text style={[styles.desc, { color: colors.muted }]}>
        Configura cómo registras tus gastos
      </Text>
      <View style={[styles.list, { backgroundColor: colors.card }]}>
        <SettingsRow
          label="Métodos de pago"
          detail="Tarjetas, efectivo y transferencias"
          count={methods.data.filter(isActiveMethod).length}
          gradient={theme.totals.thisMonth}
          icon={<CardIcon color={theme.totals.thisMonth.text} />}
          onPress={onOpenMethods}
        />
        <View style={[styles.sep, { backgroundColor: colors.line }]} />
        <SettingsRow
          label="Categorías"
          detail="Para clasificar cada gasto"
          count={categories.data.filter(isSelectableCategory).length}
          gradient={theme.frequency.monthly}
          icon={<CategoryIcon icon="dots" color={colors.onBlock} />}
          onPress={onOpenCategories}
        />
        <View style={[styles.sep, { backgroundColor: colors.line }]} />
        <SettingsRow
          label="Notificaciones"
          detail={summary}
          accessibilityLabel={`Notificaciones, ${summary}`}
          gradient={theme.frequency.quarterly}
          icon={<BellIcon color={colors.onBlock} />}
          onPress={onOpenNotifications}
        />
        {pinSupported ? (
          <>
            <View style={[styles.sep, { backgroundColor: colors.line }]} />
            <SettingsRow
              label="Acceso directo: nuevo gasto"
              detail="Un ícono en tu pantalla de inicio"
              icon={<ShortcutIcon testID="shortcut-icon" />}
              onPress={addShortcut}
            />
          </>
        ) : null}
      </View>
      <SectionLabel style={styles.section}>Beta</SectionLabel>
      <View style={[styles.list, { backgroundColor: colors.card }]}>
        <SettingsRow
          label="Comentarios"
          detail="Cuéntame qué mejorar, con capturas"
          gradient={theme.frequency.bimonthly}
          icon={<ChatIcon color={colors.onBlock} />}
          onPress={onOpenFeedback}
        />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topnav: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12, flexDirection: 'row' },
  arrow: { fontSize: 24, fontWeight: '600' },
  title: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    paddingHorizontal: 4,
    paddingBottom: 6,
  },
  desc: { fontSize: 15, fontWeight: '600', paddingHorizontal: 4, paddingBottom: 20 },
  list: { borderRadius: 22, paddingHorizontal: 16, paddingVertical: 4 },
  section: { marginHorizontal: 4, marginTop: 22, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  sep: { height: StyleSheet.hairlineWidth },
  icon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 17, fontWeight: '700' },
  detail: { fontSize: 13, fontWeight: '600', marginTop: 1 },
  count: { fontSize: 15, fontWeight: '700' },
  chev: { fontSize: 22, fontWeight: '600' },
});
