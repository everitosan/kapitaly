import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { testDeps } from '@/data/repositories/contract';
import {
  createInMemoryRepositories,
  type InMemoryRepositories,
} from '@/data/repositories/inMemory';
import type { ColorSchemeName } from '@/ui/theme';
import { ThemeProvider } from '@/ui/ThemeProvider';

import { RepositoryProvider } from './repositories';

/** Renderiza con tema y repositorios en memoria (con "Efectivo" ya creado). */
export async function renderWithProviders(
  ui: ReactElement,
  {
    repos = createInMemoryRepositories(testDeps()),
    scheme = 'light',
  }: { repos?: InMemoryRepositories; scheme?: ColorSchemeName } = {},
) {
  const view = await render(
    <ThemeProvider scheme={scheme}>
      <RepositoryProvider repositories={repos}>{ui}</RepositoryProvider>
    </ThemeProvider>,
  );
  return { ...view, repos };
}
