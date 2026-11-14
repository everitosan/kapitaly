import {
  buildBody,
  buildSubject,
  canSend,
  describeDevice,
  FEEDBACK_MAX_SHOTS,
  FEEDBACK_MAX_TEXT,
  remainingShots,
} from '../feedback';

describe('comentarios', () => {
  it('límites del formulario', () => {
    expect(FEEDBACK_MAX_TEXT).toBe(2000);
    expect(FEEDBACK_MAX_SHOTS).toBe(3);
    expect(remainingShots(0)).toBe(3);
    expect(remainingShots(2)).toBe(1);
    expect(remainingShots(3)).toBe(0);
  });

  it('solo se envía con texto y con app de correo', () => {
    expect(canSend('', true)).toBe(false);
    expect(canSend('   \n ', true)).toBe(false);
    expect(canSend('Falla la campana', true)).toBe(true);
    expect(canSend('Falla la campana', false)).toBe(false);
  });

  it('asunto con la versión', () => {
    expect(buildSubject('0.1.0-beta.6')).toBe('Comentarios · KPTLY expenses 0.1.0-beta.6');
  });

  it('cuerpo con el texto recortado y el diagnóstico al final', () => {
    expect(
      buildBody('  No se marca la variante digital \n', {
        version: '0.1.0-beta.6',
        device: 'Pixel 7 · Android 15',
      }),
    ).toBe(
      'No se marca la variante digital\n\n—\nVersión: 0.1.0-beta.6\nTeléfono: Pixel 7 · Android 15',
    );
  });

  it('describe el teléfono, con o sin modelo', () => {
    expect(describeDevice('Pixel 7', 'Android', '15')).toBe('Pixel 7 · Android 15');
    expect(describeDevice(null, 'Android', '15')).toBe('Android 15');
    expect(describeDevice(null, null, null)).toBe('Sistema desconocido');
  });
});
