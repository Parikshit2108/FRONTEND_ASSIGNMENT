
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@component': new URL('src/components', import.meta.url).pathname,
      '@constants': new URL('src/constants', import.meta.url).pathname,
      '@data': new URL('src/data', import.meta.url).pathname,
    },
  },
});
