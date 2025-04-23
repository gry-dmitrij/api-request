import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

// https://vitejs.dev/guide/build.html#library-mode
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'api-request',
      fileName: 'index',
    },
  },
  plugins: [dts()],
  resolve: {
    alias: {
      '@': resolve(__dirname, "src"),
    },
    extensions: ['.mjs', '.js', '.mts', '.ts', '.d.ts', '.jsx', '.tsx', '.json']
  }
});
