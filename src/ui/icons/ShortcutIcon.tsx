import Svg, { Circle, ClipPath, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { SHORTCUT_ICON as ART } from '../shortcutIconArt';

/**
 * Ícono del acceso directo "Nuevo gasto", igual al que Android pone en la pantalla de inicio: el
 * área visible del ícono adaptativo, en un cuadro redondeado.
 */
export function ShortcutIcon({ size = 40, testID }: { size?: number; testID?: string }) {
  const offset = (ART.canvas - ART.visible) / 2;
  const { wallet } = ART;
  return (
    <Svg
      testID={testID}
      width={size}
      height={size}
      viewBox={`${offset} ${offset} ${ART.visible} ${ART.visible}`}
    >
      <Defs>
        <LinearGradient id="shortcutIconGradient" x1="0.5" y1="0" x2="0.5" y2="1">
          <Stop offset="0" stopColor={ART.gradient.top} />
          <Stop offset="1" stopColor={ART.gradient.bottom} />
        </LinearGradient>
        <ClipPath id="shortcutIconClip">
          <Rect x={offset} y={offset} width={ART.visible} height={ART.visible} rx={14} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#shortcutIconClip)">
        <Rect x={0} y={0} width={ART.canvas} height={ART.canvas} fill={ART.background} />
        {ART.circleRadii.map((r) => (
          <Circle key={r} cx={ART.center} cy={ART.center} r={r} fill="url(#shortcutIconGradient)" />
        ))}
        <G fill="none" stroke={wallet.stroke} strokeLinecap="round" strokeLinejoin="round">
          {wallet.paths.map((d) => (
            <Path key={d} d={d} strokeWidth={wallet.strokeWidth} />
          ))}
          <Circle
            cx={wallet.clasp.cx}
            cy={wallet.clasp.cy}
            r={wallet.clasp.r}
            strokeWidth={wallet.clasp.strokeWidth}
          />
          <Path d={wallet.clasp.line} strokeWidth={wallet.clasp.strokeWidth} />
        </G>
      </G>
    </Svg>
  );
}
