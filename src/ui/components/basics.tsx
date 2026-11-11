import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Switch as RNSwitch,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { formatMXNParts, type Cents } from '@/domain/money';

import { useTheme } from '../ThemeProvider';

/** Monto con los centavos en tamaño menor: `$7,856` `.50`. */
export function MoneyText({
  cents,
  size = 17,
  color,
  weight = '800',
  style,
  suffix,
}: {
  cents: Cents;
  size?: number;
  color?: string;
  weight?: TextStyle['fontWeight'];
  style?: StyleProp<TextStyle>;
  suffix?: string;
}) {
  const { colors } = useTheme();
  const [whole, decimals] = formatMXNParts(cents);
  return (
    <Text
      style={[
        {
          fontSize: size,
          fontWeight: weight,
          color: color ?? colors.ink,
          fontVariant: ['tabular-nums'],
        },
        style,
      ]}
      accessibilityLabel={`${whole}${decimals}${suffix ? ' ' + suffix : ''}`}
    >
      {whole}
      <Text style={{ fontSize: Math.round(size * 0.57), opacity: 0.7 }}>{decimals}</Text>
      {suffix ? (
        <Text style={{ fontSize: Math.round(size * 0.7), opacity: 0.6 }}>{` ${suffix}`}</Text>
      ) : null}
    </Text>
  );
}

/** Píldora de texto. */
export function Pill({
  children,
  background,
  color,
  style,
}: {
  children: ReactNode;
  background: string;
  color: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: background }, style]}>
      <Text style={[styles.pillText, { color }]}>{children}</Text>
    </View>
  );
}

interface ButtonProps {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

/** Botón principal: píldora de tinta (invertida en oscuro) con un "+" opcional en duotono lima. */
export function PrimaryButton({
  label,
  onPress,
  disabled,
  testID,
  style,
  plus,
}: ButtonProps & { plus?: boolean }) {
  const theme = useTheme();
  const { primary, frequency } = theme;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      style={({ pressed }) => [{ opacity: disabled ? 0.4 : pressed ? 0.85 : 1 }, style]}
    >
      <LinearGradient
        colors={[primary.from, primary.to]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.primary}
      >
        {plus ? (
          <LinearGradient
            colors={[frequency.monthly.from, frequency.monthly.to]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.plus}
          >
            <Text style={[styles.plusText, { color: theme.colors.onBlock }]}>+</Text>
          </LinearGradient>
        ) : null}
        <Text style={[styles.buttonText, { color: primary.text }]}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, disabled, testID, style }: ButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.secondary,
        { backgroundColor: colors.card, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 },
        style,
      ]}
    >
      <Text style={[styles.buttonText, { color: colors.ink }]}>{label}</Text>
    </Pressable>
  );
}

export function DangerButton({ label, onPress, disabled, testID, style }: ButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.secondary,
        { opacity: disabled ? 0.38 : pressed ? 0.7 : 1 },
        style,
      ]}
    >
      <Text style={[styles.buttonText, { color: colors.danger }]}>{label}</Text>
    </Pressable>
  );
}

/** Contenedor de campo (tarjeta blanca) con etiqueta y mensaje de error opcional. */
export function Field({
  label,
  error,
  children,
  style,
}: {
  label?: string;
  error?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, radii } = useTheme();
  return (
    <View
      style={[
        styles.field,
        { backgroundColor: colors.card, borderRadius: radii.field },
        error ? { borderWidth: 2, borderColor: colors.danger } : null,
        style,
      ]}
    >
      {label ? <Text style={[styles.fieldLabel, { color: colors.muted }]}>{label}</Text> : null}
      {children}
      {error ? (
        <Text style={[styles.error, { color: colors.danger }]} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function TextField({
  label,
  value,
  onChangeText,
  error,
  placeholder,
  keyboardType,
  testID,
  maxLength,
  secure,
  right,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  testID?: string;
  maxLength?: number;
  /** Oculta el valor (p. ej. el límite de crédito). */
  secure?: boolean;
  /** Control a la derecha del campo (p. ej. "Mostrar"). */
  right?: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <Field label={label} error={error}>
      <View style={styles.inputRow}>
        <TextInput
          testID={testID}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          keyboardType={keyboardType}
          maxLength={maxLength}
          accessibilityLabel={label}
          secureTextEntry={secure}
          style={[styles.input, styles.inputFlex, { color: colors.ink }]}
        />
        {right}
      </View>
    </Field>
  );
}

/** Fila de campo con texto a la izquierda y un control a la derecha. */
export function FieldRow({
  label,
  children,
  muted,
}: {
  label: string;
  children: ReactNode;
  muted?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.fieldRow}>
      <Text style={[styles.fieldRowLabel, { color: muted ? colors.muted : colors.ink }]}>
        {label}
      </Text>
      {children}
    </View>
  );
}

export function Switch({
  value,
  onValueChange,
  label,
  testID,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
  label: string;
  testID?: string;
}) {
  const theme = useTheme();
  return (
    <RNSwitch
      testID={testID}
      accessibilityLabel={label}
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: theme.colors.switchOff, true: theme.totals.thisMonth.from }}
      thumbColor="#FFFFFF"
      ios_backgroundColor={theme.colors.switchOff}
    />
  );
}

/** Etiqueta de sección en versalitas. */
export function SectionLabel({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  const { colors } = useTheme();
  return <Text style={[styles.section, { color: colors.muted }, style]}>{children}</Text>;
}

/** Chip de selección genérico (tipo, institución…). */
export function Chip({
  label,
  selected,
  onPress,
  background,
  color,
  left,
  dashed,
  testID,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  background?: string;
  color?: string;
  left?: ReactNode;
  dashed?: boolean;
  testID?: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={[
        styles.chip,
        {
          backgroundColor: background ?? colors.bg,
          borderColor: selected ? colors.ink : 'transparent',
        },
        dashed
          ? { borderStyle: 'dashed', borderColor: colors.muted, backgroundColor: 'transparent' }
          : null,
        left ? { paddingLeft: 5 } : null,
      ]}
    >
      {left}
      <Text style={[styles.chipText, { color: color ?? (dashed ? colors.muted : colors.ink) }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, alignSelf: 'flex-start' },
  pillText: { fontSize: 13, fontWeight: '700' },
  primary: {
    height: 58,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  plus: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  plusText: { fontSize: 20, fontWeight: '700', lineHeight: 22 },
  secondary: { height: 58, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 17, fontWeight: '700' },
  field: { paddingHorizontal: 16, paddingVertical: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
  input: { fontSize: 17, fontWeight: '600', paddingVertical: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inputFlex: { flex: 1 },
  error: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 34,
    gap: 12,
  },
  fieldRowLabel: { fontSize: 16, fontWeight: '600' },
  section: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginHorizontal: 4,
    marginBottom: 12,
  },
  chip: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chipText: { fontSize: 14, fontWeight: '700' },
});
