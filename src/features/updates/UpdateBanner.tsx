import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { UpdateBanner as Banner } from '@/domain/appUpdate';
import { useTheme } from '@/ui/ThemeProvider';

/** Tarjeta del aviso de actualización, arriba del mes en el balance. */
export function UpdateBanner({
  banner,
  onUpdate,
  onRestart,
  onDismiss,
}: {
  banner: Banner;
  onUpdate: () => void;
  onRestart: () => void;
  onDismiss: () => void;
}) {
  const { colors, primary } = useTheme();

  const action = (label: string, onPress: () => void) => (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        { backgroundColor: primary.to, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <Text style={[styles.actionText, { color: primary.text }]}>{label}</Text>
    </Pressable>
  );

  let title: string;
  let detail: string | null = null;
  let button: React.ReactNode = null;
  if (banner.kind === 'available') {
    title = 'Nueva versión disponible';
    detail = banner.versionName;
    button = action('Actualizar', onUpdate);
  } else if (banner.kind === 'downloading') {
    title = `Descargando la nueva versión… ${banner.percent} %`;
  } else {
    title = 'Lista para instalar';
    button = action('Reiniciar', onRestart);
  }

  return (
    <View testID="update-banner" style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.text}>
        <Text style={[styles.title, { color: colors.ink }]}>{title}</Text>
        {detail ? <Text style={[styles.detail, { color: colors.muted }]}>{detail}</Text> : null}
      </View>
      {button}
      {banner.kind === 'available' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ocultar aviso de actualización"
          hitSlop={8}
          onPress={onDismiss}
          style={styles.close}
        >
          <Text style={[styles.closeText, { color: colors.muted }]}>✕</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 18,
    paddingVertical: 12,
    paddingLeft: 16,
    paddingRight: 10,
    marginBottom: 14,
  },
  text: { flex: 1, minWidth: 0 },
  title: { fontSize: 15, fontWeight: '800' },
  detail: { fontSize: 12.5, fontWeight: '600', marginTop: 2 },
  action: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  actionText: { fontSize: 13, fontWeight: '800' },
  close: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 14, fontWeight: '800' },
});
