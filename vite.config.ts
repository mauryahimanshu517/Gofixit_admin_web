import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(dir, 'src'),
      '@stitchkart/ui-kit-web': path.resolve(dir, 'src/shared/ui-kit-web/index.ts'),
    },
  },
  server: { port: 5174 },
});
