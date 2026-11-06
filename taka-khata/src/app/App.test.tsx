import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { db } from '../data/db'
import { getSetting, setSetting } from '../data/repo'
import { bn } from '../i18n/bn'
import { en } from '../i18n/en'
import App from './App'

beforeEach(async () => {
  await db.settings.clear()
  window.location.hash = ''
})

afterEach(() => {
  window.location.hash = ''
})

describe('App routing', () => {
  it('sends a first launch to Welcome from any route', async () => {
    window.location.hash = '#/history'

    render(<App />)

    expect(await screen.findByRole('heading', { name: bn['app.name'] })).toBeTruthy()
    expect(screen.getByRole('button', { name: bn['language.bangla'] })).toBeTruthy()
    expect(screen.getByRole('button', { name: bn['language.english'] })).toBeTruthy()
  })

  it('saves the chosen language and goes Home after Start', async () => {
    window.location.hash = '#/'

    render(<App />)

    await screen.findByRole('heading', { name: bn['app.name'] })

    fireEvent.click(screen.getByRole('button', { name: bn['language.english'] }))
    fireEvent.click(screen.getByRole('button', { name: en['welcome.start'] }))

    expect(await screen.findByText(en['home.empty'])).toBeTruthy()
    expect(await getSetting('language')).toBe('en')
    expect(document.documentElement.lang).toBe('en')
  })

  it('sends an unknown route to Home when a language is set', async () => {
    await setSetting('language', 'bn')
    window.location.hash = '#/does-not-exist'

    render(<App />)

    expect(await screen.findByText(bn['home.empty'])).toBeTruthy()
  })

  it('skips Welcome when a language is already saved', async () => {
    await setSetting('language', 'en')
    window.location.hash = '#/'

    render(<App />)

    expect(await screen.findByText(en['home.empty'])).toBeTruthy()
    expect(screen.queryByRole('heading', { name: en['app.name'] })).toBeNull()
  })

  it('renders the placeholder for a known route', async () => {
    await setSetting('language', 'en')
    window.location.hash = '#/report'

    render(<App />)

    expect(await screen.findByText(en['report.empty'])).toBeTruthy()
  })

  it('shows the bottom nav on Home but hides it on a form', async () => {
    await setSetting('language', 'en')
    window.location.hash = '#/'
    const first = render(<App />)

    expect(await screen.findByRole('navigation')).toBeTruthy()

    first.unmount()

    window.location.hash = '#/add/expense'
    render(<App />)

    expect(await screen.findByText(en['add.expenseTitle'])).toBeTruthy()
    expect(screen.queryByRole('navigation')).toBeNull()
  })
})
