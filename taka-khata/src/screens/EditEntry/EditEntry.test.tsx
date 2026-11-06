import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../app/App'
import { db } from '../../data/db'
import {
  addTransaction,
  listTransactions,
  setSetting,
} from '../../data/repo'
import { en } from '../../i18n/en'
import { today } from '../../lib/dates'

beforeEach(async () => {
  await db.transactions.clear()
  await db.settings.clear()
  window.location.hash = ''
})

afterEach(() => {
  vi.useRealTimers()
  window.location.hash = ''
})

async function openEdit(id: string): Promise<void> {
  await setSetting('language', 'en')
  window.location.hash = `#/edit/${id}`
  render(<App />)
}

describe('EditEntry', () => {
  it('fills the form from the saved entry, saves changes and returns to History', async () => {
    const saved = await addTransaction({
      type: 'expense',
      amountMinor: 12_050,
      categoryId: 'food',
      note: 'Lunch',
      date: today(),
    })

    await openEdit(saved.id)

    const amount = (await screen.findByLabelText(
      en['add.amountLabel'],
    )) as HTMLInputElement

    expect(amount.value).toBe('120.50')

    const food = await screen.findByRole('button', { name: 'Food' })

    expect(food.getAttribute('aria-pressed')).toBe('true')
    expect(
      (screen.getByLabelText(en['add.noteLabel']) as HTMLInputElement).value,
    ).toBe('Lunch')

    fireEvent.change(amount, { target: { value: '99.99' } })
    fireEvent.click(screen.getByRole('button', { name: en['add.save'] }))

    expect(
      await screen.findByRole('heading', { name: en['history.title'] }),
    ).toBeTruthy()

    const rows = await listTransactions()

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      id: saved.id,
      amountMinor: 9_999,
      categoryId: 'food',
      note: 'Lunch',
    })
  })

  it('redirects to History when the id does not exist', async () => {
    await openEdit('missing-id')

    expect(
      await screen.findByRole('heading', { name: en['history.title'] }),
    ).toBeTruthy()
    expect(window.location.hash).toBe('#/history')
  })

  it('deletes after confirmation and restores the entry with Undo', async () => {
    const saved = await addTransaction({
      type: 'income',
      amountMinor: 50_000,
      source: 'Rahim',
      date: today(),
    })

    await openEdit(saved.id)
    await screen.findByLabelText(en['add.amountLabel'])

    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'], shouldAdvanceTime: true })

    fireEvent.click(screen.getByRole('button', { name: en['common.delete'] }))
    expect(screen.getByRole('dialog')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: en['common.yes'] }))

    expect(await screen.findByText(en['edit.deleted'])).toBeTruthy()
    expect(await listTransactions()).toHaveLength(0)

    fireEvent.click(screen.getByRole('button', { name: en['common.undo'] }))

    expect(await screen.findByLabelText(en['add.amountLabel'])).toBeTruthy()
    expect(screen.queryByText(en['edit.deleted'])).toBeNull()

    const restored = await listTransactions()

    expect(restored).toHaveLength(1)
    expect(restored[0].id).toBe(saved.id)
    expect(restored[0].amountMinor).toBe(50_000)
  })

  it('keeps the entry permanently deleted after five seconds', async () => {
    const saved = await addTransaction({
      type: 'expense',
      amountMinor: 8_000,
      categoryId: 'transport',
      date: today(),
    })

    await openEdit(saved.id)
    await screen.findByLabelText(en['add.amountLabel'])

    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'], shouldAdvanceTime: true })

    fireEvent.click(screen.getByRole('button', { name: en['common.delete'] }))
    fireEvent.click(screen.getByRole('button', { name: en['common.yes'] }))

    expect(await screen.findByText(en['edit.deleted'])).toBeTruthy()

    act(() => {
      vi.advanceTimersByTime(5_000)
    })

    vi.useRealTimers()

    expect(
      await screen.findByRole('heading', { name: en['history.title'] }),
    ).toBeTruthy()
    expect(window.location.hash).toBe('#/history')
    expect(await listTransactions()).toHaveLength(0)
  })
})
