import { useEffect, useState } from 'react'

/**
 * The browser's install prompt event. Chrome fires `beforeinstallprompt` when
 * the app can be installed; we keep the event so the user can trigger the
 * native install dialog from our own button.
 */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export interface InstallPromptState {
  /** True when the browser offered to install the app. */
  canInstall: boolean
  /** True while the native install dialog is open. */
  installing: boolean
  /** True when the user accepted the native install dialog. */
  installed: boolean
  install: () => Promise<void>
}

export function useInstallPrompt(): InstallPromptState {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [installing, setInstalling] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    function onBeforeInstallPrompt(e: Event): void {
      e.preventDefault()
      setEvent(e as BeforeInstallPromptEvent)
    }

    function onInstalled(): void {
      setInstalled(true)
      setEvent(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function install(): Promise<void> {
    if (event === null || installing) {
      return
    }

    setInstalling(true)

    try {
      await event.prompt()
      const choice = await event.userChoice

      if (choice.outcome === 'accepted') {
        setInstalled(true)
        setEvent(null)
      }
    } catch {
      // The browser refused to open the dialog; keep the button available.
    } finally {
      setInstalling(false)
    }
  }

  return {
    canInstall: event !== null,
    installing,
    installed,
    install,
  }
}
