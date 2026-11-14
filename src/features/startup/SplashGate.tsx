import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { BrandSplash } from '@/ui/BrandSplash';

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
  const [animationDone, setAnimationDone] = useState(false);
  const [visible, setVisible] = useState(true);
  const hiding = ready && animationDone;
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (!hiding) return;
    opacity.value = withTiming(0, { duration: SPLASH_FADE_MS }, (finished) => {
      if (finished) scheduleOnRN(setVisible, false);
    });
  }, [hiding, opacity]);

  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

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
          <StatusBar style="light" />
          <BrandSplash animate={animate} onDone={() => setAnimationDone(true)} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
