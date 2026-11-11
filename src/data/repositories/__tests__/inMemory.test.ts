import { describeRepositoryContracts } from '../contract';
import { createInMemoryRepositories } from '../inMemory';

describeRepositoryContracts('en memoria', (deps) => {
  const repos = createInMemoryRepositories(deps);
  return {
    repos,
    peek: async (table, id) => {
      const row = repos.raw[table].get(id);
      return row ? { ...row } : undefined;
    },
  };
});
