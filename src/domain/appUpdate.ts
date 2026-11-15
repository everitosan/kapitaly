/*
 * Aviso de actualización (Google Play, flujo flexible). Puro: el hook traduce la respuesta del módulo
 * nativo a eventos y la tarjeta muestra lo que devuelve `updateBanner`.
 */

export type UpdateStatus = 'none' | 'available' | 'downloading' | 'downloaded';

export interface UpdateState {
  status: UpdateStatus;
  /** "0.1.0-beta.7" si se puede derivar del versionCode. */
  versionName: string | null;
  /** 0–100 durante la descarga. */
  percent: number;
  /** La [x] en esta apertura: oculta "Nueva versión disponible". */
  dismissed: boolean;
}

export const INITIAL_UPDATE_STATE: UpdateState = {
  status: 'none',
  versionName: null,
  percent: 0,
  dismissed: false,
};

/** Lo que responde Play al consultar. */
export interface UpdateCheck {
  status: UpdateStatus;
  availableVersionCode: number | null;
  bytesDownloaded?: number;
  totalBytes?: number;
}

export type UpdateEvent =
  | { type: 'checked'; check: UpdateCheck }
  | { type: 'progress'; bytesDownloaded: number; totalBytes: number }
  | { type: 'downloaded' }
  /** El usuario canceló la confirmación de Google o la descarga falló: se vuelve a ofrecer. */
  | { type: 'canceled' }
  | { type: 'dismissed' };

const percentOf = (done = 0, total = 0) =>
  total > 0 ? Math.min(100, Math.max(0, Math.round((done / total) * 100))) : 0;

/**
 * Nombre de la versión a partir del versionCode del workflow (`X·1e6 + Y·1e4 + Z·100 + N`):
 * N de 1 a 98 es la beta N y 99 la estable. `null` si no sigue la fórmula.
 */
export function versionNameFromCode(code: number | null): string | null {
  if (code === null || !Number.isSafeInteger(code) || code <= 0) return null;
  const major = Math.floor(code / 1_000_000);
  const minor = Math.floor((code % 1_000_000) / 10_000);
  const patch = Math.floor((code % 10_000) / 100);
  const n = code % 100;
  const base = `${major}.${minor}.${patch}`;
  if (n === 99) return base;
  if (n >= 1 && n <= 98) return `${base}-beta.${n}`;
  return null;
}

export function reduceUpdate(state: UpdateState, event: UpdateEvent): UpdateState {
  switch (event.type) {
    case 'checked': {
      const { check } = event;
      const versionName = versionNameFromCode(check.availableVersionCode) ?? state.versionName;
      if (check.status === 'downloading')
        return {
          ...state,
          status: 'downloading',
          versionName,
          percent: percentOf(check.bytesDownloaded, check.totalBytes),
        };
      return { ...state, status: check.status, versionName, percent: 0 };
    }
    case 'progress':
      return {
        ...state,
        status: 'downloading',
        percent: percentOf(event.bytesDownloaded, event.totalBytes),
      };
    case 'downloaded':
      return { ...state, status: 'downloaded', percent: 100 };
    case 'canceled':
      return { ...state, status: 'available', percent: 0 };
    case 'dismissed':
      return state.status === 'available' ? { ...state, dismissed: true } : state;
  }
}

export type UpdateBanner =
  | { kind: 'available'; versionName: string | null }
  | { kind: 'downloading'; percent: number }
  | { kind: 'downloaded' };

/** Qué muestra la tarjeta, o `null` si nada. "Lista para instalar" no se puede ocultar. */
export function updateBanner(state: UpdateState): UpdateBanner | null {
  switch (state.status) {
    case 'available':
      return state.dismissed ? null : { kind: 'available', versionName: state.versionName };
    case 'downloading':
      return { kind: 'downloading', percent: state.percent };
    case 'downloaded':
      return { kind: 'downloaded' };
    default:
      return null;
  }
}
