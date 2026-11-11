import { act, fireEvent, render, renderHook, screen } from '@testing-library/react-native';
import { useState, type ReactNode } from 'react';
import { Pressable, Text } from 'react-native';

import { darkTheme, lightTheme } from '../theme';
import { ThemeProvider, useTheme } from '../ThemeProvider';

function Counter() {
  const theme = useTheme();
  const [n, setN] = useState(0);
  return (
    <Pressable onPress={() => setN((v) => v + 1)}>
      <Text>{`${theme.scheme}:${n}`}</Text>
    </Pressable>
  );
}

describe('ThemeProvider', () => {
  it('con el sistema en modo oscuro devuelve los tokens oscuros', async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ThemeProvider scheme="dark">{children}</ThemeProvider>
    );
    const { result } = await renderHook(() => useTheme(), { wrapper });
    expect(result.current).toBe(darkTheme);
  });

  it('por defecto (sistema claro o sin preferencia) usa el tema claro', async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );
    const { result } = await renderHook(() => useTheme(), { wrapper });
    expect(result.current).toBe(lightTheme);
  });

  it('cambiar de tema en caliente no desmonta la pantalla ni pierde su estado', async () => {
    const view = await render(
      <ThemeProvider scheme="light">
        <Counter />
      </ThemeProvider>,
    );
    await act(async () => {
      fireEvent.press(screen.getByText('light:0'));
    });
    expect(screen.getByText('light:1')).toBeTruthy();
    await view.rerender(
      <ThemeProvider scheme="dark">
        <Counter />
      </ThemeProvider>,
    );
    expect(screen.getByText('dark:1')).toBeTruthy();
  });
});
