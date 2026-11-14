/* global jest */
/**
 * Mock de expo-notifications para Jest (módulo nativo). Guarda en memoria lo agendado y el permiso
 * para que las pruebas revisen qué quedó programado. `__reset()` lo deja como en una instalación nueva.
 */
const state = {
  permission: { granted: false, canAskAgain: true, status: 'undetermined' },
  /** Respuesta del usuario al pedir permiso: 'granted' | 'denied'. */
  nextAnswer: 'granted',
  scheduled: [],
  channels: {},
  lastResponse: null,
  responseListeners: new Set(),
};

const permissionResult = () => ({ ...state.permission, expires: 'never' });

module.exports = {
  SchedulableTriggerInputTypes: {
    CALENDAR: 'calendar',
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    YEARLY: 'yearly',
    DATE: 'date',
    TIME_INTERVAL: 'timeInterval',
  },
  AndroidImportance: { DEFAULT: 3, HIGH: 4, LOW: 2, MAX: 5, MIN: 1, NONE: 0, UNSPECIFIED: -1000 },
  PermissionStatus: { GRANTED: 'granted', DENIED: 'denied', UNDETERMINED: 'undetermined' },
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(async (id, channel) => {
    state.channels[id] = channel;
    return channel;
  }),
  getPermissionsAsync: jest.fn(async () => permissionResult()),
  requestPermissionsAsync: jest.fn(async () => {
    if (state.permission.canAskAgain && state.permission.status !== 'granted') {
      const granted = state.nextAnswer === 'granted';
      state.permission = {
        granted,
        canAskAgain: granted,
        status: granted ? 'granted' : 'denied',
      };
    }
    return permissionResult();
  }),
  getAllScheduledNotificationsAsync: jest.fn(async () => state.scheduled.map((r) => ({ ...r }))),
  scheduleNotificationAsync: jest.fn(async (request) => {
    const identifier = request.identifier ?? `n${state.scheduled.length + 1}`;
    state.scheduled = state.scheduled.filter((r) => r.identifier !== identifier);
    state.scheduled.push({ identifier, content: request.content, trigger: request.trigger });
    return identifier;
  }),
  cancelScheduledNotificationAsync: jest.fn(async (identifier) => {
    state.scheduled = state.scheduled.filter((r) => r.identifier !== identifier);
  }),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => {
    state.scheduled = [];
  }),
  getLastNotificationResponse: jest.fn(() => state.lastResponse),
  clearLastNotificationResponse: jest.fn(() => {
    state.lastResponse = null;
  }),
  addNotificationResponseReceivedListener: jest.fn((listener) => {
    state.responseListeners.add(listener);
    return { remove: () => state.responseListeners.delete(listener) };
  }),

  /* ---- Solo para pruebas ---- */
  __state: state,
  __reset() {
    state.permission = { granted: false, canAskAgain: true, status: 'undetermined' };
    state.nextAnswer = 'granted';
    state.scheduled = [];
    state.channels = {};
    state.lastResponse = null;
    state.responseListeners.clear();
  },
  /** Simula que el usuario toca una notificación con la app abierta. */
  __tap(data) {
    const response = {
      notification: { request: { content: { data } } },
      actionIdentifier: 'default',
    };
    state.lastResponse = response;
    state.responseListeners.forEach((l) => l(response));
  },
};
