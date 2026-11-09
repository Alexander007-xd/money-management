import react from '@vitejs/plugin-react'
import type { Plugin, UserConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

// The app is published as a GitHub Pages project site:
//   https://alexander007-xd.github.io/money-management/
// so the built files must be requested from /money-management/. The dev
// server keeps the root path, which is easier to work with locally.
const GITHUB_PAGES_BASE = '/money-management/'

// Netlify serves the build from the site root, so `vite build --mode netlify`
// must not use the GitHub Pages prefix above.
const NETLIFY_BASE = '/'

type ConfigInput = {
  command: 'build' | 'serve'
  mode: string
  isPreview?: boolean
}

/**
 * Android builds load `dist/` from Capacitor's own web server, so they use
 * relative paths and must not register the PWA service worker. `main.tsx`
 * imports `virtual:pwa-register`, which only exists when VitePWA is enabled;
 * this no-op module keeps that import valid in the APK build.
 */
const pwaRegisterStub: Plugin = {
  name: 'taka-khata:pwa-register-stub',
  resolveId(id) {
    if (id === 'virtual:pwa-register') {
      return '\0virtual:pwa-register'
    }
    return undefined
  },
  load(id) {
    if (id === '\0virtual:pwa-register') {
      return 'export function registerSW() { return () => {} }'
    }
    return undefined
  },
}

export function createConfig({ command, mode, isPreview }: ConfigInput): UserConfig {
  const isAndroid = mode === 'android'
  const isNetlify = mode === 'netlify'

  return {
    // `vite preview` also needs the deployed base, otherwise its asset paths
    // would not match the ones written into the built index.html.
    base: isAndroid
      ? './'
      : isNetlify
        ? NETLIFY_BASE
        : command === 'build' || isPreview === true
          ? GITHUB_PAGES_BASE
          : '/',
    plugins: [
      react(),
      ...(isAndroid
        ? [pwaRegisterStub]
        : [
            VitePWA({
              registerType: 'autoUpdate',
              includeAssets: ['icons/favicon.png', 'icons/apple-touch-icon.png'],
              manifest: {
                name: 'Taka Khata',
                short_name: 'Taka Khata',
                description:
                  'Write what you get, write what you spend, always know what is left.',
                lang: 'bn',
                dir: 'ltr',
                start_url: '.',
                scope: '.',
                display: 'standalone',
                orientation: 'portrait',
                theme_color: '#FBF7EF',
                background_color: '#FBF7EF',
                icons: [
                  {
                    src: 'icons/icon-192.png',
                    sizes: '192x192',
                    type: 'image/png',
                    purpose: 'any',
                  },
                  {
                    src: 'icons/icon-512.png',
                    sizes: '512x512',
                    type: 'image/png',
                    purpose: 'any',
                  },
                  {
                    src: 'icons/icon-maskable-192.png',
                    sizes: '192x192',
                    type: 'image/png',
                    purpose: 'maskable',
                  },
                  {
                    src: 'icons/icon-maskable-512.png',
                    sizes: '512x512',
                    type: 'image/png',
                    purpose: 'maskable',
                  },
                ],
              },
              workbox: {
                globPatterns: ['**/*.{js,css,html,woff,woff2,png,svg,ico}'],
                navigateFallback: 'index.html',
                cleanupOutdatedCaches: true,
                clientsClaim: true,
                skipWaiting: true,
              },
              devOptions: {
                enabled: false,
              },
            }),
          ]),
    ],
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
    },
  }
}

export default defineConfig(createConfig)
