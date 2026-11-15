import { act, render, screen } from '@testing-library/react-native';
import { processColor } from 'react-native';

import { BrandSplash, circleAt, SPLASH_DURATION } from '../BrandSplash';
import { CIRCLES, ORIGIN } from '../brandSplashArt';
import { ThemeProvider } from '../ThemeProvider';

describe('BrandSplash', () => {
  it('sin animación muestra los cuatro círculos completos y el texto, y avisa de inmediato', async () => {
    const onDone = jest.fn();
    await render(<BrandSplash animate={false} onDone={onDone} />);

    CIRCLES.forEach((circle, i) => {
      expect(Number(screen.getByTestId(`brand-splash-circle-${i}`).props.r)).toBeCloseTo(circle.r);
    });
    expect(screen.getByLabelText('KPTLY expenses')).toBeTruthy();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('hace aparecer los círculos del menor al mayor', () => {
    const byDelay = [...CIRCLES].sort((a, b) => a.delay - b.delay);
    const radii = byDelay.map((c) => c.r);
    expect(radii).toEqual([...radii].sort((a, b) => a - b));
  });

  it('cada círculo brota de la esquina inferior derecha del logo hasta su lugar del diseño', () => {
    CIRCLES.forEach((circle) => {
      expect(circleAt(circle, 0)).toEqual({ cx: ORIGIN.x, cy: ORIGIN.y, r: 0 });
      const end = circleAt(circle, 1);
      expect(end.cx).toBeCloseTo(circle.cx);
      expect(end.cy).toBeCloseTo(circle.cy);
      expect(end.r).toBeCloseTo(circle.r);
    });
  });

  it.each([
    ['light', '#F4F1EA', '#141414'],
    ['dark', '#020903', '#FFFFFF'],
  ] as const)('en tema %s usa fondo %s y texto %s', async (scheme, background, text) => {
    await render(
      <ThemeProvider scheme={scheme}>
        <BrandSplash animate={false} />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('brand-splash')).toHaveStyle({ backgroundColor: background });
    expect(screen.getByTestId('brand-splash-text').props.fill).toEqual({
      type: 0,
      payload: processColor(text),
    });
  });

  describe('con animación', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('avisa al terminar, después de ~1.1 s y antes de 1.5 s', async () => {
      const onDone = jest.fn();
      await render(<BrandSplash animate onDone={onDone} />);

      await act(async () => jest.advanceTimersByTime(1100));
      expect(onDone).not.toHaveBeenCalled();

      await act(async () => jest.advanceTimersByTime(400));
      expect(onDone).toHaveBeenCalledTimes(1);
      expect(SPLASH_DURATION).toBeLessThan(1500);
    });
  });
});
