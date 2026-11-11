import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' so the same build works on GitHub Pages, inside the Android APK and as a static preview.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { outDir: 'dist', chunkSizeWarningLimit: 1500, assetsInlineLimit: 0 },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
});
