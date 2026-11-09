import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../app/App'
import { db } from '../../data/db'
import { setSetting } from '../../data/repo'
import { en } from '../../i18n/en'
import { bn } from '../../i18n/bn'

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function dispatchInstallPrompt(): void {
  const event = new Event('beforeinstallprompt') as InstallPromptEvent
  event.prompt = vi.fn().mockResolvedValue(undefined)
  event.userChoice = Promise.resolve({ outcome: 'accepted' })
  window.dispatchEvent(event)
}

beforeEach(async () => {
  await db.settings.clear()
  window.location.hash = ''
})

afterEach(() => {
  window.location.hash = ''
  vi.restoreAllMocks()
})

async function openInstallHelp(lang: 'bn' | 'en' = 'en') {
  await setSetting('language', lang)
  window.location.hash = '#/more/install'
  render(<App />)
  await screen.findByRole('heading', {
    name: lang === 'bn' ? bn['install.title'] : en['install.title'],
  })
}

describe('InstallHelp', () => {
  it('shows the numbered steps in the current language', async () => {
    await openInstallHelp('en')

    expect(screen.getByText(en['install.step1'])).toBeTruthy()
    expect(screen.getByText(en['install.step2'])).toBeTruthy()
    expect(screen.getByText(en['install.step3'])).toBeTruthy()
  })

  it('shows the steps in Bangla too', async () => {
    await openInstallHelp('bn')

    expect(screen.getByText(bn['install.step1'])).toBeTruthy()
    expect(screen.getByText(bn['install.step2'])).toBeTruthy()
    expect(screen.getByText(bn['install.step3'])).toBeTruthy()
  })

  it('hides the install button when the browser does not offer an install', async () => {
    await openInstallHelp('en')

    expect(screen.queryByRole('button', { name: en['install.button'] })).toBeNull()
  })

  it('shows the install button when the browser offers an install', async () => {
    await openInstallHelp('en')

    dispatchInstallPrompt()

    expect(
      await screen.findByRole('button', { name: en['install.button'] }),
    ).toBeTruthy()
  })

  it('calls the browser prompt when the install button is pressed', async () => {
    await openInstallHelp('en')

    const prompt = vi.fn().mockResolvedValue(undefined)
    window.dispatchEvent(
      Object.assign(new Event('beforeinstallprompt'), {
        prompt,
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      }),
    )

    const button = await screen.findByRole('button', {
      name: en['install.button'],
    })

    fireEvent.click(button)

    await waitFor(() => {
      expect(prompt).toHaveBeenCalled()
    })
  })
})
