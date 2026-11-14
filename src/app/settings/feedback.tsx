import { useRouter } from 'expo-router';

import { FeedbackScreen } from '@/features/feedback/FeedbackScreen';

export default function Feedback() {
  const router = useRouter();
  return <FeedbackScreen onBack={() => router.back()} />;
}
