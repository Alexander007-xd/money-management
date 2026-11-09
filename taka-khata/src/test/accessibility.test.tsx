import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../app/App'
import { db } from '../data/db'
import { setSetting } from '../data/repo'
import { en } from '../i18n/en'

/**
 * Every button that shows only an icon must still have an accessible name,
 * so a screen reader user knows what the button does.
 */
function iconOnlyButtons(): HTMLElement[] {
  return Array.from(document.querySelectorAll('button')).filter((button) => {
    const hasText = (button.textContent ?? '').trim().length > 0
    const hasLabel =
      button.getAttribute('aria-label')?.trim() !== undefined &&
      button.getAttribute('aria-label')?.trim() !== ''

    return !hasText && !hasLabel
  })
}

const ROUTES = [
  '#/',
  '#/history',
  '#/report',
  '#/check',
  '#/more',
  '#/more/categories',
  '#/more/backup',
  '#/more/install',
  '#/add/income',
  '#/add/expense',
]

beforeEach(async () => {
  await db.settings.clear()
  window.location.hash = ''
})

afterEach(() => {
  window.location.hash = ''
})

describe('Accessibility', () => {
  it('gives every icon-only button an accessible name on every screen', async () => {
    await setSetting('language', 'en')

    for (const route of ROUTES) {
      window.location.hash = route
      const view = render(<App />)

      await waitFor(() => {
        expect(document.querySelector('.app-shell')).toBeTruthy()
      })

      const unlabeled = iconOnlyButtons()

      expect(
        unlabeled.map((button) => button.outerHTML),
        `unlabeled icon-only buttons on ${route}`,
      ).toEqual([])

      view.unmount()
    }
  })

  it('gives every icon-only button an accessible name in Bangla too', async () => {
    await setSetting('language', 'bn')

    for (const route of ROUTES) {
      window.location.hash = route
      const view = render(<App />)

      await waitFor(() => {
        expect(document.querySelector('.app-shell')).toBeTruthy()
      })

      const unlabeled = iconOnlyButtons()

      expect(
        unlabeled.map((button) => button.outerHTML),
        `unlabeled icon-only buttons on ${route}`,
      ).toEqual([])

      view.unmount()
    }
  })

  it('puts the screen content inside one main landmark', async () => {
    await setSetting('language', 'en')

    for (const route of ROUTES) {
      window.location.hash = route
      const view = render(<App />)

      await waitFor(() => {
        expect(document.querySelector('.app-shell')).toBeTruthy()
      })

      const mains = Array.from(document.querySelectorAll('main'))

      expect(mains, `main landmarks on ${route}`).toHaveLength(1)
      expect(mains[0].querySelector('h1'), `heading in main on ${route}`).toBeTruthy()

      view.unmount()
    }
  })

  it('labels the month switcher arrows on History and Report', async () => {
    await setSetting('language', 'en')

    window.location.hash = '#/history'
    const history = render(<App />)

    expect(
      await screen.findByRole('button', { name: en['history.previousMonth'] }),
    ).toBeTruthy()
    expect(
      screen.getByRole('button', { name: en['history.nextMonth'] }),
    ).toBeTruthy()

    history.unmount()

    window.location.hash = '#/report'
    render(<App />)

    expect(
      await screen.findByRole('button', { name: en['report.previousMonth'] }),
    ).toBeTruthy()
    expect(
      screen.getByRole('button', { name: en['report.nextMonth'] }),
    ).toBeTruthy()
  })

  it('labels the back arrow on the entry forms', async () => {
    await setSetting('language', 'en')

    window.location.hash = '#/add/income'
    render(<App />)

    expect(
      await screen.findByRole('button', { name: en['common.back'] }),
    ).toBeTruthy()
  })
})
