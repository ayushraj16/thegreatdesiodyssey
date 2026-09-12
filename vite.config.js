import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        classic: resolve(__dirname, 'classic.html'),
        reference: resolve(__dirname, 'reference.html'),
        vision: resolve(__dirname, 'vision.html'),
        contribution: resolve(__dirname, 'contribution.html'),
        tnc: resolve(__dirname, 'tnc.html')
      }
    }
  }
});
