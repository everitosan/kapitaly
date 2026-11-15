import { fireEvent, screen, within } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { sampleMethod, testDeps } from '@/data/repositories/contract';
import { createInMemoryRepositories } from '@/data/repositories/inMemory';
import { BUILTIN_CATEGORIES } from '@/domain/category';

import { renderWithProviders } from '../../testUtils';
import { SettingsScreen } from '../SettingsScreen';

jest.mock('../../../../modules/kapitaly-shortcuts', () => ({
  isPinSupported: jest.fn(() => false),
  requestPinNewExpense: jest.fn(() => false),
}));

const props = () => ({
  onBack: jest.fn(),
  onOpenMethods: jest.fn(),
  onOpenCategories: jest.fn(),
  onOpenNotifications: jest.fn(),
  onOpenFeedback: jest.fn(),
});

describe('Ajustes', () => {
  it('muestra "Métodos de pago", "Categorías" y "Notificaciones", con sus conteos', async () => {
    const repos = createInMemoryRepositories(testDeps());
    await repos.paymentMethods.create(sampleMethod());
    await repos.categories.hide(BUILTIN_CATEGORIES[5].id);
    await renderWithProviders(<SettingsScreen {...props()} />, { repos });
    expect(await screen.findByRole('button', { name: 'Métodos de pago, 2' })).toBeOnTheScreen();
    expect(await screen.findByRole('button', { name: 'Categorías, 7' })).toBeOnTheScreen();
    expect(screen.getAllByRole('button').map((b) => b.props.accessibilityLabel)).toEqual([
      'Volver',
      'Métodos de pago, 2',
      'Categorías, 7',
      'Notificaciones, Apagadas',
      'Comentarios',
    ]);
    expect(screen.getByText('Beta')).toBeOnTheScreen();
    // Los recordatorios solo viven dentro de "Notificaciones".
    expect(screen.queryByText(/^recordatorios$/i)).toBeNull();
    expect(screen.getByText('Configura alertas y recordatorios')).toBeOnTheScreen();
    expect(screen.getByText('Apagadas')).toBeOnTheScreen();
    expect(screen.getByText('Clasifica a tu gusto cada pago que registras')).toBeOnTheScreen();
    expect(screen.queryByText(/componentes/i)).toBeNull();
  });

  it('abre métodos de pago y categorías', async () => {
    const p = props();
    await renderWithProviders(<SettingsScreen {...p} />);
    await fireEvent.press(await screen.findByText('Métodos de pago'));
    await fireEvent.press(screen.getByText('Categorías'));
    expect(p.onOpenMethods).toHaveBeenCalled();
    expect(p.onOpenCategories).toHaveBeenCalled();
  });
});

describe('Notificaciones en Ajustes', () => {
  it('resume cuántos avisos están encendidos', async () => {
    const repos = createInMemoryRepositories(testDeps());
    await repos.reminderSettings.update({ dailyOn: true, idleOn: true });
    await renderWithProviders(<SettingsScreen {...props()} />, { repos });
    expect(
      await screen.findByRole('button', { name: 'Notificaciones, 2 activas' }),
    ).toBeOnTheScreen();
    await repos.reminderSettings.update({ idleOn: false });
    expect(await screen.findByText('1 activa')).toBeOnTheScreen();
  });

  it('abre la pantalla de Notificaciones', async () => {
    const p = props();
    await renderWithProviders(<SettingsScreen {...p} />);
    await fireEvent.press(await screen.findByText('Notificaciones'));
    expect(p.onOpenNotifications).toHaveBeenCalled();
  });
});

describe('Comentarios en Ajustes', () => {
  it('abre la pantalla de Comentarios desde la sección Beta', async () => {
    const p = props();
    await renderWithProviders(<SettingsScreen {...p} />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Comentarios' }));
    expect(p.onOpenFeedback).toHaveBeenCalled();
  });
});

describe('acceso directo "Nuevo gasto"', () => {
  const shortcuts = jest.requireMock('../../../../modules/kapitaly-shortcuts') as {
    isPinSupported: jest.Mock;
    requestPinNewExpense: jest.Mock;
  };

  it('no aparece si el dispositivo no puede fijar accesos directos', async () => {
    shortcuts.isPinSupported.mockReturnValue(false);
    await renderWithProviders(<SettingsScreen {...props()} />);
    expect(await screen.findByText('Categorías')).toBeOnTheScreen();
    expect(screen.queryByText('Acceso directo: nuevo gasto')).toBeNull();
  });

  it('aparece debajo de Notificaciones y pide a Android fijarlo', async () => {
    shortcuts.isPinSupported.mockReturnValue(true);
    shortcuts.requestPinNewExpense.mockReturnValue(true);
    await renderWithProviders(<SettingsScreen {...props()} />);
    expect(
      screen
        .getAllByRole('button')
        .map((b) => b.props.accessibilityLabel)
        .slice(-3),
    ).toEqual(['Notificaciones, Apagadas', 'Acceso directo: nuevo gasto', 'Comentarios']);
    await fireEvent.press(screen.getByText('Acceso directo: nuevo gasto'));
    expect(shortcuts.requestPinNewExpense).toHaveBeenCalled();
  });

  it('muestra el mismo ícono que el acceso directo', async () => {
    shortcuts.isPinSupported.mockReturnValue(true);
    await renderWithProviders(<SettingsScreen {...props()} />);
    const row = screen.getByRole('button', { name: 'Acceso directo: nuevo gasto' });
    expect(within(row).getByTestId('shortcut-icon')).toBeOnTheScreen();
  });

  it('avisa si el sistema rechaza la petición', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    shortcuts.isPinSupported.mockReturnValue(true);
    shortcuts.requestPinNewExpense.mockReturnValue(false);
    await renderWithProviders(<SettingsScreen {...props()} />);
    await fireEvent.press(screen.getByText('Acceso directo: nuevo gasto'));
    expect(alert).toHaveBeenCalledWith(
      'No se pudo agregar',
      'Tu pantalla de inicio no permite agregar accesos directos.',
    );
    alert.mockRestore();
  });
});
