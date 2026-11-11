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
