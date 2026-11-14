import { useRouter } from 'expo-router';

import { NotificationsScreen } from '@/features/reminders/NotificationsScreen';

export default function Notifications() {
  const router = useRouter();
  return <NotificationsScreen onBack={() => router.back()} />;
}
