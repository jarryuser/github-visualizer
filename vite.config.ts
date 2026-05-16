import { defineConfig } from 'vite';

export default defineConfig({
  base: '/github-visualizer/',  // имя репозитория на GitHub
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});