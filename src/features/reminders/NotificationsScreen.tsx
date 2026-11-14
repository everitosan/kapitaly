import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { AppState, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  effectiveIdleTime,
  formatClockTime,
  IDLE_DAYS_MAX,
  IDLE_DAYS_MIN,
  parseClockTime,
  type ClockTime,
  type ReminderSettings,
} from '@/domain/reminderSettings';
import { BellIcon, RoundButton } from '@/ui/components/balance';
import { SectionLabel, Switch } from '@/ui/components/basics';
import { ScreenLayout } from '@/ui/components/layout';
import { useTheme } from '@/ui/ThemeProvider';

import { useRepositories, useReminderSettings } from '../repositories';
import * as defaultScheduler from './scheduler';
import type { ReminderPermission } from './scheduler';

type Toggle = 'chargesOn' | 'dailyOn' | 'idleOn';

export interface NotificationsScreenProps {
  onBack: () => void;
  /** Permisos del sistema; se inyecta en pruebas. */
  scheduler?: Pick<typeof defaultScheduler, 'permissionStatus' | 'requestPermission'>;
}

const days = (n: number) => `${n} ${n === 1 ? 'día' : 'días'}`;

function TimeRow({
  label,
  detail,
  value,
  onChange,
  testID,
}: {
  label: string;
  detail?: string;
  value: ClockTime;
  onChange: (time: ClockTime) => void;
  testID: string;
}) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const { hour, minute } = parseClockTime(value);
  const handle = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS !== 'ios') setOpen(false);
    if (event.type === 'set' && date) onChange(formatClockTime(date.getHours(), date.getMinutes()));
  };
  return (
    <View style={[styles.sub, { backgroundColor: colors.bg }]}>
      <View style={styles.flex}>
        <Text style={[styles.subLabel, { color: colors.ink }]}>{label}</Text>
        {detail ? <Text style={[styles.subDetail, { color: colors.muted }]}>{detail}</Text> : null}
      </View>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}`}
        onPress={() => setOpen((v) => !v)}
        style={[styles.pill, { backgroundColor: colors.card }]}
      >
        <Text style={[styles.pillText, { color: colors.ink }]}>{value}</Text>
      </Pressable>
      {open ? (
        <DateTimePicker
          testID={`${testID}-picker`}
          value={new Date(2000, 0, 1, hour, minute)}
          mode="time"
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handle}
        />
      ) : null}
    </View>
  );
}

function Option({
  title,
  detail,
  value,
  disabled,
  onToggle,
  children,
}: {
  title: string;
  detail: string;
  value: boolean;
  disabled: boolean;
  onToggle: (on: boolean) => void;
  children?: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.option}>
      <View style={styles.optionHead}>
        <View style={styles.flex}>
          <Text style={[styles.optionTitle, { color: colors.ink }]}>{title}</Text>
          <Text style={[styles.optionDetail, { color: colors.muted }]}>{detail}</Text>
        </View>
        <View pointerEvents={disabled ? 'none' : 'auto'} style={disabled ? styles.off : null}>
          <Switch label={title} value={value} onValueChange={onToggle} />
        </View>
      </View>
      {value ? <View style={styles.optionBody}>{children}</View> : null}
    </View>
  );
}

/** Ajustes > Notificaciones: aviso de cobros, recordatorio diario y desuso. */
export function NotificationsScreen({
  onBack,
  scheduler = defaultScheduler,
}: NotificationsScreenProps) {
  const theme = useTheme();
  const { colors } = theme;
  const repo = useRepositories().reminderSettings;
  const settings = useReminderSettings();
  const [permission, setPermission] = useState<ReminderPermission | null>(null);

  // Se revisa al abrir y al volver a la app (p. ej. desde los ajustes del sistema).
  useEffect(() => {
    let active = true;
    const check = () =>
      scheduler.permissionStatus().then((p) => {
        if (active) setPermission(p);
      });
    check();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => {
      active = false;
      sub.remove();
    };
  }, [scheduler]);

  const s = settings.data;
  const blocked = permission === 'blocked';
  const update = (patch: Partial<ReminderSettings>) => repo.update(patch);

  const toggle = async (key: Toggle, on: boolean) => {
    if (!on) return update({ [key]: false });
    const result = permission === 'granted' ? 'granted' : await scheduler.requestPermission();
    setPermission(result);
    if (result === 'granted') await update({ [key]: true });
  };

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
        Notificaciones
      </Text>
      <Text style={[styles.desc, { color: colors.muted }]}>Recordatorios en este teléfono</Text>

      {blocked ? (
        <View
          testID="notifications-blocked"
          style={[styles.blocked, { backgroundColor: colors.alertBg }]}
        >
          <BellIcon color={colors.alertInk} />
          <View style={styles.flex}>
            <Text style={[styles.blockedTitle, { color: colors.alertInk }]}>
              Notificaciones bloqueadas
            </Text>
            <Text style={[styles.blockedText, { color: colors.alertInk }]}>
              Android no deja que KPTLY expenses te avise. Actívalas en los ajustes del sistema para
              poder encenderlas aquí.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => Linking.openSettings()}
              style={[styles.blockedButton, { backgroundColor: colors.alertInk }]}
            >
              <Text style={[styles.blockedButtonText, { color: colors.alertBg }]}>
                Abrir ajustes del sistema
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {s ? (
        <>
          <SectionLabel style={styles.section}>Cobros pendientes</SectionLabel>
          <View style={[styles.group, { backgroundColor: colors.card }]}>
            <Option
              title="Avisar el día del cobro"
              detail="Te avisaré en base a tus gastos recurrentes y vencimientos de tarjetas"
              value={s.chargesOn && !blocked}
              disabled={blocked}
              onToggle={(on) => toggle('chargesOn', on)}
            >
              <TimeRow
                label="Hora"
                value={s.chargesTime}
                onChange={(chargesTime) => update({ chargesTime })}
                testID="charges-time"
              />
            </Option>
          </View>

          <SectionLabel style={styles.section}>Registrar gastos</SectionLabel>
          <View style={[styles.group, { backgroundColor: colors.card }]}>
            <Option
              title="Recordatorio diario"
              detail="Configúralo para que no se te pase ningún gasto del día"
              value={s.dailyOn && !blocked}
              disabled={blocked}
              onToggle={(on) => toggle('dailyOn', on)}
            >
              <TimeRow
                label="Hora"
                value={s.dailyTime}
                onChange={(dailyTime) => update({ dailyTime })}
                testID="daily-time"
              />
            </Option>
            <View style={[styles.sep, { backgroundColor: colors.line }]} />
            <Option
              title="Desuso"
              detail="Te recordaré después de varios días en que no registres nada"
              value={s.idleOn && !blocked}
              disabled={blocked}
              onToggle={(on) => toggle('idleOn', on)}
            >
              <View style={[styles.sub, { backgroundColor: colors.bg }]}>
                <Text style={[styles.subLabel, styles.flex, { color: colors.ink }]}>
                  Después de
                </Text>
                <View style={styles.stepper}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Menos días"
                    disabled={s.idleDays <= IDLE_DAYS_MIN}
                    onPress={() => update({ idleDays: s.idleDays - 1 })}
                    style={[
                      styles.step,
                      { backgroundColor: colors.card },
                      s.idleDays <= IDLE_DAYS_MIN ? styles.off : null,
                    ]}
                  >
                    <Text style={[styles.stepText, { color: colors.ink }]}>−</Text>
                  </Pressable>
                  <Text testID="idle-days" style={[styles.stepValue, { color: colors.ink }]}>
                    {days(s.idleDays)}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Más días"
                    disabled={s.idleDays >= IDLE_DAYS_MAX}
                    onPress={() => update({ idleDays: s.idleDays + 1 })}
                    style={[
                      styles.step,
                      { backgroundColor: colors.card },
                      s.idleDays >= IDLE_DAYS_MAX ? styles.off : null,
                    ]}
                  >
                    <Text style={[styles.stepText, { color: colors.ink }]}>+</Text>
                  </Pressable>
                </View>
              </View>
              <TimeRow
                label="Hora"
                detail={s.idleTime === null ? 'La del recordatorio diario' : 'Hora propia'}
                value={effectiveIdleTime(s)}
                onChange={(time) => update({ idleTime: time === s.dailyTime ? null : time })}
                testID="idle-time"
              />
              {s.idleTime !== null ? (
                <Pressable accessibilityRole="button" onPress={() => update({ idleTime: null })}>
                  <Text style={[styles.link, { color: theme.totals.thisMonth.from }]}>
                    Usar la del recordatorio diario
                  </Text>
                </Pressable>
              ) : null}
            </Option>
          </View>

          {s.idleOn && !blocked ? (
            <Text style={[styles.note, { color: colors.muted }]}>
              {`Si pasan ${days(s.idleDays)} sin registrar gastos, te avisaré a las ${effectiveIdleTime(s)}; repito a los ${s.idleDays * 2} y ${s.idleDays * 3} días y luego ya no.`}
            </Text>
          ) : null}
          {(s.chargesOn || s.dailyOn || s.idleOn) && !blocked ? (
            <Text style={[styles.note, { color: colors.muted }]}>
              En Android la hora puede variar unos minutos.
            </Text>
          ) : null}
        </>
      ) : null}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  off: { opacity: 0.45 },
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
  section: { marginHorizontal: 4, marginBottom: 10 },
  group: { borderRadius: 22, paddingHorizontal: 16, paddingVertical: 2, marginBottom: 22 },
  sep: { height: StyleSheet.hairlineWidth },
  option: { paddingVertical: 14 },
  optionHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionTitle: { fontSize: 17, fontWeight: '700' },
  optionDetail: { fontSize: 13, fontWeight: '600', marginTop: 2, lineHeight: 18 },
  optionBody: { gap: 10, marginTop: 12 },
  sub: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  subLabel: { fontSize: 15, fontWeight: '700' },
  subDetail: { fontSize: 12, fontWeight: '600' },
  pill: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  pillText: { fontSize: 17, fontWeight: '800', fontVariant: ['tabular-nums'] },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  step: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontSize: 20, fontWeight: '700' },
  stepValue: {
    minWidth: 64,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  link: { fontSize: 13, fontWeight: '800', paddingHorizontal: 4 },
  note: { fontSize: 13, fontWeight: '600', paddingHorizontal: 4, marginBottom: 10, lineHeight: 19 },
  blocked: { flexDirection: 'row', gap: 12, borderRadius: 18, padding: 14, marginBottom: 18 },
  blockedTitle: { fontSize: 15, fontWeight: '800' },
  blockedText: { fontSize: 13, fontWeight: '600', marginTop: 2, lineHeight: 18 },
  blockedButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  blockedButtonText: { fontSize: 13, fontWeight: '800' },
});
