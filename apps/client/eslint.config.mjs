import nextEslintPluginNext from '@next/eslint-plugin-next';
import nx from '@nx/eslint-plugin';
import react from 'eslint-plugin-react';
import baseConfig from '../../eslint.config.mjs';

export default [
  {
    ignores: [
      '.next/**',
      '**/out-tsc/**',
      '**/test-output/**',
      'node_modules/**',
      'dist/**',
    ],
  },
  { plugins: { '@next/next': nextEslintPluginNext } },
  ...nx.configs['flat/react-typescript'],
  ...baseConfig,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@next/next/no-html-link-for-pages': 'error',
    },
  },
  {
    // No hard-coded UI text: every visible string goes through next-intl (en/fr/ar).
    files: ['src/**/*.tsx'],
    plugins: { react },
    rules: {
      'react/jsx-no-literals': [
        'error',
        {
          noStrings: false,
          ignoreProps: true,
          allowedStrings: ['·', '—', '–', '…', '/', '+', '×', '•', '(', ')', ':', '|', '%', '-', '?', '!'],
        },
      ],
    },
  },
];
