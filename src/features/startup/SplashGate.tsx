import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { BrandSplash } from '@/ui/BrandSplash';
import { SPLASH_COLORS } from '@/ui/brandSplashArt';
import { useTheme } from '@/ui/ThemeProvider';

/**
 * Si el splash de marca ya se mostró en este proceso. Si la vista raíz se vuelve a montar en la misma
 * sesión (p. ej. Android recrea la actividad), no se repite.
 */
const session = { shown: false };

/** Solo para pruebas: simula un arranque nuevo de la app. */
export function resetSplashSession(): void {
  session.shown = false;
}

/** Fundido del splash hacia la app, en ms. */
export const SPLASH_FADE_MS = 200;

type Props = {
  /** La app puede mostrarse: migraciones terminadas, con éxito o con error. */
  ready: boolean;
  /** `false` muestra el splash en su estado final (atajo o reducir movimiento). */
  animate: boolean;
  children: ReactNode;
};

/**
 * Cubre la app con el splash de marca hasta que terminan la animación y la preparación de la app,
 * y entonces lo desvanece. Oculta el splash nativo en cuanto el de marca está pintado encima,
 * sobre el mismo fondo, para que el cambio no se note.
 */
export function SplashGate({ ready, animate, children }: Props) {
  // Se decide al montar: un segundo montaje en la misma sesión no muestra el splash.
  const [alreadyShown] = useState(() => session.shown);
  const [animationDone, setAnimationDone] = useState(false);
  const [visible, setVisible] = useState(true);
  const hiding = ready && animationDone;
  const opacity = useSharedValue(1);
  const { statusBar } = SPLASH_COLORS[useTheme().scheme];

  useEffect(() => {
    if (!hiding) return;
    opacity.value = withTiming(0, { duration: SPLASH_FADE_MS }, (finished) => {
      if (finished) scheduleOnRN(setVisible, false);
    });
  }, [hiding, opacity]);

  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  useEffect(() => {
    if (alreadyShown) SplashScreen.hide();
    else session.shown = true;
  }, [alreadyShown]);

  if (alreadyShown) return <View style={styles.root}>{children}</View>;

  return (
    <View style={styles.root}>
      {children}
      {visible && (
        <Animated.View
          testID="splash-gate"
          style={[StyleSheet.absoluteFill, fadeStyle]}
          pointerEvents={hiding ? 'none' : 'auto'}
          onLayout={() => SplashScreen.hide()}
        >
          <StatusBar style={statusBar} />
          <BrandSplash animate={animate} onDone={() => setAnimationDone(true)} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
