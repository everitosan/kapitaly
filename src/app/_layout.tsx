import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { getAppRepositories } from '@/data/appRepositories';
import { getAppDatabase } from '@/data/sqlite/appDatabase';
import { NotificationRouter } from '@/features/reminders/NotificationRouter';
import { configureNotificationHandler, targetOf } from '@/features/reminders/scheduler';
import { ReminderSync } from '@/features/reminders/useReminderSync';
import { RepositoryProvider } from '@/features/repositories';
import { SplashGate } from '@/features/startup/SplashGate';
import { shouldAnimateSplash } from '@/features/startup/splashRules';
import { ThemeProvider, useTheme } from '@/ui/ThemeProvider';

import migrations from '../../drizzle/migrations';

/** Al abrir una ruta por enlace profundo (p. ej. el acceso directo "Nuevo gasto"), el balance queda debajo. */
export const unstable_settings = { anchor: 'index' };

// El splash nativo (solo el fondo de marca) sigue visible hasta que SplashGate pinta el animado.
SplashScreen.preventAutoHideAsync();
// Las notificaciones se muestran también con la app abierta.
configureNotificationHandler();

function MigrationError({ error }: { error: Error }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.center, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.ink }]}>
        No se pudo preparar la base de datos
      </Text>
      <Text style={[styles.detail, { color: colors.muted }]}>{error.message}</Text>
    </View>
  );
}

function AppStack() {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="settings/index" />
      <Stack.Screen name="settings/notifications" />
      <Stack.Screen name="categories/index" />
      <Stack.Screen name="categories/[id]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="payment-methods/index" />
      <Stack.Screen name="payment-methods/[id]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="expense/new" options={{ presentation: 'modal' }} />
      <Stack.Screen name="expense/one-off/[id]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="expense/recurring/[id]" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

function Root() {
  const { db } = getAppDatabase();
  const { success, error } = useMigrations(db, migrations);
  const reducedMotion = useReducedMotion();
  // Se decide una vez por arranque, con la URL que abrió la app.
  const [animate] = useState(() =>
    shouldAnimateSplash(
      Linking.getLinkingURL(),
      reducedMotion,
      targetOf(Notifications.getLastNotificationResponse()) !== null,
    ),
  );

  let content = null;
  if (error) content = <MigrationError error={error} />;
  else if (success) {
    content = (
      <RepositoryProvider repositories={getAppRepositories()}>
        <ReminderSync />
        <AppStack />
        <NotificationRouter />
      </RepositoryProvider>
    );
  }
  return (
    <SplashGate ready={success || error !== undefined} animate={animate}>
      {content}
    </SplashGate>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <StatusBar style="auto" />
      <Root />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  title: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  detail: { fontSize: 13, textAlign: 'center' },
});
