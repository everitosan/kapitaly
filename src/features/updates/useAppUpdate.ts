import { useEffect, useReducer } from 'react';
import { AppState, Linking } from 'react-native';

import {
  INITIAL_UPDATE_STATE,
  reduceUpdate,
  updateBanner,
  type UpdateBanner,
} from '@/domain/appUpdate';

import * as nativeUpdates from '../../../modules/kapitaly-shortcuts';

const PACKAGE = 'com.kapitaly.expenses';
/** Página de la app en Play Store: primero la app de Play, si no, el navegador. */
export const PLAY_STORE_URLS = [
  `market://details?id=${PACKAGE}`,
  `https://play.google.com/store/apps/details?id=${PACKAGE}`,
];

export interface AppUpdateDeps {
  updates?: Pick<
    typeof nativeUpdates,
    'checkUpdate' | 'startFlexibleUpdate' | 'completeUpdate' | 'onUpdateProgress'
  >;
  openUrl?: (url: string) => Promise<unknown>;
}

async function openPlayStore(openUrl: (url: string) => Promise<unknown>) {
  for (const url of PLAY_STORE_URLS) {
    try {
      await openUrl(url);
      return;
    } catch {
      // Siguiente opción.
    }
  }
}

/**
 * Aviso de actualización de Google Play (flujo flexible): consulta al abrir y al volver a la app,
 * sigue la descarga y expone las acciones de la tarjeta. La [x] solo vale en esta apertura.
 */
export function useAppUpdate({
  updates = nativeUpdates,
  openUrl = (url) => Linking.openURL(url),
}: AppUpdateDeps = {}): {
  banner: UpdateBanner | null;
  update: () => Promise<void>;
  restart: () => void;
  dismiss: () => void;
} {
  const [state, dispatch] = useReducer(reduceUpdate, INITIAL_UPDATE_STATE);

  useEffect(() => {
    let active = true;
    const check = () =>
      updates.checkUpdate().then((result) => {
        if (active) dispatch({ type: 'checked', check: result });
      });
    check();
    const stop = updates.onUpdateProgress((progress) => {
      if (progress.status === 'downloading')
        dispatch({
          type: 'progress',
          bytesDownloaded: progress.bytesDownloaded,
          totalBytes: progress.totalBytes,
        });
      else if (progress.status === 'downloaded') dispatch({ type: 'downloaded' });
      else if (progress.status === 'canceled' || progress.status === 'failed')
        dispatch({ type: 'canceled' });
    });
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') check();
    });
    return () => {
      active = false;
      stop();
      sub.remove();
    };
  }, [updates]);

  const update = async () => {
    const result = await updates.startFlexibleUpdate();
    if (result === 'canceled') dispatch({ type: 'canceled' });
    else if (result === 'failed') await openPlayStore(openUrl);
  };

  return {
    banner: updateBanner(state),
    update,
    restart: () => updates.completeUpdate(),
    dismiss: () => dispatch({ type: 'dismissed' }),
  };
}
