import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import type { Category } from '@/domain/category';
import { CategoryForm } from '@/features/categories/CategoryForm';
import { useRepositories } from '@/features/repositories';

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const repos = useRepositories();
  const isNew = id === 'new';
  const [category, setCategory] = useState<Category | null | undefined>(isNew ? null : undefined);

  useEffect(() => {
    if (!isNew) repos.categories.get(id).then(setCategory);
  }, [id, isNew, repos]);

  if (category === undefined) return null;
  return <CategoryForm category={category} onDone={() => router.back()} />;
}
