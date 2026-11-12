import { useRouter } from 'expo-router';

import { CategoryList } from '@/features/categories/CategoryList';

export default function CategoriesScreen() {
  const router = useRouter();
  return (
    <CategoryList
      onBack={() => router.back()}
      onOpen={(id) => router.push({ pathname: '/categories/[id]', params: { id } })}
      onAdd={() => router.push({ pathname: '/categories/[id]', params: { id: 'new' } })}
    />
  );
}
