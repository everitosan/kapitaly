import { act, render, screen } from '@testing-library/react-native';
import { Keyboard, Platform, Text } from 'react-native';

import { ThemeProvider } from '../../ThemeProvider';
import { ScreenLayout, SheetLayout } from '../layout';

/** Captura los listeners del teclado para simular que aparece y desaparece. */
function mockKeyboard() {
  const listeners: Record<string, () => void> = {};
  jest.spyOn(Keyboard, 'addListener').mockImplementation(((event: string, cb: () => void) => {
    listeners[event] = cb;
    return { remove: jest.fn() };
  }) as unknown as typeof Keyboard.addListener);
  return listeners;
}

const ui = (
  <ThemeProvider scheme="light">
    <SheetLayout title="Nuevo gasto" onLeft={jest.fn()} footer={<Text>Guardar</Text>}>
      <Text>Contenido</Text>
    </SheetLayout>
  </ThemeProvider>
);

describe('SheetLayout con el teclado', () => {
  const originalOS = Platform.OS;
  afterEach(() => {
    Platform.OS = originalOS;
    jest.restoreAllMocks();
  });

  it('en Android oculta el botón fijo mientras el teclado está abierto', async () => {
    Platform.OS = 'android';
    const kb = mockKeyboard();
    await render(ui);
    expect(screen.getByText('Guardar')).toBeOnTheScreen();
    await act(async () => kb.keyboardDidShow());
    expect(screen.queryByText('Guardar')).not.toBeOnTheScreen();
    await act(async () => kb.keyboardDidHide());
    expect(screen.getByText('Guardar')).toBeOnTheScreen();
  });

  it('en iOS lo deja (el teclado ya lo cubre)', async () => {
    Platform.OS = 'ios';
    const kb = mockKeyboard();
    await render(ui);
    await act(async () => kb.keyboardDidShow());
    expect(screen.getByText('Guardar')).toBeOnTheScreen();
  });
});

describe('ScreenLayout con el teclado', () => {
  afterEach(() => jest.restoreAllMocks());

  it('oculta el botón flotante mientras se escribe y lo regresa al cerrar el teclado', async () => {
    const kb = mockKeyboard();
    await render(
      <ThemeProvider scheme="light">
        <ScreenLayout footer={<Text>Agregar gasto</Text>}>
          <Text>Lista</Text>
        </ScreenLayout>
      </ThemeProvider>,
    );
    expect(screen.getByText('Agregar gasto')).toBeOnTheScreen();
    await act(async () => kb.keyboardDidShow());
    expect(screen.queryByText('Agregar gasto')).not.toBeOnTheScreen();
    expect(screen.getByText('Lista')).toBeOnTheScreen();
    await act(async () => kb.keyboardDidHide());
    expect(screen.getByText('Agregar gasto')).toBeOnTheScreen();
  });
});
