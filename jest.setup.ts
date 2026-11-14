// Áreas seguras simuladas (sin dispositivo en Jest).
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
// Hápticos: módulo nativo, sin efecto en pruebas.
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));
// Reanimated en Jest: animaciones con temporizadores de JS (usa con jest.useFakeTimers()).
require('react-native-reanimated').setUpTests();
// Notificaciones: módulo nativo; el mock guarda lo agendado en memoria (ver jest/expoNotificationsMock.js).
jest.mock('expo-notifications', () => require('./jest/expoNotificationsMock'));
// Comentarios: correo y selector de fotos son módulos nativos.
jest.mock('expo-mail-composer', () => ({
  isAvailableAsync: jest.fn(async () => true),
  composeAsync: jest.fn(async () => ({ status: 'sent' })),
}));
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: null })),
}));
