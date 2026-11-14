import { act, render } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';

import { NotificationRouter } from '../NotificationRouter';

const mockRouter = { push: jest.fn(), navigate: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

const mock = Notifications as unknown as {
  __reset: () => void;
  __tap: (data: unknown) => void;
  __state: { lastResponse: unknown };
};

beforeEach(() => {
  mock.__reset();
  mockRouter.push.mockClear();
  mockRouter.navigate.mockClear();
});

describe('al tocar una notificación', () => {
  it('el recordatorio de gastos abre "Nuevo gasto" como el atajo', async () => {
    await render(<NotificationRouter />);
    await act(async () => mock.__tap({ target: 'new-expense' }));
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/expense/new',
      params: { quick: '1' },
    });
  });

  it('el aviso de cobros abre el balance con la hoja de Pendientes', async () => {
    await render(<NotificationRouter />);
    await act(async () => mock.__tap({ target: 'pending' }));
    expect(mockRouter.navigate).toHaveBeenCalledWith({
      pathname: '/',
      params: { pending: expect.any(String) },
    });
  });

  it('atiende la notificación que abrió la app y no la repite', async () => {
    mock.__state.lastResponse = {
      notification: { request: { content: { data: { target: 'new-expense' } } } },
    };
    const view = await render(<NotificationRouter />);
    expect(mockRouter.push).toHaveBeenCalledTimes(1);
    expect(mock.__state.lastResponse).toBeNull();
    await view.unmount();
    await render(<NotificationRouter />);
    expect(mockRouter.push).toHaveBeenCalledTimes(1);
  });

  it('ignora notificaciones ajenas', async () => {
    await render(<NotificationRouter />);
    await act(async () => mock.__tap({ otra: true }));
    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });
});
