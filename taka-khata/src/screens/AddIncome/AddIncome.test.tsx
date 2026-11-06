import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../../app/App'
import { db } from '../../data/db'
import { addTransaction, listTransactions, setSetting } from '../../data/repo'
import { en } from '../../i18n/en'
import { today } from '../../lib/dates'

beforeEach(async () => {
  await db.transactions.clear()
  await db.settings.clear()
  window.location.hash = ''
})

afterEach(() => {
  window.location.hash = ''
})

async function openAddIncome(): Promise<void> {
  await setSetting('language', 'en')
  window.location.hash = '#/add/income'
  render(<App />)
  await screen.findByLabelText(en['add.amountLabel'])
}

describe('AddIncome', () => {
  it('saves a valid entry and returns Home', async () => {
    await openAddIncome()

    fireEvent.change(screen.getByLabelText(en['add.amountLabel']), {
      target: { value: '250' },
    })
    fireEvent.click(screen.getByRole('button', { name: en['from.baba'] }))
    fireEvent.click(screen.getByRole('button', { name: en['add.save'] }))

    expect(await screen.findByText(en['home.balanceLabel'])).toBeTruthy()

    const rows = await listTransactions()

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      type: 'income',
      amountMinor: 25_000,
      categoryId: null,
      source: 'Baba',
      note: '',
      date: today(),
    })
  })

  it('shows a required error and saves nothing when the amount is empty', async () => {
    await openAddIncome()

    fireEvent.click(screen.getByRole('button', { name: en['add.save'] }))

    expect(await screen.findByText(en['error.amountRequired'])).toBeTruthy()
    expect(await listTransactions()).toHaveLength(0)
  })

  it('rejects a future date', async () => {
    await openAddIncome()

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const future = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`

    fireEvent.change(screen.getByLabelText(en['add.amountLabel']), {
      target: { value: '100' },
    })
    fireEvent.change(screen.getByLabelText(en['add.dateLabel']), {
      target: { value: future },
    })
    fireEvent.click(screen.getByRole('button', { name: en['add.save'] }))

    expect(await screen.findByText(en['error.dateFuture'])).toBeTruthy()
    expect(await listTransactions()).toHaveLength(0)
  })

  it('offers the default and recent source chips', async () => {
    await addTransaction({
      type: 'income',
      amountMinor: 500_000,
      source: 'Rahim',
      date: today(),
    })

    await openAddIncome()

    expect(screen.getByRole('button', { name: en['from.baba'] })).toBeTruthy()
    expect(screen.getByRole('button', { name: en['from.mama'] })).toBeTruthy()
    expect(screen.getByRole('button', { name: en['from.other'] })).toBeTruthy()
    expect(await screen.findByRole('button', { name: 'Rahim' })).toBeTruthy()
  })

  it('reveals the note field only after tapping Add note', async () => {
    await openAddIncome()

    expect(screen.queryByLabelText(en['add.noteLabel'])).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: en['add.addNote'] }))

    expect(await screen.findByLabelText(en['add.noteLabel'])).toBeTruthy()
  })
})
