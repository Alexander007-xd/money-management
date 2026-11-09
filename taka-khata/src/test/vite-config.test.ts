import { describe, expect, it } from 'vitest'
import type { UserConfig } from 'vite'
import { createConfig } from '../../vite.config'

/**
 * Collect the plugin names from a config. Vite allows nested plugin arrays, so
 * one level of nesting is flattened here (VitePWA itself returns an array).
 */
function pluginNames(config: UserConfig): string[] {
  const names: string[] = []
  for (const item of config.plugins ?? []) {
    const entries = Array.isArray(item) ? item : [item]
    for (const entry of entries) {
      if (entry && typeof entry === 'object' && 'name' in entry) {
        names.push(String(entry.name))
      }
    }
  }
  return names
}

function hasPwa(config: UserConfig): boolean {
  return pluginNames(config).some((name) => name.startsWith('vite-plugin-pwa'))
}

describe('vite config', () => {
  it('web build keeps the GitHub Pages base and the PWA plugin', () => {
    const config = createConfig({ command: 'build', mode: 'production' })

    expect(config.base).toBe('/money-management/')
    expect(hasPwa(config)).toBe(true)
  })

  it('netlify build uses the root base and keeps the PWA plugin', () => {
    const config = createConfig({ command: 'build', mode: 'netlify' })

    expect(config.base).toBe('/')
    expect(hasPwa(config)).toBe(true)
  })

  it('android build uses a relative base and disables the PWA plugin', () => {
    const config = createConfig({ command: 'build', mode: 'android' })

    expect(config.base).toBe('./')
    expect(hasPwa(config)).toBe(false)
  })

  it('android build supplies a no-op virtual:pwa-register module', () => {
    const config = createConfig({ command: 'build', mode: 'android' })

    expect(pluginNames(config)).toContain('taka-khata:pwa-register-stub')
  })

  it('dev server keeps the root base', () => {
    const config = createConfig({ command: 'serve', mode: 'development' })

    expect(config.base).toBe('/')
    expect(hasPwa(config)).toBe(true)
  })

  it('preview uses the GitHub Pages base', () => {
    const config = createConfig({ command: 'serve', mode: 'production', isPreview: true })

    expect(config.base).toBe('/money-management/')
  })
})
