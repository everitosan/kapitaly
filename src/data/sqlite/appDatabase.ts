import { openAppDatabase } from './openDatabase';

let instance: ReturnType<typeof openAppDatabase> | null = null;

/** Base local de la app (una sola conexión por proceso). */
export function getAppDatabase() {
  if (!instance) instance = openAppDatabase();
  return instance;
}
