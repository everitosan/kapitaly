// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: ['dist/*', 'design/*', 'openspec/*', '.expo/*'],
  },
  {
    // El dominio es TypeScript puro: sin React, Expo ni dependencias de datos o UI.
    files: ['src/domain/**/*.{ts,tsx}'],
    ignores: ['src/domain/**/__tests__/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react/*', 'react-native', 'react-native/*', 'react-native-*'],
              message: 'src/domain no puede depender de React ni React Native.',
            },
            { group: ['expo', 'expo-*', '@expo/*'], message: 'src/domain no puede depender de Expo.' },
            {
              group: ['@/data', '@/data/*', '@/ui', '@/ui/*', '@/features', '@/features/*', '@/app', '@/app/*'],
              message: 'src/domain no puede importar de data, ui, features ni app.',
            },
            {
              group: ['**/data', '**/data/*', '**/ui', '**/ui/*', '**/features', '**/features/*', '**/app', '**/app/*'],
              message: 'src/domain no puede importar de data, ui, features ni app.',
            },
          ],
        },
      ],
    },
  },
]);
