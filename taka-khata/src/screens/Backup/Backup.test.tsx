import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../app/App'
import { DEFAULT_CATEGORIES, db } from '../../data/db'
import { addTransaction, exportAll, setSetting } from '../../data/repo'
import { en } from '../../i18n/en'
import { today } from '../../lib/dates'

beforeEach(async () => {
  await db.transactions.clear()
  await db.categories.clear()
  await db.categories.bulkAdd([...DEFAULT_CATEGORIES])
  await db.cashChecks.clear()
  await db.settings.clear()
  window.location.hash = ''
})

afterEach(() => {
  window.location.hash = ''
  vi.restoreAllMocks()
})

async function openBackup(): Promise<void> {
  await setSetting('language', 'en')
  window.location.hash = '#/more/backup'
  render(<App />)
  await screen.findByRole('heading', { name: en['backup.title'] })
}

/** Build a File object from the app's current data */
async function makeBackupFile(): Promise<File> {
  const data = await exportAll()
  const json = JSON.stringify(data)
  return new File([json], 'backup.json', { type: 'application/json' })
}

/** Helper: simulate a file-input change with the given File */
function pickFile(input: HTMLElement, file: File): void {
  Object.defineProperty(input, 'files', {
    configurable: true,
    value: [file],
  })
  fireEvent.change(input)
}

describe('Backup', () => {
  it('renders both action buttons and the reminder', async () => {
    await openBackup()

    expect(
      screen.getByRole('button', { name: en['backup.saveFile'] }),
    ).toBeTruthy()
    expect(screen.getByText(en['backup.saveHint'])).toBeTruthy()
    expect(screen.getByText(en['backup.restoreHint'])).toBeTruthy()
    expect(screen.getByText(en['backup.reminder'])).toBeTruthy()
  })

  it('export triggers a file download', async () => {
    await addTransaction({
      type: 'income',
      amountMinor: 100_00,
      date: today(),
    })

    // Spy on URL.createObjectURL and anchor.click so we don't actually download
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    await openBackup()
    fireEvent.click(screen.getByRole('button', { name: en['backup.saveFile'] }))

    await waitFor(() => {
      expect(createObjectURL).toHaveBeenCalledOnce()
    })
    expect(clickSpy).toHaveBeenCalledOnce()

    // The blob argument should contain the JSON
    const blob: Blob = createObjectURL.mock.calls[0][0] as Blob
    const text = await blob.text()
    const parsed: unknown = JSON.parse(text)
    expect(parsed).toMatchObject({ app: 'taka-khata' })
  })

  it('shows the restore file input when the restore button is clicked', async () => {
    await openBackup()

    expect(screen.queryByText(en['backup.restore'])).toBeTruthy()
    // The hidden file input should exist in the DOM
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement | null
    expect(input).toBeTruthy()
  })

  it('import round trip: valid backup replaces data', async () => {
    // Start with one transaction
    await addTransaction({
      type: 'income',
      amountMinor: 50_00,
      date: today(),
    })

    const backupFile = await makeBackupFile()

    // Clear db after capturing the backup
    await db.transactions.clear()

    await openBackup()

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    pickFile(input, backupFile)

    // Confirm dialog should appear with count info
    const confirmTitle = await screen.findByText(en['backup.confirmTitle'])
    expect(confirmTitle).toBeTruthy()

    // Confirm the import
    fireEvent.click(screen.getByRole('button', { name: en['common.confirm'] }))

    // Success message
    expect(await screen.findByText(en['backup.done'])).toBeTruthy()

    // Data should be back
    const rows = await db.transactions.toArray()
    expect(rows).toHaveLength(1)
    expect(rows[0].amountMinor).toBe(50_00)
  })

  it('invalid file shows error and changes nothing', async () => {
    await addTransaction({
      type: 'income',
      amountMinor: 75_00,
      date: today(),
    })

    await openBackup()

    const badFile = new File(['not json at all'], 'bad.json', {
      type: 'application/json',
    })
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    pickFile(input, badFile)

    expect(await screen.findByText(en['backup.invalid'])).toBeTruthy()

    // No confirm dialog
    expect(screen.queryByText(en['backup.confirmTitle'])).toBeNull()

    // Data untouched
    const rows = await db.transactions.toArray()
    expect(rows).toHaveLength(1)
  })

  it('cancel on confirm dialog does not import', async () => {
    await addTransaction({
      type: 'expense',
      amountMinor: 20_00,
      categoryId: 'food',
      date: today(),
    })

    const backupFile = await makeBackupFile()

    await db.transactions.clear()

    await openBackup()

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    pickFile(input, backupFile)

    await screen.findByText(en['backup.confirmTitle'])

    // Cancel
    fireEvent.click(screen.getByRole('button', { name: en['common.cancel'] }))

    // Confirm dialog should close, no success
    await waitFor(() => {
      expect(screen.queryByText(en['backup.confirmTitle'])).toBeNull()
    })
    expect(screen.queryByText(en['backup.done'])).toBeNull()

    // DB should still be empty (we cleared before opening)
    const rows = await db.transactions.toArray()
    expect(rows).toHaveLength(0)
  })

  it('shows correct language when in Bangla', async () => {
    await setSetting('language', 'bn')
    window.location.hash = '#/more/backup'
    render(<App />)

    const { bn } = await import('../../i18n/bn')
    expect(await screen.findByRole('heading', { name: bn['backup.title'] })).toBeTruthy()
    expect(screen.getByRole('button', { name: bn['backup.saveFile'] })).toBeTruthy()
    expect(screen.getByText(bn['backup.reminder'])).toBeTruthy()
  })
})
