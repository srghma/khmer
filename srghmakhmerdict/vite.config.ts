import { defineConfig } from 'vite'
import { sveltekit } from '@sveltejs/kit/vite'
import { paraglide } from '@inlang/paraglide-js-adapter-sveltekit/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import webfontDownload from 'vite-plugin-webfont-dl'
import path from 'path'

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST

export default defineConfig(async () => ({
  plugins: [
    paraglide({
      project: path.resolve(__dirname, './project.inlang'),
      outdir: path.resolve(__dirname, './src/paraglide'),
    }),
    sveltekit(),
    tsconfigPaths(),
    tailwindcss(),
    webfontDownload(),
  ],

  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: 'ws', host, port: 1421 } : undefined,
    watch: { ignored: ['**/src-tauri/**'] },
  },
}))
