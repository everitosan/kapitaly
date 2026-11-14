/*
 * Comentarios de la beta: reglas del formulario y armado del correo. Puro: el envío lo hace la app
 * de correo del teléfono (ver src/features/feedback).
 */

export const FEEDBACK_MAX_TEXT = 2000;
export const FEEDBACK_MAX_SHOTS = 3;

export interface FeedbackDiagnostics {
  /** Versión de la app, p. ej. "0.1.0-beta.6". */
  version: string;
  /** Modelo y sistema, p. ej. "Pixel 7 · Android 15". */
  device: string;
}

/** Solo se envía con texto (no basta con espacios) y con una app de correo disponible. */
export const canSend = (text: string, mailAvailable: boolean): boolean =>
  mailAvailable && text.trim().length > 0;

export const buildSubject = (version: string): string => `Comentarios · KPTLY expenses ${version}`;

/** Texto del usuario y, al final, los datos de diagnóstico. */
export function buildBody(text: string, diagnostics: FeedbackDiagnostics): string {
  return [
    text.trim(),
    '',
    '—',
    `Versión: ${diagnostics.version}`,
    `Teléfono: ${diagnostics.device}`,
  ].join('\n');
}

/** "Pixel 7 · Android 15"; sin modelo, solo el sistema. */
export function describeDevice(
  model: string | null,
  osName: string | null,
  osVersion: string | null,
): string {
  const system = [osName, osVersion].filter(Boolean).join(' ') || 'Sistema desconocido';
  return model ? `${model} · ${system}` : system;
}

/** Cuántas capturas más se pueden agregar. */
export const remainingShots = (current: number): number =>
  Math.max(0, FEEDBACK_MAX_SHOTS - current);
