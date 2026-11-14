import { useEffect, useLayoutEffect, useRef } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import {
  BACKGROUND,
  CIRCLES,
  GRADIENT,
  LOGO_BOX,
  ORIGIN,
  TEXT_BOX,
  TEXT_PATH,
} from './brandSplashArt';

/** Tiempos de la variante C aprobada en la maqueta. */
export const SPLASH_TIMING = {
  circleDuration: 520,
  textDelay: 800,
  textDuration: 380,
  /** Desplazamiento inicial del texto, en unidades del diseño. */
  textRise: 14,
} as const;

/** Duración total de la animación en ms. */
export const SPLASH_DURATION = SPLASH_TIMING.textDelay + SPLASH_TIMING.textDuration;

const EASE = Easing.bezier(0.2, 0.8, 0.2, 1);
/** Ancho del cuadro del logo respecto al lienzo del diseño (224 / 402). */
const LOGO_WIDTH_RATIO = LOGO_BOX.size / 402;
/** Espacio entre el logo y el texto en el diseño. */
const TEXT_GAP = TEXT_BOX.y - (LOGO_BOX.y + LOGO_BOX.size);

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type CircleGeometry = { cx: number; cy: number; r: number };

/**
 * Círculo escalado por `s` (0 a 1) alrededor de ORIGIN: el centro se acerca a ese punto y el radio
 * se encoge en la misma proporción. Evita depender de `transform-origin` en SVG.
 */
export function circleAt({ cx, cy, r }: CircleGeometry, s: number): CircleGeometry {
  'worklet';
  return { cx: ORIGIN.x + s * (cx - ORIGIN.x), cy: ORIGIN.y + s * (cy - ORIGIN.y), r: s * r };
}

type Props = {
  /** `false` muestra el estado final de inmediato (atajo o movimiento reducido). */
  animate: boolean;
  /** Se llama una vez, cuando el splash llega a su estado final. */
  onDone?: () => void;
};

function GrowingCircle({ index, progress }: { index: number; progress: SharedValue<number> }) {
  const circle = CIRCLES[index];
  const animatedProps = useAnimatedProps(() => circleAt(circle, progress.value));
  return (
    <AnimatedCircle
      testID={`brand-splash-circle-${index}`}
      animatedProps={animatedProps}
      fill={`url(#brandSplashGradient${index})`}
    />
  );
}

/** Splash de marca: logo de círculos y "KPTLY expenses" sobre el fondo de la marca. */
export function BrandSplash({ animate, onDone }: Props) {
  const { width } = useWindowDimensions();
  const logoSize = width * LOGO_WIDTH_RATIO;
  const unit = logoSize / LOGO_BOX.size;

  const start = animate ? 0 : 1;
  const p0 = useSharedValue(start);
  const p1 = useSharedValue(start);
  const p2 = useSharedValue(start);
  const p3 = useSharedValue(start);
  const text = useSharedValue(start);
  const progress = [p0, p1, p2, p3];

  const onDoneRef = useRef(onDone);
  useLayoutEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    const finish = () => onDoneRef.current?.();
    if (!animate) {
      finish();
      return;
    }
    [p0, p1, p2, p3].forEach((value, i) => {
      value.value = withDelay(
        CIRCLES[i].delay,
        withTiming(1, { duration: SPLASH_TIMING.circleDuration, easing: EASE }),
      );
    });
    text.value = withDelay(
      SPLASH_TIMING.textDelay,
      withTiming(1, { duration: SPLASH_TIMING.textDuration, easing: EASE }, (finished) => {
        if (finished) scheduleOnRN(finish);
      }),
    );
    // Solo al montar: el splash se anima una vez por arranque.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const textStyle = useAnimatedStyle(() => ({
    opacity: text.value,
    transform: [{ translateY: (1 - text.value) * SPLASH_TIMING.textRise * unit }],
  }));

  return (
    <View style={styles.root} testID="brand-splash">
      <Svg
        width={logoSize}
        height={logoSize}
        viewBox={`${LOGO_BOX.x} ${LOGO_BOX.y} ${LOGO_BOX.size} ${LOGO_BOX.size}`}
      >
        <Defs>
          {CIRCLES.map((_, i) => (
            // Relativo a cada círculo: escala con él y, al final, coincide con el degradado del diseño.
            <LinearGradient key={i} id={`brandSplashGradient${i}`} x1="0.5" y1="0" x2="0.5" y2="1">
              <Stop offset="0" stopColor={GRADIENT.top} />
              <Stop offset="1" stopColor={GRADIENT.bottom} />
            </LinearGradient>
          ))}
          <ClipPath id="brandSplashClip">
            <Rect
              x={LOGO_BOX.x}
              y={LOGO_BOX.y}
              width={LOGO_BOX.size}
              height={LOGO_BOX.size}
              rx={LOGO_BOX.radius}
            />
          </ClipPath>
        </Defs>
        <G clipPath="url(#brandSplashClip)">
          {progress.map((value, i) => (
            <GrowingCircle key={i} index={i} progress={value} />
          ))}
        </G>
      </Svg>
      <Animated.View style={[{ marginTop: TEXT_GAP * unit }, textStyle]}>
        <Svg
          width={logoSize}
          height={TEXT_BOX.height * unit}
          viewBox={`${TEXT_BOX.x} ${TEXT_BOX.y} ${TEXT_BOX.width} ${TEXT_BOX.height}`}
          accessibilityLabel="KPTLY expenses"
        >
          <Path d={TEXT_PATH} fill="#FFFFFF" />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    backgroundColor: BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
