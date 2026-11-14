import { Platform } from 'react-native';

import { feedbackDiagnostics } from '../diagnostics';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { version: '0.1.0-beta.6' } },
}));
jest.mock('expo-device', () => ({
  modelName: 'Pixel 7',
  osName: 'google/panther/…',
  osVersion: '15',
}));

describe('feedbackDiagnostics', () => {
  it('reúne la versión de la app y el teléfono', () => {
    const original = Platform.OS;
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    expect(feedbackDiagnostics()).toEqual({
      version: '0.1.0-beta.6',
      device: 'Pixel 7 · Android 15',
    });
    Object.defineProperty(Platform, 'OS', { value: original, configurable: true });
  });
});
