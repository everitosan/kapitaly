import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import type { Gradient } from '../theme';
import { useTheme } from '../ThemeProvider';

interface Props {
  gradient: Gradient;
  radius: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  testID?: string;
}

/**
 * Bloque de color del estilo A-1: degradado a 135° (arriba-izquierda → abajo-derecha) entre dos tonos,
 * con un brillo de 1 px en el borde superior (45% en claro, 35% en oscuro).
 */
export function DuotoneBlock({ gradient, radius, style, children, testID }: Props) {
  const { scheme } = useTheme();
  const highlight = scheme === 'dark' ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.45)';
  return (
    <LinearGradient
      testID={testID}
      colors={[gradient.from, gradient.to]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[{ borderRadius: radius, overflow: 'hidden' }, style]}
    >
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: radius, borderTopWidth: 1, borderColor: highlight },
        ]}
      />
      {children}
    </LinearGradient>
  );
}
