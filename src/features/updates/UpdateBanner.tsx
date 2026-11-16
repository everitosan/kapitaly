import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { UpdateBanner as Banner } from '@/domain/appUpdate';
import { DuotoneBlock } from '@/ui/components/DuotoneBlock';
import { useTheme } from '@/ui/ThemeProvider';

/** Tinta de los elementos oscuros del bloque (ícono, botón y barra), igual en ambos temas. */
const DARK = '#141414';

function UpIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 19V5M5 12l7-7 7 7"
        stroke={color}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Aviso de actualización arriba del mes: bloque amarillo limón con ícono, acción y avance. */
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
  const { update } = useTheme();

  const action = (label: string, onPress: () => void) => (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.action, { opacity: pressed ? 0.85 : 1 }]}
    >
      <Text style={[styles.actionText, { color: update.from }]}>{label}</Text>
    </Pressable>
  );

  let title: string;
  let detail: string | null = null;
  let button: ReactNode = null;
  let progress: number | null = null;
  if (banner.kind === 'available') {
    title = 'Nueva versión disponible';
    detail = banner.versionName;
    button = action('Actualizar', onUpdate);
  } else if (banner.kind === 'downloading') {
    title = `Descargando la nueva versión… ${banner.percent} %`;
    progress = banner.percent;
  } else {
    title = 'Lista para instalar';
    button = action('Reiniciar', onRestart);
  }

  return (
    <DuotoneBlock testID="update-banner" gradient={update} radius={22} style={styles.card}>
      <View style={styles.row}>
        <View
          testID="update-icon"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.icon}
        >
          <UpIcon color={update.from} />
        </View>
        <View style={styles.text}>
          <Text style={[styles.title, { color: update.text }]}>{title}</Text>
          {detail ? <Text style={[styles.detail, { color: update.text }]}>{detail}</Text> : null}
          {progress !== null ? (
            <View
              testID="update-progress"
              accessible
              accessibilityRole="progressbar"
              accessibilityLabel="Avance de la descarga"
              accessibilityValue={{ min: 0, max: 100, now: progress }}
              style={styles.track}
            >
              <View style={[styles.fill, { width: `${progress}%` }]} />
            </View>
          ) : null}
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
            <Text style={[styles.closeText, { color: update.text }]}>✕</Text>
          </Pressable>
        ) : null}
      </View>
    </DuotoneBlock>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: 10,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DARK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, minWidth: 0 },
  title: { fontSize: 16, fontWeight: '800' },
  detail: { fontSize: 12.5, fontWeight: '700', marginTop: 2, opacity: 0.7 },
  track: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(20,20,20,0.15)',
    marginTop: 8,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 999, backgroundColor: DARK },
  action: { borderRadius: 999, paddingHorizontal: 15, paddingVertical: 9, backgroundColor: DARK },
  actionText: { fontSize: 13.5, fontWeight: '800' },
  close: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', opacity: 0.6 },
  closeText: { fontSize: 14, fontWeight: '800' },
});
