import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { getAppRepositories } from '@/data/appRepositories';
import { getAppDatabase } from '@/data/sqlite/appDatabase';
import { RepositoryProvider } from '@/features/repositories';
import { ThemeProvider, useTheme } from '@/ui/ThemeProvider';

import migrations from '../../drizzle/migrations';

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
  if (error) return <MigrationError error={error} />;
  if (!success) return null;
  return (
    <RepositoryProvider repositories={getAppRepositories()}>
      <AppStack />
    </RepositoryProvider>
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
