import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import vitePluginBundleObfuscator from 'vite-plugin-bundle-obfuscator'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
    tailwindcss(),
    vitePluginBundleObfuscator({
      enable: command === 'build',
      autoExcludeNodeModules: true,
      threadPool: true,
      apply: 'build',
      options: {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.75,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.4,
        debugProtection: true,
        disableConsoleOutput: false,
        identifierNamesGenerator: 'hexadecimal',
        selfDefending: true,
        simplify: true,
        stringArray: true,
        stringArrayThreshold: 0.75,
        stringArrayEncoding: ['base64'],
        stringArrayCallsTransform: true,
        stringArrayCallsTransformThreshold: 0.5,
        stringArrayRotate: true,
        stringArrayShuffle: true,
        splitStrings: true,
        splitStringsChunkLength: 5,
        ignoreImports: true,
        unicodeEscapeSequence: false,
      },
    }),
  ],
  build: {
    sourcemap: false,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}))