import { useRouter } from 'expo-router';

import { SettingsScreen } from '@/features/settings/SettingsScreen';

export default function Settings() {
  const router = useRouter();
  return (
    <SettingsScreen
      onBack={() => router.back()}
      onOpenMethods={() => router.push('/payment-methods')}
      onOpenCategories={() => router.push('/categories')}
    />
  );
}
