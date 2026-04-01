import { defineConfig } from 'vitest/config';

export default defineConfig({
  server: {
    historyApiFallback: true,
  },
  test: {
    environment: 'node',
  },
});
