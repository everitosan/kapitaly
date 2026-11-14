import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { describeDevice, type FeedbackDiagnostics } from '@/domain/feedback';

const SYSTEM_NAMES: Partial<Record<typeof Platform.OS, string>> = {
  android: 'Android',
  ios: 'iOS',
};

/**
 * Versión de la app (la del build: en una beta, "0.1.0-beta.N") y el teléfono. El nombre del sistema
 * sale de la plataforma: en algunos Android `Device.osName` es la huella completa del sistema.
 */
export function feedbackDiagnostics(): FeedbackDiagnostics {
  return {
    version: Constants.expoConfig?.version ?? 'desconocida',
    device: describeDevice(
      Device.modelName,
      SYSTEM_NAMES[Platform.OS] ?? Platform.OS,
      Device.osVersion,
    ),
  };
}
