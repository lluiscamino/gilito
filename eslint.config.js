import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  prettier,
  {
    files: ['**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['src/ui/components/**/*.ts'],
    ignores: ['src/ui/components/app.ts'], // composition root: wires controllers, needs the repo type
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/lib/**'],
              message: 'UI components must not import from lib. Move logic to a controller.',
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  },
);
