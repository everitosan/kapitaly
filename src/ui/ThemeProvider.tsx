import { createContext, useContext, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { themes, type ColorSchemeName, type Theme } from './theme';

const ThemeContext = createContext<Theme>(themes.light);

/**
 * Sigue el tema del sistema (claro u oscuro) y cambia en caliente sin desmontar la pantalla:
 * solo cambia el valor del contexto. `scheme` permite fijarlo (pantalla de muestra y pruebas).
 */
export function ThemeProvider({
  children,
  scheme,
}: {
  children: ReactNode;
  scheme?: ColorSchemeName;
}) {
  const system = useColorScheme();
  const name: ColorSchemeName = scheme ?? (system === 'dark' ? 'dark' : 'light');
  return <ThemeContext.Provider value={themes[name]}>{children}</ThemeContext.Provider>;
}

export const useTheme = (): Theme => useContext(ThemeContext);
