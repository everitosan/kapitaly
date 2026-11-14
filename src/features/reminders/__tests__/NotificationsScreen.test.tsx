import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { Linking } from 'react-native';

import { testDeps } from '@/data/repositories/contract';
import {
  createInMemoryRepositories,
  type InMemoryRepositories,
} from '@/data/repositories/inMemory';
import { DEFAULT_REMINDER_SETTINGS } from '@/domain/reminderSettings';

import { renderWithProviders } from '../../testUtils';
import { NotificationsScreen } from '../NotificationsScreen';

const mock = Notifications as unknown as {
  __reset: () => void;
  __state: {
    permission: { granted: boolean; canAskAgain: boolean; status: string };
    nextAnswer: 'granted' | 'denied';
  };
};

const grant = () => {
  mock.__state.permission = { granted: true, canAskAgain: true, status: 'granted' };
};
const block = () => {
  mock.__state.permission = { granted: false, canAskAgain: false, status: 'denied' };
};

async function open(repos: InMemoryRepositories = createInMemoryRepositories(testDeps())) {
  await renderWithProviders(<NotificationsScreen onBack={jest.fn()} />, { repos });
  await screen.findByText('Avisar el día del cobro');
  return repos;
}

const toggle = (label: string, on = true) =>
  fireEvent(screen.getByLabelText(label), 'valueChange', on);

/** Elige una hora en el selector nativo abierto desde la fila `testID`. */
async function pickTime(testID: string, hour: number, minute: number) {
  await fireEvent.press(screen.getByTestId(testID));
  const date = new Date(2000, 0, 1, hour, minute);
  await fireEvent(
    screen.getByTestId(`${testID}-picker`),
    'change',
    { type: 'set', nativeEvent: { timestamp: date.getTime(), utcOffset: 0 } },
    date,
  );
}

beforeEach(() => mock.__reset());

describe('Notificaciones', () => {
  it('la primera vez todo está apagado y sin horas', async () => {
    await open();
    for (const label of ['Avisar el día del cobro', 'Recordatorio diario', 'Desuso'])
      expect(screen.getByLabelText(label)).toHaveProp('value', false);
    expect(screen.queryByText('Hora')).not.toBeOnTheScreen();
    expect(
      screen.getByText('Te avisaré en base a tus gastos recurrentes y vencimientos de tarjetas'),
    ).toBeOnTheScreen();
    expect(
      screen.getByText('Configúralo para que no se te pase ningún gasto del día'),
    ).toBeOnTheScreen();
    expect(
      screen.getByText('Te recordaré después de varios días en que no registres nada'),
    ).toBeOnTheScreen();
  });

  it('al encender pide el permiso; concedido, queda encendido con su hora', async () => {
    const repos = await open();
    await toggle('Recordatorio diario');
    await waitFor(async () => expect((await repos.reminderSettings.get()).dailyOn).toBe(true));
    expect(await screen.findByLabelText('Hora: 21:00')).toBeOnTheScreen();
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
  });

  it('con el permiso negado no se enciende y explica cómo habilitarlo', async () => {
    mock.__state.nextAnswer = 'denied';
    const repos = await open();
    await toggle('Recordatorio diario');
    expect(await screen.findByText('Notificaciones bloqueadas')).toBeOnTheScreen();
    expect(screen.getByLabelText('Recordatorio diario')).toHaveProp('value', false);
    expect(await repos.reminderSettings.get()).toEqual(DEFAULT_REMINDER_SETTINGS);

    const openSettings = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
    await fireEvent.press(screen.getByText('Abrir ajustes del sistema'));
    expect(openSettings).toHaveBeenCalled();
  });

  it('si el permiso se revocó en el sistema, lo muestra bloqueado sin apagar las preferencias', async () => {
    block();
    const repos = createInMemoryRepositories(testDeps());
    await repos.reminderSettings.update({ dailyOn: true });
    await open(repos);
    expect(await screen.findByTestId('notifications-blocked')).toBeOnTheScreen();
    expect(screen.getByLabelText('Recordatorio diario')).toHaveProp('value', false);
    expect((await repos.reminderSettings.get()).dailyOn).toBe(true);
  });

  it('cambia la hora del aviso de cobros', async () => {
    grant();
    const repos = createInMemoryRepositories(testDeps());
    await repos.reminderSettings.update({ chargesOn: true });
    await open(repos);
    await pickTime('charges-time', 9, 30);
    await waitFor(async () =>
      expect((await repos.reminderSettings.get()).chargesTime).toBe('09:30'),
    );
  });

  describe('desuso', () => {
    let repos: InMemoryRepositories;
    beforeEach(async () => {
      grant();
      repos = createInMemoryRepositories(testDeps());
      await repos.reminderSettings.update({ dailyOn: true, idleOn: true });
      await open(repos);
    });

    it('usa la hora del recordatorio diario y la sigue si cambia', async () => {
      expect(screen.getByText('La del recordatorio diario')).toBeOnTheScreen();
      await pickTime('daily-time', 20, 30);
      await waitFor(() => expect(screen.getAllByLabelText('Hora: 20:30')).toHaveLength(2));
      expect(screen.getByText(/te avisaré a las 20:30; repito a los 6 y 9 días/)).toBeOnTheScreen();
    });

    it('con hora propia la usa y ofrece volver a la del diario', async () => {
      await pickTime('idle-time', 8, 0);
      expect(await screen.findByText('Hora propia')).toBeOnTheScreen();
      expect((await repos.reminderSettings.get()).idleTime).toBe('08:00');
      await fireEvent.press(screen.getByText('Usar la del recordatorio diario'));
      await waitFor(async () => expect((await repos.reminderSettings.get()).idleTime).toBeNull());
      expect(await screen.findByText('La del recordatorio diario')).toBeOnTheScreen();
    });

    it('ajusta los días entre 1 y 14', async () => {
      expect(screen.getByTestId('idle-days')).toHaveTextContent('3 días');
      await fireEvent.press(screen.getByLabelText('Más días'));
      await waitFor(() => expect(screen.getByTestId('idle-days')).toHaveTextContent('4 días'));
      await repos.reminderSettings.update({ idleDays: 1 });
      await waitFor(() => expect(screen.getByTestId('idle-days')).toHaveTextContent('1 día'));
      expect(screen.getByLabelText('Menos días')).toBeDisabled();
    });
  });
});
