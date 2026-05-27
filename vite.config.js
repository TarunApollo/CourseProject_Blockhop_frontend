import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
    server: {
        proxy: {
            '/backend': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/backend/, ''),
            },
        },
    },
    plugins: [
        vue(),
        vueJsx(),
        vueDevTools({
            // DISABLE THIS TO SEE THE comp inspector just for presentation
            appendTo: /__disable_vue_devtools_overlay__/,
            launchEditor: false,
            componentInspector: false,
        }),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        },
    },
})
