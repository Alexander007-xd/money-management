import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../../app/App'
import { APP_VERSION } from '../../app/version'
import { db } from '../../data/db'
import { getSetting, setSetting } from '../../data/repo'
import { bn } from '../../i18n/bn'
import { en } from '../../i18n/en'
import type { Language } from '../../i18n/types'

beforeEach(async () => {
  await db.settings.clear()
  window.location.hash = ''
})

afterEach(() => {
  window.location.hash = ''
})

async function openMore(lang: Language): Promise<void> {
  await setSetting('language', lang)
  window.location.hash = '#/more'
  render(<App />)
  await screen.findByRole('heading', {
    name: lang === 'bn' ? bn['more.title'] : en['more.title'],
  })
}

describe('More', () => {
  it('shows the language switch, links and app version', async () => {
    await openMore('en')

    const english = screen.getByRole('button', { name: en['language.english'] })
    const bangla = screen.getByRole('button', { name: en['language.bangla'] })

    expect(english.getAttribute('aria-pressed')).toBe('true')
    expect(bangla.getAttribute('aria-pressed')).toBe('false')

    expect(
      screen.getByRole('link', { name: en['more.categories'] }).getAttribute('href'),
    ).toBe('#/more/categories')
    expect(
      screen.getByRole('link', { name: en['more.backup'] }).getAttribute('href'),
    ).toBe('#/more/backup')
    expect(
      screen.getByRole('link', { name: en['more.install'] }).getAttribute('href'),
    ).toBe('#/more/install')

    expect(screen.getByText(en['more.about'])).toBeTruthy()
    expect(
      screen.getByText(
        en['more.version'].replace('{version}', APP_VERSION),
      ),
    ).toBeTruthy()
  })

  it('switches to Bangla and saves the choice', async () => {
    await openMore('en')

    fireEvent.click(screen.getByRole('button', { name: en['language.bangla'] }))

    expect(
      await screen.findByRole('heading', { name: bn['more.title'] }),
    ).toBeTruthy()
    expect(
      screen.getByRole('link', { name: bn['more.categories'] }),
    ).toBeTruthy()
    expect(await getSetting('language')).toBe('bn')
    expect(document.documentElement.lang).toBe('bn')
  })

  it('keeps the chosen language after a reload', async () => {
    await setSetting('language', 'bn')
    window.location.hash = '#/more'

    const first = render(<App />)

    fireEvent.click(
      await screen.findByRole('button', { name: bn['language.english'] }),
    )

    expect(
      await screen.findByRole('heading', { name: en['more.title'] }),
    ).toBeTruthy()

    first.unmount()

    render(<App />)

    expect(
      await screen.findByRole('heading', { name: en['more.title'] }),
    ).toBeTruthy()
    expect(
      screen
        .getByRole('button', { name: en['language.english'] })
        .getAttribute('aria-pressed'),
    ).toBe('true')
  })
})
