import { render, screen } from '@testing-library/react-native';

import { CATEGORY_ICON_KEYS } from '@/domain/category';

import { CATEGORY_ICONS, CategoryIcon } from '../categoryIcons';

it('toda clave del dominio tiene ícono y no hay íconos sin clave', () => {
  expect(Object.keys(CATEGORY_ICONS).sort()).toEqual([...CATEGORY_ICON_KEYS].sort());
  for (const key of CATEGORY_ICON_KEYS) expect(CATEGORY_ICONS[key].length).toBeGreaterThan(0);
});

it('dibuja una clave desconocida con el ícono de "Otro"', async () => {
  await render(<CategoryIcon icon="no-existe" color="#000" testID="icono" />);
  expect(screen.getByTestId('icono')).toBeOnTheScreen();
});
