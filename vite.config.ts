import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    watch: {
      // Android emulator disk images contain locked files, not web source.
      ignored: ['**/.android-qa/**', '**/android/**', '**/test-results/**', '**/releases/**', '**/asset-archive/**'],
    },
  },
});
