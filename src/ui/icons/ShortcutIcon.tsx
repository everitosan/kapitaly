import Svg, { Circle, ClipPath, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { SHORTCUT_ICON as ART } from '../shortcutIconArt';

/**
 * Ícono del acceso directo "Nuevo gasto", igual al que Android pone en la pantalla de inicio: el
 * área visible del ícono adaptativo, en un cuadro redondeado.
 */
export function ShortcutIcon({ size = 40, testID }: { size?: number; testID?: string }) {
  const offset = (ART.canvas - ART.visible) / 2;
  const { field, wallet } = ART;
  const { scale, translateX, translateY } = wallet.transform;
  return (
    <Svg
      testID={testID}
      width={size}
      height={size}
      viewBox={`${offset} ${offset} ${ART.visible} ${ART.visible}`}
    >
      <Defs>
        <LinearGradient id="shortcutIconGradient" x1="0.5" y1="0" x2="0.5" y2="1">
          <Stop offset="0" stopColor={field.gradient.top} />
          <Stop offset="1" stopColor={field.gradient.bottom} />
        </LinearGradient>
        <ClipPath id="shortcutIconClip">
          <Rect x={offset} y={offset} width={ART.visible} height={ART.visible} rx={14} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#shortcutIconClip)">
        <Rect x={0} y={0} width={ART.canvas} height={ART.canvas} fill={ART.background} />
        <Circle cx={field.cx} cy={field.cy} r={field.r} fill="url(#shortcutIconGradient)" />
        <G
          transform={`translate(${translateX} ${translateY}) scale(${scale})`}
          fill="none"
          stroke={wallet.stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {wallet.paths.map((p) => (
            <Path key={p.d} d={p.d} strokeWidth={p.strokeWidth} />
          ))}
        </G>
      </G>
    </Svg>
  );
}
