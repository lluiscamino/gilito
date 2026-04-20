import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/gilito/',
  server: {
    historyApiFallback: true,
  },
  test: {
    environment: 'node',
  },
});
