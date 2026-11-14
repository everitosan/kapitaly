import { fireEvent, screen, waitFor, within } from '@testing-library/react-native';

import { renderWithProviders } from '../../testUtils';
import { FeedbackScreen } from '../FeedbackScreen';

const DIAGNOSTICS = { version: '0.1.0-beta.6', device: 'Pixel 7 · Android 15' };

function setup({
  mailAvailable = true,
  picks = [] as (string[] | null)[],
}: { mailAvailable?: boolean; picks?: (string[] | null)[] } = {}) {
  const mail = {
    isAvailableAsync: jest.fn(async () => mailAvailable),
    composeAsync: jest.fn(async () => ({ status: 'sent' as const })),
  };
  const queue = [...picks];
  const picker = {
    launchImageLibraryAsync: jest.fn(async () => {
      const next = queue.shift() ?? null;
      return next === null
        ? { canceled: true as const, assets: null }
        : { canceled: false as const, assets: next.map((uri) => ({ uri, width: 1, height: 1 })) };
    }),
  };
  return { mail, picker };
}

async function open(deps: ReturnType<typeof setup>) {
  await renderWithProviders(
    <FeedbackScreen
      onBack={jest.fn()}
      mail={deps.mail as never}
      picker={deps.picker as never}
      diagnostics={() => DIAGNOSTICS}
    />,
  );
  await waitFor(() => expect(deps.mail.isAvailableAsync).toHaveBeenCalled());
}

const sendButton = () => screen.getByTestId('feedback-send');
const shotCount = () => screen.queryAllByLabelText(/^Quitar captura/).length;

describe('Comentarios', () => {
  it('sin texto no se puede enviar y el contador está en cero', async () => {
    await open(setup());
    expect(screen.getByTestId('feedback-count')).toHaveTextContent('0 / 2,000');
    expect(sendButton()).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText('Tu comentario'), '   ');
    expect(sendButton()).toBeDisabled();
  });

  it('limita el texto a 2,000 caracteres', async () => {
    await open(setup());
    expect(screen.getByLabelText('Tu comentario')).toHaveProp('maxLength', 2000);
    await fireEvent.changeText(screen.getByLabelText('Tu comentario'), 'Hola');
    expect(screen.getByTestId('feedback-count')).toHaveTextContent('4 / 2,000');
    expect(sendButton()).toBeEnabled();
  });

  it('avisa qué datos de diagnóstico se agregan', async () => {
    await open(setup());
    expect(screen.getByText(/versión 0\.1\.0-beta\.6/)).toBeOnTheScreen();
    expect(screen.getByText(/Pixel 7 · Android 15/)).toBeOnTheScreen();
  });

  describe('capturas', () => {
    it('agrega y quita', async () => {
      const deps = setup({ picks: [['file:///a.jpg', 'file:///b.jpg']] });
      await open(deps);
      await fireEvent.press(screen.getByLabelText('Agregar captura'));
      await waitFor(() => expect(shotCount()).toBe(2));
      expect(deps.picker.launchImageLibraryAsync).toHaveBeenCalledWith(
        expect.objectContaining({ allowsMultipleSelection: true, selectionLimit: 3 }),
      );
      await fireEvent.press(screen.getByLabelText('Quitar captura 1'));
      expect(shotCount()).toBe(1);
      expect(screen.getByLabelText('Agregar captura')).toBeOnTheScreen();
    });

    it('con 3 ya no ofrece agregar y solo pide las que faltan', async () => {
      const deps = setup({ picks: [['file:///a.jpg'], ['file:///b.jpg', 'file:///c.jpg']] });
      await open(deps);
      await fireEvent.press(screen.getByLabelText('Agregar captura'));
      await waitFor(() => expect(shotCount()).toBe(1));
      await fireEvent.press(screen.getByLabelText('Agregar captura'));
      await waitFor(() => expect(shotCount()).toBe(3));
      expect(deps.picker.launchImageLibraryAsync).toHaveBeenLastCalledWith(
        expect.objectContaining({ selectionLimit: 2 }),
      );
      expect(screen.queryByLabelText('Agregar captura')).not.toBeOnTheScreen();
    });

    it('cancelar el selector no cambia nada', async () => {
      const deps = setup({ picks: [null] });
      await open(deps);
      await fireEvent.press(screen.getByLabelText('Agregar captura'));
      await waitFor(() => expect(deps.picker.launchImageLibraryAsync).toHaveBeenCalled());
      expect(shotCount()).toBe(0);
    });
  });

  describe('enviar', () => {
    it('abre el correo listo y conserva el formulario', async () => {
      const deps = setup({ picks: [['file:///cache/captura.jpg']] });
      await open(deps);
      await fireEvent.changeText(
        screen.getByLabelText('Tu comentario'),
        'No se marca la variante digital',
      );
      await fireEvent.press(screen.getByLabelText('Agregar captura'));
      await waitFor(() => expect(shotCount()).toBe(1));
      await fireEvent.press(sendButton());

      await waitFor(() =>
        expect(deps.mail.composeAsync).toHaveBeenCalledWith({
          recipients: ['eve.san.dev@gmail.com'],
          subject: 'Comentarios · KPTLY expenses 0.1.0-beta.6',
          body: 'No se marca la variante digital\n\n—\nVersión: 0.1.0-beta.6\nTeléfono: Pixel 7 · Android 15',
          attachments: ['file:///cache/captura.jpg'],
        }),
      );
      expect(await screen.findByTestId('feedback-opened')).toHaveTextContent(
        'Se abrió tu correo para enviar los comentarios',
      );
      expect(screen.getByLabelText('Tu comentario')).toHaveProp(
        'value',
        'No se marca la variante digital',
      );
      expect(shotCount()).toBe(1);
    });

    it('sin app de correo avisa y no deja enviar', async () => {
      await open(setup({ mailAvailable: false }));
      const notice = await screen.findByTestId('feedback-no-mail');
      expect(within(notice).getByText('No hay una app de correo')).toBeOnTheScreen();
      await fireEvent.changeText(screen.getByLabelText('Tu comentario'), 'Hola');
      expect(sendButton()).toBeDisabled();
      expect(screen.getByLabelText('Tu comentario')).toHaveProp('value', 'Hola');
    });
  });
});
