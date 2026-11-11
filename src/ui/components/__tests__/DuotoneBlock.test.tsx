import { render, screen } from '@testing-library/react-native';
import { processColor, Text } from 'react-native';

import { lightTheme } from '../../theme';
import { ThemeProvider } from '../../ThemeProvider';
import { DuotoneBlock } from '../DuotoneBlock';

describe('DuotoneBlock', () => {
  it('pinta el degradado del token a 135° y muestra su contenido', async () => {
    await render(
      <ThemeProvider scheme="light">
        <DuotoneBlock testID="block" gradient={lightTheme.frequency.annual} radius={22}>
          <Text>Seguro del auto</Text>
        </DuotoneBlock>
      </ThemeProvider>,
    );
    const block = screen.getByTestId('block');
    const { from, to } = lightTheme.frequency.annual;
    expect(block.props.colors).toEqual([processColor(from), processColor(to)]);
    expect(block.props.startPoint).toEqual([0, 0]);
    expect(block.props.endPoint).toEqual([1, 1]);
    expect(screen.getByText('Seguro del auto')).toBeTruthy();
  });
});
